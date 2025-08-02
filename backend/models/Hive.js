const mongoose = require('mongoose');

const hiveSchema = new mongoose.Schema({
    // Temel Bilgiler
    name: {
        type: String,
        required: [true, 'Kovan adı zorunludur'],
        trim: true,
        maxlength: [100, 'Kovan adı en fazla 100 karakter olabilir']
    },

    // Kovan Numarası
    number: {
        type: Number,
        required: [true, 'Kovan numarası zorunludur'],
        min: [1, 'Kovan numarası 1 den küçük olamaz']
    },

    // Arılık Referansı
    apiary: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Apiary',
        required: true
    },

    // Kovan Tipi
    type: {
        type: String,
        enum: ['langstroth', 'dadant', 'top-bar', 'warre', 'traditional'],
        default: 'langstroth'
    },

    // Kraliçe Bilgileri
    queen: {
        present: {
            type: Boolean,
            default: true
        },
        age: {
            type: Number, // Ay cinsinden
            min: [0, 'Kraliçe yaşı negatif olamaz'],
            max: [60, 'Kraliçe yaşı 60 aydan fazla olamaz']
        },
        marked: {
            type: Boolean,
            default: false
        },
        color: {
            type: String,
            enum: ['white', 'yellow', 'red', 'green', 'blue']
        },
        breed: {
            type: String,
            enum: ['caucasian', 'carniolan', 'italian', 'buckfast', 'anatolian']
        },
        lastSeen: Date,
        productivity: {
            type: String,
            enum: ['excellent', 'good', 'average', 'poor']
        }
    },

    // Kovan Durumu
    status: {
        type: String,
        enum: ['active', 'inactive', 'dead', 'swarmed', 'queenless'],
        default: 'active'
    },

    // Arı Popülasyonu
    population: {
        estimate: {
            type: Number,
            min: [0, 'Popülasyon negatif olamaz']
        },
        strength: {
            type: String,
            enum: ['very-strong', 'strong', 'medium', 'weak', 'very-weak'],
            default: 'medium'
        },
        brood: {
            type: String,
            enum: ['abundant', 'good', 'average', 'little', 'none'],
            default: 'good'
        }
    },

    // Çerçeve Bilgileri
    frames: {
        total: {
            type: Number,
            required: false,  // Zorunlu olmaktan çıkardık
            min: [1, 'En az 1 çerçeve olmalıdır'],
            default: 10  // Varsayılan değer
        },
        brood: {
            type: Number,
            default: 0,
            min: [0, 'Negatif çerçeve sayısı olamaz']
        },
        honey: {
            type: Number,
            default: 0,
            min: [0, 'Negatif çerçeve sayısı olamaz']
        },
        empty: {
            type: Number,
            default: 0,
            min: [0, 'Negatif çerçeve sayısı olamaz']
        }
    },

    // Sağlık Bilgileri
    health: {
        status: {
            type: String,
            enum: ['healthy', 'sick', 'weak', 'dead'],
            default: 'healthy'
        },
        diseases: [{
            name: {
                type: String,
                enum: ['varroa', 'nosema', 'american-foulbrood', 'european-foulbrood', 'chalkbrood', 'sacbrood']
            },
            severity: {
                type: String,
                enum: ['mild', 'moderate', 'severe']
            },
            detectedDate: Date,
            treatment: String,
            resolved: {
                type: Boolean,
                default: false
            }
        }],
        lastTreatment: {
            type: String,
            date: Date,
            notes: String
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
        honeyType: {
            type: String,
            enum: ['wildflower', 'acacia', 'linden', 'sunflower', 'chestnut', 'pine']
        }
    },

    // Kontrol Kayıtları
    inspections: [{
        date: {
            type: Date,
            required: true
        },
        inspector: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        findings: {
            queenPresent: Boolean,
            broodPattern: {
                type: String,
                enum: ['excellent', 'good', 'poor', 'patchy']
            },
            temperament: {
                type: String,
                enum: ['calm', 'normal', 'defensive', 'aggressive']
            },
            population: {
                type: String,
                enum: ['very-strong', 'strong', 'medium', 'weak', 'very-weak']
            }
        },
        actions: [{
            type: String,
            enum: ['feeding', 'treatment', 'super-added', 'super-removed', 'requeening']
        }],
        notes: String,
        weather: {
            temperature: Number,
            humidity: Number,
            windSpeed: Number,
            conditions: {
                type: String,
                enum: ['sunny', 'cloudy', 'rainy', 'windy']
            }
        }
    }],

    // Notlar
    notes: {
        type: String,
        maxlength: [1000, 'Notlar en fazla 1000 karakter olabilir']
    },

    // Sensör Bilgileri (IoT Integration) - ÇOKLU ROUTER DESTEĞİ
    sensors: [{
        routerId: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        sensorId: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        type: {
            type: String,
            enum: ['environmental', 'gas', 'weight', 'vibration', 'temperature', 'humidity'],
            required: true
        },
        deviceId: {
            type: String, // BT107, BT108, BT109, BT110
            required: true,
            trim: true
        },
        isActive: {
            type: Boolean,
            default: true
        },
        isConnected: {
            type: Boolean,
            default: false
        },
        lastDataReceived: {
            type: Date,
            default: null
        },
        connectionStatus: {
            type: String,
            enum: ['connected', 'disconnected', 'error', 'unknown'],
            default: 'unknown'
        },
        description: String, // "BME280 Environmental Sensor"
        dataTypes: [String] // ["temperature", "humidity", "pressure", "altitude"]
    }],

    // ESKİ SENSOR FİELD (Backward Compatibility)
    sensor: {
        routerId: {
            type: String,
            sparse: true,
            trim: true,
            index: true,
            validate: {
                validator: function (v) {
                    return !v || v.length > 0;
                },
                message: 'Router ID boş olamaz'
            }
        },
        sensorId: {
            type: String,
            sparse: true,
            trim: true,
            index: true,
            validate: {
                validator: function (v) {
                    return !v || v.length > 0;
                },
                message: 'Sensor ID boş olamaz'
            }
        },
        isConnected: {
            type: Boolean,
            default: false
        },
        lastDataReceived: {
            type: Date,
            default: null
        },
        connectionStatus: {
            type: String,
            enum: ['connected', 'disconnected', 'error', 'unknown'],
            default: 'unknown'
        },
        calibrationDate: {
            type: Date,
            default: null
        },
        // Donanım Detayları
        hardwareDetails: {
            coordinatorAddress: {
                type: String,
                default: null
            },
            channel: {
                type: Number,
                default: 23
            },
            routers: [{
                routerId: String,      // 107, 108, 109, 110
                routerType: String,    // 'bmp280', 'mics4514', 'loadcell', 'mq2'
                address: String,       // 41, 52, 66, 58
                sensorIds: [String],   // ['1013'], ['1002'], ['1010'], ['1009']
                dataKeys: [String],    // ['temperature', 'humidity'], ['co2', 'nh3'], etc.
                isActive: {
                    type: Boolean,
                    default: true
                },
                lastSeen: Date
            }]
        }
    },

    // Aktiflik Durumu
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Kovan verimlilik hesaplama
hiveSchema.virtual('productivity').get(function () {
    if (this.production.annualProduction) {
        return this.production.annualProduction;
    }
    return 0;
});

// Son kontrol tarihi
hiveSchema.virtual('lastInspection').get(function () {
    if (this.inspections && this.inspections.length > 0) {
        return this.inspections[this.inspections.length - 1].date;
    }
    return null;
});

// Kovan yaşı hesaplama
hiveSchema.virtual('age').get(function () {
    if (this.createdAt) {
        const diffTime = Math.abs(Date.now() - this.createdAt);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }
    return 0;
});

// Indexes
hiveSchema.index({ apiary: 1, number: 1 }, { unique: true });
hiveSchema.index({ status: 1 });
hiveSchema.index({ 'queen.present': 1 });

module.exports = mongoose.model('Hive', hiveSchema);
