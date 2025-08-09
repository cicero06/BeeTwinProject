const mongoose = require('mongoose');
require('dotenv').config();

async function simpleCheck() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB bağlandı\n');

        // Raw koleksiyon kontrolü
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();

        console.log('📊 VERİTABANI KOLEKSİYONLARI:');
        console.log('================================');

        for (let collection of collections) {
            const collectionName = collection.name;
            const count = await db.collection(collectionName).countDocuments();
            console.log(`${collectionName}: ${count} kayıt`);

            if (count > 0 && count < 10) {
                const samples = await db.collection(collectionName).find({}).limit(2).toArray();
                console.log('  Örnek kayıtlar:');
                samples.forEach((doc, index) => {
                    console.log(`    ${index + 1}. ID: ${doc._id}`);
                    if (doc.name) console.log(`       Name: ${doc.name}`);
                    if (doc.email) console.log(`       Email: ${doc.email}`);
                    if (doc.userType) console.log(`       UserType: ${doc.userType}`);
                    if (doc.role) console.log(`       Role: ${doc.role}`);
                    if (doc.routerId) console.log(`       RouterID: ${doc.routerId}`);
                    if (doc.sensorType) console.log(`       SensorType: ${doc.sensorType}`);
                    console.log('');
                });
            }
            console.log('');
        }

        // Users koleksiyonu özel analizi
        console.log('👥 KULLANICI ANALİZİ:');
        console.log('====================');

        const users = await db.collection('users').find({}).toArray();
        users.forEach((user, index) => {
            console.log(`${index + 1}. ${user.name || user.email || 'İsimsiz'}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   UserType: ${user.userType || 'Tanımsız'}`);
            console.log(`   Role: ${user.role || 'Yok'}`);
            console.log(`   Active: ${user.isActive}`);
            console.log(`   Created: ${user.createdAt}`);
            console.log('');
        });

        // Role field kontrolü
        const usersWithRole = await db.collection('users').find({ role: { $exists: true } }).toArray();
        if (usersWithRole.length > 0) {
            console.log('⚠️  ROLE FIELD KALINTILARI:');
            usersWithRole.forEach(user => {
                console.log(`   ${user.email}: role="${user.role}", userType="${user.userType}"`);
            });
            console.log('');
        }

        // Router analizi
        const routers = await db.collection('routers').find({}).toArray();
        if (routers.length > 0) {
            console.log('📡 ROUTER ANALİZİ:');
            console.log('=================');
            routers.forEach((router, index) => {
                console.log(`${index + 1}. Router ID: ${router.routerId}`);
                console.log(`   Name: ${router.name || 'Tanımsız'}`);
                console.log(`   Status: ${router.status}`);
                console.log(`   Sensors: ${router.sensors?.length || 0}`);
                if (router.sensors?.length > 0) {
                    router.sensors.forEach(sensor => {
                        console.log(`     - ${sensor.sensorId}: ${sensor.sensorType}`);
                    });
                }
                console.log('');
            });
        }

    } catch (error) {
        console.error('❌ Hata:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('✅ Bağlantı kapatıldı');
    }
}

simpleCheck();
