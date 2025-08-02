const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Apiary = require('../models/Apiary');

// @route   GET /api/apiaries
// @desc    Kullanıcının arılıklarını getir
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        console.log('🏡 Apiaries GET request - User:', req.user.userId);

        const apiaries = await Apiary.find({
            ownerId: req.user.userId,  // owner -> ownerId
            isActive: true
        }).populate('hives');

        console.log('🏡 Found apiaries:', apiaries.length);

        res.json({
            success: true,
            data: {
                apiaries,
                count: apiaries.length
            }
        });

    } catch (error) {
        console.error('❌ Arılıkları getirme hatası:', error);
        console.error('❌ Error message:', error.message);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası oluştu'
        });
    }
});

// @route   POST /api/apiaries
// @desc    Yeni arılık oluştur
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        console.log('📝 POST Apiaries request - User:', req.user.userId);
        console.log('📝 Request body:', req.body);

        const apiaryData = {
            ...req.body,
            ownerId: req.user.userId  // owner -> ownerId
        };

        console.log('📝 Final apiary data:', apiaryData);

        const apiary = await Apiary.create(apiaryData);

        res.status(201).json({
            success: true,
            message: 'Arılık başarıyla oluşturuldu',
            data: { apiary }
        });

    } catch (error) {
        console.error('❌ POST Apiaries hatası:', error);
        console.error('❌ Error message:', error.message);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası oluştu'
        });
    }
});

module.exports = router;
