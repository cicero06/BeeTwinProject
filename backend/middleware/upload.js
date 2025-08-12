const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Upload klasörünü oluştur
const uploadDir = path.join(__dirname, '..', 'uploads', 'profiles');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Unique filename: userId_timestamp.extension
        const uniqueName = `${req.user.id}_${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    // Sadece resim dosyalarına izin ver
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Sadece resim dosyaları yüklenebilir!'), false);
    }
};

// Upload configuration
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

module.exports = upload;
