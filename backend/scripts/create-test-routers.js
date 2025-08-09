const mongoose = require('mongoose');
require('dotenv').config();

async function createTestRouters() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB bağlandı');

        const db = mongoose.connection.db;

        // Admin kullanıcısını bul
        const adminUser = await db.collection('users').findOne({ userType: 'admin' });
        if (!adminUser) {
            console.log('❌ Admin kullanıcısı bulunamadı. Önce admin oluşturun.');
            return;
        }

        // Beekeeper kullanıcısını bul
        const beekeeperUser = await db.collection('users').findOne({ userType: 'beekeeper' });
        if (!beekeeperUser) {
            console.log('❌ Beekeeper kullanıcısı bulunamadı.');
            return;
        }

        // Test router'ları tanımla
        const testRouters = [
            {
                routerId: '107',
                name: 'Test Router 107 - Sicaklık/Basınç',
                description: 'BMP280 sensörü ile sicaklık ve basınç ölçümü',
                sensors: [{
                    sensorId: 'S1',
                    sensorType: 'BMP280',
                    dataKeys: [
                        { key: 'WT', parameter: 'temperature', unit: '°C' },
                        { key: 'PR', parameter: 'pressure', unit: 'hPa' }
                    ]
                }],
                ownerId: beekeeperUser._id,
                status: 'active',
                batteryLevel: 85,
                lastSeen: new Date(),
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                routerId: '108',
                name: 'Test Router 108 - Hava Kalitesi',
                description: 'MICS-4514 sensörü ile hava kalitesi ölçümü',
                sensors: [{
                    sensorId: 'S1',
                    sensorType: 'MICS-4514',
                    dataKeys: [
                        { key: 'AL', parameter: 'alcohol', unit: 'ppm' },
                        { key: 'AM', parameter: 'ammonia', unit: 'ppm' }
                    ]
                }],
                ownerId: beekeeperUser._id,
                status: 'active',
                batteryLevel: 92,
                lastSeen: new Date(),
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                routerId: '109',
                name: 'Admin Router 109 - Ağırlık',
                description: 'Load Cell sensörü ile ağırlık ölçümü (Admin testi)',
                sensors: [{
                    sensorId: 'S1',
                    sensorType: 'Load Cell',
                    dataKeys: [
                        { key: 'WT', parameter: 'weight', unit: 'kg' }
                    ]
                }],
                ownerId: adminUser._id,
                status: 'active',
                batteryLevel: 78,
                lastSeen: new Date(),
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];

        // Router'ları oluştur
        for (let router of testRouters) {
            // Aynı routerId var mı kontrol et
            const existing = await db.collection('routers').findOne({ routerId: router.routerId });
            if (existing) {
                console.log(`⚠️  Router ${router.routerId} zaten mevcut, atlıyorum`);
                continue;
            }

            const result = await db.collection('routers').insertOne(router);
            console.log(`✅ Router ${router.routerId} oluşturuldu (${router.name})`);
            console.log(`   Sahibi: ${router.ownerId.equals(adminUser._id) ? 'Admin' : 'Beekeeper'}`);
            console.log(`   Sensör: ${router.sensors[0].sensorType}`);
            console.log('');
        }

        // Güncel router listesi
        console.log('📡 TÜM ROUTER\'LAR:');
        const allRouters = await db.collection('routers').find({}).toArray();
        allRouters.forEach((router, index) => {
            console.log(`${index + 1}. Router ${router.routerId}: ${router.name}`);
            console.log(`   Sahibi: ${router.ownerId.equals(adminUser._id) ? 'Admin' : 'Beekeeper'}`);
            console.log(`   Durum: ${router.status} (${router.batteryLevel}%)`);
            console.log(`   Sensörler: ${router.sensors.length}`);
            router.sensors.forEach(sensor => {
                console.log(`     - ${sensor.sensorId}: ${sensor.sensorType} (${sensor.dataKeys.length} parametre)`);
            });
            console.log('');
        });

    } catch (error) {
        console.error('❌ Hata:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('✅ Bağlantı kapatıldı');
    }
}

createTestRouters();
