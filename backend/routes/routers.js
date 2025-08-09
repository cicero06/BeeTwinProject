const express = require('express');
const Router = require('../models/Router');
const { auth, requireBeekeeperOrAdmin } = require('../middleware/auth');
const {
    validateRouterData,
    createRouterConfig,
    getSupportedSensorTypes,
    getSensorTypeKeys
} = require('../config/routerConfig');

const router = express.Router();

/**
 * @route   GET /api/routers/sensor-types
 * @desc    Desteklenen sensör tiplerini listele
 * @access  Private
 */
router.get('/sensor-types', auth, async (req, res) => {
    try {
        const sensorTypes = getSupportedSensorTypes();

        res.json({
            success: true,
            sensorTypes
        });

    } catch (error) {
        console.error('Sensör tipleri alınamadı:', error);
        res.status(500).json({
            success: false,
            message: 'Sensör tipleri alınamadı',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/routers/create
 * @desc    Yeni router oluştur (manuel giriş ile)
 * @access  Private
 */
router.post('/create', auth, async (req, res) => {
    try {
        const routerData = req.body;

        // Validasyon
        const validation = validateRouterData(routerData);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Router verilerinde hata',
                errors: validation.errors
            });
        }

        // Aynı Router ID'nin başka bir kullanıcıda olup olmadığını kontrol et
        const existingRouter = await Router.findOne({
            routerId: routerData.routerId.toString()
        });

        if (existingRouter && existingRouter.ownerId.toString() !== req.user.id) {
            return res.status(409).json({
                success: false,
                message: `Router ID ${routerData.routerId} başka bir kullanıcı tarafından kullanılıyor`
            });
        }

        // Router konfigürasyonu oluştur
        const routerConfig = createRouterConfig(routerData);

        // Yeni router oluştur veya mevcut olanı güncelle
        let routerDoc;
        if (existingRouter) {
            // Kullanıcı kendi router'ını güncelliyor
            routerDoc = await Router.findOneAndUpdate(
                { routerId: routerData.routerId.toString(), ownerId: req.user.id },
                {
                    ...routerConfig,
                    ownerId: req.user.id,
                    hiveId: routerData.hiveId || null,
                    apiaryId: routerData.apiaryId || null,
                    status: 'active',
                    lastSeen: new Date()
                },
                { new: true, upsert: true }
            );
        } else {
            routerDoc = new Router({
                ...routerConfig,
                ownerId: req.user.id,
                hiveId: routerData.hiveId || null,
                apiaryId: routerData.apiaryId || null,
                status: 'active'
            });
            await routerDoc.save();
        }

        res.json({
            success: true,
            router: routerDoc,
            message: 'Router başarıyla oluşturuldu'
        });

    } catch (error) {
        console.error('Router oluşturma hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Router oluşturulamadı',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/routers/user
 * @desc    Kullanıcının router'larını listele
 * @access  Private
 */
router.get('/user', auth, async (req, res) => {
    try {
        const routers = await Router.find({ ownerId: req.user.id })
            .populate('apiaryId hiveId')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            routers
        });

    } catch (error) {
        console.error('Kullanıcı router listesi alınamadı:', error);
        res.status(500).json({
            success: false,
            message: 'Router listesi alınamadı',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/routers/:routerId
 * @desc    Belirli bir router'ın detaylarını getir
 * @access  Private
 */
router.get('/:routerId', auth, async (req, res) => {
    try {
        const { routerId } = req.params;

        const routerDoc = await Router.findOne({
            routerId,
            ownerId: req.user.id
        }).populate('apiaryId hiveId');

        if (!routerDoc) {
            return res.status(404).json({
                success: false,
                message: 'Router bulunamadı'
            });
        }

        res.json({
            success: true,
            router: routerDoc
        });

    } catch (error) {
        console.error('Router detay hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Router detayları alınamadı',
            error: error.message
        });
    }
});

/**
 * @route   PUT /api/routers/:routerId
 * @desc    Router'ı güncelle
 * @access  Private
 */
router.put('/:routerId', auth, async (req, res) => {
    try {
        const { routerId } = req.params;
        const updateData = req.body;

        const router = await Router.findOneAndUpdate(
            { routerId, ownerId: req.user.id },
            {
                ...updateData,
                lastSeen: new Date()
            },
            { new: true }
        );

        if (!router) {
            return res.status(404).json({
                success: false,
                message: 'Router bulunamadı'
            });
        }

        res.json({
            success: true,
            router,
            message: 'Router güncellendi'
        });

    } catch (error) {
        console.error('Router güncelleme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Router güncellenemedi',
            error: error.message
        });
    }
});

/**
 * @route   DELETE /api/routers/:routerId
 * @desc    Router'ı sil
 * @access  Private
 */
router.delete('/:routerId', auth, async (req, res) => {
    try {
        const { routerId } = req.params;

        const router = await Router.findOneAndDelete({
            routerId,
            ownerId: req.user.id
        });

        if (!router) {
            return res.status(404).json({
                success: false,
                message: 'Router bulunamadı'
            });
        }

        res.json({
            success: true,
            message: 'Router başarıyla silindi'
        });

    } catch (error) {
        console.error('Router silme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Router silinemedi',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/routers/sensor-types/:sensorType/keys
 * @desc    Belirli bir sensör tipinin desteklediği veri anahtarlarını getir
 * @access  Private
 */
router.get('/sensor-types/:sensorType/keys', auth, async (req, res) => {
    try {
        const { sensorType } = req.params;
        const keys = getSensorTypeKeys(sensorType);

        if (!keys) {
            return res.status(404).json({
                success: false,
                message: 'Sensör tipi bulunamadı'
            });
        }

        res.json({
            success: true,
            sensorType,
            keys
        });

    } catch (error) {
        console.error('Sensör tipi anahtarları alınamadı:', error);
        res.status(500).json({
            success: false,
            message: 'Sensör tipi anahtarları alınamadı',
            error: error.message
        });
    }
});

module.exports = router;
