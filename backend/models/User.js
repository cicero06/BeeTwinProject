const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    // Kişisel Bilgiler
    firstName: {
        type: String,
        required: [true, 'Ad alanı zorunludur'],
        trim: true,
        maxlength: [50, 'Ad en fazla 50 karakter olabilir']
    },
    lastName: {
        type: String,
        required: [true, 'Soyad alanı zorunludur'],
        trim: true,
        maxlength: [50, 'Soyad en fazla 50 karakter olabilir']
    },
    email: {
        type: String,
        required: [true, 'E-posta alanı zorunludur'],
        unique: true,
        lowercase: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Geçerli bir e-posta adresi giriniz'
        ]
    },
    password: {
        type: String,
        required: function () {
            // Google OAuth kullanıcıları için şifre zorunlu değil
            return !this.googleId;
        },
        minlength: [3, 'Şifre en az 3 karakter olmalıdır'],
        select: false // Şifre varsayılan olarak döndürülmez
    },

    // Google OAuth Bilgileri
    googleId: {
        type: String,
        unique: true,
        sparse: true // Sadece Google OAuth kullanıcıları için unique olsun
    },
    profilePicture: {
        type: String // Google'dan gelen profil fotosu URL'i
    },
    emailVerified: {
        type: Boolean,
        default: false
    },

    location: {
        type: String,
        required: [true, 'Konum alanı zorunludur'],
        trim: true
    },

    // Kullanıcı Tipi
    userType: {
        type: String,
        enum: ['beekeeper', 'admin'],
        default: 'beekeeper'
    },

    // Arıcılık Bilgileri (Sadece arıcılar için)
    beekeepingInfo: {
        experience: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced'],
            default: 'beginner' // 🎯 DEFAULT DEĞER
            // required: function () {
            //     return this.userType === 'beekeeper';
            // }
        },
        totalApiaries: {
            type: Number,
            min: [0, 'Arılık sayısı negatif olamaz'],
            default: 0
        },
        totalHives: {
            type: Number,
            min: [0, 'Kovan sayısı negatif olamaz'],
            default: 0
        },
        goals: {
            type: String,
            maxlength: [500, 'Hedefler en fazla 500 karakter olabilir']
        },
        startDate: {
            type: Date,
            default: Date.now
        }
    },

    // Profil Bilgileri
    avatar: {
        type: String,
        default: ''
    },
    profilePicture: {
        type: String,
        default: ''
    },
    phone: {
        type: String,
        trim: true
    },
    bio: {
        type: String,
        maxlength: [500, 'Biyografi en fazla 500 karakter olabilir'],
        trim: true
    },
    dateOfBirth: {
        type: Date
    },

    // Hesap Durumu
    isActive: {
        type: Boolean,
        default: true
    },
    emailVerified: {
        type: Boolean,
        default: false
    },

    // Kullanıcı İzinleri ve Durum
    isActive: {
        type: Boolean,
        default: true
    },

    // Tarihler
    lastLogin: {
        type: Date
    },

    // Arılık Referansları
    apiaries: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Apiary'
    }],

    // Şifre Sıfırlama
    passwordResetToken: {
        type: String
    },
    passwordResetExpires: {
        type: Date
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Şifre hashleme middleware
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Şifre karşılaştırma metodu
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Tam ad virtual field
userSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`;
});

// Arılık sayısı virtual field
userSchema.virtual('apiaryCount', {
    ref: 'Apiary',
    localField: '_id',
    foreignField: 'owner',
    count: true
});

// JSON dönüşümünde hassas bilgileri gizle
userSchema.methods.toJSON = function () {
    const userObject = this.toObject();
    delete userObject.password;
    delete userObject.__v;
    return userObject;
};

module.exports = mongoose.model('User', userSchema);
