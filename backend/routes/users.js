const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Hive = require('../models/Hive');
const Apiary = require('../models/Apiary');

// @route   GET /api/users
// @desc    Tüm kullanıcıları getir (Admin)
// @access  Private/Admin
router.get('/', auth, async (req, res) => {
    try {
        const users = await User.find({ isActive: true })
            .populate('apiaries')
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
        console.error('Kullanıcıları getirme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası oluştu'
        });
    }
});

// @route   GET /api/users/hives
// @desc    Kullanıcının kendi kovanlarını getir
// @access  Private
router.get('/hives', auth, async (req, res) => {
    try {
        console.log('🏠 User hives endpoint - User ID:', req.user.id);

        // Kullanıcının kendi arılıklarını bul
        const apiaries = await Apiary.find({
            ownerId: req.user.id,
            isActive: true
        });
        console.log('✅ Found user apiaries:', apiaries.length);

        const apiaryIds = apiaries.map(apiary => apiary._id);

        // Bu arılıklardaki kovanları bul
        const hives = await Hive.find({
            apiary: { $in: apiaryIds },
            isActive: true
        }).populate('apiary', 'name location');

        console.log('✅ Found user hives:', hives.length);

        res.json({
            success: true,
            data: hives,
            count: hives.length
        });

    } catch (error) {
        console.error('❌ Kullanıcı kovanları getirme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası oluştu'
        });
    }
});

// @route   GET /api/users/:id
// @desc    Belirli kullanıcı getir
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .populate('apiaries')
            .select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Kullanıcı bulunamadı'
            });
        }

        res.json({
            success: true,
            data: { user }
        });

    } catch (error) {
        console.error('Kullanıcı getirme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası oluştu'
        });
    }
});

module.exports = router;
