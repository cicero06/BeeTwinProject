const express = require('express');
const router = express.Router();
const { auth, requireBeekeeperOrAdmin } = require('../middleware/auth');
const SensorReading = require('../models/SensorReading');
const Sensor = require('../models/Sensor');
const mongoose = require('mongoose');

// @route   GET /api/sensor-readings
// @desc    Kullanıcının sensör verilerini getir
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        console.log('📊 Sensor Readings GET request - User:', req.user.userId);

        // Query parametreleri
        const { sensorId, startDate, endDate, limit = 100 } = req.query;

        // Kullanıcının sensörlerini bul
        const userSensors = await Sensor.find({ ownerId: req.user.userId }).select('_id');
        const sensorIds = userSensors.map(s => s._id);

        // Filter oluştur
        let filter = { sensorId: { $in: sensorIds } };

        if (sensorId) {
            filter.sensorId = sensorId;
        }

        if (startDate || endDate) {
            filter.timestamp = {};
            if (startDate) filter.timestamp.$gte = new Date(startDate);
            if (endDate) filter.timestamp.$lte = new Date(endDate);
        }

        console.log('📊 Filter:', filter);

        const readings = await SensorReading.find(filter)
            .populate('sensorId', 'name deviceId')
            .sort({ timestamp: -1 })
            .limit(parseInt(limit));

        console.log('📊 Found readings:', readings.length);

        res.json({
            success: true,
            data: {
                readings,
                count: readings.length
            }
        });

    } catch (error) {
        console.error('❌ Sensör verilerini getirme hatası:', error);
        console.error('❌ Error message:', error.message);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası oluştu'
        });
    }
});

// @route   POST /api/sensor-readings
// @desc    Yeni sensör verisi kaydet (IoT cihazlar için)
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        console.log('📝 POST Sensor Readings request - User:', req.user.userId);
        console.log('📝 Request body:', req.body);

        const readingData = {
            ...req.body,
            timestamp: req.body.timestamp || new Date()
        };

        // Sensörün kullanıcıya ait olduğunu kontrol et
        const sensor = await Sensor.findOne({
            _id: readingData.sensorId,
            ownerId: req.user.userId
        });

        if (!sensor) {
            return res.status(404).json({
                success: false,
                message: 'Sensör bulunamadı veya yetkiniz yok'
            });
        }

        console.log('📝 Final reading data:', readingData);

        const reading = await SensorReading.create(readingData);

        res.status(201).json({
            success: true,
            message: 'Sensör verisi başarıyla kaydedildi',
            data: { reading }
        });

    } catch (error) {
        console.error('❌ POST Sensor Readings hatası:', error);
        console.error('❌ Error message:', error.message);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası oluştu'
        });
    }
});

// @route   GET /api/sensor-readings/latest/:sensorId
// @desc    Belirli sensörün son verisi
// @access  Private
router.get('/latest/:sensorId', auth, async (req, res) => {
    try {
        const sensorIdParam = req.params.sensorId;
        let sensor;

        // Router ID (string) veya Sensor ObjectId kontrolü
        if (mongoose.Types.ObjectId.isValid(sensorIdParam) && sensorIdParam.length === 24) {
            // Geçerli ObjectId ise normal arama
            sensor = await Sensor.findOne({
                _id: sensorIdParam,
                ownerId: req.user.userId
            });
        } else {
            // Router ID ise deviceId ile arama (BT107 formatında)
            const deviceId = sensorIdParam.startsWith('BT') ? sensorIdParam : `BT${sensorIdParam}`;
            sensor = await Sensor.findOne({
                deviceId: deviceId,
                ownerId: req.user.userId
            });
        }

        if (!sensor) {
            return res.status(404).json({
                success: false,
                message: 'Sensör bulunamadı'
            });
        }

        const latestReading = await SensorReading.findOne({
            sensorId: req.params.sensorId
        })
            .populate('sensorId', 'name deviceId')
            .sort({ timestamp: -1 });

        res.json({
            success: true,
            data: { reading: latestReading }
        });

    } catch (error) {
        console.error('Son sensör verisi getirme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası oluştu'
        });
    }
});

// @route   POST /api/sensor-readings/archive
// @desc    Eski verileri arşiv koleksiyonuna taşı (silmek yerine)
// @access  Private
router.post('/archive', auth, async (req, res) => {
    try {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        // Kullanıcının sensörlerini bul
        const userSensors = await Sensor.find({ ownerId: req.user.userId });
        const sensorIds = userSensors.map(s => s._id);

        // 6+ ay önceki verileri bul
        const oldReadings = await SensorReading.find({
            sensorId: { $in: sensorIds },
            timestamp: { $lt: sixMonthsAgo }
        });

        if (oldReadings.length > 0) {
            // Arşiv koleksiyonuna kopyala
            const ArchiveReading = mongoose.model('ArchiveSensorReading', SensorReading.schema);
            await ArchiveReading.insertMany(oldReadings);

            // Ana koleksiyondan sil
            await SensorReading.deleteMany({
                sensorId: { $in: sensorIds },
                timestamp: { $lt: sixMonthsAgo }
            });
        }

        console.log(`� Archived ${oldReadings.length} old readings`);

        res.json({
            success: true,
            message: `${oldReadings.length} eski veri arşivlendi`,
            data: { archivedCount: oldReadings.length }
        });

    } catch (error) {
        console.error('Veri arşivleme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası oluştu'
        });
    }
});

module.exports = router;
