const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const { auth, requireBeekeeperOrAdmin } = require('../middleware/auth');
const Hive = require('../models/Hive');
const Apiary = require('../models/Apiary');

/**
 * @route   POST /api/hardware/assign
 * @desc    Router/Sensor ID'yi kovan ile eşleştir
 * @access  Private
 */
router.post('/assign', [
    auth,
    body('hiveId').isMongoId().withMessage('Geçerli bir kovan ID\'si giriniz'),
    body('routerId').trim().isLength({ min: 1 }).withMessage('Router ID zorunludur'),
    body('sensorId').optional().trim().isLength({ min: 1 }).withMessage('Sensor ID geçersiz')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: errors.array()
            });
        }

        const { hiveId, routerId, sensorId, coordinatorAddress, channel } = req.body;

        // Kovan kontrolü
        const hive = await Hive.findById(hiveId).populate('apiary');
        if (!hive) {
            return res.status(404).json({
                success: false,
                message: 'Kovan bulunamadı'
            });
        }

        // Yetkili kullanıcı kontrolü
        if (hive.apiary.ownerId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Bu kovana erişim yetkiniz yok'
            });
        }

        // Router ID duplicate kontrolü - GLOBAL (TÜM KULLANICILAR ARASINDA)
        const existingRouterHive = await Hive.findOne({
            'sensor.routerId': routerId,
            _id: { $ne: hiveId } // Aynı kovan hariç
        }).populate('apiary', 'ownerId');

        if (existingRouterHive) {
            const isOwnHive = existingRouterHive.apiary.ownerId.toString() === req.user.id;
            return res.status(400).json({
                success: false,
                message: isOwnHive
                    ? `Router ID "${routerId}" zaten sizin "${existingRouterHive.name}" kovanınızda kullanılıyor`
                    : `Router ID "${routerId}" başka bir kullanıcı tarafından kullanılıyor. Lütfen benzersiz bir Router ID seçin.`,
                error: 'DUPLICATE_ROUTER_ID',
                conflictHive: {
                    id: existingRouterHive._id,
                    name: existingRouterHive.name,
                    isOwn: isOwnHive
                }
            });
        }

        // Sensor ID duplicate kontrolü - GLOBAL (TÜM KULLANICILAR ARASINDA) (varsa)
        if (sensorId) {
            const existingSensorHive = await Hive.findOne({
                'sensor.sensorId': sensorId,
                _id: { $ne: hiveId }
            }).populate('apiary', 'ownerId');

            if (existingSensorHive) {
                const isOwnHive = existingSensorHive.apiary.ownerId.toString() === req.user.id;
                return res.status(400).json({
                    success: false,
                    message: isOwnHive
                        ? `Sensor ID "${sensorId}" zaten sizin "${existingSensorHive.name}" kovanınızda kullanılıyor`
                        : `Sensor ID "${sensorId}" başka bir kullanıcı tarafından kullanılıyor. Lütfen benzersiz bir Sensor ID seçin.`,
                    error: 'DUPLICATE_SENSOR_ID',
                    conflictHive: {
                        id: existingSensorHive._id,
                        name: existingSensorHive.name,
                        isOwn: isOwnHive
                    }
                });
            }
        }

        // Hardware bilgilerini güncelle
        hive.sensor = {
            ...hive.sensor,
            routerId: routerId,
            sensorId: sensorId || hive.sensor.sensorId,
            isConnected: true,
            connectionStatus: 'connected',
            calibrationDate: new Date(),
            hardwareDetails: {
                ...hive.sensor.hardwareDetails,
                coordinatorAddress: coordinatorAddress || hive.sensor.hardwareDetails?.coordinatorAddress,
                channel: channel || hive.sensor.hardwareDetails?.channel || 23
            }
        };

        await hive.save();

        res.json({
            success: true,
            message: 'Hardware başarıyla eşleştirildi',
            data: {
                hive: {
                    id: hive._id,
                    name: hive.name,
                    sensor: hive.sensor
                }
            }
        });

    } catch (error) {
        console.error('Hardware assign error:', error);
        res.status(500).json({
            success: false,
            message: 'Hardware eşleştirme hatası',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/hardware/transfer
 * @desc    Hardware'i bir kovandan diğerine transfer et
 * @access  Private
 */
router.post('/transfer', [
    auth,
    body('fromHiveId').isMongoId().withMessage('Kaynak kovan ID\'si geçersiz'),
    body('toHiveId').isMongoId().withMessage('Hedef kovan ID\'si geçersiz')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: errors.array()
            });
        }

        const { fromHiveId, toHiveId } = req.body;

        // Her iki kovanı da getir
        const [fromHive, toHive] = await Promise.all([
            Hive.findById(fromHiveId).populate('apiary'),
            Hive.findById(toHiveId).populate('apiary')
        ]);

        if (!fromHive || !toHive) {
            return res.status(404).json({
                success: false,
                message: 'Kovan(lar) bulunamadı'
            });
        }

        // Yetkili kullanıcı kontrolü
        if (fromHive.apiary.ownerId.toString() !== req.user.id ||
            toHive.apiary.ownerId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Bu kovanlara erişim yetkiniz yok'
            });
        }

        // Hardware bilgilerini transfer et
        const transferredSensor = { ...fromHive.sensor };

        // Kaynak kovanı temizle
        fromHive.sensor = {
            routerId: null,
            sensorId: null,
            isConnected: false,
            connectionStatus: 'disconnected',
            lastDataReceived: null,
            calibrationDate: null,
            hardwareDetails: {
                coordinatorAddress: null,
                channel: 23,
                routers: []
            }
        };

        // Hedef kovana ata
        toHive.sensor = transferredSensor;

        await Promise.all([fromHive.save(), toHive.save()]);

        res.json({
            success: true,
            message: 'Hardware başarıyla transfer edildi',
            data: {
                from: {
                    id: fromHive._id,
                    name: fromHive.name,
                    sensor: fromHive.sensor
                },
                to: {
                    id: toHive._id,
                    name: toHive.name,
                    sensor: toHive.sensor
                }
            }
        });

    } catch (error) {
        console.error('Hardware transfer error:', error);
        res.status(500).json({
            success: false,
            message: 'Hardware transfer hatası',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/hardware/check/:routerId
 * @desc    Router ID kullanım durumunu kontrol et
 * @access  Private
 */
router.get('/check/:routerId', auth, async (req, res) => {
    try {
        const { routerId } = req.params;

        const hive = await Hive.findOne({
            'sensor.routerId': routerId
        }).populate('apiary', 'name ownerId');

        if (!hive) {
            return res.json({
                success: true,
                available: true,
                message: 'Router ID kullanılabilir'
            });
        }

        res.json({
            success: true,
            available: false,
            message: 'Router ID zaten kullanımda',
            usedBy: {
                hive: {
                    id: hive._id,
                    name: hive.name
                },
                apiary: {
                    id: hive.apiary._id,
                    name: hive.apiary.name
                },
                owner: {
                    id: hive.apiary.ownerId,
                    canTransfer: hive.apiary.ownerId.toString() === req.user.id
                }
            }
        });

    } catch (error) {
        console.error('Hardware check error:', error);
        res.status(500).json({
            success: false,
            message: 'Hardware kontrol hatası',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/hardware/list
 * @desc    Kullanıcının tüm hardware eşleştirmelerini listele
 * @access  Private
 */
router.get('/list', auth, async (req, res) => {
    try {
        const hives = await Hive.find()
            .populate({
                path: 'apiary',
                match: { ownerId: req.user.id },
                select: 'name ownerId'
            })
            .select('name sensor apiary')
            .lean();

        // Sadece kullanıcının kovanlarını filtrele
        const userHives = hives.filter(hive => hive.apiary);

        const hardwareList = userHives.map(hive => ({
            hive: {
                id: hive._id,
                name: hive.name
            },
            apiary: {
                id: hive.apiary._id,
                name: hive.apiary.name
            },
            hardware: {
                routerId: hive.sensor?.routerId || null,
                sensorId: hive.sensor?.sensorId || null,
                isConnected: hive.sensor?.isConnected || false,
                connectionStatus: hive.sensor?.connectionStatus || 'unknown',
                lastDataReceived: hive.sensor?.lastDataReceived || null
            }
        }));

        res.json({
            success: true,
            data: hardwareList,
            stats: {
                total: hardwareList.length,
                connected: hardwareList.filter(h => h.hardware.isConnected).length,
                withRouter: hardwareList.filter(h => h.hardware.routerId).length,
                withSensor: hardwareList.filter(h => h.hardware.sensorId).length
            }
        });

    } catch (error) {
        console.error('Hardware list error:', error);
        res.status(500).json({
            success: false,
            message: 'Hardware listesi alınamadı',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/hardware/routers/:hiveId
 * @desc    Get router configurations for a specific hive
 * @access  Private
 */
router.get('/routers/:hiveId', auth, async (req, res) => {
    try {
        const { hiveId } = req.params;

        // Kovan kontrolü - POPULATE'ı kontrol et
        console.log('🔍 FETCHING HIVE:', hiveId);
        const hive = await Hive.findById(hiveId)
            .populate('apiary')
            .select('+hardware +sensors +hardwareDetails'); // Explicit select

        if (!hive) {
            return res.status(404).json({
                success: false,
                message: 'Kovan bulunamadı'
            });
        }

        console.log('🔍 HIVE FOUND:', hive.name);
        console.log('🔍 FULL HIVE OBJECT KEYS:', Object.keys(hive.toObject()));
        console.log('🔍 HIVE TOOBJECT:', JSON.stringify(hive.toObject(), null, 2));

        // Eğer populate çalışmadıysa manuel al
        let apiaryOwnerId;
        if (typeof hive.apiary === 'string' || hive.apiary instanceof mongoose.Types.ObjectId) {
            console.log('⚠️ POPULATE FAILED - Manual apiary fetch needed');
            const Apiary = require('../models/Apiary');
            const apiary = await Apiary.findById(hive.apiary);
            apiaryOwnerId = apiary?.ownerId?.toString();
            console.log('🔧 MANUAL APIARY OWNER:', apiaryOwnerId);
        } else {
            console.log('✅ POPULATE SUCCESS');
            apiaryOwnerId = hive.apiary?.ownerId?.toString();
        }

        // Debug authorization - Manuel string conversion
        const userIdString = req.user?.id ? String(req.user.id) : null;
        console.log('🔍 AUTHORIZATION DEBUG:');
        console.log('JWT User Original:', req.user?.id);
        console.log('JWT User String:', userIdString);
        console.log('JWT User Type:', typeof userIdString);
        console.log('Apiary Owner:', apiaryOwnerId);
        console.log('Apiary Owner Type:', typeof apiaryOwnerId);
        console.log('Match:', apiaryOwnerId === userIdString);

        // Yetkili kullanıcı kontrolü - Manuel string conversion
        if (apiaryOwnerId !== userIdString) {
            console.log('❌ AUTHORIZATION FAILED');
            console.log('Expected:', apiaryOwnerId);
            console.log('Actual:', userIdString);
            return res.status(403).json({
                success: false,
                message: 'Bu kovana erişim yetkiniz yok'
            });
        }

        console.log('✅ AUTHORIZATION SUCCESS');

        // Router konfigürasyonlarını al
        const routers = hive.sensor?.hardwareDetails?.routers || [];
        console.log('🔍 HIVE SENSOR:', hive.sensor);
        console.log('🔍 HIVE SENSOR HARDWAREDETAILS:', hive.sensor?.hardwareDetails);
        console.log('🔍 ROUTERS FOUND:', routers.length, 'routers');
        console.log('🔍 ROUTERS DATA:', routers);

        res.json({
            success: true,
            data: {
                hiveId: hive._id,
                hiveName: hive.name,
                routers: routers.map(router => ({
                    routerId: router.routerId,
                    routerType: router.routerType,
                    address: router.address,
                    sensorIds: router.sensorIds,
                    dataKeys: router.dataKeys,
                    isActive: router.isActive,
                    lastSeen: router.lastSeen
                })),
                totalRouters: routers.length,
                activeRouters: routers.filter(r => r.isActive).length
            }
        });

    } catch (error) {
        console.error('Router config error:', error);
        res.status(500).json({
            success: false,
            message: 'Router konfigürasyonları alınamadı',
            error: error.message
        });
    }
});

module.exports = router;
