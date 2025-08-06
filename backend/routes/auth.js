const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const Apiary = require('../models/Apiary');
const auth = require('../middleware/auth');

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// JWT token oluşturma fonksiyonu
const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d'
    });
};

// @route   POST /api/auth/register
// @desc    Kullanıcı kaydı
// @access  Public
router.post('/register', [
    body('firstName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Ad 2-50 karakter arası olmalıdır'),
    body('lastName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Soyad 2-50 karakter arası olmalıdır'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Geçerli bir e-posta adresi giriniz'),
    body('password')
        .isLength({ min: 3 })
        .withMessage('Şifre en az 3 karakter olmalıdır'),
    // .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    // .withMessage('Şifre en az 1 küçük harf, 1 büyük harf ve 1 rakam içermelidir'),
    body('location')
        .trim()
        .isLength({ min: 2 })
        .withMessage('Konum bilgisi zorunludur'),
    body('userType')
        .optional()
        .isIn(['beekeeper', 'admin'])
        .withMessage('Geçerli bir kullanıcı tipi seçiniz'),
    // Arılık koordinat validasyonu
    body('apiaries.*.latitude')
        .optional()
        .isFloat({ min: -90, max: 90 })
        .withMessage('Geçersiz enlem değeri (-90 ile 90 arası olmalı)'),
    body('apiaries.*.longitude')
        .optional()
        .isFloat({ min: -180, max: 180 })
        .withMessage('Geçersiz boylam değeri (-180 ile 180 arası olmalı)'),
    body('apiaries.*.name')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Arılık adı 1-100 karakter arası olmalıdır'),
    body('apiaries.*.hiveCount')
        .optional()
        .isInt({ min: 0, max: 1000 })
        .withMessage('Kovan sayısı 0-1000 arası olmalıdır')
], async (req, res) => {
    try {
        // Validation kontrolü
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Girilen bilgilerde hata var',
                errors: errors.array()
            });
        }

        const {
            firstName,
            lastName,
            email,
            password,
            location,
            userType,
            beekeepingInfo,
            apiaries
        } = req.body;

        // E-posta kontrolü
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Bu e-posta adresi zaten kullanılıyor'
            });
        }

        // Kullanıcı oluşturma
        const userData = {
            firstName,
            lastName,
            email,
            password,
            location,
            userType: userType || 'beekeeper'  // 🎯 DEFAULT BEEKEEPER
        };

        // Arıcı ise arıcılık bilgilerini ekle
        if (userType === 'beekeeper' && beekeepingInfo) {
            userData.beekeepingInfo = beekeepingInfo;
        }

        const user = await User.create(userData);

        // Arıcı ise arılıkları oluştur
        if (userType === 'beekeeper' && apiaries && apiaries.length > 0) {
            const createdApiaries = [];
            const Hive = require('../models/Hive');

            for (const apiaryData of apiaries) {
                // Location objesi oluştur
                const locationData = {
                    address: apiaryData.location
                };

                // Eğer latitude ve longitude varsa coordinates ekle
                if (apiaryData.latitude && apiaryData.longitude) {
                    locationData.coordinates = {
                        latitude: apiaryData.latitude,
                        longitude: apiaryData.longitude
                    };
                }

                const apiary = await Apiary.create({
                    name: apiaryData.name,
                    location: locationData,
                    hiveCount: apiaryData.hiveCount,
                    ownerId: user._id
                });
                createdApiaries.push(apiary._id);

                // Bu arılık için kovanları oluştur
                if (apiaryData.hives && apiaryData.hives.length > 0) {
                    for (const hiveData of apiaryData.hives) {
                        console.log('🏠 Kovan işleniyor:', hiveData.name);
                        console.log('🔧 Hardware verileri:', JSON.stringify(hiveData.hardware, null, 2));

                        // ÇOKLU ROUTER SİSTEMİ DESTEĞİ
                        let sensorData = {};

                        if (hiveData.hardware?.routers && hiveData.hardware.routers.length > 0) {
                            // YENİ ÇOKLU ROUTER SİSTEMİ
                            console.log('🚀 Çoklu router sistemi algılandı:', hiveData.hardware.routers.length, 'router');

                            // Her router için benzersizlik kontrolü
                            for (const router of hiveData.hardware.routers) {
                                if (router.routerId) {
                                    const existingRouterHive = await Hive.findOne({
                                        'sensor.routerId': router.routerId
                                    });
                                    if (existingRouterHive) {
                                        return res.status(400).json({
                                            success: false,
                                            message: `Router ID "${router.routerId}" zaten kullanımda. Her Router ID benzersiz olmalıdır.`,
                                            error: 'DUPLICATE_ROUTER_ID'
                                        });
                                    }
                                }

                                // Her sensör için benzersizlik kontrolü
                                if (router.sensors && router.sensors.length > 0) {
                                    for (const sensor of router.sensors) {
                                        if (sensor.sensorId) {
                                            const existingSensorHive = await Hive.findOne({
                                                'sensor.sensorId': sensor.sensorId
                                            });
                                            if (existingSensorHive) {
                                                return res.status(400).json({
                                                    success: false,
                                                    message: `Sensor ID "${sensor.sensorId}" zaten kullanımda. Her Sensor ID benzersiz olmalıdır.`,
                                                    error: 'DUPLICATE_SENSOR_ID'
                                                });
                                            }
                                        }
                                    }
                                }
                            }

                            // Çoklu router verilerini sensor data formatına çevir
                            sensorData = {
                                // İlk aktif router'ı primary router yap (backward compatibility)
                                routerId: hiveData.hardware.routers.find(r => r.routerId)?.routerId || null,
                                sensorId: hiveData.hardware.routers
                                    .find(r => r.sensors?.find(s => s.sensorId))?.sensors
                                    .find(s => s.sensorId)?.sensorId || null,
                                isConnected: hiveData.hardware.routers.some(r => r.routerId),
                                connectionStatus: hiveData.hardware.routers.some(r => r.routerId) ? 'connected' : 'disconnected',
                                lastDataReceived: null,
                                calibrationDate: null,
                                // Çoklu router detayları
                                hardwareDetails: {
                                    coordinatorAddress: hiveData.hardware.coordinatorAddress || '34',
                                    channel: hiveData.hardware.channel || 23,
                                    systemType: 'multi-router',
                                    routers: hiveData.hardware.routers.map(router => ({
                                        routerType: router.routerType,
                                        routerName: router.routerName,
                                        routerId: router.routerId,
                                        address: router.address,
                                        isActive: router.isActive,
                                        sensors: router.sensors?.map(sensor => ({
                                            sensorType: sensor.sensorType,
                                            sensorName: sensor.sensorName,
                                            sensorId: sensor.sensorId,
                                            unit: sensor.unit,
                                            isActive: sensor.isActive
                                        })) || []
                                    }))
                                }
                            };

                        } else {
                            // ESKİ TEK ROUTER SİSTEMİ (Legacy)
                            console.log('⚙️ Legacy tek router sistemi algılandı');

                            if (hiveData.hardware?.routerId) {
                                const existingRouterHive = await Hive.findOne({
                                    'sensor.routerId': hiveData.hardware.routerId
                                });
                                if (existingRouterHive) {
                                    return res.status(400).json({
                                        success: false,
                                        message: `Router ID "${hiveData.hardware.routerId}" zaten kullanımda.`,
                                        error: 'DUPLICATE_ROUTER_ID'
                                    });
                                }
                            }

                            if (hiveData.hardware?.sensorId) {
                                const existingSensorHive = await Hive.findOne({
                                    'sensor.sensorId': hiveData.hardware.sensorId
                                });
                                if (existingSensorHive) {
                                    return res.status(400).json({
                                        success: false,
                                        message: `Sensor ID "${hiveData.hardware.sensorId}" zaten kullanımda.`,
                                        error: 'DUPLICATE_SENSOR_ID'
                                    });
                                }
                            }

                            sensorData = {
                                routerId: hiveData.hardware?.routerId || null,
                                sensorId: hiveData.hardware?.sensorId || null,
                                isConnected: !!(hiveData.hardware?.routerId && hiveData.hardware?.sensorId),
                                connectionStatus: hiveData.hardware?.routerId && hiveData.hardware?.sensorId ? 'connected' : 'disconnected',
                                lastDataReceived: null,
                                calibrationDate: hiveData.hardware?.calibrationDate || null,
                                hardwareDetails: {
                                    coordinatorAddress: hiveData.hardware?.coordinatorAddress || '34',
                                    channel: hiveData.hardware?.channel || 23,
                                    systemType: 'legacy',
                                    routers: []
                                }
                            };
                        }

                        // Kovanı oluştur
                        const newHive = await Hive.create({
                            name: hiveData.name || `Kovan ${hiveData.hiveNumber || 1}`,
                            number: hiveData.hiveNumber || 1,
                            description: hiveData.description || 'Kayıt sırasında oluşturulan kovan',
                            apiary: apiary._id,
                            type: hiveData.hiveType || 'langstroth',
                            sensor: sensorData
                        });

                        console.log('✅ Kovan oluşturuldu:', newHive.name, 'ID:', newHive._id);
                    }
                }
            }

            // Kullanıcıya arılık referanslarını ekle
            user.apiaries = createdApiaries;
            await user.save();
        }

        // JWT token oluştur
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: 'Kullanıcı başarıyla kaydedildi',
            data: {
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    userType: user.userType,
                    location: user.location,
                    beekeepingInfo: user.beekeepingInfo,
                    apiaries: user.apiaries
                },
                token
            }
        });

    } catch (error) {
        console.error('Kayıt hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası oluştu'
        });
    }
});

