const mongoose = require('mongoose');
const Sensor = require('../models/Sensor');

async function updateRouterIds() {
    try {
        await mongoose.connect('mongodb://localhost:27017/beetwin');
        console.log('📦 MongoDB bağlantısı başarılı');

        // Router 107 (BMP280)
        await Sensor.updateOne(
            { deviceId: 'BT107' },
            {
                $set: {
                    routerId: '107',
                    sensorId: '1013',
                    sensorTypes: ['temperature', 'humidity', 'pressure', 'altitude']
                }
            }
        );

        // Router 108 (MICS-4514)
        await Sensor.updateOne(
            { deviceId: 'BT108' },
            {
                $set: {
                    routerId: '108',
                    sensorId: '1002',
                    sensorTypes: ['co', 'no2']
                }
            }
        );

        console.log('✅ Router ID\'ler güncellendi');

        // Güncellenmiş sensörleri göster
        const sensors = await Sensor.find().select('deviceId routerId sensorId sensorTypes name');
        console.log('📡 Güncellenmiş sensörler:');
        sensors.forEach(sensor => {
            console.log(`  ${sensor.deviceId} → Router: ${sensor.routerId}, Sensor: ${sensor.sensorId}, Types: ${sensor.sensorTypes.join(', ')}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Hata:', error.message);
        process.exit(1);
    }
}

updateRouterIds();
