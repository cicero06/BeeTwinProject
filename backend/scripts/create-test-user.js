const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const User = require('../models/User');

async function createTestUser() {
    try {
        await mongoose.connect('mongodb://localhost:27017/beetwin');
        console.log('📦 MongoDB bağlantısı başarılı');

        // Mevcut kullanıcıyı sil
        await User.deleteOne({ email: 'contact@gmail.com' });
        console.log('🗑️ Eski kullanıcı silindi');

        // Yeni kullanıcı oluştur
        const hashedPassword = await bcryptjs.hash('Hsyndnz1234', 12);

        const testUser = new User({
            firstName: 'Test',
            lastName: 'User',
            email: 'contact@gmail.com',
            password: hashedPassword,
            userType: 'hobbyist',
            location: {
                address: 'Test Location'
            },
            beekeepingInfo: {
                experience: 'beginner',
                hiveCount: 5,
                goals: ['honey_production']
            }
        });

        await testUser.save();
        console.log('✅ Test kullanıcısı oluşturuldu:');
        console.log('📧 Email: contact@gmail.com');
        console.log('🔑 Password: Hsyndnz1234');
        console.log('🆔 ID:', testUser._id);

        process.exit(0);

    } catch (error) {
        console.error('❌ Test kullanıcısı oluşturma hatası:', error);
        process.exit(1);
    }
}

createTestUser();
