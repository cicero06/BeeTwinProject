const SensorReading = require('../models/SensorReading');
const Sensor = require('../models/Sensor');
const mongoose = require('mongoose');
const { broadcastSensorData } = require('./websocket');
const MLProcessor = require('./mlProcessor');

// LoRa verisi işleme sınıfı
class LoRaDataProcessor {
    constructor(io) {
        this.io = io; // WebSocket instance
        this.mlProcessor = new MLProcessor(); // 🧠 ML Processor entegrasyonu
    }

    // Router ID'sine göre sensor types belirle - GÜNCEL TEST KOVALI
    getSensorTypesByRouter(routerId) {
        const routerConfigs = {
            // AKTIF ÇALIŞAN ROUTERLAR
            '107': ['temperature', 'humidity', 'pressure', 'altitude'], // BMP280 - Router 107, Sensor 1013
            '108': ['co', 'no2'],                           // MICS-4514 - Router 108, Sensor 1002

            // GELECEKTE EKLENECEKLERİ (HAZIR OLSUN)
            '109': ['weight', 'load'],                       // Load Sensor - Router 109, Sensor 1010  
            '110': ['gas', 'smoke', 'lpg']                   // MQ2 Gas - Router 110, Sensor 1009
        };

        return routerConfigs[routerId] || ['temperature', 'humidity']; // Default sensors
    }

    // 🎯 PERMANENT SOLUTION: Router configuration auto-update
    async ensureRouterConfiguration(hive, routerId, sensorId) {
        try {
            const Hive = require('../models/Hive');

            // Router configuration mapping
            const routerTypeMap = {
                '107': { type: 'bmp280', address: '41', sensorIds: ['1013'], dataKeys: ['temperature', 'humidity', 'pressure'] },
                '108': { type: 'mics4514', address: '52', sensorIds: ['1002'], dataKeys: ['co', 'no2'] },
                '109': { type: 'loadcell', address: '66', sensorIds: ['1010'], dataKeys: ['weight', 'load'] },
                '110': { type: 'mq2', address: '58', sensorIds: ['1009'], dataKeys: ['gas', 'smoke', 'lpg'] }
            };

            const routerConfig = routerTypeMap[routerId];
            if (!routerConfig) {
                console.log('⚠️ Unknown router ID:', routerId);
                return;
            }

            // Check if hardwareDetails exists and if this router is already configured
            const existingRouter = hive.hardwareDetails?.routers?.find(r => r.routerId === routerId);

            if (!existingRouter) {
                console.log('🔧 Adding router configuration to hive:', routerId);

                // Initialize hardwareDetails structure if needed
                const updateData = {
                    $push: {
                        'hardwareDetails.routers': {
                            routerId: routerId,
                            routerType: routerConfig.type,
                            address: routerConfig.address,
                            sensorIds: routerConfig.sensorIds,
                            dataKeys: routerConfig.dataKeys,
                            isActive: true,
                            lastSeen: new Date()
                        }
                    }
                };

                // If hardwareDetails structure doesn't exist, initialize it
                if (!hive.hardwareDetails) {
                    updateData.$set = {
                        'hardwareDetails': {
                            coordinatorAddress: null,
                            channel: 23,
                            routers: [{
                                routerId: routerId,
                                routerType: routerConfig.type,
                                address: routerConfig.address,
                                sensorIds: routerConfig.sensorIds,
                                dataKeys: routerConfig.dataKeys,
                                isActive: true,
                                lastSeen: new Date()
                            }]
                        }
                    };
                    delete updateData.$push; // Remove push operation if we're setting the whole structure
                }

                await Hive.findByIdAndUpdate(hive._id, updateData);
                console.log('✅ Router configuration added:', routerId, '→ Type:', routerConfig.type);
            } else {
                // Update lastSeen for existing router
                await Hive.findOneAndUpdate(
                    {
                        _id: hive._id,
                        'hardwareDetails.routers.routerId': routerId
                    },
                    {
                        $set: {
                            'hardwareDetails.routers.$.lastSeen': new Date(),
                            'hardwareDetails.routers.$.isActive': true
                        }
                    }
                );
            }

        } catch (error) {
            console.error('❌ Router configuration error:', error.message);
        }
    }