// @route   POST /api/auth/login
// @desc    Kullanıcı girişi
// @access  Public
router.post('/login', [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Geçerli bir e-posta adresi giriniz'),
    body('password')
        .exists()
        .withMessage('Şifre zorunludur')
], async (req, res) => {
    try {
        // Validation kontrolü
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Girilen bilgilerde hata var',
                errors: errors.array()
            });
        }

        const { email, password } = req.body;

        // Debug logları
        console.log('Login attempt:', { email, password });

        // Kullanıcı arama (şifre dahil)
        const user = await User.findOne({ email }).select('+password').populate('apiaries');

        if (!user) {
            console.log('User not found:', email);
            return res.status(401).json({
                success: false,
                message: 'Geçersiz e-posta veya şifre'
            });
        }

        console.log('User found:', { email: user.email, hasPassword: !!user.password });

        // Şifre kontrolü
        const isPasswordValid = await user.comparePassword(password);
        console.log('Password comparison result:', isPasswordValid);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Geçersiz e-posta veya şifre'
            });
        }

        // Aktif kullanıcı kontrolü
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Hesabınız devre dışı bırakılmış'
            });
        }

        // Son giriş zamanını güncelle
        user.lastLogin = new Date();
        await user.save();

        // JWT token oluştur
        const token = generateToken(user._id);

        res.json({
            success: true,
            message: 'Giriş başarılı',
            data: {
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    userType: user.userType,
                    location: user.location,
                    beekeepingInfo: user.beekeepingInfo,
                    apiaries: user.apiaries,
                    lastLogin: user.lastLogin
                },
                token
            }
        });

    } catch (error) {
        console.error('Giriş hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası oluştu'
        });
    }
});

