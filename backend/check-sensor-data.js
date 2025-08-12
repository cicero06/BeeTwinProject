const mongoose = require('mongoose');
require('dotenv').config();

async function checkSensorData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('📦 MongoDB bağlantısı başarılı');

        const db = mongoose.connection.db;

        console.log('📊 Son 5 Sensör Okuma:');
        console.log('======================');

        const readings = await db.collection('sensorreadings').find({}).sort({ timestamp: -1 }).limit(5).toArray();

        readings.forEach((reading, i) => {
            console.log(`${i + 1}. ${new Date(reading.timestamp).toLocaleString('tr-TR')}`);
            console.log(`   Router: ${reading.metadata?.routerId}`);
            console.log(`   Veri: ${JSON.stringify(reading.data)}`);
            console.log('');
        });

        console.log('🔧 Router ID Başına Dağılım:');
        console.log('=============================');

        const routerCounts = {};
        const allReadings = await db.collection('sensorreadings').find({}).toArray();

        allReadings.forEach(reading => {
            const routerId = reading.metadata?.routerId || 'bilinmiyor';
            routerCounts[routerId] = (routerCounts[routerId] || 0) + 1;
        });

        Object.entries(routerCounts).forEach(([routerId, count]) => {
            console.log(`Router ${routerId}: ${count} okuma`);
        });

        // Son 24 saatteki okumalar
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentCount = await db.collection('sensorreadings').countDocuments({
            timestamp: { $gte: yesterday }
        });

        console.log('\n⏰ Son 24 Saatteki Okumalar:');
        console.log('============================');
        console.log(`Toplam: ${recentCount} okuma`);

        if (recentCount > 0) {
            const recentReadings = await db.collection('sensorreadings').find({
                timestamp: { $gte: yesterday }
            }).sort({ timestamp: -1 }).limit(3).toArray();

            console.log('\nSon 3 okuma:');
            recentReadings.forEach((reading, i) => {
                console.log(`${i + 1}. ${new Date(reading.timestamp).toLocaleString('tr-TR')}`);
                console.log(`   Router: ${reading.metadata?.routerId}`);
                console.log(`   Veri: ${JSON.stringify(reading.data)}`);
            });
        }

    } catch (error) {
        console.error('❌ Hata:', error.message);
    } finally {
        await mongoose.disconnect();
    }
}

checkSensorData();
