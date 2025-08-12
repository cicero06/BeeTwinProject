const mongoose = require('mongoose');
const Apiary = require('./models/Apiary');

mongoose.connect('mongodb://localhost:27017/beetwin', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        console.log('MongoDB baglantisi basarili');
        const apiaries = await Apiary.find().limit(10);
        console.log('📍 Ilk 10 arilik koordinat bilgileri:');
        apiaries.forEach((apiary, index) => {
            console.log(`${index + 1}. ${apiary.name}`);
            console.log(`   - Address: ${apiary.location?.address || 'Yok'}`);
            console.log(`   - Coordinates: ${JSON.stringify(apiary.location?.coordinates || 'Yok')}`);
            console.log(`   - Lat/Lng: ${apiary.coordinates?.latitude || 'Yok'} / ${apiary.coordinates?.longitude || 'Yok'}`);
            console.log(`   - ID: ${apiary._id}`);
            console.log('---');
        });
        process.exit(0);
    })
    .catch(err => {
        console.error('MongoDB baglanti hatasi:', err);
        process.exit(1);
    });
