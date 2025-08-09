const express = require('express');
const router = express.Router();
const { auth, requireBeekeeperOrAdmin } = require('../middleware/auth');
const Sensor = require('../models/Sensor');
const SensorReading = require('../models/SensorReading');

// Helper function - Router için son veri alma
async function getLatestRouterData(routerId, userId) {
    try {
        // Device ID formatına çevir (107 → BT107)
        const deviceId = `BT${routerId}`;
        
        // Router'a ait sensörü deviceId ile bul
        const sensor = await Sensor.findOne({
            deviceId: deviceId,
            ownerId: userId
        });

        if (!sensor) {
            console.log(`⚠️ Sensor not found for device ${deviceId} and user ${userId}`);
            return null;
        }

        // Router 107 ve 108 için özel işlem: Son 5 kaydı al ve birleştir
        if (routerId === '107' || routerId === '108') {
            const recentReadings = await SensorReading.find({
                sensorId: sensor._id
            }).sort({ timestamp: -1 }).limit(5);

            if (recentReadings.length > 0) {
                // Tüm verileri birleştir - her reading'in data'sını ekle
                const combinedData = {};
                let latestTimestamp = recentReadings[0].timestamp;
                let latestBattery = recentReadings[0].batteryLevel;
                let latestSignal = recentReadings[0].signalStrength;

                // Son 5 kayıttaki tüm dataları birleştir
                recentReadings.forEach(reading => {
                    if (reading.data) {
                        // Her field'ı ayrı ayrı kontrol et ve ekle
                        Object.keys(reading.data).forEach(key => {
                            if (reading.data[key] !== null && reading.data[key] !== undefined) {
                                combinedData[key] = reading.data[key];
                            }
                        });
                    }
                });

                console.log(`🔄 Router ${routerId} combined data:`, combinedData);

                // Field mapping: Koordinatör formatını standart formata çevir
                const mappedData = {
                    // Mevcut veriler
                    ...combinedData,
                    // Field mapping
                    temperature: combinedData.WT || combinedData.temperature,
                    pressure: combinedData.PR || combinedData.pressure,
                    humidity: combinedData.WH || combinedData.humidity,
                    co: combinedData.CO || combinedData.co,
                    no2: combinedData.NO || combinedData.no2,
                    // Meta veriler
                    timestamp: latestTimestamp,
                    batteryLevel: latestBattery,
                    signalStrength: latestSignal,
                    sensorTypes: sensor.sensorTypes
                };

                console.log(`🔄 Router ${routerId} mapped data:`, {
                    original: combinedData,
                    mapped: mappedData
                });

                return mappedData;
            }
        } else {
            // Diğer router'lar için normal işlem
            const latestReading = await SensorReading.findOne({
                sensorId: sensor._id
            }).sort({ timestamp: -1 });

            if (latestReading) {
                // Field mapping: Koordinatör formatını standart formata çevir
                const mappedData = {
                    // Mevcut veriler
                    ...latestReading.data,
                    // Field mapping
                    temperature: latestReading.data.WT || latestReading.data.temperature,
                    pressure: latestReading.data.PR || latestReading.data.pressure,
                    humidity: latestReading.data.WH || latestReading.data.humidity,
                    co: latestReading.data.CO || latestReading.data.co,
                    no2: latestReading.data.NO || latestReading.data.no2,
                    // Meta veriler
                    timestamp: latestReading.timestamp,
                    batteryLevel: latestReading.batteryLevel,
                    signalStrength: latestReading.signalStrength,
                    sensorTypes: sensor.sensorTypes
                };

                return mappedData;
            }
        }

        return null;
    } catch (error) {
        console.error(`❌ Error getting latest data for router ${routerId}:`, error);
        return null;
    }
}

