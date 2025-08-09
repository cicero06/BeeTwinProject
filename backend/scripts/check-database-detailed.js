const mongoose = require('mongoose');
const User = require('../models/User');
const Apiary = require('../models/Apiary');
const Hive = require('../models/Hive');
const Sensor = require('../models/Sensor');
const SensorReading = require('../models/SensorReading');
const Router = require('../models/Router');

require('dotenv').config();

async function checkDatabase() {
    try {
        // MongoDB'ye bağlan
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB bağlantısı başarılı');

        console.log('\n📊 VERİTABANI DURUMU RAPORU');
        console.log('=' * 50);

        // Users koleksiyonu
        const userCount = await User.countDocuments();
        console.log(`\n👥 KULLANICILAR (${userCount} kayıt):`);

        if (userCount > 0) {
            const users = await User.find({}, 'name email userType isActive createdAt').limit(10);
            users.forEach((user, index) => {
                console.log(`${index + 1}. ${user.name} (${user.email})`);
                console.log(`   - Tip: ${user.userType || 'Tanımsız'}`);
                console.log(`   - Durum: ${user.isActive ? 'Aktif' : 'Pasif'}`);
                console.log(`   - Kayıt: ${user.createdAt?.toLocaleDateString('tr-TR') || 'Bilinmiyor'}`);
                console.log('');
            });
        } else {
            console.log('❌ Hiç kullanıcı bulunamadı');
        }

        // Apiaries koleksiyonu
        const apiaryCount = await Apiary.countDocuments();
        console.log(`\n🏡 ARILIKLAR (${apiaryCount} kayıt):`);

        if (apiaryCount > 0) {
            const apiaries = await Apiary.find({}, 'name location ownerId').populate('ownerId', 'name email').limit(5);
            apiaries.forEach((apiary, index) => {
                console.log(`${index + 1}. ${apiary.name}`);
                console.log(`   - Konum: ${apiary.location?.address || 'Tanımsız'}`);
                console.log(`   - Sahibi: ${apiary.ownerId?.name || 'Bilinmiyor'} (${apiary.ownerId?.email || ''})`);
                console.log('');
            });
        } else {
            console.log('❌ Hiç arılık bulunamadı');
        }

        // Hives koleksiyonu
        const hiveCount = await Hive.countDocuments();
        console.log(`\n🐝 KOVANLAR (${hiveCount} kayıt):`);

        if (hiveCount > 0) {
            const hives = await Hive.find({}, 'name sensor ownerId apiaryId').populate('ownerId', 'name').populate('apiaryId', 'name').limit(5);
            hives.forEach((hive, index) => {
                console.log(`${index + 1}. ${hive.name}`);
                console.log(`   - Arılık: ${hive.apiaryId?.name || 'Tanımsız'}`);
                console.log(`   - Sahibi: ${hive.ownerId?.name || 'Bilinmiyor'}`);
                console.log(`   - Sensör: ${hive.sensor?.routerId || 'Yok'} / ${hive.sensor?.sensorId || 'Yok'}`);
                console.log('');
            });
        } else {
            console.log('❌ Hiç kovan bulunamadı');
        }

        // Routers koleksiyonu
        const routerCount = await Router.countDocuments();
        console.log(`\n📡 ROUTER'LAR (${routerCount} kayıt):`);

        if (routerCount > 0) {
            const routers = await Router.find({}, 'routerId name sensors status ownerId').populate('ownerId', 'name').limit(5);
            routers.forEach((router, index) => {
                console.log(`${index + 1}. Router ID: ${router.routerId}`);
                console.log(`   - İsim: ${router.name || 'Tanımsız'}`);
                console.log(`   - Sahibi: ${router.ownerId?.name || 'Bilinmiyor'}`);
                console.log(`   - Durum: ${router.status || 'Bilinmiyor'}`);
                console.log(`   - Sensör Sayısı: ${router.sensors?.length || 0}`);
                if (router.sensors?.length > 0) {
                    router.sensors.forEach(sensor => {
                        console.log(`     └─ ${sensor.sensorId}: ${sensor.sensorType}`);
                    });
                }
                console.log('');
            });
        } else {
            console.log('❌ Hiç router bulunamadı');
        }

        // Sensors koleksiyonu
        const sensorCount = await Sensor.countDocuments();
        console.log(`\n📊 SENSÖRLER (${sensorCount} kayıt):`);

        if (sensorCount > 0) {
            const sensors = await Sensor.find({}, 'routerId sensorId sensorType status').limit(5);
            sensors.forEach((sensor, index) => {
                console.log(`${index + 1}. ${sensor.routerId}/${sensor.sensorId}`);
                console.log(`   - Tip: ${sensor.sensorType || 'Tanımsız'}`);
                console.log(`   - Durum: ${sensor.status || 'Bilinmiyor'}`);
                console.log('');
            });
        } else {
            console.log('❌ Hiç sensör bulunamadı');
        }

        // SensorReadings koleksiyonu
        const readingCount = await SensorReading.countDocuments();
        console.log(`\n📈 SENSÖR OKUMALARI (${readingCount} kayıt):`);

        if (readingCount > 0) {
            const latestReadings = await SensorReading.find({})
                .sort({ timestamp: -1 })
                .limit(5)
                .populate('sensor', 'routerId sensorId sensorType');

            console.log('Son 5 okuma:');
            latestReadings.forEach((reading, index) => {
                console.log(`${index + 1}. ${reading.sensor?.routerId}/${reading.sensor?.sensorId}`);
                console.log(`   - Tarih: ${reading.timestamp?.toLocaleString('tr-TR') || 'Bilinmiyor'}`);
                console.log(`   - Veri: ${JSON.stringify(reading.data || {})}`);
                console.log('');
            });
        } else {
            console.log('❌ Hiç sensör okuması bulunamadı');
        }

        // UserType analizi
        console.log('\n🔐 KULLANICI TİPLERİ ANALİZİ:');
        const userTypes = await User.aggregate([
            { $group: { _id: '$userType', count: { $sum: 1 } } }
        ]);

        userTypes.forEach(type => {
            console.log(`   - ${type._id || 'Tanımsız'}: ${type.count} kullanıcı`);
        });

        // Role field analizi (eski sistem kalıntıları)
        const usersWithRole = await User.find({ role: { $exists: true } }, 'name email role userType');
        if (usersWithRole.length > 0) {
            console.log('\n⚠️  ROLE FIELD KALINTILARI:');
            usersWithRole.forEach(user => {
                console.log(`   - ${user.name}: role=${user.role}, userType=${user.userType}`);
            });
        }

        console.log('\n✅ Veritabanı kontrol tamamlandı');

    } catch (error) {
        console.error('❌ Veritabanı kontrol hatası:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 MongoDB bağlantısı kapatıldı');
    }
}

// Script'i çalıştır
if (require.main === module) {
    checkDatabase();
}

module.exports = checkDatabase;
