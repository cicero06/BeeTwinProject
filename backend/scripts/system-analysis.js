const mongoose = require('mongoose');
require('dotenv').config();

async function comprehensiveAnalysis() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB bağlandı\n');

        const db = mongoose.connection.db;

        console.log('🔍 SİSTEM GEREKSİNİMLERİ ANALİZİ');
        console.log('=' * 50);

        // 1. KULLANICI ROL SİSTEMİ
        console.log('\n1️⃣ KULLANICI ROL SİSTEMİ:');
        const users = await db.collection('users').find({}).toArray();
        const userTypes = {};
        users.forEach(user => {
            userTypes[user.userType] = (userTypes[user.userType] || 0) + 1;
        });

        console.log('   Mevcut Roller:');
        Object.keys(userTypes).forEach(type => {
            console.log(`   ✅ ${type}: ${userTypes[type]} kullanıcı`);
        });

        // Eksik roller
        const requiredRoles = ['admin', 'beekeeper'];
        const missingRoles = requiredRoles.filter(role => !userTypes[role]);
        if (missingRoles.length > 0) {
            console.log('   ❌ Eksik Roller:', missingRoles.join(', '));
        } else {
            console.log('   ✅ Tüm gerekli roller mevcut');
        }

        // 2. ARILIK YÖNETİMİ
        console.log('\n2️⃣ ARILIK YÖNETİMİ:');
        const apiaries = await db.collection('apiaries').find({}).toArray();
        console.log(`   ✅ Arılık Sayısı: ${apiaries.length}`);

        // Arılık-kullanıcı ilişkisi
        const apiaryOwners = await db.collection('apiaries').aggregate([
            { $lookup: { from: 'users', localField: 'ownerId', foreignField: '_id', as: 'owner' } },
            { $project: { name: 1, 'owner.email': 1, 'owner.userType': 1, location: 1 } }
        ]).toArray();

        apiaryOwners.forEach((apiary, index) => {
            console.log(`   ${index + 1}. ${apiary.name}`);
            console.log(`      Sahibi: ${apiary.owner[0]?.email || 'Bilinmiyor'} (${apiary.owner[0]?.userType || 'N/A'})`);
            console.log(`      Konum: ${apiary.location?.address || 'Tanımsız'}`);
        });

        // 3. KOVAN YÖNETİMİ
        console.log('\n3️⃣ KOVAN YÖNETİMİ:');
        const hives = await db.collection('hives').find({}).toArray();
        console.log(`   ✅ Kovan Sayısı: ${hives.length}`);

        // Kovan-sensör ilişkisi
        let hivesWithSensors = 0;
        let hivesWithoutSensors = 0;
        hives.forEach(hive => {
            if (hive.sensor && hive.sensor.routerId) {
                hivesWithSensors++;
            } else {
                hivesWithoutSensors++;
            }
        });

        console.log(`   ✅ Sensörlü Kovanlar: ${hivesWithSensors}`);
        console.log(`   ⚠️  Sensörsüz Kovanlar: ${hivesWithoutSensors}`);

        // 4. ROUTER SİSTEMİ (YENİ)
        console.log('\n4️⃣ ROUTER SİSTEMİ (YENİ):');
        const routers = await db.collection('routers').find({}).toArray();
        console.log(`   ✅ Router Sayısı: ${routers.length}`);

        if (routers.length > 0) {
            routers.forEach((router, index) => {
                console.log(`   ${index + 1}. Router ${router.routerId}: ${router.name}`);
                console.log(`      Durum: ${router.status} (${router.batteryLevel}%)`);
                console.log(`      Sensörler: ${router.sensors?.length || 0}`);
                router.sensors?.forEach(sensor => {
                    console.log(`        - ${sensor.sensorId}: ${sensor.sensorType} (${sensor.dataKeys?.length || 0} parametre)`);
                });
            });
        }

        // 5. SENSÖR SİSTEMİ (ESKİ)
        console.log('\n5️⃣ SENSÖR SİSTEMİ (ESKİ):');
        const sensors = await db.collection('sensors').find({}).toArray();
        console.log(`   ⚠️  Eski Sensör Kayıtları: ${sensors.length}`);

        if (sensors.length > 0) {
            console.log('   Eski sensörler:');
            sensors.forEach((sensor, index) => {
                console.log(`   ${index + 1}. ${sensor.routerId}/${sensor.sensorId} - ${sensor.sensorType}`);
            });
        }

        // 6. SENSÖR VERİLERİ
        console.log('\n6️⃣ SENSÖR VERİLERİ:');
        const readings = await db.collection('sensorreadings').countDocuments();
        console.log(`   ✅ Toplam Okuma: ${readings}`);

        // Son 24 saatteki veriler
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentReadings = await db.collection('sensorreadings').countDocuments({
            timestamp: { $gte: yesterday }
        });
        console.log(`   📊 Son 24 Saat: ${recentReadings} okuma`);

        // En son veri
        const latestReading = await db.collection('sensorreadings')
            .findOne({}, { sort: { timestamp: -1 } });
        if (latestReading) {
            console.log(`   🕐 Son Veri: ${latestReading.timestamp?.toLocaleString('tr-TR')}`);
        }

        // 7. SİSTEM EKSİKLİKLERİ
        console.log('\n7️⃣ SİSTEM EKSİKLİKLERİ VE ÖNERİLER:');

        const issues = [];
        const recommendations = [];

        // Router-Hive entegrasyonu
        if (routers.length > 0 && hivesWithoutSensors > 0) {
            issues.push('Yeni router sistemi ile kovanlar arasında bağlantı eksik');
            recommendations.push('Kovanları yeni router sistemine bağlayın');
        }

        // Eski sistem kalıntıları
        if (sensors.length > 0 && routers.length > 0) {
            issues.push('Hem eski hem yeni sensör sistemi mevcut - karışıklık yaratabilir');
            recommendations.push('Eski sensör kayıtlarını yeni sisteme migrate edin');
        }

        // Veri güncelliği
        const dataAge = latestReading ? (Date.now() - latestReading.timestamp.getTime()) / (1000 * 60 * 60) : null;
        if (dataAge && dataAge > 1) {
            issues.push(`En son veri ${Math.round(dataAge)} saat önce - sistem çalışmıyor olabilir`);
            recommendations.push('Koordinatör ve router bağlantılarını kontrol edin');
        }

        // Admin panel erişimi
        const adminUsers = users.filter(u => u.userType === 'admin');
        if (adminUsers.length === 0) {
            issues.push('Admin kullanıcısı yok');
            recommendations.push('Admin kullanıcısı oluşturun');
        }

        // Çıktı
        if (issues.length > 0) {
            console.log('   ❌ Tespit Edilen Sorunlar:');
            issues.forEach((issue, index) => {
                console.log(`      ${index + 1}. ${issue}`);
            });
        }

        if (recommendations.length > 0) {
            console.log('   💡 Öneriler:');
            recommendations.forEach((rec, index) => {
                console.log(`      ${index + 1}. ${rec}`);
            });
        }

        if (issues.length === 0) {
            console.log('   ✅ Sistem genel olarak sağlıklı görünüyor');
        }

        // 8. AUTHORIZATION TEST HAZIRLIĞI
        console.log('\n8️⃣ AUTHORIZATION TEST HAZIRLIĞI:');
        const testScenarios = [
            'Beekeeper login testi',
            'Admin login testi',
            'Beekeeper route erişim testi',
            'Admin-only route erişim testi',
            'Router CRUD işlemleri testi',
            'Cross-user data erişim testi'
        ];

        console.log('   📋 Test Edilmesi Gerekenler:');
        testScenarios.forEach((scenario, index) => {
            console.log(`      ${index + 1}. ${scenario}`);
        });

        // Test kullanıcıları
        console.log('\n   👥 Test Kullanıcıları:');
        users.forEach(user => {
            console.log(`      - ${user.email} (${user.userType})`);
            if (user.userType === 'admin') {
                console.log(`        Şifre: admin123`);
            }
        });

    } catch (error) {
        console.error('❌ Analiz hatası:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ Analiz tamamlandı');
    }
}

comprehensiveAnalysis();
