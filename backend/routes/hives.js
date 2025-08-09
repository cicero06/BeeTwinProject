const express = require('express');
const router = express.Router();
const { auth, requireBeekeeperOrAdmin } = require('../middleware/auth');
const Hive = require('../models/Hive');

// @route   GET /api/hives
// @desc    Kullanıcının kovanlarını getir
// @access  Private (Beekeeper or Admin)
router.get('/', auth, requireBeekeeperOrAdmin, async (req, res) => {
    try {
        console.log('🏠 Hives GET request - User:', req.user.userId);

        const hives = await Hive.find({ isActive: true })
            .populate({
                path: 'apiary',
                match: { ownerId: req.user.userId }  // owner -> ownerId
            });

        // Sahip olduğu arılıklardaki kovanları filtrele
        const userHives = hives.filter(hive => hive.apiary !== null);

        console.log('🏠 Found hives:', userHives.length);

        res.json({
            success: true,
            data: {
                hives: userHives,
                count: userHives.length
            }
        });

    } catch (error) {
        console.error('❌ Kovanları getirme hatası:', error);
        console.error('❌ Error message:', error.message);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası oluştu'
        });
    }
});

// @route   POST /api/hives
// @desc    Yeni kovan oluştur
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        console.log('📝 POST Hives request - User:', req.user.userId);
        console.log('📝 Request body:', req.body);

        const { sensor, ...hiveData } = req.body;

        // GLOBAL Router/Sensor ID benzersizlik kontrolü
        if (sensor) {
            if (sensor.routerId) {
                const existingRouterHive = await Hive.findOne({
                    'sensor.routerId': sensor.routerId
                });

                if (existingRouterHive) {
                    return res.status(400).json({
                        success: false,
                        message: `Router ID "${sensor.routerId}" zaten başka bir kovan tarafından kullanılıyor. Her Router ID benzersiz olmalıdır.`
                    });
                }
            }

            if (sensor.sensorId) {
                const existingSensorHive = await Hive.findOne({
                    'sensor.sensorId': sensor.sensorId
                });

                if (existingSensorHive) {
                    return res.status(400).json({
                        success: false,
                        message: `Sensor ID "${sensor.sensorId}" zaten başka bir kovan tarafından kullanılıyor. Her Sensor ID benzersiz olmalıdır.`
                    });
                }
            }
        }

        // Kovan verisi hazırla
        const completeHiveData = {
            ...hiveData,
            sensor: sensor ? {
                routerId: sensor.routerId || null,
                sensorId: sensor.sensorId || null,
                isConnected: !!(sensor.routerId && sensor.sensorId),
                connectionStatus: sensor.routerId && sensor.sensorId ? 'connected' : 'disconnected',
                lastDataReceived: null,
                calibrationDate: sensor.calibrationDate || null
            } : {
                routerId: null,
                sensorId: null,
                isConnected: false,
                connectionStatus: 'disconnected',
                lastDataReceived: null,
                calibrationDate: null
            }
        };

        const hive = await Hive.create(completeHiveData);

        res.status(201).json({
            success: true,
            message: 'Kovan başarıyla oluşturuldu',
            data: { hive }
        });

    } catch (error) {
        console.error('❌ POST Hives hatası:', error);
        console.error('❌ Error message:', error.message);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası oluştu'
        });
    }
});

// @route   PUT /api/hives/:id/sensor
// @desc    Kovan ile sensör eşleştir
// @access  Private
router.put('/:id/sensor', auth, async (req, res) => {
    try {
        const { routerId, sensorId } = req.body;

        console.log('🔗 Sensor pairing request - Hive:', req.params.id);
        console.log('🔗 Router ID:', routerId, 'Sensor ID:', sensorId);

        // Önce kovanın kullanıcıya ait olduğunu kontrol et
        const hive = await Hive.findById(req.params.id).populate('apiary');

        if (!hive) {
            return res.status(404).json({
                success: false,
                message: 'Kovan bulunamadı'
            });
        }

        if (hive.apiary.ownerId.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'Bu kovanı yönetme yetkiniz yok'
            });
        }

        // GLOBAL Router/Sensor ID benzersizlik kontrolü
        if (routerId) {
            const existingRouterHive = await Hive.findOne({
                'sensor.routerId': routerId,
                _id: { $ne: req.params.id }
            });

            if (existingRouterHive) {
                return res.status(400).json({
                    success: false,
                    message: `Router ID "${routerId}" zaten başka bir kovan tarafından kullanılıyor. Her Router ID benzersiz olmalıdır.`
                });
            }
        }

        if (sensorId) {
            const existingSensorHive = await Hive.findOne({
                'sensor.sensorId': sensorId,
                _id: { $ne: req.params.id }
            });

            if (existingSensorHive) {
                return res.status(400).json({
                    success: false,
                    message: `Sensor ID "${sensorId}" zaten başka bir kovan tarafından kullanılıyor. Her Sensor ID benzersiz olmalıdır.`
                });
            }
        }

        // Sensör bilgilerini güncelle
        const updatedHive = await Hive.findByIdAndUpdate(
            req.params.id,
            {
                'sensor.routerId': routerId || null,
                'sensor.sensorId': sensorId || null,
                'sensor.isConnected': !!(routerId && sensorId),
                'sensor.connectionStatus': routerId && sensorId ? 'connected' : 'disconnected'
            },
            { new: true }
        ).populate('apiary');

        res.json({
            success: true,
            message: 'Sensör eşleştirmesi başarıyla güncellendi',
            data: { hive: updatedHive }
        });

    } catch (error) {
        console.error('❌ Sensor pairing error:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası oluştu'
        });
    }
});

// @route   GET /api/hives/:id/sensor-data
// @desc    Kovanın sensör verilerini getir
// @access  Private
router.get('/:id/sensor-data', auth, async (req, res) => {
    try {
        const { limit = 100, startDate, endDate } = req.query;

        // Kovanın kullanıcıya ait olduğunu kontrol et
        const hive = await Hive.findById(req.params.id).populate('apiary');

        if (!hive) {
            return res.status(404).json({
                success: false,
                message: 'Kovan bulunamadı'
            });
        }

        if (hive.apiary.ownerId.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'Bu kovanın verilerine erişim yetkiniz yok'
            });
        }

        if (!hive.sensor.routerId || !hive.sensor.sensorId) {
            return res.status(400).json({
                success: false,
                message: 'Bu kovana henüz sensör eşleştirilmemiş'
            });
        }

        // Sensör verilerini al (SensorReading modelinden)
        const SensorReading = require('../models/SensorReading');

        let query = {
            sensorId: hive.sensor.sensorId
        };

        // Tarih filtreleri
        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) query.timestamp.$gte = new Date(startDate);
            if (endDate) query.timestamp.$lte = new Date(endDate);
        }

        const sensorData = await SensorReading.find(query)
            .sort({ timestamp: -1 })
            .limit(parseInt(limit));

        res.json({
            success: true,
            data: {
                hive: {
                    id: hive._id,
                    name: hive.name,
                    sensor: hive.sensor
                },
                readings: sensorData,
                count: sensorData.length
            }
        });

    } catch (error) {
        console.error('❌ Sensor data fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası oluştu'
        });
    }
});

module.exports = router;
