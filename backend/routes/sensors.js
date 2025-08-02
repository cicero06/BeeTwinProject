const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Sensor = require('../models/Sensor');

// @route   GET /api/sensors
// @desc    Kullanıcının sensörlerini getir
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        console.log('🔍 Sensors GET request - User:', req.user);
        console.log('🔍 Looking for sensors with ownerId:', req.user.userId);

        // Kullanıcının sahip olduğu sensörler
        const sensors = await Sensor.find({
            ownerId: req.user.userId,
            isActive: true
        }).populate('apiaryId');

        console.log('🔍 Found sensors:', sensors.length);

        res.json({
            success: true,
            data: {
                sensors,
                count: sensors.length
            }
        });

    } catch (error) {
        console.error('❌ Sensörleri getirme hatası:', error);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası oluştu'
        });
    }
});

// @route   POST /api/sensors
// @desc    Yeni sensör oluştur
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        console.log('📝 POST Sensors request - User:', req.user.userId);
        console.log('📝 Request body:', req.body);

        const sensorData = {
            ...req.body,
            ownerId: req.user.userId
        };

        console.log('📝 Final sensor data:', sensorData);

        const sensor = await Sensor.create(sensorData);

        res.status(201).json({
            success: true,
            message: 'Sensör başarıyla oluşturuldu',
            data: { sensor }
        });

    } catch (error) {
        console.error('❌ POST Sensors hatası:', error);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası oluştu'
        });
    }
});

// @route   GET /api/sensors/:id
// @desc    Belirli sensör getir
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const sensor = await Sensor.findOne({
            _id: req.params.id,
            ownerId: req.user.userId
        }).populate('apiaryId');

        if (!sensor) {
            return res.status(404).json({
                success: false,
                message: 'Sensör bulunamadı'
            });
        }

        res.json({
            success: true,
            data: { sensor }
        });

    } catch (error) {
        console.error('Sensör getirme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası oluştu'
        });
    }
});

// @route   POST /api/sensors/data
// @desc    Arduino sensörlerinden gelen veriyi işle
// @access  Public (Arduino'dan geliyor)
router.post('/data', async (req, res) => {
    try {
        const { routerId, sensorId, data, timestamp } = req.body;

        console.log('📡 Incoming sensor data:');
        console.log('Router ID:', routerId);
        console.log('Sensor ID:', sensorId);
        console.log('Data:', data);

        const SensorReading = require('../models/SensorReading');
        const Hive = require('../models/Hive');

        // Önce bu sensörün hangi kovana ait olduğunu bul
        const associatedHive = await Hive.findOne({
            'sensor.routerId': routerId,
            'sensor.sensorId': sensorId
        });

        if (!associatedHive) {
            console.log('⚠️ No hive associated with this sensor');
            return res.status(404).json({
                success: false,
                message: 'Bu sensöre atanmış kovan bulunamadı'
            });
        }

        // Sensör verisini kaydet
        const sensorReading = new SensorReading({
            sensorId: associatedHive._id, // Geçici olarak hive ID kullanıyoruz
            timestamp: timestamp ? new Date(timestamp) : new Date(),
            data: {
                temperature: data.temperature,
                humidity: data.humidity,
                weight: data.weight,
                // Router tipine göre ekstra alanlar
                ...(data.co2 && { other: { ...data.other || {}, co2: data.co2 } }),
                ...(data.nh3 && { other: { ...data.other || {}, nh3: data.nh3 } }),
                ...(data.smoke && { other: { ...data.other || {}, smoke: data.smoke } }),
                ...(data.lpg && { other: { ...data.other || {}, lpg: data.lpg } })
            },
            batteryLevel: data.batteryLevel,
            signalStrength: data.signalStrength || -50 // Varsayılan sinyal gücü
        });

        await sensorReading.save();

        // Kovanın bağlantı durumunu güncelle
        await Hive.findByIdAndUpdate(associatedHive._id, {
            'sensor.isConnected': true,
            'sensor.lastDataReceived': new Date(),
            'sensor.connectionStatus': 'connected'
        });

        console.log('✅ Sensor data saved successfully');

        res.json({
            success: true,
            message: 'Sensör verisi başarıyla kaydedildi',
            data: {
                hiveId: associatedHive._id,
                hiveName: associatedHive.name,
                readingId: sensorReading._id
            }
        });

    } catch (error) {
        console.error('❌ Sensor data processing error:', error);
        res.status(500).json({
            success: false,
            message: 'Sensör verisi işlenirken hata oluştu',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @route   GET /api/sensors/status
// @desc    Tüm sensörlerin durumunu getir
// @access  Public
router.get('/status', async (req, res) => {
    try {
        const Hive = require('../models/Hive');

        const hivesWithSensors = await Hive.find({
            'sensor.routerId': { $exists: true, $ne: null },
            'sensor.sensorId': { $exists: true, $ne: null }
        }).select('name sensor');

        const sensorStatus = hivesWithSensors.map(hive => ({
            hiveName: hive.name,
            routerId: hive.sensor.routerId,
            sensorId: hive.sensor.sensorId,
            isConnected: hive.sensor.isConnected,
            lastDataReceived: hive.sensor.lastDataReceived,
            connectionStatus: hive.sensor.connectionStatus
        }));

        res.json({
            success: true,
            data: {
                totalSensors: sensorStatus.length,
                connectedSensors: sensorStatus.filter(s => s.isConnected).length,
                sensors: sensorStatus
            }
        });

    } catch (error) {
        console.error('❌ Sensor status error:', error);
        res.status(500).json({
            success: false,
            message: 'Sensör durumu alınırken hata oluştu'
        });
    }
});

// @route   GET /api/sensors/readings/:hiveId
// @desc    Belirli bir kovanın sensör verilerini getir
// @access  Public
router.get('/readings/:hiveId', async (req, res) => {
    try {
        const { hiveId } = req.params;
        const { limit = 100, startDate, endDate, type } = req.query;

        const Hive = require('../models/Hive');
        const SensorReading = require('../models/SensorReading');

        // Kovanı bul
        const hive = await Hive.findById(hiveId);
        if (!hive) {
            return res.status(404).json({
                success: false,
                message: 'Kovan bulunamadı'
            });
        }

        // Sorgu koşulları
        let query = { sensorId: hiveId };

        // Tarih filtreleri
        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) query.timestamp.$gte = new Date(startDate);
            if (endDate) query.timestamp.$lte = new Date(endDate);
        }

        const readings = await SensorReading.find(query)
            .sort({ timestamp: -1 })
            .limit(parseInt(limit));

        // Veri tipine göre filtrele
        let processedReadings = readings;
        if (type && ['temperature', 'humidity', 'weight'].includes(type)) {
            processedReadings = readings.map(reading => ({
                _id: reading._id,
                timestamp: reading.timestamp,
                value: reading.data[type],
                quality: reading.quality
            })).filter(r => r.value !== undefined && r.value !== null);
        }

        res.json({
            success: true,
            data: {
                hive: {
                    id: hive._id,
                    name: hive.name
                },
                readings: type ? processedReadings : readings,
                count: processedReadings.length,
                filterType: type || 'all'
            }
        });

    } catch (error) {
        console.error('❌ Readings fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Sensör verileri alınırken hata oluştu'
        });
    }
});

module.exports = router;