// @route   GET /api/auth/me
// @desc    Kullanıcı bilgilerini getir
// @access  Private
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
            .populate('apiaries')
            .populate('apiaryCount');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Kullanıcı bulunamadı'
            });
        }

        res.json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    fullName: user.fullName,
                    email: user.email,
                    userType: user.userType,
                    location: user.location,
                    beekeepingInfo: user.beekeepingInfo,
                    apiaries: user.apiaries,
                    apiaryCount: user.apiaryCount,
                    lastLogin: user.lastLogin,
                    createdAt: user.createdAt
                }
            }
        });

    } catch (error) {
        console.error('Kullanıcı bilgisi alma hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası oluştu'
        });
    }
});

// @route   PUT /api/auth/update-profile
// @desc    Kullanıcı profili güncelle
// @access  Private
router.put('/update-profile', auth, [
    body('firstName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Ad 2-50 karakter arası olmalıdır'),
    body('lastName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Soyad 2-50 karakter arası olmalıdır'),
    body('location')
        .optional()
        .trim()
        .isLength({ min: 2 })
        .withMessage('Konum bilgisi en az 2 karakter olmalıdır'),
    body('phone')
        .optional()
        .trim()
        .isMobilePhone('tr-TR')
        .withMessage('Geçerli bir telefon numarası giriniz')
], async (req, res) => {
    try {
        // Validation kontrolü
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Girilen bilgilerde hata var',
                errors: errors.array()
            });
        }

        const allowedUpdates = ['firstName', 'lastName', 'location', 'phone', 'beekeepingInfo'];
        const updates = {};

        // Sadece izin verilen alanları güncelle
        Object.keys(req.body).forEach(key => {
            if (allowedUpdates.includes(key)) {
                updates[key] = req.body[key];
            }
        });

        const user = await User.findByIdAndUpdate(
            req.user.userId,
            { $set: updates },
            { new: true, runValidators: true }
        ).populate('apiaries');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Kullanıcı bulunamadı'
            });
        }

        res.json({
            success: true,
            message: 'Profil başarıyla güncellendi',
            data: {
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    fullName: user.fullName,
                    email: user.email,
                    userType: user.userType,
                    location: user.location,
                    phone: user.phone,
                    beekeepingInfo: user.beekeepingInfo,
                    apiaries: user.apiaries
                }
            }
        });

    } catch (error) {
        console.error('Profil güncelleme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası oluştu'
        });
    }
});

