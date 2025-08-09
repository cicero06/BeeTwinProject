const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const SensorReading = require('../models/SensorReading');
const Sensor = require('../models/Sensor');

console.log('🔧 Simple LoRa route loaded');

// @route   POST /api/lora/data
// @desc    Coordinator'dan gelen veriyi al
// @access  Public
router.post('/data', [
    body('deviceId').notEmpty().withMessage('Device ID gerekli'),
    body('routerId').notEmpty().withMessage('Router ID gerekli'),
    body('sensorId').notEmpty().withMessage('Sensor ID gerekli'),
    body('sensorData').isObject().withMessage('Sensor data object olmalı')
], async (req, res) => {
    try {
        console.log('🎯 LoRa endpoint reached!');
        console.log('📥 Raw body:', req.body);

        // Validation hatalarını kontrol et
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('❌ Validation errors:', errors.array());
            return res.status(400).json({
                success: false,
                message: 'Geçersiz veri formatı',
                errors: errors.array()
            });
        }

        const { deviceId, routerId, sensorId, sensorData, timestamp } = req.body;

        console.log('📡 Wireless data received from:', deviceId);
        console.log('🎯 Router ID:', routerId, '- Sensor ID:', sensorId);
        console.log('📊 Data:', sensorData);

        // Sensörü bul
        const sensor = await Sensor.findOne({ routerId, deviceId });

        if (!sensor) {
            console.log('⚠️ Sensor not found for Router:', routerId);
            return res.json({
                success: true,
                message: 'Veri alındı (sensör bulunamadı)',
                data: { deviceId, routerId, sensorId }
            });
        }

        // Veriyi kaydet
        const reading = await SensorReading.create({
            sensorId: sensor._id,
            data: sensorData,
            timestamp: timestamp || new Date(),
            batteryLevel: req.body.batteryLevel || 85,
            signalStrength: req.body.signalStrength || -65,
            metadata: {
                source: 'coordinator',
                routerId,
                sensorId
            }
        });

        console.log('✅ Data saved successfully:', reading._id);

        res.json({
            success: true,
            message: 'Veri başarıyla işlendi',
            data: {
                deviceId,
                recordId: reading._id,
                receivedAt: new Date()
            }
        });

    } catch (error) {
        console.error('❌ LoRa data processing error:', error);
        res.status(500).json({
            success: false,
            message: 'Veri işleme hatası',
            error: error.message
        });
    }
});

module.exports = router;
