/**
 * ÇOK ROUTERLı HIVE MODELİ - BACKEND GÜNCELLEMESİ
 * 
 * Mevcut Hive modelini kovan başına 4 router destekleyecek şekilde günceller
 * Her router için benzersiz ID'ler ve multiple sensörler
 */

// models/Hive.js - Güncellenmiş Model
const mongoose = require('mongoose');

const SensorSchema = new mongoose.Schema({
    sensorType: {
        type: String,
        required: true,
        enum: ['temp', 'pressure', 'humidity', 'co', 'no2', 'gasLevel', 'weight', 'deltaWeight', 'smoke', 'lpg']
    },
    sensorName: String,
    sensorId: {
        type: String,
        required: true,
        unique: true // Global benzersizlik
    },
    unit: String,
    isActive: {
        type: Boolean,
        default: true
    },
    calibration: {
        offset: { type: Number, default: 0 },
        multiplier: { type: Number, default: 1 }
    }
});

const RouterSchema = new mongoose.Schema({
    routerType: {
        type: String,
        required: true,
        enum: ['bmp280', 'mics4514', 'loadcell', 'mq2']
    },
    routerName: String,
    routerId: {
        type: String,
        required: true,
        unique: true // Global benzersizlik
    },
    address: String,
    sensors: [SensorSchema],
    isActive: {
        type: Boolean,
        default: true
    },
    lastSeen: Date,
    batteryLevel: Number,
    signalStrength: Number
});

const HardwareSchema = new mongoose.Schema({
    coordinatorAddress: {
        type: String,
        default: '34'
    },
    channel: {
        type: Number,
        default: 23
    },
    routers: [RouterSchema] // Artık array of routers
});

const HiveSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    hiveNumber: {
        type: Number,
        required: true
    },
    hiveType: {
        type: String,
        enum: ['langstroth', 'top-bar', 'warre', 'other'],
        default: 'langstroth'
    },
    description: String,
    hardware: HardwareSchema,
    // İstatistikler
    stats: {
        totalRouters: { type: Number, default: 0 },
        activeRouters: { type: Number, default: 0 },
        totalSensors: { type: Number, default: 0 },
        activeSensors: { type: Number, default: 0 },
        lastDataReceived: Date
    }
}, {
    timestamps: true
});

// Pre-save middleware: İstatistikleri otomatik hesapla
HiveSchema.pre('save', function (next) {
    if (this.hardware && this.hardware.routers) {
        this.stats.totalRouters = this.hardware.routers.length;
        this.stats.activeRouters = this.hardware.routers.filter(r => r.isActive).length;

        let totalSensors = 0;
        let activeSensors = 0;

        this.hardware.routers.forEach(router => {
            if (router.sensors) {
                totalSensors += router.sensors.length;
                activeSensors += router.sensors.filter(s => s.isActive).length;
            }
        });

        this.stats.totalSensors = totalSensors;
        this.stats.activeSensors = activeSensors;
    }
    next();
});

// Virtual: Tüm aktif router ID'lerini getir
HiveSchema.virtual('activeRouterIds').get(function () {
    if (!this.hardware || !this.hardware.routers) return [];
    return this.hardware.routers
        .filter(router => router.isActive && router.routerId)
        .map(router => router.routerId);
});

// Virtual: Tüm aktif sensor ID'lerini getir
HiveSchema.virtual('activeSensorIds').get(function () {
    if (!this.hardware || !this.hardware.routers) return [];

    const sensorIds = [];
    this.hardware.routers.forEach(router => {
        if (router.isActive && router.sensors) {
            router.sensors.forEach(sensor => {
                if (sensor.isActive && sensor.sensorId) {
                    sensorIds.push(sensor.sensorId);
                }
            });
        }
    });
    return sensorIds;
});

// Static method: Router ID benzersizlik kontrolü
HiveSchema.statics.checkRouterIdUniqueness = async function (routerId, excludeHiveId = null) {
    const query = { 'hardware.routers.routerId': routerId };
    if (excludeHiveId) {
        query._id = { $ne: excludeHiveId };
    }

    const existingHive = await this.findOne(query);
    return !existingHive; // true = benzersiz, false = duplicate
};

// Static method: Sensor ID benzersizlik kontrolü
HiveSchema.statics.checkSensorIdUniqueness = async function (sensorId, excludeHiveId = null) {
    const query = { 'hardware.routers.sensors.sensorId': sensorId };
    if (excludeHiveId) {
        query._id = { $ne: excludeHiveId };
    }

    const existingHive = await this.findOne(query);
    return !existingHive; // true = benzersiz, false = duplicate
};

// Instance method: Router tipine göre getir
HiveSchema.methods.getRouterByType = function (routerType) {
    if (!this.hardware || !this.hardware.routers) return null;
    return this.hardware.routers.find(router => router.routerType === routerType && router.isActive);
};

// Instance method: Sensor tipine göre getir
HiveSchema.methods.getSensorsByType = function (sensorType) {
    if (!this.hardware || !this.hardware.routers) return [];

    const sensors = [];
    this.hardware.routers.forEach(router => {
        if (router.isActive && router.sensors) {
            const matchingSensors = router.sensors.filter(sensor =>
                sensor.sensorType === sensorType && sensor.isActive
            );
            sensors.push(...matchingSensors);
        }
    });
    return sensors;
};

module.exports = mongoose.model('Hive', HiveSchema);
