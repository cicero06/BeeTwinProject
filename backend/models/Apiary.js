const mongoose = require('mongoose');

const apiarySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Arılık adı zorunludur'],
        trim: true,
        maxlength: [100, 'Arılık adı en fazla 100 karakter olabilir']
    },

    // Konum Bilgileri
    location: {
        address: {
            type: String,
            required: [true, 'Adres zorunludur'],
            trim: true
        },
        coordinates: {
            latitude: {
                type: Number,
                min: [-90, 'Geçersiz enlem'],
                max: [90, 'Geçersiz enlem']
            },
            longitude: {
                type: Number,
                min: [-180, 'Geçersiz boylam'],
                max: [180, 'Geçersiz boylam']
            }
        },
        city: String,
        district: String,
        postalCode: String
    },

    // Sahiplik Bilgileri
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Arılık Detayları
    hiveCount: {
        type: Number,
        required: false,  // Zorunlu olmaktan çıkardık
        min: [1, 'En az 1 kovan olmalıdır'],
        max: [1000, 'En fazla 1000 kovan olabilir'],
        default: 0  // Varsayılan değer
    },

    // Arılık Tipi
    type: {
        type: String,
        enum: ['traditional', 'modern', 'top-bar', 'warre'],
        default: 'modern'
    },

    // Çevre Bilgileri
    environment: {
        vegetation: [{
            type: String,
            enum: ['forest', 'meadow', 'agricultural', 'urban', 'mountain', 'coastal']
        }],
        waterSource: {
            type: String,
            enum: ['river', 'lake', 'well', 'artificial', 'none']
        },
        climate: {
            type: String,
            enum: ['temperate', 'continental', 'mediterranean', 'subtropical']
        }
    },

    // Üretim Bilgileri
    production: {
        lastHarvest: {
            date: Date,
            amount: Number, // kg cinsinden
            quality: {
                type: String,
                enum: ['excellent', 'good', 'average', 'poor']
            }
        },
        annualProduction: {
            type: Number,
            min: [0, 'Negatif üretim olamaz']
        },
        honeyTypes: [{
            type: String,
            enum: ['wildflower', 'acacia', 'linden', 'sunflower', 'chestnut', 'pine']
        }]
    },

    // Sağlık ve Durum
    health: {
        status: {
            type: String,
            enum: ['healthy', 'sick', 'weak', 'dead'],
            default: 'healthy'
        },
        lastInspection: Date,
        diseases: [{
            name: String,
            detectedDate: Date,
            treatment: String,
            resolved: {
                type: Boolean,
                default: false
            }
        }],
        treatments: [{
            type: String,
            date: Date,
            notes: String
        }]
    },

    // Notlar ve Ekstra Bilgiler
    notes: {
        type: String,
        maxlength: [1000, 'Notlar en fazla 1000 karakter olabilir']
    },

    // Aktiflik Durumu
    isActive: {
        type: Boolean,
        default: true
    },

    // Fotoğraflar
    photos: [{
        url: String,
        description: String,
        uploadDate: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Kovan referansları virtual field
apiarySchema.virtual('hives', {
    ref: 'Hive',
    localField: '_id',
    foreignField: 'apiary'
});

// Arılık verimlilik hesaplama
apiarySchema.virtual('productivity').get(function () {
    if (this.production.annualProduction && this.hiveCount) {
        return (this.production.annualProduction / this.hiveCount).toFixed(2);
    }
    return 0;
});

// Arılık yaşı hesaplama
apiarySchema.virtual('age').get(function () {
    if (this.createdAt) {
        const diffTime = Math.abs(Date.now() - this.createdAt);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }
    return 0;
});

// Indexes
apiarySchema.index({ owner: 1 });
apiarySchema.index({ 'location.coordinates': '2dsphere' });
apiarySchema.index({ name: 'text', 'location.address': 'text' });

module.exports = mongoose.model('Apiary', apiarySchema);
