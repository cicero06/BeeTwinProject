/**
 * BeeTwin Quick Setup Script
 * Physical Router'lar için otomatik kullanıcı ve kovan kurulumu
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection
const MONGODB_URI = 'mongodb://localhost:27017/beetwin';

async function quickSetup() {
    try {
        console.log('🚀 BeeTwin Physical Router Setup başlatılıyor...');

        // MongoDB'ye bağlan
        await mongoose.connect(MONGODB_URI);
        console.log('✅ MongoDB bağlantısı kuruldu');

        const db = mongoose.connection.db;

        // 1. Kullanıcı oluştur
        console.log('\n👤 Kullanıcı oluşturuluyor...');
        const hashedPassword = await bcrypt.hash('Hsyn123456', 10);

        const userData = {
            firstName: 'Hasan',
            lastName: 'Test',
            email: 'hsyn@gmail.com',
            password: hashedPassword,
            userType: 'beekeeper',
            location: 'Test Location',
            beekeepingInfo: {
                experience: 'intermediate',
                hiveCount: 2,
                location: 'Test Arılık'
            },
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const userResult = await db.collection('users').insertOne(userData);
        const userId = userResult.insertedId;
        console.log(`✅ Kullanıcı oluşturuldu: ${userId}`);

        // 2. Arılık oluştur
        console.log('\n🏡 Arılık oluşturuluyor...');
        const apiaryData = {
            name: 'Test Arılığı',
            location: {
                address: 'Test Arılık Adresi',
                coordinates: {
                    latitude: 39.925533,
                    longitude: 32.866287
                }
            },
            hiveCount: 2,
            ownerId: userId,
            type: 'modern',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const apiaryResult = await db.collection('apiaries').insertOne(apiaryData);
        const apiaryId = apiaryResult.insertedId;
        console.log(`✅ Arılık oluşturuldu: ${apiaryId}`);

        // 3. Physical Router'larla eşleşen kovanları oluştur
        console.log('\n🏠 Physical Router kovanları oluşturuluyor...');

        // Kovan 1 - Router 107 (BMP280)
        const hive1Data = {
            name: 'Kovan 1 - BMP280 Router',
            number: 1,
            description: 'Physical Router 107 ile eşleştirilmiş - BMP280 Sensörü',
            apiary: apiaryId,
            type: 'langstroth',
            sensor: {
                routerId: '107',        // Physical Router ID
                sensorId: '1013',       // Physical Sensor ID  
                isConnected: true,
                connectionStatus: 'connected',
                lastDataReceived: new Date(),
                calibrationDate: new Date(),
                hardwareDetails: {
                    coordinatorAddress: '34',
                    channel: 23,
                    routers: [{
                        routerId: '107',
                        routerType: 'bmp280',
                        address: '41',
                        sensorIds: ['1013'],
                        dataKeys: ['temperature', 'humidity', 'pressure']
                    }]
                }
            },
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Kovan 2 - Router 108 (MICS-4514)
        const hive2Data = {
            name: 'Kovan 2 - MICS4514 Router',
            number: 2,
            description: 'Physical Router 108 ile eşleştirilmiş - MICS-4514 Sensörü',
            apiary: apiaryId,
            type: 'langstroth',
            sensor: {
                routerId: '108',        // Physical Router ID
                sensorId: '1002',       // Physical Sensor ID
                isConnected: true,
                connectionStatus: 'connected',
                lastDataReceived: new Date(),
                calibrationDate: new Date(),
                hardwareDetails: {
                    coordinatorAddress: '34',
                    channel: 23,
                    routers: [{
                        routerId: '108',
                        routerType: 'mics4514',
                        address: '52',
                        sensorIds: ['1002'],
                        dataKeys: ['gasLevel', 'no2Level', 'coLevel']
                    }]
                }
            },
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const hiveResults = await db.collection('hives').insertMany([hive1Data, hive2Data]);
        console.log(`✅ 2 kovan oluşturuldu: ${Object.values(hiveResults.insertedIds)}`);

        // 4. Özet rapor
        console.log('\n🎉 Physical Router Setup tamamlandı!');
        console.log('📊 Oluşturulan veriler:');
        console.log(`   👤 Kullanıcı: hsyn@gmail.com / Hsyn123456`);
        console.log(`   🏡 Arılık: Test Arılığı`);
        console.log(`   🏠 Kovan 1: Router 107 - Sensor 1013 (BMP280)`);
        console.log(`   🏠 Kovan 2: Router 108 - Sensor 1002 (MICS-4514)`);
        console.log('\n✅ Artık physical Router verileriniz doğru kovanlarla eşleşecek!');
        console.log('🔓 Giriş yapabilirsiniz: hsyn@gmail.com / Hsyn123456');

        // Bağlantıyı kapat
        await mongoose.connection.close();
        console.log('🔌 MongoDB bağlantısı kapatıldı');

    } catch (error) {
        console.error('❌ Setup hatası:', error);
        process.exit(1);
    }
}

// Script'i çalıştır
if (require.main === module) {
    quickSetup();
}

module.exports = { quickSetup };
