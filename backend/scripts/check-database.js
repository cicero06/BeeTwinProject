const mongoose = require('mongoose');
const User = require('../models/User');
const Hive = require('../models/Hive');
const Apiary = require('../models/Apiary');

async function checkDatabase() {
    try {
        // MongoDB bağlantısı
        await mongoose.connect('mongodb://localhost:27017/beetwin');
        console.log('📦 MongoDB bağlantısı başarılı');

        // Kullanıcıları kontrol et
        const users = await User.find({});
        console.log('\n🔍 Database\'deki kullanıcılar:');

        if (users.length === 0) {
            console.log('❌ Hiç kullanıcı bulunamadı!');
        } else {
            users.forEach((user, index) => {
                console.log(`\n👤 Kullanıcı ${index + 1}:`);
                console.log('📧 Email:', user.email);
                console.log('🆔 ID:', user._id);
                console.log('👤 Ad:', user.firstName, user.lastName);
                console.log('📅 Kayıt:', user.createdAt);
            });
        }

        // Arılıkları kontrol et
        const apiaries = await Apiary.find({});
        console.log(`\n🏡 Toplam arılık: ${apiaries.length}`);

        // Kovanları kontrol et
        const hives = await Hive.find({});
        console.log(`🏠 Toplam kovan: ${hives.length}`);

        if (hives.length > 0) {
            console.log('\n🔧 Kovan donanım durumu:');
            hives.forEach((hive, index) => {
                console.log(`\nKovan ${index + 1}: ${hive.name}`);
                if (hive.hardware && hive.hardware.routers) {
                    console.log(`  📡 Router sayısı: ${hive.hardware.routers.length}`);
                    hive.hardware.routers.forEach((router, rIndex) => {
                        console.log(`    Router ${rIndex + 1}: ${router.routerId} (${router.routerType})`);
                        if (router.sensors) {
                            console.log(`      📊 Sensör sayısı: ${router.sensors.length}`);
                        }
                    });
                } else if (hive.hardware && hive.hardware.routerId) {
                    console.log(`  📡 Legacy Router: ${hive.hardware.routerId}`);
                    console.log(`  📊 Legacy Sensor: ${hive.hardware.sensorId}`);
                }
            });
        }

        console.log('\n✅ Database kontrolü tamamlandı');
        process.exit(0);

    } catch (error) {
        console.error('❌ Database kontrol hatası:', error);
        process.exit(1);
    }
}

checkDatabase();
