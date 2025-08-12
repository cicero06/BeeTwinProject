const mongoose = require('mongoose');
const Apiary = require('./models/Apiary');
const User = require('./models/User');
const Hive = require('./models/Hive');

mongoose.connect('mongodb://localhost:27017/beetwin', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        console.log('MongoDB bağlantısı başarılı');

        // dnzhsyn@gmail.com kullanıcısını bul
        const user = await User.findOne({ email: 'dnzhsyn@gmail.com' });

        if (!user) {
            console.log('❌ Kullanıcı bulunamadı!');
            process.exit(1);
        }

        console.log('👤 Kullanıcı Bilgileri:');
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   👨 Ad: ${user.firstName} ${user.lastName}`);
        console.log(`   🆔 ID: ${user._id}`);
        console.log('---\n');

        // Bu kullanıcının arılıklarını bul
        const userApiaries = await Apiary.find({ ownerId: user._id });

        console.log('🏡 Arılıklar:');
        for (const apiary of userApiaries) {
            console.log(`   📍 ${apiary.name}`);
            console.log(`   🏠 Adres: ${apiary.location?.address || 'Yok'}`);

            const coords = apiary.location?.coordinates;
            if (coords && coords.latitude && coords.longitude) {
                console.log(`   🗺️ Koordinatlar: ✅ Lat: ${coords.latitude}, Lng: ${coords.longitude}`);
            } else {
                console.log(`   🗺️ Koordinatlar: ❌ EKSİK`);
            }

            console.log(`   🆔 Arılık ID: ${apiary._id}`);

            // Bu arılığa ait kovanları bul
            const hives = await Hive.find({ apiary: apiary._id });
            console.log(`   🐝 Kovanlar: ${hives.length} adet`);

            hives.forEach((hive, index) => {
                console.log(`      ${index + 1}. ${hive.name || 'İsimsiz kovan'}`);
                console.log(`         🔧 Router ID: ${hive.sensor?.routerId || 'Yok'}`);
                console.log(`         📡 Sensor ID: ${hive.sensor?.sensorId || 'Yok'}`);
                console.log(`         🔌 Bağlı: ${hive.sensor?.isConnected ? 'Evet' : 'Hayır'}`);
                console.log(`         🆔 Kovan ID: ${hive._id}`);
            });

            console.log('---\n');
        }

        process.exit(0);
    })
    .catch(err => {
        console.error('MongoDB bağlantı hatası:', err);
        process.exit(1);
    });
