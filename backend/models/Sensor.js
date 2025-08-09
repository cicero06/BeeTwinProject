const mongoose = require('mongoose');

const sensorSchema = new mongoose.Schema({
    deviceId: {
        type: String,
        required: [true, 'Device ID zorunludur'],
        unique: true,
        trim: true
    },
    routerId: {
        type: String,
        required: [true, 'Router ID zorunludur'],
        trim: true,
        index: true
    },
    sensorId: {
        type: String,
        required: [true, 'Sensor ID zorunludur'],
        trim: true
    },
    name: {
        type: String,
        required: [true, 'Sensör adı zorunludur'],
        trim: true,
        maxlength: [100, 'Sensör adı en fazla 100 karakter olabilir']
    },
    apiaryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Apiary',
        required: false  // Zorunlu olmaktan çıkardık
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sensorTypes: [{
        type: String,
        enum: [
            'temperature', 'humidity', 'pressure', 'altitude',
            'weight', 'sound', 'vibration', 'co', 'no2',
            'gasLevel', 'smoke', 'lpg'
        ],
        required: true
    }],
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
sensorSchema.index({ ownerId: 1 });
sensorSchema.index({ apiaryId: 1 });
sensorSchema.index({ status: 1 });
sensorSchema.index({ routerId: 1 });
sensorSchema.index({ routerId: 1, ownerId: 1 });

module.exports = mongoose.model('Sensor', sensorSchema);
