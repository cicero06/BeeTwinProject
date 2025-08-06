/**
 * ÇOKLU ROUTER SENSOR VERİ API'LERİ
 * 
 * Çoklu router sisteminden gelen verileri işlemek için güncellenmiş API'ler
 */

// routes/sensors.js - Güncellenmiş Sensor Data API
const express = require('express');
const SensorReading = require('../models/SensorReading');
const Hive = require('../models/Hive');
const auth = require('../middleware/auth');
const router = express.Router();

/**
 * Çoklu Router'dan Sensor Verisi Alma
 * GET /api/sensors/readings/:hiveId
 * 
 * Bir kovan için tüm router'lardan gelen verileri döndürür
 */
router.get('/readings/:hiveId', auth, async (req, res) => {
    try {
        const { hiveId } = req.params;
        const { routerType, sensorType, limit = 50, timeRange = '24h' } = req.query;

        // Kovan bilgilerini al
        const hive = await Hive.findById(hiveId);
        if (!hive) {
            return res.status(404).json({
                success: false,
                message: 'Kovan bulunamadı'
            });
        }

        // Kullanıcı yetki kontrolü
        if (hive.userId.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'Bu kovana erişim yetkiniz yok'
            });
        }

        // Tüm aktif router'ları al
        const activeRouters = hive.hardware.routers.filter(router => router.isActive);

        if (activeRouters.length === 0) {
            return res.json({
                success: true,
                message: 'Bu kovanda aktif router bulunamadı',
                data: {
                    hiveId,
                    hiveName: hive.name,
                    routers: [],
                    readings: []
                }
            });
        }

        // Zaman aralığını hesapla
        const timeFilter = calculateTimeFilter(timeRange);

        // Query filtrelerini oluştur
        let query = {
            timestamp: { $gte: timeFilter },
            $or: []
        };

        // Router tipine göre filtrele
        if (routerType) {
            const matchingRouters = activeRouters.filter(r => r.routerType === routerType);
            matchingRouters.forEach(router => {
                if (sensorType) {
                    // Belirli sensor tipi
                    const matchingSensors = router.sensors.filter(s => s.sensorType === sensorType && s.isActive);
                    matchingSensors.forEach(sensor => {
                        query.$or.push({ sensorId: sensor.sensorId });
                    });
                } else {
                    // Router'ın tüm sensörleri
                    router.sensors.filter(s => s.isActive).forEach(sensor => {
                        query.$or.push({ sensorId: sensor.sensorId });
                    });
                }
            });
        } else {
            // Tüm router'ların tüm sensörleri
            activeRouters.forEach(router => {
                router.sensors.filter(s => s.isActive).forEach(sensor => {
                    query.$or.push({ sensorId: sensor.sensorId });
                });
            });
        }

        // Veri yoksa boş döndür
        if (query.$or.length === 0) {
            return res.json({
                success: true,
                data: {
                    hiveId,
                    hiveName: hive.name,
                    routers: activeRouters.map(r => ({
                        routerId: r.routerId,
                        routerName: r.routerName,
                        routerType: r.routerType,
                        sensorCount: r.sensors.filter(s => s.isActive).length
                    })),
                    readings: []
                }
            });
        }

        // Sensor verilerini al
        const readings = await SensorReading.find(query)
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .lean();

        // Verileri router ve sensor tipine göre grupla
        const groupedData = groupReadingsByRouter(readings, activeRouters);

        res.json({
            success: true,
            data: {
                hiveId,
                hiveName: hive.name,
                timeRange,
                totalReadings: readings.length,
                routers: activeRouters.map(r => ({
                    routerId: r.routerId,
                    routerName: r.routerName,
                    routerType: r.routerType,
                    sensors: r.sensors.filter(s => s.isActive).map(s => ({
                        sensorId: s.sensorId,
                        sensorName: s.sensorName,
                        sensorType: s.sensorType,
                        unit: s.unit
                    }))
                })),
                readings: groupedData
            }
        });

    } catch (error) {
        console.error('Çoklu router veri alma hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sensor verileri alınamadı',
            error: error.message
        });
    }
});

/**
 * Router Tipine Göre Son Veriler
 * GET /api/sensors/latest/:hiveId/:routerType
 */
