const mongoose = require('mongoose');
const SensorReading = require('../models/SensorReading');
const Sensor = require('../models/Sensor');

async function testCurrentData() {
    try {
        await mongoose.connect('mongodb://localhost:27017/beetwin');
        console.log('📦 MongoDB bağlantısı başarılı');

        // Router 107 için en son veriyi kontrol et
        const sensor107 = await Sensor.findOne({ routerId: '107' });
        console.log('🔍 Router 107 Sensor:', sensor107 ? sensor107.deviceId : 'Bulunamadı');

        if (sensor107) {
            const latestReading = await SensorReading.findOne({ sensorId: sensor107._id })
                .sort({ timestamp: -1 });

            if (latestReading) {
                console.log('📊 En son veri (Router 107):');
                console.log('  🌡️ Sıcaklık:', latestReading.data.temperature);
                console.log('  💧 Nem:', latestReading.data.humidity);
                console.log('  📈 Basınç:', latestReading.data.pressure);
                console.log('  ⏰ Zaman:', latestReading.timestamp);
            } else {
                console.log('❌ Router 107 için veri bulunamadı');
            }
        }

        // Router 108 için de kontrol et
        const sensor108 = await Sensor.findOne({ routerId: '108' });
        console.log('🔍 Router 108 Sensor:', sensor108 ? sensor108.deviceId : 'Bulunamadı');

        if (sensor108) {
            const latestReading = await SensorReading.findOne({ sensorId: sensor108._id })
                .sort({ timestamp: -1 });

            if (latestReading) {
                console.log('📊 En son veri (Router 108):');
                console.log('  🟢 CO:', latestReading.data.co);
                console.log('  🔴 NO2:', latestReading.data.no2);
                console.log('  ⏰ Zaman:', latestReading.timestamp);
            } else {
                console.log('❌ Router 108 için veri bulunamadı');
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Hata:', error.message);
        process.exit(1);
    }
}

testCurrentData();