// @route   GET /api/sensors/hive/:hiveId/routers
// @desc    Belirli bir kovan için tüm router verilerini getir
// @access  Private
router.get('/hive/:hiveId/routers', auth, async (req, res) => {
    try {
        const { hiveId } = req.params;
        console.log('🏠 Hive routers data request - Hive:', hiveId, 'User:', req.user.userId);

        // Hive'a ait tüm router'ları bul (authentication check dahil)
        const Hive = require('../models/Hive');
        const Apiary = require('../models/Apiary');

        // Kullanıcının kovanını bul
        const hive = await Hive.findById(hiveId).populate('apiary');

        if (!hive || !hive.apiary || hive.apiary.ownerId.toString() !== req.user.userId.toString()) {
            return res.status(404).json({
                success: false,
                message: 'Kovan bulunamadı veya erişim yetkisi yok'
            });
        }

        const routerData = {};

        // Hive'ın hardware konfigürasyonundaki router'ları al
        if (hive.hardware && hive.hardware.routers) {
            for (const router of hive.hardware.routers) {
                if (router.isActive && router.routerId) {
                    // Bu router için son veriyi al
                    const latestData = await getLatestRouterData(router.routerId);

                    routerData[router.routerId] = {
                        routerId: router.routerId,
                        routerName: router.routerName,
                        routerType: router.routerType,
                        address: router.address,
                        sensors: router.sensors,
                        data: latestData,
                        isActive: router.isActive,
                        lastSeen: router.lastSeen,
                        batteryLevel: router.batteryLevel,
                        signalStrength: router.signalStrength
                    };
                }
            }
        }

        res.json({
            success: true,
            hiveId: hiveId,
            hiveName: hive.name,
            data: routerData
        });

    } catch (error) {
        console.error('❌ Hive routers data error:', error);
        res.status(500).json({
            success: false,
            message: 'Hive router verileri alınamadı',
            error: error.message
        });
    }
});

// @route   GET /api/sensors/router/:routerId/latest
// @desc    Belirli bir router için son veriyi getir
// @access  Private
router.get('/router/:routerId/latest', auth, async (req, res) => {
    try {
        const { routerId } = req.params;
        console.log('📡 Router data request - Router:', routerId, 'User:', req.user.userId);

        // Router'ın kullanıcıya ait olup olmadığını kontrol et
        const Hive = require('../models/Hive');
        const Apiary = require('../models/Apiary');

        // Önce kullanıcının arılıklarını bul
        const userApiaries = await Apiary.find({ ownerId: req.user.userId });
        const apiaryIds = userApiaries.map(a => a._id);

        // Bu arılıklardaki kovanları kontrol et
        const userHive = await Hive.findOne({
            apiary: { $in: apiaryIds },
            $or: [
                // Legacy sensor system
                { 'sensor.routerId': routerId },
                // New sensors system
                { 'sensors.routerId': routerId },
                // Hardware routers path (new structure)
                { 'sensor.hardwareDetails.routers.routerId': routerId },
                // Legacy hardware routers path (fallback)
                { 'hardware.routers.routerId': routerId }
            ]
        });

        if (!userHive) {
            console.log(`❌ Router ${routerId} not found for user ${req.user.userId}`);
            return res.status(403).json({
                success: false,
                message: 'Bu router\'a erişim yetkiniz yok'
            });
        }

        console.log(`✅ Router ${routerId} access granted for user ${req.user.userId}`);

        // Router verilerini al
        const routerData = await getLatestRouterData(routerId, req.user.userId);

        // Router bilgilerini bul (hem yeni hem eski structure'dan)
        let router = userHive.sensor?.hardwareDetails?.routers?.find(r => r.routerId === routerId);
        if (!router) {
            router = userHive.hardware?.routers?.find(r => r.routerId === routerId);
        }

        res.json({
            success: true,
            routerId: routerId,
            routerName: router?.routerName,
            routerType: router?.routerType,
            data: routerData,
            source: routerData ? 'sensor' : 'no_data'
        });

    } catch (error) {
        console.error('❌ Router data error:', error);
        res.status(500).json({
            success: false,
            message: 'Router verisi alınamadı',
            error: error.message
        });
    }
});

// @route   GET /api/sensors/router/:routerId
// @desc    Belirli router verilerini getir (dinamik)
// @access  Private
router.get('/router/:routerId', auth, async (req, res) => {
    try {
        const { routerId } = req.params;
        console.log(`🔍 Router ${routerId} data request - User:`, req.user.userId);

        // Router sensörünü bul
        const sensor = await Sensor.findOne({
            ownerId: req.user.userId,
            deviceId: `BT${routerId}`
        });

        if (!sensor) {
            console.log(`⚠️ Router ${routerId} sensor not found for user:`, req.user.userId);
            return res.status(404).json({
                success: false,
                message: `Router ${routerId} sensörü bulunamadı`
            });
        }

        // Son sensör verilerini al
        const latestReading = await SensorReading.findOne({
            sensorId: sensor._id
        }).sort({ timestamp: -1 });

        if (!latestReading) {
            console.log(`⚠️ No readings found for Router ${routerId}`);
            return res.json({
                success: true,
                data: {
                    routerId: routerId,
                    deviceId: sensor.deviceId,
                    data: null,
                    batteryLevel: null,
                    signalStrength: null,
                    timestamp: new Date().toISOString(),
                    source: 'no_data'
                }
            });
        }

        // Gerçek veri varsa onu döndür
        res.json({
            success: true,
            data: {
                routerId: routerId,
                deviceId: sensor.deviceId,
                ...latestReading.data,
                batteryLevel: latestReading.batteryLevel,
                signalStrength: latestReading.signalStrength,
                timestamp: latestReading.timestamp,
                source: 'sensor'
            }
        });

    } catch (error) {
        console.error(`❌ Router ${req.params.routerId} veri hatası:`, error);
        res.status(500).json({
            success: false,
            message: `Router ${req.params.routerId} verisi alınamadı`
        });
    }
});

