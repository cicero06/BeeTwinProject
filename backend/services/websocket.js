const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

// WebSocket server setup
const setupWebSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || "http://localhost:3000",
            credentials: true
        }
    });

    // Authentication middleware for WebSocket
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;

        if (!token) {
            return next(new Error('Authentication error'));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.userId;
            next();
        } catch (err) {
            next(new Error('Authentication error'));
        }
    });

    // Client bağlandığında
    io.on('connection', (socket) => {
        console.log(`🔌 Client connected: ${socket.userId}`);

        // Kullanıcıyı kendi room'una ekle
        socket.join(`user_${socket.userId}`);

        // Bağlantı kesildiğinde
        socket.on('disconnect', () => {
            console.log(`🔌 Client disconnected: ${socket.userId}`);
        });

        // Client'dan komut geldiğinde (sensöre komut gönderme)
        socket.on('sensor_command', (data) => {
            console.log('📡 Sensor command received:', data);
            // LoRa'ya komut gönder
            sendCommandToLoRa(data);
        });
    });

    return io;
};

// LoRa'dan veri geldiğinde bu fonksiyon çağrılır
const broadcastSensorData = (io, sensorData) => {
    console.log('📊 Broadcasting sensor data:', sensorData);

    // WebSocket instance kontrolü
    if (!io) {
        console.log('⚠️ WebSocket instance not available, skipping broadcast');
        return;
    }

    try {
        // İlgili kullanıcıya gönder
        io.to(`user_${sensorData.ownerId}`).emit('sensor_data', {
            type: 'new_reading',
            data: sensorData,
            timestamp: new Date()
        });

        // 🧠 ML insights broadcast
        if (sensorData.mlInsights) {
            io.to(`user_${sensorData.ownerId}`).emit('ml_insights', {
                type: 'ml_analysis',
                deviceId: sensorData.deviceId,
                insights: sensorData.mlInsights,
                timestamp: new Date()
            });
        }

        // ML anomaly alerts
        if (sensorData.mlInsights && sensorData.mlInsights.anomalyDetection && sensorData.mlInsights.anomalyDetection.is_anomaly) {
            io.to(`user_${sensorData.ownerId}`).emit('alert', {
                type: 'ml_anomaly',
                message: sensorData.mlInsights.anomalyDetection.analysis?.summary || 'ML anomaly detected',
                sensorId: sensorData.sensorId,
                deviceId: sensorData.deviceId,
                confidence: sensorData.mlInsights.anomalyDetection.confidence,
                severity: sensorData.mlInsights.anomalyDetection.severity || 'medium',
                method: 'machine_learning'
            });
        }

        // ML insight alerts
        if (sensorData.mlInsights && sensorData.mlInsights.insights) {
            sensorData.mlInsights.insights.forEach(insight => {
                if (insight.severity === 'high' || insight.severity === 'critical') {
                    io.to(`user_${sensorData.ownerId}`).emit('alert', {
                        type: 'ml_insight',
                        message: insight.message,
                        sensorId: sensorData.sensorId,
                        deviceId: sensorData.deviceId,
                        severity: insight.severity,
                        method: 'ml_analysis'
                    });
                }
            });
        }

        console.log('✅ WebSocket broadcast successful');

    } catch (error) {
        console.error('❌ WebSocket broadcast error:', error.message);
    }

    // Klasik threshold-based alerts (backward compatibility)
    try {
        if (sensorData.data && sensorData.data.temperature > 35) {
            io.to(`user_${sensorData.ownerId}`).emit('alert', {
                type: 'high_temperature',
                message: 'Yüksek sıcaklık tespit edildi!',
                sensorId: sensorData.sensorId,
                value: sensorData.data.temperature,
                method: 'threshold'
            });
        }
    } catch (error) {
        console.error('❌ Alert broadcast error:', error.message);
    }
};

// LoRa'ya komut gönderme fonksiyonu
const sendCommandToLoRa = (commandData) => {
    // Burada LoRa gateway'e komut gönderilir
    // Serial port, MQTT, HTTP vs.
    console.log('📡 Sending command to LoRa:', commandData);
};

module.exports = {
    setupWebSocket,
    broadcastSensorData,
    sendCommandToLoRa
};
