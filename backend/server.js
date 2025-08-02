const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/database');
const { setupWebSocket } = require('./services/websocket');
const SerialReader = require('./services/serialReader');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Setup WebSocket
const io = setupWebSocket(server);

// Setup Serial Reader for LoRa data
const serialReader = new SerialReader(io, {
    portPath: process.env.SERIAL_PORT || 'COM3', // .env'den alınacak
    baudRate: parseInt(process.env.SERIAL_BAUD_RATE) || 9600
});

// Serial Reader'ı başlat - LoRa Coordinator bağlantısı
setTimeout(() => {
    serialReader.start().then((success) => {
        if (success) {
            console.log('✅ LoRa Coordinator bağlantısı başarılı - Gerçek zamanlı veri akışı aktif');
        } else {
            console.log('⚠️ LoRa Coordinator bağlanamadı - Manuel veri girişi kullanılacak');
            console.log(`💡 Coordinator port: ${process.env.SERIAL_PORT || 'COM3'}`);
        }
    });
}, 3000); // Server başladıktan 3 saniye sonra başlat

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Debug middleware - TÜM request'leri logla
app.use((req, res, next) => {
    console.log(`🌐 ${req.method} ${req.path} - Body:`, req.body);
    next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/apiaries', require('./routes/apiaries'));
app.use('/api/hives', require('./routes/hives'));
app.use('/api/sensors', require('./routes/sensors'));
app.use('/api/sensor-readings', require('./routes/sensorReadings'));
app.use('/api/admin', require('./routes/admin'));

// LoRa route'unu WebSocket ile birlikte setup et
const { router: loraRouter, setWebSocketInstance } = require('./routes/lora');

// LoRa Processor'a WebSocket instance'ını ver
setWebSocketInstance(io);

app.use('/api/lora', loraRouter); // Wireless veri endpoint'i

app.use('/api/ml', require('./routes/ml')); // 🧠 Machine Learning API endpoint'leri
app.use('/api/hardware', require('./routes/hardware')); // 🔧 Hardware Management API

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Backend server çalışıyor!',
        timestamp: new Date().toISOString()
    });
});

// Serial Reader status endpoint
app.get('/api/serial-status', (req, res) => {
    const status = serialReader.getStatus();
    res.json({
        success: true,
        data: status
    });
});

// Manuel test verisi gönderme endpoint (development)
app.post('/api/test-serial', (req, res) => {
    try {
        const { testData } = req.body;
        if (testData) {
            serialReader.handleIncomingData(testData);
            res.json({
                success: true,
                message: 'Test verisi işlendi',
                data: testData
            });
        } else {
            // Varsayılan test verisi
            serialReader.handleIncomingData("BT001:25.5,65.2,45.8:85:-65");
            res.json({
                success: true,
                message: 'Varsayılan test verisi gönderildi'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Test verisi hatası',
            error: error.message
        });
    }
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Sunucu hatası oluştu',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint bulunamadı'
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV}`);
    console.log(`🌐 API Health: http://localhost:${PORT}/api/health`);
    console.log(`📡 Serial Status: http://localhost:${PORT}/api/serial-status`);
    console.log(`🧪 Test Serial: POST http://localhost:${PORT}/api/test-serial`);
});
