const express = require('express');
const router = express.Router();
const { auth, requireAdmin, requireBeekeeperOrAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const User = require('../models/User');
const Hive = require('../models/Hive');
const Apiary = require('../models/Apiary');
const path = require('path');
const fs = require('fs');

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

// @route   GET /api/users/profile
// @desc    Kullanıcının kendi profilini ve tüm verilerini getir
// @access  Private
router.get('/profile', auth, async (req, res) => {
    try {
        console.log('👤 Profile endpoint - User ID:', req.user.id);

        // Kullanıcı bilgilerini ve arılıklarını getir
        const user = await User.findById(req.user.id)
            .populate({
                path: 'apiaries',
                populate: {
                    path: 'hives',
                    select: 'name sensor apiary status'
                }
            })
            .select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Kullanıcı bulunamadı'
            });
        }

        console.log('✅ Profile data prepared for:', user.email);
        console.log('🏡 Apiaries count:', user.apiaries?.length || 0);
        console.log('🖼️ Profile picture:', user.profilePicture || 'None');

        res.json({
            success: true,
            data: {
                user: {
                    _id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    phone: user.phone,
                    location: user.location,
                    bio: user.bio,
                    beekeepingInfo: user.beekeepingInfo,
                    profilePicture: user.profilePicture,
                    userType: user.userType,
                    apiaries: user.apiaries || []
                }
            }
        });

    } catch (error) {
        console.error('❌ Profile getirme hatası:', error);
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

// @route   PUT /api/users/profile
// @desc    Kullanıcının kendi profilini güncelle
// @access  Private
router.put('/profile', auth, async (req, res) => {
    try {
        console.log('📝 Profile update endpoint - User ID:', req.user.id);
        console.log('📝 Request body:', req.body);

        const {
            firstName,
            lastName,
            email,
            phone,
            location,
            bio,
            dateOfBirth,
            profilePicture,
            beekeepingInfo
        } = req.body;

        // Güncellenecek kullanıcıyı bul
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Kullanıcı bulunamadı'
            });
        }

        // Email değişikliği kontrolü
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email, _id: { $ne: req.user.id } });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Bu e-posta adresi zaten kullanılıyor'
                });
            }
        }

        // Güncellenecek alanları belirle
        const updateFields = {};

        if (firstName !== undefined) updateFields.firstName = firstName;
        if (lastName !== undefined) updateFields.lastName = lastName;
        if (email !== undefined) updateFields.email = email;
        if (phone !== undefined) updateFields.phone = phone;
        if (location !== undefined) updateFields.location = location;
        if (bio !== undefined) updateFields.bio = bio;
        if (dateOfBirth !== undefined) updateFields.dateOfBirth = dateOfBirth;
        if (profilePicture !== undefined) updateFields.profilePicture = profilePicture;

        // Arıcılık bilgilerini güncelle
        if (beekeepingInfo && user.userType === 'beekeeper') {
            if (beekeepingInfo.experience !== undefined) {
                updateFields['beekeepingInfo.experience'] = beekeepingInfo.experience;
            }
            if (beekeepingInfo.goals !== undefined) {
                updateFields['beekeepingInfo.goals'] = beekeepingInfo.goals;
            }
        }

        // Kullanıcıyı güncelle
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updateFields },
            {
                new: true,
                runValidators: true
            }
        ).populate({
            path: 'apiaries',
            populate: {
                path: 'hives',
                select: 'name sensor apiary status'
            }
        }).select('-password');

        console.log('✅ Profile updated successfully:', updatedUser.firstName, updatedUser.lastName);

        res.json({
            success: true,
            message: 'Profil başarıyla güncellendi',
            data: { user: updatedUser }
        });

    } catch (error) {
        console.error('Profil güncelleme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Profil güncellenirken bir hata oluştu',
            error: error.message
        });
    }
});

// @route   POST /api/users/upload-photo
// @desc    Profil fotoğrafı yükle
// @access  Private
router.post('/upload-photo', auth, upload.single('profilePhoto'), async (req, res) => {
    try {
        console.log('📸 Photo upload endpoint - User ID:', req.user.id);
        console.log('📸 File info:', req.file);

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Lütfen bir resim dosyası seçiniz'
            });
        }

        // Eski profil fotoğrafını sil
        const user = await User.findById(req.user.id);
        if (user.profilePicture) {
            const oldPhotoPath = path.join(__dirname, '..', 'uploads', 'profiles', path.basename(user.profilePicture));
            if (fs.existsSync(oldPhotoPath)) {
                fs.unlinkSync(oldPhotoPath);
                console.log('🗑️ Old photo deleted:', oldPhotoPath);
            }
        }

        // Yeni profil fotoğrafı URL'ini oluştur
        const photoUrl = `/uploads/profiles/${req.file.filename}`;

        // Kullanıcıyı güncelle
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { profilePicture: photoUrl },
            { new: true }
        ).select('-password');

        console.log('✅ Photo uploaded successfully:', photoUrl);

        res.json({
            success: true,
            message: 'Profil fotoğrafı başarıyla yüklendi',
            data: {
                profilePicture: photoUrl,
                user: updatedUser
            }
        });

    } catch (error) {
        console.error('Foto yükleme hatası:', error);

        // Hata durumunda yüklenen dosyayı sil
        if (req.file) {
            const filePath = req.file.path;
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        res.status(500).json({
            success: false,
            message: 'Foto yüklenirken bir hata oluştu',
            error: error.message
        });
    }
});

module.exports = router;
