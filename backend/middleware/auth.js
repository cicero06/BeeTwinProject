const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    try {
        // Token'ı header'dan al
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token bulunamadı, erişim reddedildi'
            });
        }

        console.log('Received token:', token.substring(0, 20) + '...'); // Debug log

        // Token'ı doğrula
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token decoded successfully:', { userId: decoded.userId }); // Debug log

        // Kullanıcı var mı kontrol et
        const user = await User.findById(decoded.userId);
        if (!user) {
            console.log('User not found for ID:', decoded.userId); // Debug log
            return res.status(401).json({
                success: false,
                message: 'Token geçerli değil'
            });
        }

        console.log('User found:', user.email); // Debug log

        // Kullanıcı aktif mi kontrol et
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Hesabınız devre dışı bırakılmış'
            });
        }

        // User object'ini req'e ekle (hem decoded token hem de user data)
        req.user = {
            id: user._id,
            userId: user._id,
            email: user.email,
            userType: user.userType,
            ...decoded
        };

        console.log('req.user set to:', req.user.id); // Debug log

        next();

    } catch (error) {
        console.error('Auth middleware hatası:', error);
        res.status(401).json({
            success: false,
            message: 'Token geçerli değil'
        });
    }
};

// Admin kontrolü middleware'i
const requireAdmin = (req, res, next) => {
    if (req.user?.userType !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Bu işlem için admin yetkisi gereklidir'
        });
    }
    next();
};

// Beekeeper veya Admin kontrolü middleware'i
const requireBeekeeperOrAdmin = (req, res, next) => {
    if (!req.user?.userType || (req.user.userType !== 'beekeeper' && req.user.userType !== 'admin')) {
        return res.status(403).json({
            success: false,
            message: 'Bu işlem için kullanıcı yetkisi gereklidir'
        });
    }
    next();
};

module.exports = { auth, requireAdmin, requireBeekeeperOrAdmin };