router.get('/latest/:hiveId/:routerType', auth, async (req, res) => {
    try {
        const { hiveId, routerType } = req.params;

        const hive = await Hive.findById(hiveId);
        if (!hive || hive.userId.toString() !== req.user.userId) {
            return res.status(404).json({
                success: false,
                message: 'Kovan bulunamadı veya erişim yetkiniz yok'
            });
        }

        // Belirtilen router tipini bul
        const router = hive.hardware.routers.find(r => r.routerType === routerType && r.isActive);

        if (!router) {
            return res.status(404).json({
                success: false,
                message: `${routerType} router bu kovanda bulunamadı`
            });
        }

        // Aktif sensör ID'lerini al
        const activeSensorIds = router.sensors
            .filter(s => s.isActive && s.sensorId)
            .map(s => s.sensorId);

        if (activeSensorIds.length === 0) {
            return res.json({
                success: true,
                message: 'Bu router\'da aktif sensör bulunamadı',
                data: {
                    routerId: router.routerId,
                    routerType: router.routerType,
                    readings: []
                }
            });
        }

        // Her sensör için son veriyi al
        const latestReadings = await Promise.all(
            activeSensorIds.map(async (sensorId) => {
                const reading = await SensorReading.findOne({ sensorId })
                    .sort({ timestamp: -1 })
                    .lean();

                const sensor = router.sensors.find(s => s.sensorId === sensorId);

                return {
                    sensorId,
                    sensorName: sensor?.sensorName,
                    sensorType: sensor?.sensorType,
                    unit: sensor?.unit,
                    reading: reading || null,
                    lastUpdated: reading?.timestamp || null
                };
            })
        );

        res.json({
            success: true,
            data: {
                routerId: router.routerId,
                routerName: router.routerName,
                routerType: router.routerType,
                readings: latestReadings
            }
        });

    } catch (error) {
        console.error('Router son veri hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Router verileri alınamadı',
            error: error.message
        });
    }
});

/**
 * Çoklu Router Durum Kontrolü
 * GET /api/sensors/router-status/:hiveId
 */
router.get('/router-status/:hiveId', auth, async (req, res) => {
    try {
        const { hiveId } = req.params;

        const hive = await Hive.findById(hiveId);
        if (!hive || hive.userId.toString() !== req.user.userId) {
            return res.status(404).json({
                success: false,
                message: 'Kovan bulunamadı'
            });
        }

        // Her router için durum kontrolü
        const routerStatuses = await Promise.all(
            hive.hardware.routers.map(async (router) => {
                if (!router.isActive) {
                    return {
                        routerId: router.routerId,
                        routerName: router.routerName,
                        routerType: router.routerType,
                        status: 'inactive',
                        lastSeen: null,
                        activeSensors: 0,
                        totalSensors: router.sensors.length
                    };
                }

                // Aktif sensörler
                const activeSensors = router.sensors.filter(s => s.isActive && s.sensorId);

                // Son veri zamanını bul
                let lastSeen = null;
                if (activeSensors.length > 0) {
                    const latestReading = await SensorReading.findOne({
                        sensorId: { $in: activeSensors.map(s => s.sensorId) }
                    }).sort({ timestamp: -1 }).lean();

                    lastSeen = latestReading?.timestamp;
                }

                // Durum hesapla
                let status = 'offline';
                if (lastSeen) {
                    const timeDiff = Date.now() - new Date(lastSeen).getTime();
                    if (timeDiff < 30 * 60 * 1000) { // 30 dakika
                        status = 'online';
                    } else if (timeDiff < 2 * 60 * 60 * 1000) { // 2 saat
                        status = 'warning';
                    }
                }

                return {
                    routerId: router.routerId,
                    routerName: router.routerName,
                    routerType: router.routerType,
                    status,
                    lastSeen,
                    activeSensors: activeSensors.length,
                    totalSensors: router.sensors.length,
                    sensors: activeSensors.map(s => ({
                        sensorId: s.sensorId,
                        sensorName: s.sensorName,
                        sensorType: s.sensorType
                    }))
                };
            })
        );

        res.json({
            success: true,
            data: {
                hiveId,
                hiveName: hive.name,
                totalRouters: hive.hardware.routers.length,
                activeRouters: routerStatuses.filter(r => r.status !== 'inactive').length,
                onlineRouters: routerStatuses.filter(r => r.status === 'online').length,
                routers: routerStatuses
            }
        });

    } catch (error) {
        console.error('Router durum kontrolü hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Router durumu kontrol edilemedi',
            error: error.message
        });
    }
});

// Yardımcı fonksiyonlar
function calculateTimeFilter(timeRange) {
    const now = new Date();
    switch (timeRange) {
        case '1h':
            return new Date(now.getTime() - 60 * 60 * 1000);
        case '6h':
            return new Date(now.getTime() - 6 * 60 * 60 * 1000);
        case '24h':
            return new Date(now.getTime() - 24 * 60 * 60 * 1000);
        case '7d':
            return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        case '30d':
            return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        default:
            return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
}

function groupReadingsByRouter(readings, routers) {
    const grouped = {};

    routers.forEach(router => {
        grouped[router.routerId] = {
            routerInfo: {
                routerId: router.routerId,
                routerName: router.routerName,
                routerType: router.routerType
            },
            sensors: {}
        };

        router.sensors.filter(s => s.isActive).forEach(sensor => {
            grouped[router.routerId].sensors[sensor.sensorId] = {
                sensorInfo: {
                    sensorId: sensor.sensorId,
                    sensorName: sensor.sensorName,
                    sensorType: sensor.sensorType,
                    unit: sensor.unit
                },
                readings: readings.filter(r => r.sensorId === sensor.sensorId)
            };
        });
    });

    return grouped;
}

module.exports = router;
