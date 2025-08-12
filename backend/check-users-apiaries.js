const mongoose = require('mongoose');
const Apiary = require('./models/Apiary');
const User = require('./models/User');

mongoose.connect('mongodb://localhost:27017/beetwin', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        console.log('MongoDB bağlantısı başarılı');

        // Tüm kullanıcıları ve arılıklarını listele
        const users = await User.find().select('email firstName lastName');
        console.log('📊 Kullanıcılar ve arılık bilgileri:\n');

        for (const user of users) {
            const userApiaries = await Apiary.find({ ownerId: user._id });
            console.log(`👤 ${user.firstName} ${user.lastName} (${user.email})`);
            console.log(`   📧 ID: ${user._id}`);

            if (userApiaries.length === 0) {
                console.log('   🏡 Arılık: Yok');
            } else {
                userApiaries.forEach((apiary, index) => {
                    console.log(`   🏡 Arılık ${index + 1}: ${apiary.name}`);
                    console.log(`      📍 Adres: ${apiary.location?.address || 'Yok'}`);

                    const coords = apiary.location?.coordinates;
                    if (coords && coords.latitude && coords.longitude) {
                        console.log(`      🗺️ Koordinatlar: ✅ ${coords.latitude}, ${coords.longitude}`);
                    } else {
                        console.log(`      🗺️ Koordinatlar: ❌ EKSİK`);
                    }
                    console.log(`      🆔 ID: ${apiary._id}`);
                });
            }
            console.log('---\n');
        }

        process.exit(0);
    })
    .catch(err => {
        console.error('MongoDB bağlantı hatası:', err);
        process.exit(1);
    });
