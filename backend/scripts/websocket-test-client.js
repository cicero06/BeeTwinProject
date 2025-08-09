const { io } = require('socket.io-client');

// Socket.IO test client
const testSocketData = () => {
    const socket = io('http://localhost:5000');

    socket.on('connect', function () {
        console.log('🔗 Connected to Socket.IO server');

        // Test verileri gönder
        setInterval(() => {
            const testData = [
                // BT107 - BME280 Sensör
                {
                    deviceId: 'BT107',
                    routerId: '107',
                    timestamp: new Date().toISOString(),
                    parameters: {
                        temperature: Math.round((34.5 + (Math.random() - 0.5) * 4) * 10) / 10,
                        humidity: Math.round((55 + (Math.random() - 0.5) * 20) * 10) / 10,
                        pressure: Math.round((1015 + (Math.random() - 0.5) * 30) * 10) / 10
                    }
                },
                // BT108 - MICS-4514 Hava Kalitesi
                {
                    deviceId: 'BT108',
                    routerId: '108',
                    timestamp: new Date().toISOString(),
                    parameters: {
                        co2: Math.round((800 + Math.random() * 400) * 10) / 10,
                        nh3: Math.round((20 + Math.random() * 30) * 10) / 10,
                        voc: Math.round((200 + Math.random() * 300) * 10) / 10
                    }
                },
                // BT109 - Ağırlık Sensörü
                {
                    deviceId: 'BT109',
                    routerId: '109',
                    timestamp: new Date().toISOString(),
                    parameters: {
                        weight: Math.round((25 + (Math.random() - 0.5) * 10) * 10) / 10
                    }
                },
                // BT110 - MQ2 Gaz Sensörü
                {
                    deviceId: 'BT110',
                    routerId: '110',
                    timestamp: new Date().toISOString(),
                    parameters: {
                        mq2: Math.round((300 + Math.random() * 400) * 10) / 10,
                        gas: Math.round((300 + Math.random() * 400) * 10) / 10
                    }
                }
            ];

            // Sensor data broadcast
            socket.emit('sensorDataUpdate', {
                type: 'realtime',
                data: testData,
                timestamp: new Date().toISOString()
            });

            console.log('📡 Sent test data:', testData.length, 'devices at', new Date().toLocaleTimeString());

        }, 3000); // Her 3 saniyede bir veri gönder
    });

    socket.on('sensorDataUpdate', function (data) {
        console.log('📨 Received sensor data:', data);
    });

    socket.on('connect_error', function (error) {
        console.log('❌ Connection error:', error.message);
    });

    socket.on('disconnect', function (reason) {
        console.log('🔌 Disconnected:', reason);
    });
};

console.log('🚀 Starting Socket.IO test client...');
testSocketData();
