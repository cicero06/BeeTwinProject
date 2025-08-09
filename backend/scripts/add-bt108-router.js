// BT108 Router'ını kullanıcının kovanına ekleme scripti
const mongoose = require('mongoose');
require('dotenv').config();

// Models
const Hive = require('../models/Hive');
const Sensor = require('../models/Sensor');
const User = require('../models/User');

async function addBT108RouterToUser() {
    try {
        // MongoDB'ye bağlan
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/beetwin');
        console.log('✅ MongoDB bağlantısı başarılı');

        // Kullanıcıyı bul
        const user = await User.findOne({ email: 'dnzhsyn@gmail.com' });
        if (!user) {
            console.log('❌ Kullanıcı bulunamadı');
            return;
        }
        console.log('✅ Kullanıcı bulundu:', user.email);

        // Kullanıcının kovanlarını bul
        const hives = await Hive.find({ 'apiary': { $in: await getApiaryIds(user._id) } });
        console.log(`✅ ${hives.length} kovan bulundu`);

        if (hives.length === 0) {
            console.log('❌ Kovan bulunamadı');
            return;
        }

        // İlk kovanı al
        const targetHive = hives[0];
        console.log('🎯 Hedef kovan:', targetHive.name);

        // BT108 router'ını kovan yapılandırmasına ekle
        const updatedHive = await Hive.findByIdAndUpdate(
            targetHive._id,
            {
                $addToSet: {
                    'sensor.hardwareDetails.routers': {
                        routerId: '108',
                        routerName: 'BT108',
                        routerType: 'mics4514',
                        sensorIds: ['1002'],
                        dataKeys: ['co', 'no2'],
                        isActive: true,
                        description: 'MICS-4514 Hava Kalitesi Sensörü'
                    }
                }
            },
            { new: true }
        );

        console.log('✅ BT108 router kovan yapılandırmasına eklendi');

        // BT108 için sensör kaydı oluştur
        const existingSensor = await Sensor.findOne({ 
            deviceId: 'BT108',
            ownerId: user._id 
        });

        if (!existingSensor) {
            const newSensor = new Sensor({
                deviceId: 'BT108',
                name: 'BT108 Hava Kalitesi Sensörü',
                type: 'environmental',
                location: targetHive.location,
                isActive: true,
                batteryLevel: 85,
                signalStrength: -65,
                lastSeen: new Date(),
                sensorTypes: ['co', 'no2', 'air_quality'],
                ownerId: user._id,
                createdAt: new Date()
            });

            await newSensor.save();
            console.log('✅ BT108 sensör kaydı oluşturuldu');
        } else {
            console.log('ℹ️ BT108 sensör kaydı zaten mevcut');
        }

        console.log('🎉 BT108 router başarıyla eklendi!');
        
    } catch (error) {
        console.error('❌ Hata:', error);
    } finally {
        await mongoose.disconnect();
        console.log('✅ MongoDB bağlantısı kapatıldı');
    }
}

async function getApiaryIds(userId) {
    const Apiary = require('../models/Apiary');
    const apiaries = await Apiary.find({ ownerId: userId });
    return apiaries.map(a => a._id);
}

// Script'i çalıştır
addBT108RouterToUser();

module.exports = { addBT108RouterToUser };
