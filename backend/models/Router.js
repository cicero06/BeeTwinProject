const mongoose = require('mongoose');

const routerSchema = new mongoose.Schema({
    routerId: {
        type: String,
        required: [true, 'Router ID zorunludur'],
        unique: true,
        trim: true
    },
    name: {
        type: String,
        required: [true, 'Router adı zorunludur'],
        trim: true,
        maxlength: [100, 'Router adı en fazla 100 karakter olabilir']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Açıklama en fazla 500 karakter olabilir']
    },
    sensors: [{
        sensorId: {
            type: String,
            required: true
        },
        sensorType: {
            type: String,
            required: true,
            enum: [
                'BMP280', 'DHT22', 'DHT11', 'BME280',
                'MICS-4514', 'MQ2', 'MQ135', 'Load Cell',
                'Sound', 'Vibration', 'Light', 'UV'
            ]
        },
        dataKeys: [{
            key: String,        // WT, PR, WH, AL, etc.
            parameter: String,  // temperature, pressure, humidity, etc.
            unit: String       // °C, hPa, %, m, etc.
        }]
    }],
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    apiaryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Apiary',
        required: false
    },
    hiveId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hive',
        required: false
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'error', 'maintenance'],
        default: 'active'
    },
    batteryLevel: {
        type: Number,
        min: [0, 'Batarya seviyesi 0-100 arası olmalıdır'],
        max: [100, 'Batarya seviyesi 0-100 arası olmalıdır'],
        default: 100
    },
    lastSeen: {
        type: Date,
        default: Date.now
    },
    location: {
        latitude: Number,
        longitude: Number
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
routerSchema.index({ routerId: 1 });
routerSchema.index({ ownerId: 1 });
routerSchema.index({ apiaryId: 1 });
routerSchema.index({ hiveId: 1 });
routerSchema.index({ status: 1 });

// Pre-save middleware to update lastSeen
routerSchema.pre('save', function (next) {
    this.lastSeen = new Date();
    next();
});

module.exports = mongoose.model('Router', routerSchema);
