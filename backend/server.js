const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

// Express app ve HTTP server
const app = express();
const server = http.createServer(app);

// Socket.IO yapılandırması - 4-Router sistemi için optimize edilmiş
const io = socketIo(server, {
    cors: {
        origin: ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization"]
    },
    pingTimeout: 60000,
    pingInterval: 25000
});

// CORS yapılandırması - Frontend ile backend arasında tam uyumluluk
app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Accept',
        'Origin',
        'X-Requested-With',
        'X-HTTP-Method-Override'
    ],
    optionsSuccessStatus: 200
}));

// Body parser middleware - Büyük dosyalar için optimize edilmiş
app.use(express.json({
    limit: '50mb',
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));
app.use(express.urlencoded({
    extended: true,
    limit: '50mb'
}));

// Static dosyalar
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging middleware - Geliştirme ve debug için
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);

    // Sensitive headers hariç log
    const safeHeaders = { ...req.headers };
    delete safeHeaders.authorization;
    console.log('Headers:', JSON.stringify(safeHeaders, null, 2));

    if (req.body && Object.keys(req.body).length > 0) {
        // Password gibi sensitive bilgileri loglamayalım
        const safeBody = { ...req.body };
        if (safeBody.password) safeBody.password = '[HIDDEN]';
        if (safeBody.confirmPassword) safeBody.confirmPassword = '[HIDDEN]';
        console.log('Body:', JSON.stringify(safeBody, null, 2));
    }
    next();
});

// MongoDB Bağlantısı - Production ready
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/beetwin';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4
})
    .then(() => {
        console.log('✅ MongoDB bağlantısı başarılı');
        console.log('📊 Database:', MONGODB_URI);
        console.log('🔗 Connection ready state:', mongoose.connection.readyState);
    })
    .catch((error) => {
        console.error('❌ MongoDB bağlantı hatası:', error);
        process.exit(1);
    });

// MongoDB bağlantı durumu izleme
mongoose.connection.on('connected', () => {
    console.log('🔗 MongoDB bağlandı');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB hatası:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('🔌 MongoDB bağlantısı kesildi');
});

// WebSocket bağlantı yönetimi - 4-Router sistemi için optimize edilmiş
io.on('connection', (socket) => {
    console.log(`🔗 Yeni WebSocket bağlantısı: ${socket.id}`);

    // Kullanıcı kimlik doğrulama
    socket.on('authenticate', (token) => {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            socket.userId = decoded.userId;
            socket.join(`user-${decoded.userId}`);
            console.log(`👤 Kullanıcı ${decoded.userId} kimlik doğrulaması yapıldı`);
            socket.emit('authenticated', { success: true, userId: decoded.userId });
        } catch (error) {
            console.error('❌ WebSocket kimlik doğrulama hatası:', error);
            socket.emit('authenticated', { success: false, error: 'Invalid token' });
        }
    });

    // Kullanıcı odalarına katılma
    socket.on('join-user-room', (userId) => {
        socket.join(`user-${userId}`);
        console.log(`👤 Kullanıcı ${userId} odasına katıldı`);
        socket.emit('joined-room', { type: 'user', id: userId });
    });

    // Kovan odalarına katılma
    socket.on('join-hive-room', (hiveId) => {
        socket.join(`hive-${hiveId}`);
        console.log(`🏠 Kovan ${hiveId} odasına katıldı`);
        socket.emit('joined-room', { type: 'hive', id: hiveId });
    });

    // Arılık odalarına katılma
    socket.on('join-apiary-room', (apiaryId) => {
        socket.join(`apiary-${apiaryId}`);
        console.log(`🏡 Arılık ${apiaryId} odasına katıldı`);
        socket.emit('joined-room', { type: 'apiary', id: apiaryId });
    });

    // 4-Router sistemi sensör verisi - Real-time data streaming
    socket.on('sensor-data', (data) => {
        console.log('📊 4-Router Sensör verisi alındı:', {
            hiveId: data.hiveId,
            routerId: data.routerId,
            sensorType: data.sensorType,
            timestamp: data.timestamp
        });

        // Veri doğrulama
        if (!data.hiveId || !data.routerId || !data.sensorType) {
            socket.emit('sensor-error', {
                error: 'Eksik veri',
                required: ['hiveId', 'routerId', 'sensorType']
            });
            return;
        }

        // Timestamp ekle
        data.receivedAt = new Date().toISOString();

        // Broadcast to relevant rooms
        if (data.hiveId) {
            socket.to(`hive-${data.hiveId}`).emit('sensor-update', data);
            io.to(`hive-${data.hiveId}`).emit('real-time-data', data);
        }
        if (data.userId) {
            socket.to(`user-${data.userId}`).emit('sensor-update', data);
        }
        if (data.apiaryId) {
            socket.to(`apiary-${data.apiaryId}`).emit('sensor-update', data);
        }

        // Global sensor data stream
        socket.broadcast.emit('global-sensor-update', {
            hiveId: data.hiveId,
            routerId: data.routerId,
            sensorType: data.sensorType,
            value: data.value,
            timestamp: data.timestamp
        });
    });

    // Hardware durumu güncelleme
    socket.on('hardware-status', (status) => {
        console.log('🔧 Hardware durumu:', status);

        if (status.hiveId) {
            socket.to(`hive-${status.hiveId}`).emit('hardware-update', status);
        }
        if (status.userId) {
            socket.to(`user-${status.userId}`).emit('hardware-update', status);
        }
    });

    // Router bağlantı durumu
    socket.on('router-connection', (connectionData) => {
        console.log('📡 Router bağlantı durumu:', connectionData);

        if (connectionData.hiveId) {
            io.to(`hive-${connectionData.hiveId}`).emit('router-status', connectionData);
        }
    });

    // Alarm sistemi
    socket.on('alarm', (alarmData) => {
        console.log('🚨 Alarm tetiklendi:', alarmData);

        // Critical alarms to all users
        if (alarmData.level === 'critical') {
            io.emit('critical-alarm', alarmData);
        }

        // Specific user/hive alarms
        if (alarmData.userId) {
            io.to(`user-${alarmData.userId}`).emit('alarm', alarmData);
        }
        if (alarmData.hiveId) {
            io.to(`hive-${alarmData.hiveId}`).emit('alarm', alarmData);
        }
    });

    // Bağlantı koptuğunda temizlik
    socket.on('disconnect', (reason) => {
        console.log(`🔌 WebSocket bağlantısı kesildi: ${socket.id}, Sebep: ${reason}`);

        // User room'dan çık
        if (socket.userId) {
            socket.leave(`user-${socket.userId}`);
        }
    });

    // Error handling
    socket.on('error', (error) => {
        console.error('❌ WebSocket hatası:', error);
    });
});