    // Sensör var olup olmadığını kontrol et ve gerekirse oluştur
    async ensureSensorExists(wirelessData, hive, routerId, sensorId) {
        try {
            // Device ID ile sensor ara
            let sensor = await Sensor.findOne({ deviceId: wirelessData.deviceId });

            if (sensor) {
                console.log('✅ Existing sensor found:', sensor.deviceId, 'Router:', routerId);
                return sensor;
            }

            // Sensör tipi belirle
            const sensorTypes = this.getSensorTypesByRouter(routerId);

            if (!hive || !hive.apiary) {
                console.log('⚠️ Creating basic sensor without hive association for device:', wirelessData.deviceId);

                // Geçici test kullanıcısı bilgileri
                const testUserId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');
                const testApiaryId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439022');

                sensor = await Sensor.create({
                    deviceId: wirelessData.deviceId,
                    name: `Test Sensor - ${wirelessData.deviceId}`,
                    ownerId: testUserId,
                    apiaryId: testApiaryId,
                    sensorTypes: sensorTypes,
                    status: 'active',
                    batteryLevel: wirelessData.batteryLevel || 85
                });
                console.log('✅ Test sensor created:', sensor.deviceId, 'Router:', routerId, 'Types:', sensorTypes);
                return sensor;
            }

            // Gerçek kovan bilgileri ile sensör oluştur
            sensor = await Sensor.create({
                deviceId: wirelessData.deviceId,
                name: `${hive.name} - ${wirelessData.deviceId}`,
                ownerId: hive.apiary.ownerId, // 🎯 GERÇEK KULLANICI ID
                apiaryId: hive.apiary._id,    // 🎯 GERÇEK ARILIK ID
                sensorTypes: sensorTypes,
                status: 'active',
                batteryLevel: wirelessData.batteryLevel || 85
            });
            console.log('✅ New sensor created with real owner:', sensor.deviceId, 'Router:', routerId, 'Types:', sensorTypes);

            return sensor;

        } catch (error) {
            console.error('❌ Sensor creation error:', error.message);
            console.error('Error details:', error.stack);
            return null;
        }
    }

    // Wireless veriyi işle
    async processWirelessData(wirelessData) {
        try {
            console.log('📡 Processing wireless data:', wirelessData.deviceId);

            // Device ID'den router ID çıkar (BT107 → 107)
            const routerId = wirelessData.deviceId.replace('BT', '');

            // Koordinatör sistemde hive araması
            const Hive = require('../models/Hive');
            const hive = await Hive.findOne({
                'hardwareDetails.routers.routerId': routerId
            }).populate('apiary');

            // Hive varsa router configuration'ı güncelle
            if (hive) {
                await this.ensureRouterConfiguration(hive, routerId, '1013'); // Default sensor ID
            }

            // Sensör var olup olmadığını kontrol et
            const sensor = await this.ensureSensorExists(wirelessData, hive, routerId, '1013');
            if (!sensor) {
                console.log('❌ Sensor creation failed for:', wirelessData.deviceId);
                return null;
            }

            // Son veri ile karşılaştır (anomali tespiti için)
            const lastReading = await SensorReading.findOne({
                sensorId: sensor._id
            }).sort({ timestamp: -1 });

            // SensorReading oluştur (Battery ve Signal Strength eklendi)
            const readingData = {
                sensorId: sensor._id,
                data: wirelessData.sensorData,
                timestamp: wirelessData.originalTimestamp || wirelessData.receivedAt,
                batteryLevel: wirelessData.batteryLevel,   // 🔋 Coordinator'dan gelen
                signalStrength: wirelessData.signalStrength, // 📶 Coordinator'dan gelen
                metadata: {
                    receivedAt: wirelessData.receivedAt,
                    dataInterval: '10min',
                    source: 'wireless'
                }
            };

            // 🧠 ML Analysis - Gelişmiş analiz
            const historicalData = await this.mlProcessor.getHistoricalData(wirelessData.deviceId, 30);
            const mlResults = await this.mlProcessor.analyzeData({
                deviceId: wirelessData.deviceId,
                sensorData: wirelessData.sensorData,
                historicalData: historicalData
            });

            // ML sonuçlarını metadata'ya ekle
            readingData.metadata.mlAnalysis = mlResults;

            // Klasik anomali tespiti (backward compatibility)
            if (lastReading) {
                const basicAnomalies = this.detectAnomalies(lastReading.data, wirelessData.sensorData);
                if (basicAnomalies.length > 0) {
                    readingData.metadata.basicAnomalies = basicAnomalies;
                    console.log('⚠️ Basic anomalies detected:', basicAnomalies);
                }
            }

            // Database'e kaydet
            const savedReading = await SensorReading.create(readingData);
            console.log('💾 Wireless sensor reading saved:', savedReading._id);

            // Sensör bilgilerini güncelle
            await Sensor.findByIdAndUpdate(sensor._id, {
                batteryLevel: wirelessData.batteryLevel,
                lastSeen: wirelessData.receivedAt,
                status: wirelessData.batteryLevel > 20 ? 'active' : 'low_battery'
            });

            // Alert kontrolü (ML sonuçları dahil)
            await this.checkForAlerts(sensor, savedReading, mlResults);

            // WebSocket ile frontend'e gönder (ML insights dahil)
            broadcastSensorData(this.io, {
                ...savedReading.toObject(),
                ownerId: sensor.ownerId,
                sensorName: sensor.name,
                deviceId: sensor.deviceId,
                mlInsights: mlResults // 🧠 ML sonuçları frontend'e
            });

            return savedReading;

        } catch (error) {
            console.error('❌ Wireless data processing error:', error.message);
            console.error('📋 Error stack:', error.stack);
            console.error('🔍 Error details:', {
                name: error.name,
                message: error.message,
                deviceId: wirelessData?.deviceId,
                routerId: wirelessData?.deviceId?.replace('BT', '')
            });
            return null;
        }
    }