// ESKİ ENDPOINTS (Backward Compatibility)
// @route   GET /api/sensors/router-107
// @desc    Router 107 (BMP280) sensor verilerini getir
// @access  Private
router.get('/router-107', auth, async (req, res) => {
    try {
        console.log('🔍 Router 107 data request - User:', req.user.userId);

        // Router 107 sensor'unu bul
        const sensor = await Sensor.findOne({
            ownerId: req.user.userId,
            deviceId: 'BT107'
        });

        if (!sensor) {
            console.log('⚠️ Router 107 sensor not found for user:', req.user.userId);
            return res.status(404).json({
                success: false,
                message: 'Router 107 sensörü bulunamadı'
            });
        }

        // Son sensör verilerini al
        const latestReading = await SensorReading.findOne({
            sensorId: sensor._id
        }).sort({ timestamp: -1 });

        if (!latestReading) {
            console.log('⚠️ No readings found for Router 107');
            // Simüle data döndür
            return res.json({
                success: true,
                data: {
                    temperature: 25.5 + (Math.random() - 0.5) * 3,
                    humidity: 65 + (Math.random() - 0.5) * 8,
                    pressure: 1013.25 + (Math.random() - 0.5) * 10,
                    altitude: 150 + (Math.random() - 0.5) * 20,  // ✅ Altitude eklendi
                    timestamp: new Date().toISOString(),
                    source: 'simulated'
                }
            });
        }

        // Gerçek veri varsa onu döndür
        res.json({
            success: true,
            data: {
                temperature: latestReading.data?.temperature || 25.5,
                humidity: latestReading.data?.humidity || 65,
                pressure: latestReading.data?.pressure || 1013.25,
                altitude: latestReading.data?.altitude || 150,    // ✅ Altitude eklendi
                timestamp: latestReading.timestamp,
                source: 'sensor'
            }
        });

    } catch (error) {
        console.error('❌ Router 107 veri hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Router 107 verisi alınamadı'
        });
    }
});

// @route   GET /api/sensors/router-108
// @desc    Router 108 (MICS-4514) sensor verilerini getir
// @access  Private
router.get('/router-108', auth, async (req, res) => {
    try {
        console.log('🔍 Router 108 data request - User:', req.user.userId);

        // Router 108 sensor'unu bul
        const sensor = await Sensor.findOne({
            ownerId: req.user.userId,
            deviceId: 'BT108'
        });

        if (!sensor) {
            console.log('⚠️ Router 108 sensor not found for user:', req.user.userId);
            return res.status(404).json({
                success: false,
                message: 'Router 108 sensörü bulunamadı'
            });
        }

        // Son sensör verilerini al
        const latestReading = await SensorReading.findOne({
            sensorId: sensor._id
        }).sort({ timestamp: -1 });

        if (!latestReading) {
            console.log('⚠️ No readings found for Router 108');
            // Simüle data döndür
            return res.json({
                success: true,
                data: {
                    co: 0.5 + Math.random() * 2,
                    no2: 0.3 + Math.random() * 1.5,
                    timestamp: new Date().toISOString(),
                    source: 'simulated'
                }
            });
        }

        // Gerçek veri varsa onu döndür
        res.json({
            success: true,
            data: {
                co: latestReading.data?.co || 0.5,
                no2: latestReading.data?.no2 || 0.3,
                timestamp: latestReading.timestamp,
                source: 'sensor'
            }
        });

    } catch (error) {
        console.error('❌ Router 108 veri hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Router 108 verisi alınamadı'
        });
    }
});

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
