const mongoose = require('mongoose');
const Apiary = require('./models/Apiary');

mongoose.connect('mongodb://localhost:27017/beetwin', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        console.log('MongoDB bağlantısı başarılı');
        const apiaries = await Apiary.find().limit(5);
        console.log('📍 İlk 5 arılık koordinat bilgileri:');
        apiaries.forEach((apiary, index) => {
            console.log(`${index + 1}. ${apiary.name}`);
            console.log(`   - Address: ${apiary.location?.address || 'Yok'}`);
            console.log(`   - Coordinates: ${JSON.stringify(apiary.location?.coordinates || 'Yok')}`);
            console.log(`   - ID: ${apiary._id}`);
            console.log('---');
        });
        process.exit(0);
    })
    .catch(err => {
        console.error('MongoDB bağlantı hatası:', err);
        process.exit(1);
    });