    // Anomali tespiti
    detectAnomalies(lastData, currentData) {
        const anomalies = [];
        const thresholds = {
            temperature: 10, // 10°C ani değişim
            humidity: 30,    // 30% ani değişim
            weight: 5        // 5kg ani değişim
        };

        for (const [key, value] of Object.entries(currentData)) {
            if (lastData[key] !== undefined && typeof value === 'number') {
                const diff = Math.abs(value - lastData[key]);
                const threshold = thresholds[key] || 50; // Default threshold

                if (diff > threshold) {
                    anomalies.push({
                        field: key,
                        previousValue: lastData[key],
                        currentValue: value,
                        difference: diff,
                        threshold: threshold
                    });
                }
            }
        }

        return anomalies;
    }

    // Alert kontrolü
    async checkForAlerts(sensor, reading, mlResults = null) {
        // Implementation here
    }

    // Raw LoRa payload parse
    parseLoRaPayload(rawData) {
        try {
            // Hex string kontrolü
            if (typeof rawData === 'string' && /^[0-9A-Fa-f]+$/.test(rawData)) {
                const buffer = Buffer.from(rawData, 'hex');
                return this.parseByteArray(buffer);
            }

            return null;
        } catch (error) {
            console.error('❌ LoRa payload parse error:', error.message);
            return null;
        }
    }

    // Text format parse
    parseTextFormat(rawData) {
        try {
            console.log('🔍 Parsing text format:', rawData);

            if (!rawData || typeof rawData !== 'string') {
                console.log('❌ Invalid text data format');
                return null;
            }

            // Format: "RID:107 SID:1013 WT:25.50 PR:1013.25 WH:65.00"
            const parts = rawData.split(' ').filter(part => part.trim().length > 0);

            if (parts.length < 3) {
                console.log('❌ Insufficient data parts:', parts.length);
                return null;
            }

            // RID parse et
            const ridPart = parts[0].trim(); // "RID:107"
            const routerId = ridPart.split(':')[1].trim(); // "107"

            // SID parse et
            const sidPart = parts[1].trim(); // " SID:1013"
            const sensorId = sidPart.split(':')[1].trim(); // "1013"

            // Data parse et
            const sensorData = {};
            for (let i = 2; i < parts.length; i++) {
                const dataPart = parts[i].trim();
                if (dataPart.includes(':')) {
                    const [key, value] = dataPart.split(':');
                    const numValue = parseFloat(value);
                    if (!isNaN(numValue)) {
                        sensorData[key] = numValue;
                    }
                }
            }

            // Device ID oluştur
            const deviceId = `BT${routerId}`;

            const result = {
                deviceId: deviceId,
                routerId: routerId,
                sensorId: sensorId,
                sensorData: sensorData,
                receivedAt: new Date(),
                originalTimestamp: new Date(),
                batteryLevel: 85, // Default
                signalStrength: -70 // Default
            };

            console.log('✅ Text format parsed successfully:', result);
            return result;

        } catch (error) {
            console.error('❌ Text format parse error:', error.message);
            return null;
        }
    }
}

module.exports = LoRaDataProcessor;
