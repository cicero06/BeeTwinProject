const mongoose = require('mongoose');
require('dotenv').config();

async function cleanupRoleFields() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB bağlandı');

        const db = mongoose.connection.db;

        // Role field'larını kaldır
        console.log('🧹 Role field\'larını temizliyorum...');
        const result = await db.collection('users').updateMany(
            { role: { $exists: true } },
            { $unset: { role: 1 } }
        );

        console.log(`✅ ${result.modifiedCount} kullanıcıdan role field kaldırıldı`);

        // Kontrol et
        const usersAfter = await db.collection('users').find({}).toArray();
        console.log('\n📋 Temizlik sonrası kullanıcılar:');
        usersAfter.forEach((user, index) => {
            console.log(`${index + 1}. ${user.email}`);
            console.log(`   UserType: ${user.userType}`);
            console.log(`   Role: ${user.role || 'YOK ✅'}`);
            console.log('');
        });

    } catch (error) {
        console.error('❌ Hata:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('✅ Bağlantı kapatıldı');
    }
}

cleanupRoleFields();
