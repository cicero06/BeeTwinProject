const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const SensorReading = require('../models/SensorReading');

// @route   POST /api/sensor-readings/batch
// @desc    Birden fazla sensör verisi kaydet (optimize edilmiş)
// @access  Private
router.post('/batch', auth, async (req, res) => {
    try {
        console.log('📦 Batch Sensor Readings - User:', req.user.userId);
        console.log('📦 Batch size:', req.body.readings?.length);

        const { readings } = req.body;

        if (!readings || !Array.isArray(readings)) {
            return res.status(400).json({
                success: false,
                message: 'readings array gerekli'
            });
        }

        // Her reading'e timestamp ekle
        const processedReadings = readings.map(reading => ({
            ...reading,
            timestamp: reading.timestamp || new Date()
        }));

        // Toplu insert (çok daha hızlı)
        const savedReadings = await SensorReading.insertMany(processedReadings);

        console.log('📦 Saved readings:', savedReadings.length);

        res.status(201).json({
            success: true,
            message: `${savedReadings.length} sensör verisi kaydedildi`,
            data: {
                count: savedReadings.length,
                readings: savedReadings
            }
        });

    } catch (error) {
        console.error('❌ Batch insert hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası oluştu'
        });
    }
});

module.exports = router;