// API Routes - Tüm route'ları dahil et
try {
    console.log('🔄 Route yükleme başlatılıyor...');

    // Health check endpoint
    app.get('/api/health', (req, res) => {
        res.json({
            success: true,
            message: 'BeeTwin Backend is running',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            status: 'healthy'
        });
    });
    console.log('✅ Health endpoint yüklendi');

    app.use('/api/auth', require('./routes/auth'));
    console.log('✅ Auth route yüklendi');

    app.use('/api/users', require('./routes/users'));
    console.log('✅ Users route yüklendi');

    app.use('/api/apiaries', require('./routes/apiaries'));
    console.log('✅ Apiaries route yüklendi');

    app.use('/api/hives', require('./routes/hives'));
    console.log('✅ Hives route yüklendi');

    app.use('/api/sensors', require('./routes/sensors'));
    console.log('✅ Sensors route yüklendi');

    app.use('/api/sensor-readings', require('./routes/sensorReadings'));
    console.log('✅ Sensor-readings route yüklendi');

    app.use('/api/batch-readings', require('./routes/batchSensorReadings'));
    console.log('✅ Batch-readings route yüklendi');

    app.use('/api/hardware', require('./routes/hardware'));
    console.log('✅ Hardware route yüklendi');

    app.use('/api/routers', require('./routes/routers'));
    console.log('✅ Routers route yüklendi');

    // LoRa route - Simple version (syntax hatası olduğu için)
    app.use('/api/lora', require('./routes/lora-simple'));
    console.log('✅ LoRa Simple route yüklendi');

    app.use('/api/ml', require('./routes/ml'));
    console.log('✅ ML route yüklendi');

    app.use('/api/coordinator', require('./routes/coordinator'));
    console.log('✅ Coordinator route yüklendi');

    // Health endpoint for PC coordinator
    app.get('/api/health', (req, res) => {
        res.json({
            success: true,
            status: 'healthy',
            message: 'BeeTwin Backend API çalışıyor',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            endpoints: {
                coordinator: '/api/coordinator',
                sensors: '/api/sensors',
                auth: '/api/auth'
            }
        });
    });
    console.log('✅ Health endpoint eklendi');

    console.log('🔄 Test route yükleniyor...');
    app.use('/api/test', require('./routes/test'));
    console.log('✅ Test route yüklendi');

    app.use('/api/admin', require('./routes/admin'));
    console.log('✅ Admin route yüklendi');

    console.log('✅ Tüm API route\'ları başarıyla yüklendi');
} catch (error) {
    console.error('❌ Route yükleme hatası:', error);
    console.error('❌ Stack trace:', error.stack);
}