// @route   POST /api/auth/change-password
// @desc    Şifre değiştirme
// @access  Private
router.post('/change-password', auth, [
    body('currentPassword')
        .exists()
        .withMessage('Mevcut şifre zorunludur'),
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('Yeni şifre en az 6 karakter olmalıdır')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Yeni şifre en az 1 küçük harf, 1 büyük harf ve 1 rakam içermelidir')
], async (req, res) => {
    try {
        // Validation kontrolü
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Girilen bilgilerde hata var',
                errors: errors.array()
            });
        }

        const { currentPassword, newPassword } = req.body;

        // Kullanıcı arama (şifre dahil)
        const user = await User.findById(req.user.userId).select('+password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Kullanıcı bulunamadı'
            });
        }

        // Mevcut şifre kontrolü
        const isCurrentPasswordValid = await user.comparePassword(currentPassword);
        if (!isCurrentPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Mevcut şifre hatalı'
            });
        }

        // Yeni şifre kaydetme
        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Şifre başarıyla değiştirildi'
        });

    } catch (error) {
        console.error('Şifre değiştirme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası oluştu'
        });
    }
});

// @route   POST /api/auth/forgot-password
// @desc    Şifremi unuttum - Email ile şifre sıfırlama linki gönder
// @access  Public
router.post('/forgot-password', [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Geçerli bir e-posta adresi giriniz')
], async (req, res) => {
    try {
        // Validation kontrolü
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Geçerli bir e-posta adresi giriniz',
                errors: errors.array()
            });
        }

        const { email } = req.body;

        // Kullanıcıyı bul
        const user = await User.findOne({ email });
        if (!user) {
            // Güvenlik için kullanıcı yoksa da başarılı mesaj döndür
            return res.json({
                success: true,
                message: 'Eğer bu e-posta adresine kayıtlı bir hesap varsa, şifre sıfırlama bağlantısı gönderilecektir.'
            });
        }

        // Şifre sıfırlama token'ı oluştur (basit implementasyon)
        const crypto = require('crypto');
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 dakika

        // Token'ı kullanıcıya kaydet
        user.passwordResetToken = resetToken;
        user.passwordResetExpires = resetTokenExpires;
        await user.save();

        // Normal uygulamada burada email gönderilir
        // Şimdilik sadece console'a yazdıralım
        console.log(`Password reset link for ${email}: http://localhost:5175/reset-password?token=${resetToken}`);

        res.json({
            success: true,
            message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.',
            // Development için token'ı döndürelim
            resetToken: resetToken,
            resetLink: `http://localhost:5175/reset-password?token=${resetToken}`
        });

    } catch (error) {
        console.error('Şifre sıfırlama hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası oluştu'
        });
    }
});

