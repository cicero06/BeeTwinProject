const express = require('express');
const router = express.Router();
const LoRaDataProcessor = require('../services/loraProcessor');
const { body, validationResult } = require('express-validator');

// LoRa Processor instance - WebSocket ile birlikte initialize edilecek
let loraProcessor = null;

// WebSocket instance'ı set etmek için fonksiyon
const setWebSocketInstance = (io) => {
    loraProcessor = new LoRaDataProcessor(io);
    console.log('🔌 LoRa Processor WebSocket instance set');
};

// Fallback için WebSocket olmadan processor
if (!loraProcessor) {
    loraProcessor = new LoRaDataProcessor();
}

/**
 * @route   POST /api/lora/data
 * @desc    Coordinator'dan gelen wireless veriyi al
 * @access  Public (Arduino'dan geldiği için auth yok)
 * @body    {
 *   "deviceId": "BT001",
 *   "sensorData": {
 *     "temperature": 25.5,
 *     "humidity": 65.2,
 *     "weight": 45.8,
 *     "gasLevel": 0.85
 *   },
 *   "batteryLevel": 85,
 *   "signalStrength": -65,
 *   "timestamp": "2025-07-24T10:30:15Z"
 * }
 */
router.post('/data', [
    // Validation middleware
    body('deviceId')
        .notEmpty()
        .withMessage('Device ID gerekli')
        .isLength({ min: 3, max: 20 })
        .withMessage('Device ID 3-20 karakter olmalı'),

    body('routerId')
        .optional()
        .isString()
        .withMessage('Router ID string olmalı'),

    body('sensorId')
        .optional()
        .isString()
        .withMessage('Sensor ID string olmalı'),

    body('sensorData')
        .isObject()
        .withMessage('Sensor data object olmalı'),

    body('sensorData.temperature')
        .optional()
        .isFloat({ min: -50, max: 100 })
        .withMessage('Sıcaklık -50 ile 100 arasında olmalı'),

    body('sensorData.humidity')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('Nem 0 ile 100 arasında olmalı'),

    body('sensorData.weight')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Ağırlık 0 dan büyük olmalı'),

    body('sensorData.pressure')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Basınç 0 dan büyük olmalı'),

    body('sensorData.altitude')
        .optional()
        .isFloat()
        .withMessage('Yükseklik sayısal olmalı'),

    body('sensorData.gasLevel')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Gaz seviyesi 0 dan büyük olmalı'),

    body('sensorData.no2Level')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('NO2 seviyesi 0 dan büyük olmalı'),

    body('batteryLevel')
        .isInt({ min: 0, max: 100 })
        .withMessage('Batarya seviyesi 0-100 arası olmalı'),

    body('signalStrength')
        .optional()
        .isInt({ min: -120, max: 0 })
        .withMessage('Sinyal gücü -120 ile 0 arası olmalı'),

    body('timestamp')
        .optional()
        .isISO8601()
        .withMessage('Timestamp ISO8601 formatında olmalı')

], async (req, res) => {
    try {
        console.log('🎯 LoRa endpoint reached!'); // DEBUG LOG
        console.log('📥 Raw body:', req.body);     // DEBUG LOG

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

        const { deviceId, routerId, sensorId, sensorData, batteryLevel, signalStrength, timestamp } = req.body;

        console.log('📡 Wireless data received from:', deviceId);
        console.log('🎯 Router ID:', routerId, '- Sensor ID:', sensorId);
        console.log('📊 Data:', sensorData);
        console.log('🔋 Battery:', batteryLevel + '%');

        // Veriyi işle
        const processedData = await loraProcessor.processWirelessData({
            deviceId,
            routerId,
            sensorId,
            sensorData,
            batteryLevel,
            signalStrength: signalStrength || -999,
            receivedAt: new Date(),
            originalTimestamp: timestamp
        });

        if (processedData) {
            res.json({
                success: true,
                message: 'Veri başarıyla işlendi',
                data: {
                    deviceId,
                    recordId: processedData._id,
                    receivedAt: new Date(),
                    nextExpectedAt: new Date(Date.now() + 10 * 60 * 1000) // 10 dakika sonra
                }
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Veri işlenirken hata oluştu'
            });
        }

    } catch (error) {
        console.error('❌ LoRa data processing error:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

/**
 * @route   GET /api/lora/devices
 * @desc    Aktif cihazları listele (son 30 dakikada veri gönderen)
 * @access  Public
 */
router.get('/devices', async (req, res) => {
    try {
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

        const Sensor = require('../models/Sensor');
        const SensorReading = require('../models/SensorReading');

        // Son 30 dakikada veri gönderen cihazlar
        const activeDevices = await SensorReading.aggregate([
            {
                $match: {
                    timestamp: { $gte: thirtyMinutesAgo }
                }
            },
            {
                $lookup: {
                    from: 'sensors',
                    localField: 'sensorId',
                    foreignField: '_id',
                    as: 'sensor'
                }
            },
            {
                $unwind: '$sensor'
            },
            {
                $group: {
                    _id: '$sensor.deviceId',
                    lastSeen: { $max: '$timestamp' },
                    batteryLevel: { $last: '$batteryLevel' },
                    signalStrength: { $last: '$signalStrength' },
                    dataCount: { $sum: 1 }
                }
            },
            {
                $sort: { lastSeen: -1 }
            }
        ]);

        res.json({
            success: true,
            data: {
                activeDevices,
                count: activeDevices.length,
                checkTime: new Date()
            }
        });

    } catch (error) {
        console.error('❌ Active devices query error:', error);
        res.status(500).json({
            success: false,
            message: 'Aktif cihazlar sorgulanırken hata oluştu'
        });
    }
});

/**
 * @route   GET /api/lora/health/:deviceId
 * @desc    Belirli bir cihazın sağlık durumunu kontrol et
 * @access  Public
 */
router.get('/health/:deviceId', async (req, res) => {
    try {
        const { deviceId } = req.params;
        const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000);

        const SensorReading = require('../models/SensorReading');
        const Sensor = require('../models/Sensor');

        // Cihazı bul
        const sensor = await Sensor.findOne({ deviceId });
        if (!sensor) {
            return res.status(404).json({
                success: false,
                message: 'Cihaz bulunamadı'
            });
        }

        // Son veriyi bul
        const lastReading = await SensorReading.findOne({
            sensorId: sensor._id
        }).sort({ timestamp: -1 });

        // Son 20 dakikada veri var mı kontrol et (10 dk + 10 dk tolerance)
        const isOnline = lastReading && lastReading.timestamp > twentyMinutesAgo;

        res.json({
            success: true,
            data: {
                deviceId,
                isOnline,
                lastSeen: lastReading?.timestamp,
                batteryLevel: lastReading?.batteryLevel,
                signalStrength: lastReading?.signalStrength,
                status: isOnline ? 'ONLINE' : 'OFFLINE',
                missedHeartbeats: isOnline ? 0 : Math.floor((Date.now() - new Date(lastReading?.timestamp || 0)) / (10 * 60 * 1000))
            }
        });

    } catch (error) {
        console.error('❌ Device health check error:', error);
        res.status(500).json({
            success: false,
            message: 'Cihaz sağlığı kontrol edilirken hata oluştu'
        });
    }
});

module.exports = {
    router,
    setWebSocketInstance
};
