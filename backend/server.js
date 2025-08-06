const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/database');
const { setupWebSocket } = require('./services/websocket');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Setup WebSocket
const io = setupWebSocket(server);

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
    console.log(`📡 Coordinator ayrı çalıştırın: py pc_coordinator_text.py`);
});
