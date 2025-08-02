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

    // Router ID'sine göre sensor types belirle
    getSensorTypesByRouter(routerId) {
        const routerConfigs = {
            '107': ['temperature', 'humidity', 'pressure', 'altitude'], // BME280
            '108': ['gasLevel', 'no2Level', 'co', 'no'],                // MICS-4514
            '109': ['weight', 'temperature', 'humidity'],               // Ağırlık + Çevre
            '110': ['vibration', 'sound', 'temperature'],               // Titreşim + Ses
            '111': ['light', 'uv', 'temperature'],                      // Işık sensörleri
            '112': ['ph', 'moisture', 'temperature']                    // Toprak sensörleri
        };

        return routerConfigs[routerId] || ['temperature', 'humidity']; // Default sensors
    }

    // Wireless veriyi işle (10 dakikada bir gelen)
    async processWirelessData(wirelessData) {
        try {
            console.log('🔄 LoRa Processor başlatıldı...');
            console.log('📥 Gelen veri:', JSON.stringify(wirelessData, null, 2));

            // Eğer string ise parse et
            if (typeof wirelessData === 'string') {
                wirelessData = this.parseLoRaPayload(wirelessData);
                if (!wirelessData) {
                    console.error('❌ Failed to parse wireless data');
                    return null;
                }
            }

            console.log('📡 Processing wireless data:', wirelessData.deviceId);

            // 🎯 Router ID ve Sensor ID'yi al
            const routerId = wirelessData.routerId || wirelessData.deviceId.replace('BT', ''); // Router ID
            const sensorId = wirelessData.sensorId; // Sensor ID
            console.log('🔍 Router ID:', routerId, '- Sensor ID:', sensorId);

            // Hive modelini import et
            const Hive = require('../models/Hive');

            console.log('🔎 Database sorguda...');
            // 🔧 DÜZELTME: Hem eski hem yeni format ile kovan ara
            const query = {
                $or: [
                    // YENİ FORMAT: sensors array'inde ara
                    { 'sensors.routerId': routerId },
                    // ESKİ FORMAT: sensor object'inde ara (backward compatibility)
                    { 'sensor.routerId': routerId }
                ]
            };

            // Eğer sensor ID verilmişse onu da kontrol et
            if (sensorId) {
                query.$or = [
                    {
                        'sensors.routerId': routerId,
                        'sensors.sensorId': sensorId
                    },
                    {
                        'sensor.routerId': routerId,
                        'sensor.sensorId': sensorId
                    }
                ];
            }

            const hive = await Hive.findOne(query).populate('apiary');

            if (!hive) {
                console.error('❌ Router/Sensor ID eşleştirmesi bulunamadı:');
                console.error('   Router ID:', routerId);
                console.error('   Sensor ID:', sensorId);
                console.log('💡 Bu Router/Sensor kombinasyonu hangi kovanla eşleştirilmeli');
                console.log('💡 Migration script çalıştırın: node backend/scripts/migrate-sensors.js');
                return null;
            }

            // Hangi sensor'ın match ettiğini bul
            let matchedSensor = null;
            if (hive.sensors && hive.sensors.length > 0) {
                matchedSensor = hive.sensors.find(s =>
                    s.routerId === routerId && (!sensorId || s.sensorId === sensorId)
                );
            }

            console.log('✅ Kovan bulundu:', hive.name, '→ Router:', routerId, 'Sensor:', sensorId);
            if (matchedSensor) {
                console.log('🎯 Sensor tipi:', matchedSensor.type, '→ DeviceId:', matchedSensor.deviceId);
            }
            console.log('🎯 Arılık:', hive.apiary.name, '→ Sahibi:', hive.apiary.ownerId);

            // Sensörü database'de bul veya oluştur
            let sensor = await Sensor.findOne({
                deviceId: wirelessData.deviceId
            });

            if (!sensor) {
                console.log('📝 Creating new sensor:', wirelessData.deviceId);

                // Router tipine göre sensor types dinamik olarak belirle
                const sensorTypes = this.getSensorTypesByRouter(routerId);

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
            }

            // Son veri ile karşılaştır (anomali tespiti için)
            const lastReading = await SensorReading.findOne({
                sensorId: sensor._id
            }).sort({ timestamp: -1 });

            // SensorReading oluştur
            const readingData = {
                sensorId: sensor._id,
                data: wirelessData.sensorData,
                batteryLevel: wirelessData.batteryLevel,
                signalStrength: wirelessData.signalStrength,
                timestamp: wirelessData.originalTimestamp || wirelessData.receivedAt,
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

        for (const [key, threshold] of Object.entries(thresholds)) {
            if (lastData[key] && currentData[key]) {
                const change = Math.abs(currentData[key] - lastData[key]);
                if (change > threshold) {
                    anomalies.push({
                        parameter: key,
                        change: change,
                        threshold: threshold,
                        lastValue: lastData[key],
                        currentValue: currentData[key]
                    });
                }
            }
        }

        return anomalies;
    }

    // Alert kontrolü (ML sonuçları dahil)
    async checkForAlerts(sensor, reading, mlResults = null) {
        const alerts = [];

        // 🧠 ML-based alerts (öncelik yüksek)
        if (mlResults && mlResults.anomalyDetection && mlResults.anomalyDetection.is_anomaly) {
            const mlAnomaly = mlResults.anomalyDetection;

            alerts.push({
                type: 'ML_ANOMALY_DETECTED',
                message: mlAnomaly.analysis?.summary || 'ML model anomaly detected',
                severity: mlAnomaly.severity || 'medium',
                confidence: mlAnomaly.confidence || 0.5,
                method: 'machine_learning',
                details: mlAnomaly.analysis?.details || []
            });
        }

        // 🧠 ML insights'lardan alerts
        if (mlResults && mlResults.insights) {
            mlResults.insights.forEach(insight => {
                if (insight.severity === 'high' || insight.severity === 'critical') {
                    alerts.push({
                        type: 'ML_INSIGHT',
                        message: insight.message,
                        severity: insight.severity,
                        confidence: insight.confidence || 0.7,
                        method: 'ml_analysis'
                    });
                }
            });
        }

        // 🧠 Trend-based alerts
        if (mlResults && mlResults.trendPrediction && mlResults.trendPrediction.overall_analysis) {
            const trendAnalysis = mlResults.trendPrediction.overall_analysis;

            if (trendAnalysis.alerts && trendAnalysis.alerts.length > 0) {
                trendAnalysis.alerts.forEach(alert => {
                    alerts.push({
                        type: 'TREND_ALERT',
                        message: alert,
                        severity: 'medium',
                        method: 'trend_prediction'
                    });
                });
            }
        }

        // Klasik threshold-based alerts (backward compatibility)
        // Sıcaklık kontrolü
        if (reading.data.temperature) {
            if (reading.data.temperature > 35) {
                alerts.push({
                    type: 'HIGH_TEMPERATURE',
                    message: `Yüksek sıcaklık: ${reading.data.temperature}°C`,
                    severity: 'critical',
                    method: 'threshold'
                });
            } else if (reading.data.temperature < 10) {
                alerts.push({
                    type: 'LOW_TEMPERATURE',
                    message: `Düşük sıcaklık: ${reading.data.temperature}°C`,
                    severity: 'warning',
                    method: 'threshold'
                });
            }
        }

        // Batarya kontrolü
        if (reading.batteryLevel < 20) {
            alerts.push({
                type: 'LOW_BATTERY',
                message: `Düşük batarya: %${reading.batteryLevel}`,
                severity: 'warning',
                method: 'threshold'
            });
        }

        // Klasik anomaly kontrolü
        if (reading.metadata?.basicAnomalies?.some(a => a.parameter === 'weight')) {
            alerts.push({
                type: 'WEIGHT_ANOMALY',
                message: 'Kovan ağırlığında ani değişim tespit edildi',
                severity: 'info',
                method: 'basic_anomaly'
            });
        }

        // Alert'leri işle
        for (const alert of alerts) {
            console.log(`🚨 Alert: ${alert.message}`);

            // WebSocket ile alert gönder
            if (this.io) {
                this.io.emit('sensor-alert', {
                    deviceId: sensor.deviceId,
                    sensorName: sensor.name,
                    ownerId: sensor.ownerId,
                    ...alert,
                    timestamp: new Date()
                });
            }
        }
    }

    // LoRa payload'ını parse et
    parseLoRaPayload(rawData) {
        // LoRa gateway'den gelen format'a göre ayarla
        // Örnek format:
        try {
            // HEX string'i parse et
            if (typeof rawData === 'string') {
                // BT format: "BT001:25.5,65.2,45.8:85:-65"
                // COORD format: "COORD_001:26.5,67.2,46.8,0.87:88:-68"
                const [deviceId, sensorValues, battery, rssi] = rawData.split(':');
                const sensorParts = sensorValues.split(',');

                let sensorData;
                if (sensorParts.length === 3) {
                    // BT format (3 değer)
                    const [temperature, humidity, weight] = sensorParts;
                    sensorData = {
                        temperature: parseFloat(temperature),
                        humidity: parseFloat(humidity),
                        weight: parseFloat(weight)
                    };
                } else if (sensorParts.length === 4) {
                    // COORD format (4 değer)
                    const [temperature, humidity, weight, gasLevel] = sensorParts;
                    sensorData = {
                        temperature: parseFloat(temperature),
                        humidity: parseFloat(humidity),
                        weight: parseFloat(weight),
                        gasLevel: parseFloat(gasLevel)
                    };
                } else {
                    console.error('❌ Invalid sensor data format:', sensorValues);
                    return null;
                }

                return {
                    deviceId: deviceId,
                    sensorData: sensorData,
                    batteryLevel: parseInt(battery),
                    rssi: parseInt(rssi)
                };
            }

            // JSON format
            if (typeof rawData === 'object') {
                return {
                    deviceId: rawData.device_id,
                    sensorData: rawData.payload,
                    batteryLevel: rawData.battery,
                    rssi: rawData.rssi
                };
            }

        } catch (error) {
            console.error('❌ Payload parse error:', error);
            throw error;
        }
    }
}

module.exports = LoRaDataProcessor;
