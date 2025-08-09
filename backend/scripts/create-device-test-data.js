const mongoose = require('mongoose');
const SensorReading = require('../models/SensorReading');

// Database bağlantısı
mongoose.connect('mongodb://localhost:27017/bee_twin', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const createTestSensorData = async () => {
    try {
        console.log('🚀 Creating test sensor data...');

        // Önce eski verileri temizle
        await SensorReading.deleteMany({});
        console.log('🗑️ Old data cleared');

        const now = new Date();
        const testData = [];

        // BT107 (Router 107) - BME280 Sensör Verileri
        for (let i = 0; i < 10; i++) {
            const timestamp = new Date(now.getTime() - (i * 60000)); // Her dakika bir veri

            // Sıcaklık verisi
            testData.push({
                deviceId: 'BT107',
                routerId: '107',
                sensorId: 'temperature',
                value: 34.5 + (Math.random() - 0.5) * 4, // 32.5-36.5 arası
                unit: '°C',
                timestamp: timestamp,
                parameters: {
                    temperature: 34.5 + (Math.random() - 0.5) * 4,
                    humidity: 55 + (Math.random() - 0.5) * 20,
                    pressure: 1015 + (Math.random() - 0.5) * 30
                }
            });

            // Nem verisi  
            testData.push({
                deviceId: 'BT107',
                routerId: '107',
                sensorId: 'humidity',
                value: 55 + (Math.random() - 0.5) * 20, // 45-65 arası
                unit: '%',
                timestamp: timestamp,
                parameters: {
                    temperature: 34.5 + (Math.random() - 0.5) * 4,
                    humidity: 55 + (Math.random() - 0.5) * 20,
                    pressure: 1015 + (Math.random() - 0.5) * 30
                }
            });

            // Basınç verisi
            testData.push({
                deviceId: 'BT107',
                routerId: '107',
                sensorId: 'pressure',
                value: 1015 + (Math.random() - 0.5) * 30, // 1000-1030 arası
                unit: 'hPa',
                timestamp: timestamp,
                parameters: {
                    temperature: 34.5 + (Math.random() - 0.5) * 4,
                    humidity: 55 + (Math.random() - 0.5) * 20,
                    pressure: 1015 + (Math.random() - 0.5) * 30
                }
            });
        }

        // BT108 (Router 108) - MICS-4514 Hava Kalitesi Verileri
        for (let i = 0; i < 10; i++) {
            const timestamp = new Date(now.getTime() - (i * 60000));

            testData.push({
                deviceId: 'BT108',
                routerId: '108',
                sensorId: 'co2',
                value: 800 + Math.random() * 400, // 800-1200 ppm arası
                unit: 'ppm',
                timestamp: timestamp,
                parameters: {
                    co2: 800 + Math.random() * 400,
                    nh3: 20 + Math.random() * 30,
                    voc: 200 + Math.random() * 300
                }
            });

            testData.push({
                deviceId: 'BT108',
                routerId: '108',
                sensorId: 'nh3',
                value: 20 + Math.random() * 30, // 20-50 ppm arası
                unit: 'ppm',
                timestamp: timestamp,
                parameters: {
                    co2: 800 + Math.random() * 400,
                    nh3: 20 + Math.random() * 30,
                    voc: 200 + Math.random() * 300
                }
            });
        }

        // BT109 (Router 109) - Ağırlık Sensörü
        for (let i = 0; i < 10; i++) {
            const timestamp = new Date(now.getTime() - (i * 60000));

            testData.push({
                deviceId: 'BT109',
                routerId: '109',
                sensorId: 'weight',
                value: 25 + (Math.random() - 0.5) * 10, // 20-30 kg arası
                unit: 'kg',
                timestamp: timestamp,
                parameters: {
                    weight: 25 + (Math.random() - 0.5) * 10
                }
            });
        }

        // BT110 (Router 110) - MQ2 Gaz Sensörü
        for (let i = 0; i < 10; i++) {
            const timestamp = new Date(now.getTime() - (i * 60000));

            testData.push({
                deviceId: 'BT110',
                routerId: '110',
                sensorId: 'mq2',
                value: 300 + Math.random() * 400, // 300-700 ppm arası
                unit: 'ppm',
                timestamp: timestamp,
                parameters: {
                    mq2: 300 + Math.random() * 400,
                    gas: 300 + Math.random() * 400
                }
            });
        }

        // Verileri kaydet
        await SensorReading.insertMany(testData);
        console.log(`✅ ${testData.length} test sensor reading created`);

        // Özet göster
        const summary = await SensorReading.aggregate([
            {
                $group: {
                    _id: '$deviceId',
                    count: { $sum: 1 },
                    latestTimestamp: { $max: '$timestamp' }
                }
            }
        ]);

        console.log('📊 Test Data Summary:');
        summary.forEach(item => {
            console.log(`  ${item._id}: ${item.count} readings, latest: ${item.latestTimestamp}`);
        });

    } catch (error) {
        console.error('❌ Error creating test data:', error);
    } finally {
        mongoose.disconnect();
    }
};

createTestSensorData();
