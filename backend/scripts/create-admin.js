const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createAdminUser() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB bağlandı');

        const db = mongoose.connection.db;

        // Admin kullanıcısı var mı kontrol et
        const existingAdmin = await db.collection('users').findOne({ userType: 'admin' });
        if (existingAdmin) {
            console.log('⚠️  Admin kullanıcısı zaten mevcut:', existingAdmin.email);
            return;
        }

        // Admin kullanıcısı oluştur
        const adminPassword = 'admin123'; // Test için basit şifre
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        const adminUser = {
            name: 'Admin User',
            email: 'admin@beetwin.com',
            password: hashedPassword,
            userType: 'admin',
            isActive: true,
            isVerified: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await db.collection('users').insertOne(adminUser);
        console.log('✅ Admin kullanıcısı oluşturuldu');
        console.log(`   ID: ${result.insertedId}`);
        console.log(`   Email: ${adminUser.email}`);
        console.log(`   Password: ${adminPassword}`);
        console.log(`   UserType: ${adminUser.userType}`);

        // Güncel kullanıcı listesi
        console.log('\n👥 TÜM KULLANICILAR:');
        const allUsers = await db.collection('users').find({}).toArray();
        allUsers.forEach((user, index) => {
            console.log(`${index + 1}. ${user.name || 'İsimsiz'} (${user.email})`);
            console.log(`   UserType: ${user.userType}`);
            console.log(`   Active: ${user.isActive}`);
            console.log('');
        });

    } catch (error) {
        console.error('❌ Hata:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('✅ Bağlantı kapatıldı');
    }
}

createAdminUser();
