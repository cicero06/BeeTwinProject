const mongoose = require('mongoose');
const User = require('./models/User');
const Apiary = require('./models/Apiary');
const Hive = require('./models/Hive');

mongoose.connect('mongodb://localhost:27017/beetwin', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        console.log('MongoDB bağlantısı başarılı');

        // dnzhsyn@gmail.com kullanıcısının profile API'sine benzer şekilde veri getir
        const user = await User.findOne({ email: 'dnzhsyn@gmail.com' })
            .populate({
                path: 'apiaries',
                populate: {
                    path: 'hives',
                    select: 'name sensor apiary status'
                }
            });

        if (!user) {
            console.log('❌ Kullanıcı bulunamadı!');
            process.exit(1);
        }

        console.log('📡 Frontend\'e gönderilecek API yanıtı:');
        console.log('=====================================\n');

        const responseData = {
            success: true,
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                userType: user.userType,
                apiaries: user.apiaries || []
            }
        };

        console.log(JSON.stringify(responseData, null, 2));

        console.log('\n📊 Özet:');
        console.log(`👤 Kullanıcı: ${user.firstName} ${user.lastName}`);
        console.log(`📧 Email: ${user.email}`);
        console.log(`🏡 Arılık sayısı: ${user.apiaries?.length || 0}`);

        if (user.apiaries && user.apiaries.length > 0) {
            user.apiaries.forEach((apiary, index) => {
                console.log(`\n🏡 Arılık ${index + 1}:`);
                console.log(`   📍 Ad: ${apiary.name}`);
                console.log(`   🗺️ Koordinatlar: ${JSON.stringify(apiary.location?.coordinates || 'EKSİK')}`);
                console.log(`   🐝 Kovan sayısı: ${apiary.hives?.length || 0}`);
            });
        }

        process.exit(0);
    })
    .catch(err => {
        console.error('MongoDB bağlantı hatası:', err);
        process.exit(1);
    });
