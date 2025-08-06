/**
 * BeeTwin Database Temizleme Script
 * Tüm test verilerini siler ve temiz database için hazırlar
 */

const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = 'mongodb://localhost:27017/beetwin';

async function cleanDatabase() {
    try {
        console.log('🧹 Database temizleme başlatılıyor...');

        // MongoDB'ye bağlan
        await mongoose.connect(MONGODB_URI);
        console.log('✅ MongoDB bağlantısı kuruldu');

        const db = mongoose.connection.db;

        // 🗑️ Tüm kullanıcıları sil
        console.log('\n🗑️ Kullanıcılar siliniyor...');
        const usersResult = await db.collection('users').deleteMany({});
        console.log(`✅ ${usersResult.deletedCount} kullanıcı silindi`);

        // 🗑️ Tüm arılıkları sil
        console.log('\n🗑️ Arılıklar siliniyor...');
        const apiariesResult = await db.collection('apiaries').deleteMany({});
        console.log(`✅ ${apiariesResult.deletedCount} arılık silindi`);

        // 🗑️ Tüm kovanları sil
        console.log('\n🗑️ Kovanlar siliniyor...');
        const hivesResult = await db.collection('hives').deleteMany({});
        console.log(`✅ ${hivesResult.deletedCount} kovan silindi`);

        // 🗑️ Tüm sensör verilerini sil
        console.log('\n🗑️ Sensör verileri siliniyor...');
        const sensorReadingsResult = await db.collection('sensorreadings').deleteMany({});
        console.log(`✅ ${sensorReadingsResult.deletedCount} sensör verisi silindi`);

        // 🗑️ Tüm sensörleri sil (eğer ayrı koleksiyon varsa)
        console.log('\n🗑️ Sensörler siliniyor...');
        try {
            const sensorsResult = await db.collection('sensors').deleteMany({});
            console.log(`✅ ${sensorsResult.deletedCount} sensör silindi`);
        } catch (error) {
            console.log('ℹ️ Sensors koleksiyonu bulunamadı (sorun değil)');
        }

        // 📊 Sonuç özeti
        console.log('\n🎉 Database temizleme tamamlandı!');
        console.log('📊 Silinen veriler:');
        console.log(`   👥 Kullanıcılar: ${usersResult.deletedCount}`);
        console.log(`   🏡 Arılıklar: ${apiariesResult.deletedCount}`);
        console.log(`   🏠 Kovanlar: ${hivesResult.deletedCount}`);
        console.log(`   📡 Sensör Verileri: ${sensorReadingsResult.deletedCount}`);

        console.log('\n✨ Database artık temiz! Yeni kullanıcı kaydı yapabilirsiniz.');

        // Bağlantıyı kapat
        await mongoose.connection.close();
        console.log('🔌 MongoDB bağlantısı kapatıldı');

    } catch (error) {
        console.error('❌ Database temizleme hatası:', error);
        process.exit(1);
    }
}

// Script'i çalıştır
if (require.main === module) {
    console.log('🚨 DİKKAT: Bu script tüm database verilerini silecek!');
    console.log('⏳ 5 saniye içinde başlayacak... (Ctrl+C ile iptal edebilirsiniz)');

    setTimeout(() => {
        cleanDatabase();
    }, 5000);
}

module.exports = { cleanDatabase };
