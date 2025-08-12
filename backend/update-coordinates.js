const mongoose = require('mongoose');
const Apiary = require('./models/Apiary');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

mongoose.connect('mongodb://localhost:27017/beetwin', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        console.log('MongoDB bağlantısı başarılı');

        // Koordinatı eksik arılıkları listele
        const apiariesWithoutCoords = await Apiary.find({
            $or: [
                { 'location.coordinates': { $exists: false } },
                { 'location.coordinates.latitude': { $exists: false } },
                { 'location.coordinates.longitude': { $exists: false } },
                { 'location.coordinates': {} }
            ]
        });

        console.log('🗺️ Koordinat bilgisi eksik arılıklar:\n');

        if (apiariesWithoutCoords.length === 0) {
            console.log('✅ Tüm arılıkların koordinat bilgisi mevcut!');
            process.exit(0);
        }

        for (const apiary of apiariesWithoutCoords) {
            console.log(`🏡 ${apiary.name}`);
            console.log(`📍 Adres: ${apiary.location?.address || 'Yok'}`);
            console.log(`🆔 ID: ${apiary._id}`);

            const updateCoords = await askQuestion('Bu arılık için koordinat eklemek ister misiniz? (e/h): ');

            if (updateCoords.toLowerCase() === 'e') {
                const latitude = await askQuestion('Latitude (enlem) girin: ');
                const longitude = await askQuestion('Longitude (boylam) girin: ');

                const lat = parseFloat(latitude);
                const lng = parseFloat(longitude);

                if (isNaN(lat) || isNaN(lng)) {
                    console.log('❌ Geçersiz koordinat değerleri!');
                    continue;
                }

                if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                    console.log('❌ Koordinat değerleri geçerli aralıkta değil!');
                    continue;
                }

                // Koordinatları güncelle
                await Apiary.findByIdAndUpdate(apiary._id, {
                    'location.coordinates.latitude': lat,
                    'location.coordinates.longitude': lng
                });

                console.log('✅ Koordinatlar başarıyla güncellendi!');
            }

            console.log('---\n');
        }

        console.log('🎉 İşlem tamamlandı!');
        rl.close();
        process.exit(0);
    })
    .catch(err => {
        console.error('MongoDB bağlantı hatası:', err);
        rl.close();
        process.exit(1);
    });