// @route   POST /api/auth/reset-password
// @desc    Şifre sıfırla
// @access  Public
router.post('/reset-password', [
    body('token')
        .exists()
        .withMessage('Sıfırlama token\'ı zorunludur'),
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('Yeni şifre en az 6 karakter olmalıdır')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Yeni şifre en az 1 küçük harf, 1 büyük harf ve 1 rakam içermelidir')
], async (req, res) => {
    try {
        // Validation kontrolü
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Girilen bilgilerde hata var',
                errors: errors.array()
            });
        }

        const { token, newPassword } = req.body;

        // Token ile kullanıcıyı bul ve token'ın geçerli olup olmadığını kontrol et
        const user = await User.findOne({
            passwordResetToken: token,
            passwordResetExpires: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Geçersiz veya süresi dolmuş sıfırlama token\'ı'
            });
        }

        // Yeni şifreyi kaydet
        user.password = newPassword;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        res.json({
            success: true,
            message: 'Şifreniz başarıyla sıfırlandı. Yeni şifrenizle giriş yapabilirsiniz.'
        });

    } catch (error) {
        console.error('Şifre sıfırlama hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası oluştu'
        });
    }
});

// Google OAuth Giriş/Kayıt
router.post('/google-auth', async (req, res) => {
    try {
        const { credential } = req.body;

        // Google ID token'ını doğrula
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        const {
            email,
            given_name: firstName,
            family_name: lastName,
            picture,
            sub: googleId,
            email_verified
        } = payload;

        // Email doğrulanmamışsa hata ver
        if (!email_verified) {
            return res.status(400).json({
                success: false,
                message: 'Google hesabınızın email adresi doğrulanmamış'
            });
        }

        // Kullanıcıyı bul veya oluştur
        let user = await User.findOne({ email });

        if (user) {
            // Mevcut kullanıcı - Google ID'yi güncelle
            if (!user.googleId) {
                user.googleId = googleId;
                user.profilePicture = picture;
                await user.save();
            }
        } else {
            // Yeni kullanıcı oluştur
            user = new User({
                firstName,
                lastName,
                email,
                googleId,
                profilePicture: picture,
                userType: 'beekeeper',
                location: 'Belirtilmemiş',
                isActive: true,
                emailVerified: true,
                // Google OAuth kullanıcıları için şifre zorunlu değil
                password: undefined
            });

            await user.save();
        }

        // Son giriş zamanını güncelle
        user.lastLogin = new Date();
        await user.save();

        // JWT token oluştur
        const token = generateToken(user._id);

        res.json({
            success: true,
            message: 'Google ile giriş başarılı',
            data: {
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    userType: user.userType,
                    location: user.location,
                    profilePicture: user.profilePicture,
                    lastLogin: user.lastLogin
                },
                token
            }
        });

    } catch (error) {
        console.error('Google Auth Error:', error);
        res.status(500).json({
            success: false,
            message: 'Google ile giriş yapılırken bir hata oluştu'
        });
    }
});

// Debug için şifre hash'leme endpoint'i
router.post('/hash-password', async (req, res) => {
    try {
        const { password } = req.body;
        const bcrypt = require('bcryptjs');

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        res.json({
            success: true,
            originalPassword: password,
            hashedPassword: hashedPassword
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
