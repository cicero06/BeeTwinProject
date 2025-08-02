const mongoose = require('mongoose');

const sensorReadingSchema = new mongoose.Schema({
    // Sensör Referansı
    sensorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sensor',
        required: true
    },

    // Zaman Damgası
    timestamp: {
        type: Date,
        default: Date.now,
        required: true
    },

    // Sensör Verileri (Flexible JSON)
    data: {
        // Sıcaklık (°C)
        temperature: {
            type: Number,
            min: [-50, 'Sıcaklık çok düşük'],
            max: [100, 'Sıcaklık çok yüksek']
        },

        // Nem (%)
        humidity: {
            type: Number,
            min: [0, 'Nem negatif olamaz'],
            max: [100, 'Nem %100 dan fazla olamaz']
        },

        // Ağırlık (kg)
        weight: {
            type: Number,
            min: [0, 'Ağırlık negatif olamaz']
        },

        // Ses Seviyesi (dB)
        sound: {
            type: Number,
            min: [0, 'Ses seviyesi negatif olamaz']
        },

        // Titreşim
        vibration: {
            type: Number,
            min: [0, 'Titreşim negatif olamaz']
        },

        // Diğer sensör verileri için flexible field
        other: mongoose.Schema.Types.Mixed
    },

    // Pil Seviyesi (%)
    batteryLevel: {
        type: Number,
        min: [0, 'Pil seviyesi negatif olamaz'],
        max: [100, 'Pil seviyesi %100 dan fazla olamaz']
    },

    // Sinyal Gücü (dBm)
    signalStrength: {
        type: Number
    },

    // Veri Kalitesi
    quality: {
        type: String,
        enum: ['excellent', 'good', 'fair', 'poor'],
        default: 'good'
    },

    // Aktif/Pasif Durum
    isActive: {
        type: Boolean,
        default: true
    },

    // 🧠 ML Analysis ve Metadata
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Index'ler
sensorReadingSchema.index({ sensorId: 1, timestamp: -1 });
sensorReadingSchema.index({ timestamp: -1 });
sensorReadingSchema.index({ sensorId: 1 });

// Virtual: Veri yaşı (dakika cinsinden)
sensorReadingSchema.virtual('ageInMinutes').get(function () {
    return Math.floor((Date.now() - this.timestamp.getTime()) / (1000 * 60));
});

// Virtual: Sıcaklık Fahrenheit'e çevir
sensorReadingSchema.virtual('temperatureFahrenheit').get(function () {
    if (this.data && this.data.temperature) {
        return (this.data.temperature * 9 / 5) + 32;
    }
    return null;
});

// Static method: Son N veriyi getir
sensorReadingSchema.statics.getLatestReadings = function (sensorId, limit = 10) {
    return this.find({ sensorId, isActive: true })
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate('sensorId', 'name deviceId');
};

// Static method: Belirli tarih aralığındaki verileri getir
sensorReadingSchema.statics.getReadingsByDateRange = function (sensorId, startDate, endDate) {
    return this.find({
        sensorId,
        timestamp: {
            $gte: startDate,
            $lte: endDate
        },
        isActive: true
    }).sort({ timestamp: 1 });
};

// Instance method: Veri kalitesini hesapla
sensorReadingSchema.methods.calculateQuality = function () {
    let score = 100;

    // Pil seviyesi kontrolü
    if (this.batteryLevel && this.batteryLevel < 20) {
        score -= 30;
    } else if (this.batteryLevel && this.batteryLevel < 50) {
        score -= 10;
    }

    // Sinyal gücü kontrolü
    if (this.signalStrength && this.signalStrength < -80) {
        score -= 20;
    } else if (this.signalStrength && this.signalStrength < -60) {
        score -= 10;
    }

    // Veri yaşı kontrolü
    const ageMinutes = this.ageInMinutes;
    if (ageMinutes > 60) {
        score -= 20;
    } else if (ageMinutes > 30) {
        score -= 10;
    }

    if (score >= 90) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'fair';
    return 'poor';
};

// Pre-save middleware: Otomatik kalite hesaplama
sensorReadingSchema.pre('save', function (next) {
    if (!this.quality) {
        this.quality = this.calculateQuality();
    }
    next();
});

module.exports = mongoose.model('SensorReading', sensorReadingSchema);