// Health Check - Kapsamlı sistem durumu
app.get('/health', async (req, res) => {
    try {
        // Database bağlantı kontrolü
        const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

        // Memory kullanımı
        const memoryUsage = process.memoryUsage();

        // Uptime
        const uptime = process.uptime();

        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            service: 'BeeTwin Backend Server',
            version: '2.0.0',
            system: '4-Router Architecture',
            database: {
                status: dbStatus,
                uri: MONGODB_URI.replace(/\/\/.*@/, '//***:***@'), // Hide credentials
            },
            memory: {
                rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
                heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
                heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB'
            },
            uptime: Math.round(uptime) + ' seconds',
            connectedSockets: io.engine.clientsCount,
            features: [
                '4-Router System Support',
                'Multi-Apiary Management',
                'Real-time WebSocket Communication',
                'JWT Authentication',
                'Beekeeper Registration System',
                'Hardware Management',
                'LoRa Communication',
                'Machine Learning Integration',
                'Batch Sensor Readings',
                'Admin Panel Support'
            ]
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// API Documentation
app.get('/api', (req, res) => {
    res.json({
        message: '🐝 BeeTwin API Documentation',
        version: '2.0.0',
        system: '4-Router Architecture',
        baseUrl: `${req.protocol}://${req.get('host')}/api`,
        endpoints: {
            authentication: {
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login',
                refresh: 'POST /api/auth/refresh',
                logout: 'POST /api/auth/logout'
            },
            users: {
                profile: 'GET /api/users/profile',
                update: 'PUT /api/users/profile',
                delete: 'DELETE /api/users/profile'
            },
            apiaries: {
                list: 'GET /api/apiaries',
                create: 'POST /api/apiaries',
                get: 'GET /api/apiaries/:id',
                update: 'PUT /api/apiaries/:id',
                delete: 'DELETE /api/apiaries/:id'
            },
            hives: {
                list: 'GET /api/hives',
                create: 'POST /api/hives',
                get: 'GET /api/hives/:id',
                update: 'PUT /api/hives/:id',
                delete: 'DELETE /api/hives/:id',
                sensors: 'GET /api/hives/:id/sensors'
            },
            sensors: {
                readings: 'GET /api/sensors/readings/:hiveId',
                latest: 'GET /api/sensors/latest/:hiveId',
                send: 'POST /api/sensors/data'
            },
            hardware: {
                routers: 'GET /api/hardware/routers',
                status: 'GET /api/hardware/status/:routerId',
                configure: 'POST /api/hardware/configure'
            }
        },
        websocket: {
            url: `ws://${req.get('host')}`,
            events: [
                'sensor-data',
                'hardware-status',
                'router-connection',
                'alarm',
                'join-user-room',
                'join-hive-room',
                'join-apiary-room'
            ]
        }
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: '🐝 BeeTwin IoT Backend Server',
        version: '2.0.0',
        system: '4-Router Architecture',
        status: 'Running',
        features: [
            'Arıcı Kayıt Sistemi',
            '4-Router Donanım Desteği',
            'Çoklu Arılık Yönetimi',
            'Gerçek Zamanlı Sensör Takibi',
            'WebSocket İletişimi',
            'JWT Kimlik Doğrulama'
        ],
        links: {
            health: '/health',
            api: '/api',
            docs: '/api'
        }
    });
});

// 404 handler
app.use('*', (req, res) => {
    console.log(`❌ 404 - Route bulunamadı: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        error: 'Route bulunamadı',
        message: `${req.method} ${req.originalUrl} endpoint'i mevcut değil`,
        availableEndpoints: '/api',
        timestamp: new Date().toISOString()
    });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('❌ Server hatası:', error);

    // Development'ta stack trace göster
    const isDev = process.env.NODE_ENV !== 'production';

    res.status(error.status || 500).json({
        error: 'Sunucu hatası',
        message: error.message,
        ...(isDev && { stack: error.stack }),
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
    });
});

// Server başlatma
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
    console.log('\n🚀 BeeTwin Backend Server başlatıldı');
    console.log(`📡 HTTP Server: http://${HOST}:${PORT}`);
    console.log(`🔗 WebSocket Server: ws://${HOST}:${PORT}`);
    console.log(`🐝 Sistem: 4-Router Architecture`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📅 Başlangıç: ${new Date().toLocaleString('tr-TR')}`);
    console.log(`🔧 Node.js: ${process.version}`);
    console.log('✅ Server hazır ve istekleri kabul ediyor\n');
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
    console.log(`\n🛑 ${signal} sinyali alındı, server kapatılıyor...`);

    server.close((err) => {
        if (err) {
            console.error('❌ Server kapatma hatası:', err);
            process.exit(1);
        }

        console.log('✅ HTTP Server kapatıldı');

        mongoose.connection.close(() => {
            console.log('✅ MongoDB bağlantısı kapatıldı');
            console.log('👋 BeeTwin Backend temiz bir şekilde kapatıldı');
            process.exit(0);
        });
    });

    // Force exit after 10 seconds
    setTimeout(() => {
        console.log('⏰ Zorla kapatılıyor...');
        process.exit(1);
    }, 10000);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Promise Rejection:', reason);
    console.error('Promise:', promise);
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

// Export for testing
module.exports = { app, server, io };


