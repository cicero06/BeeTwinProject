/**
 * BeeTwin Database Migration Script
 * Tek sensor'dan çoklu sensor'lara geçiş
 */

const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = 'mongodb://localhost:27017/beetwin';

async function migrateDatabase() {
    try {
        console.log('🔄 Database migration başlatılıyor...');

        // MongoDB'ye bağlan
        await mongoose.connect(MONGODB_URI);
        console.log('✅ MongoDB bağlantısı kuruldu');

        // Hive collection'ını al
        const db = mongoose.connection.db;
        const hivesCollection = db.collection('hives');

        // Mevcut tüm kovanları getir
        const hives = await hivesCollection.find({}).toArray();
        console.log(`📊 ${hives.length} kovan bulundu`);

        for (const hive of hives) {
            console.log(`\n🔄 ${hive.name} güncelleniyor...`);

            // Yeni sensors array'i oluştur
            const sensors = [];

            // Eğer eski sensor field'ı varsa, onu sensors array'ine ekle
            if (hive.sensor && hive.sensor.routerId) {
                const routerId = hive.sensor.routerId;
                const sensorId = hive.sensor.sensorId;

                // Router tipine göre sensor bilgilerini belirle
                let sensorInfo = getSensorInfo(routerId, sensorId);

                sensors.push({
                    routerId: routerId,
                    sensorId: sensorId,
                    type: sensorInfo.type,
                    deviceId: `BT${routerId}`,
                    isActive: true,
                    isConnected: hive.sensor.isConnected || false,
                    lastDataReceived: hive.sensor.lastDataReceived || null,
                    connectionStatus: hive.sensor.connectionStatus || 'unknown',
                    description: sensorInfo.description,
                    dataTypes: sensorInfo.dataTypes
                });

                console.log(`  ✅ ${routerId}/${sensorId} eklendi (${sensorInfo.type})`);
            }

            // Fiziksel kovan için SADECE ÇALIŞAN router'ları ekle
            if (hive.name === 'Kovan 1') {
                // ✅ Router 107 - BMP280 (ÇALIŞIYOR)
                if (!sensors.find(s => s.routerId === '107')) {
                    sensors.push({
                        routerId: '107',
                        sensorId: '1013',
                        type: 'bmp280',
                        deviceId: 'BT107',
                        isActive: true,
                        isConnected: true,
                        connectionStatus: 'active',
                        description: 'BMP280 Environmental Sensor - ÇALIŞIYOR',
                        dataTypes: ['temperature', 'humidity', 'pressure']
                    });
                    console.log('  ✅ Router 107 (BMP280) eklendi - AKTIF');
                }

                // ✅ Router 108 - MICS-4514 (ÇALIŞIYOR)
                if (!sensors.find(s => s.routerId === '108')) {
                    sensors.push({
                        routerId: '108',
                        sensorId: '1002',
                        type: 'mics4514',
                        deviceId: 'BT108',
                        isActive: true,
                        isConnected: true,
                        connectionStatus: 'active',
                        description: 'MICS-4514 Gas Sensor - ÇALIŞIYOR',
                        dataTypes: ['co', 'no2', 'nh3', 'gasLevel']
                    });
                    console.log('  ✅ Router 108 (MICS-4514) eklendi - AKTIF');
                }

                // ⏳ Router 109 - Load Sensor (HENÜZ ÇALIŞMIYOR)
                if (!sensors.find(s => s.routerId === '109')) {
                    sensors.push({
                        routerId: '109',
                        sensorId: '1010',
                        type: 'loadSensor',
                        deviceId: 'BT109',
                        isActive: false,
                        isConnected: false,
                        connectionStatus: 'inactive',
                        description: 'Load Sensor - GELİŞTİRME AŞAMASINDA',
                        dataTypes: ['weight', 'load']
                    });
                    console.log('  ⏳ Router 109 (Load) eklendi - PASIF');
                }

                // ⏳ Router 110 - MQ2 Gas (HENÜZ ÇALIŞMIYOR)
                if (!sensors.find(s => s.routerId === '110')) {
                    sensors.push({
                        routerId: '110',
                        sensorId: '1009',
                        type: 'mq2',
                        deviceId: 'BT110',
                        isActive: false,
                        isConnected: false,
                        connectionStatus: 'inactive',
                        description: 'MQ2 Gas Sensor - GELİŞTİRME AŞAMASINDA',
                        dataTypes: ['gas', 'smoke', 'lpg']
                    });
                }

                // Router 110 - MQ2 Gas sensor (henüz aktif değil)
                if (!sensors.find(s => s.routerId === '110')) {
                    sensors.push({
                        routerId: '110',
                        sensorId: '1009',
                        type: 'gas',
                        deviceId: 'BT110',
                        isActive: false,
                        isConnected: false,
                        connectionStatus: 'unknown',
                        description: 'MQ2 Gas Sensor',
                        dataTypes: ['gasLevel', 'smokeLevel']
                    });
                }

                console.log(`  ✅ Kovan 1 için ${sensors.length} sensor eklendi`);
            }

            // Database'i güncelle
            await hivesCollection.updateOne(
                { _id: hive._id },
                {
                    $set: { sensors: sensors },
                    $unset: { 'sensor.routerId': '', 'sensor.sensorId': '' } // Eski alanları temizle
                }
            );

            console.log(`  ✅ ${hive.name} başarıyla güncellendi`);
        }

        console.log('\n🎉 Migration tamamlandı!');

    } catch (error) {
        console.error('❌ Migration hatası:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 MongoDB bağlantısı kapatıldı');
    }
}

function getSensorInfo(routerId, sensorId) {
    const routerConfigs = {
        '107': {
            type: 'environmental',
            description: 'BME280 Environmental Sensor',
            dataTypes: ['temperature', 'humidity', 'pressure', 'altitude']
        },
        '108': {
            type: 'gas',
            description: 'MICS-4514 Gas Sensor',
            dataTypes: ['gasLevel', 'no2Level', 'co', 'no']
        },
        '109': {
            type: 'weight',
            description: 'Weight Sensor',
            dataTypes: ['weight', 'temperature', 'humidity']
        },
        '110': {
            type: 'gas',
            description: 'MQ2 Gas Sensor',
            dataTypes: ['gasLevel', 'smokeLevel']
        }
    };

    return routerConfigs[routerId] || {
        type: 'environmental',
        description: `Router ${routerId} Sensor`,
        dataTypes: ['temperature', 'humidity']
    };
}

// Script'i çalıştır
if (require.main === module) {
    migrateDatabase();
}

module.exports = { migrateDatabase };
