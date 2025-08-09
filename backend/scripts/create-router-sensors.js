const mongoose = require('mongoose');
const Sensor = require('../models/Sensor');
const User = require('../models/User');

async function createRouterSensors() {
    try {
        await mongoose.connect('mongodb://localhost:27017/beetwin');
        console.log('📦 MongoDB bağlantısı başarılı');

        // dnzhsyn@gmail.com kullanıcısını bul
        const user = await User.findOne({ email: 'dnzhsyn@gmail.com' });
        if (!user) {
            console.error('❌ Kullanıcı bulunamadı: dnzhsyn@gmail.com');
            process.exit(1);
        }

        console.log('👤 Kullanıcı bulundu:', user.email, '→ ID:', user._id);

        // Router 107 için sensör oluştur/güncelle
        const router107 = await Sensor.findOneAndUpdate(
            { routerId: '107', ownerId: user._id },
            {
                deviceId: 'BT107',
                routerId: '107',
                sensorId: '1013',
                name: 'Router 107 - BMP280',
                ownerId: user._id,
                sensorTypes: ['temperature', 'humidity', 'pressure', 'altitude'],
                status: 'active',
                batteryLevel: 85,
                isActive: true
            },
            { upsert: true, new: true }
        );

        // Router 108 için sensör oluştur/güncelle
        const router108 = await Sensor.findOneAndUpdate(
            { routerId: '108', ownerId: user._id },
            {
                deviceId: 'BT108',
                routerId: '108',
                sensorId: '1002',
                name: 'Router 108 - MICS-4514',
                ownerId: user._id,
                sensorTypes: ['co', 'no2'],
                status: 'active',
                batteryLevel: 85,
                isActive: true
            },
            { upsert: true, new: true }
        );

        console.log('✅ Router sensörleri oluşturuldu:');
        console.log('  🔧 Router 107:', router107.deviceId, '→', router107.sensorTypes.join(', '));
        console.log('  🔧 Router 108:', router108.deviceId, '→', router108.sensorTypes.join(', '));

        // Test verisi ekle
        const SensorReading = require('../models/SensorReading');

        // Router 107 test verisi
        const testReading107 = await SensorReading.create({
            sensorId: router107._id,
            data: {
                temperature: 27.0,
                humidity: 69.0,
                pressure: 101357.0,
                altitude: 100.5
            },
            timestamp: new Date(),
            batteryLevel: 85,
            signalStrength: -65,
            metadata: {
                source: 'coordinator',
                routerId: '107',
                sensorId: '1013'
            }
        });

        // Router 108 test verisi
        const testReading108 = await SensorReading.create({
            sensorId: router108._id,
            data: {
                co: 550.69,
                no2: 10.0
            },
            timestamp: new Date(),
            batteryLevel: 85,
            signalStrength: -65,
            metadata: {
                source: 'coordinator',
                routerId: '108',
                sensorId: '1002'
            }
        });

        console.log('📊 Test verileri eklendi:');
        console.log('  📈 Router 107 Reading:', testReading107._id);
        console.log('  📈 Router 108 Reading:', testReading108._id);

        process.exit(0);
    } catch (error) {
        console.error('❌ Hata:', error.message);
        process.exit(1);
    }
}

createRouterSensors();
