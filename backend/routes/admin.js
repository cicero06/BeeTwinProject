const express = require('express');
const router = express.Router();
const { auth, requireAdmin } = require('../middleware/auth');
const Hive = require('../models/Hive');
const User = require('../models/User');
const Apiary = require('../models/Apiary');

// @route   GET /api/admin/hives
// @desc    Tüm kovanları listele (Admin)
// @access  Admin Only
router.get('/hives', auth, requireAdmin, async (req, res) => {
    try {
        console.log('🔍 Admin Hives GET request');

        const hives = await Hive.find()
            .populate('apiary', 'name location')
            .sort({ createdAt: -1 });

        console.log('🔍 Found hives:', hives.length);

        res.json({
            success: true,
            data: {
                hives,
                count: hives.length
            }
        });

    } catch (error) {
        console.error('❌ Admin hives fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası oluştu'
        });
    }
});

// @route   GET /api/admin/stats
// @desc    Admin istatistikleri
// @access  Admin Only
router.get('/stats', auth, requireAdmin, async (req, res) => {
    try {
        const [totalUsers, totalApiaries, totalHives, totalConnectedSensors] = await Promise.all([
            User.countDocuments({ userType: { $ne: 'admin' } }),
            Apiary.countDocuments(),
            Hive.countDocuments(),
            Hive.countDocuments({ 'sensor.isConnected': true })
        ]);

        const recentUsers = await User.find({ userType: { $ne: 'admin' } })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('firstName lastName email userType isActive createdAt');

        res.json({
            success: true,
            data: {
                totalUsers,
                totalApiaries,
                totalHives,
                totalConnectedSensors,
                recentUsers,
                systemHealth: {
                    database: 98,
                    api: 99,
                    sensors: Math.round((totalConnectedSensors / Math.max(totalHives, 1)) * 100),
                    storage: 87
                }
            }
        });

    } catch (error) {
        console.error('❌ Admin stats error:', error);
        res.status(500).json({
            success: false,
            message: 'İstatistikler alınırken hata oluştu'
        });
    }
});

// @route   GET /api/admin/users
// @desc    Tüm kullanıcıları listele (Admin)
// @access  Admin Only
router.get('/users', auth, requireAdmin, async (req, res) => {
    try {
        const users = await User.find({ userType: { $ne: 'admin' } })
            .select('-password')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: {
                users,
                count: users.length
            }
        });

    } catch (error) {
        console.error('❌ Admin users fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Kullanıcılar alınırken hata oluştu'
        });
    }
});

// @route   PUT /api/admin/users/:id/status
// @desc    Kullanıcı durumunu güncelle (Admin)
// @access  Admin Only
router.put('/users/:id/status', auth, requireAdmin, async (req, res) => {
    try {
        const { isActive } = req.body;

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isActive },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Kullanıcı bulunamadı'
            });
        }

        res.json({
            success: true,
            message: `Kullanıcı durumu ${isActive ? 'aktif' : 'pasif'} olarak güncellendi`,
            data: { user }
        });

    } catch (error) {
        console.error('❌ User status update error:', error);
        res.status(500).json({
            success: false,
            message: 'Kullanıcı durumu güncellenirken hata oluştu'
        });
    }
});

// @route   DELETE /api/admin/hives/:id
// @desc    Kovanı sil (Admin)
// @access  Admin Only
router.delete('/hives/:id', auth, requireAdmin, async (req, res) => {
    try {
        const hive = await Hive.findByIdAndDelete(req.params.id);

        if (!hive) {
            return res.status(404).json({
                success: false,
                message: 'Kovan bulunamadı'
            });
        }

        res.json({
            success: true,
            message: 'Kovan başarıyla silindi'
        });

    } catch (error) {
        console.error('❌ Hive delete error:', error);
        res.status(500).json({
            success: false,
            message: 'Kovan silinirken hata oluştu'
        });
    }
});

// @route   GET /api/admin/apiaries
// @desc    Tüm arılıkları listele (Admin)
// @access  Admin Only
router.get('/apiaries', auth, requireAdmin, async (req, res) => {
    try {
        const apiaries = await Apiary.find()
            .populate('ownerId', 'firstName lastName email userType')
            .populate('hives')
            .sort({ createdAt: -1 });

        // Koordinat bilgilerini de dahil et
        const formattedApiaries = apiaries.map(apiary => ({
            _id: apiary._id,
            name: apiary.name,
            location: {
                address: apiary.location.address,
                coordinates: apiary.location.coordinates || null,
                city: apiary.location.city,
                district: apiary.location.district
            },
            hiveCount: apiary.hiveCount,
            actualHiveCount: apiary.hives ? apiary.hives.length : 0,
            owner: apiary.ownerId,
            status: apiary.status,
            isActive: apiary.isActive,
            createdAt: apiary.createdAt,
            updatedAt: apiary.updatedAt
        }));

        res.json({
            success: true,
            data: {
                apiaries: formattedApiaries,
                count: formattedApiaries.length
            }
        });

    } catch (error) {
        console.error('❌ Admin apiaries error:', error);
        res.status(500).json({
            success: false,
            message: 'Arılıklar alınırken hata oluştu'
        });
    }
});

module.exports = router; module.exports = router;