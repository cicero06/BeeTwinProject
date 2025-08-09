const Hive = require('../models/Hive');
const SensorReading = require('../models/SensorReading');

/**
 * Koordinatör Eşleştirme Servisi
 * 
 * Koordinatörden gelen router ve sensör verilerini 
 * kayıtlı kovanlarla eşleştirir ve dashboard'da 
 * doğru bilgilerin gösterilmesini sağlar.
 */

class CoordinatorMatchingService {
    
    /**
     * Koordinatörden gelen veriyi kayıtlı kovanlarla eşleştir
     * @param {Object} coordinatorData - Koordinatörden gelen ham veri
     * @returns {Object} Eşleştirme sonucu
     */
    static async matchCoordinatorData(coordinatorData) {
        try {
            console.log('🔍 Koordinatör verisi eşleştiriliyor:', coordinatorData);

            const {
                coordinatorAddress,
                timestamp,
                routers = []
            } = coordinatorData;

            const matchResults = [];
            const unmatchedRouters = [];

            // Her router için eşleştirme yap
            for (const routerData of routers) {
                const {
                    routerId,
                    routerType,
                    address,
                    sensors = [],
                    data = {}
                } = routerData;

                console.log(`🔧 Router işleniyor: ${routerId} (${routerType})`);

                // Router ID ile eşleşen kovanları bul
                const matchingHives = await Hive.find({
                    $or: [
                        { 'sensor.routerId': routerId },
                        { 'sensors.routerId': routerId },
                        { 'sensor.hardwareDetails.routers.routerId': routerId }
                    ]
                }).populate('apiary', 'name location ownerId');

                if (matchingHives.length > 0) {
                    // Eşleşen kovanlar bulundu
                    for (const hive of matchingHives) {
                        const matchResult = {
                            hiveId: hive._id,
                            hiveName: hive.name,
                            apiaryName: hive.apiary?.name,
                            ownerId: hive.apiary?.ownerId,
                            routerId,
                            routerType,
                            routerAddress: address,
                            coordinatorAddress,
                            matchedSensors: [],
                            receivedData: data,
                            timestamp: new Date(timestamp),
                            status: 'matched'
                        };

                        // Sensör eşleştirmesi
                        for (const sensorData of sensors) {
                            const sensorMatch = await this.matchSensorData(hive, sensorData);
                            if (sensorMatch) {
                                matchResult.matchedSensors.push(sensorMatch);
                            }
                        }

                        matchResults.push(matchResult);

                        // Kovan bağlantı durumunu güncelle
                        await this.updateHiveConnectionStatus(hive._id, routerId, {
                            isConnected: true,
                            lastDataReceived: new Date(timestamp),
                            connectionStatus: 'connected'
                        });
                    }
                } else {
                    // Eşleşmeyen router
                    unmatchedRouters.push({
                        routerId,
                        routerType,
                        address,
                        reason: 'no_matching_hive',
                        sensors: sensors.length,
                        timestamp: new Date(timestamp)
                    });
                    
                    console.log(`⚠️ Eşleşmeyen router: ${routerId} (${routerType})`);
                }
            }

            // Sonucu döndür
            return {
                success: true,
                coordinatorAddress,
                timestamp: new Date(timestamp),
                totalRouters: routers.length,
                matchedRouters: matchResults.length,
                unmatchedRouters: unmatchedRouters.length,
                matches: matchResults,
                unmatched: unmatchedRouters
            };

        } catch (error) {
            console.error('❌ Koordinatör eşleştirme hatası:', error);
            return {
                success: false,
                error: error.message,
                timestamp: new Date()
            };
        }
    }

    /**
     * Sensör verilerini eşleştir
     * @param {Object} hive - Kovan modeli
     * @param {Object} sensorData - Sensör verisi
     * @returns {Object|null} Eşleştirme sonucu
     */
    static async matchSensorData(hive, sensorData) {
        try {
            const { sensorId, type, value, unit } = sensorData;

            // Kovanın sensörleri arasında eşleşme ara
            let matchedSensor = null;

            // Yeni çoklu sensör sisteminde ara
            if (hive.sensors && hive.sensors.length > 0) {
                matchedSensor = hive.sensors.find(s => s.sensorId === sensorId);
            }

            // Eski sensör sisteminde ara (backward compatibility)
            if (!matchedSensor && hive.sensor?.sensorId === sensorId) {
                matchedSensor = {
                    sensorId: hive.sensor.sensorId,
                    type: hive.sensor.type || type,
                    deviceId: hive.sensor.deviceId
                };
            }

            if (matchedSensor) {
                return {
                    sensorId,
                    registeredType: matchedSensor.type,
                    receivedType: type,
                    value,
                    unit,
                    deviceId: matchedSensor.deviceId,
                    status: 'matched'
                };
            }

            return null;

        } catch (error) {
            console.error('❌ Sensör eşleştirme hatası:', error);
            return null;
        }
    }

    /**
     * Kovan bağlantı durumunu güncelle
     * @param {String} hiveId - Kovan ID'si
     * @param {String} routerId - Router ID'si
     * @param {Object} connectionInfo - Bağlantı bilgileri
     */
    static async updateHiveConnectionStatus(hiveId, routerId, connectionInfo) {
        try {
            const updateQuery = {
                $set: {
                    'sensor.isConnected': connectionInfo.isConnected,
                    'sensor.lastDataReceived': connectionInfo.lastDataReceived,
                    'sensor.connectionStatus': connectionInfo.connectionStatus
                }
            };

            // Çoklu sensör sisteminde de güncelle
            const hive = await Hive.findById(hiveId);
            if (hive && hive.sensors) {
                const sensorIndex = hive.sensors.findIndex(s => s.routerId === routerId);
                if (sensorIndex >= 0) {
                    updateQuery.$set[`sensors.${sensorIndex}.isConnected`] = connectionInfo.isConnected;
                    updateQuery.$set[`sensors.${sensorIndex}.lastDataReceived`] = connectionInfo.lastDataReceived;
                    updateQuery.$set[`sensors.${sensorIndex}.connectionStatus`] = connectionInfo.connectionStatus;
                }
            }

            await Hive.findByIdAndUpdate(hiveId, updateQuery);
            
            console.log(`✅ Kovan ${hiveId} bağlantı durumu güncellendi: ${connectionInfo.connectionStatus}`);

        } catch (error) {
            console.error('❌ Kovan bağlantı durumu güncelleme hatası:', error);
        }
    }

    /**
     * Kullanıcının kovalarının eşleştirme durumunu getir
     * @param {String} userId - Kullanıcı ID'si
     * @returns {Object} Eşleştirme durumu özeti
     */
    static async getUserHiveMatchingStatus(userId) {
        try {
            // Kullanıcının tüm kovanlarını getir
            const hives = await Hive.find({})
                .populate({
                    path: 'apiary',
                    match: { ownerId: userId },
                    select: 'name location ownerId'
                })
                .exec();

            // Sadece kullanıcının kovanlarını filtrele
            const userHives = hives.filter(hive => hive.apiary);

            const status = {
                totalHives: userHives.length,
                connectedHives: 0,
                disconnectedHives: 0,
                errorHives: 0,
                unknownHives: 0,
                hiveDetails: []
            };

            for (const hive of userHives) {
                const hiveStatus = this.getHiveConnectionStatus(hive);
                
                // Sayaçları güncelle
                switch (hiveStatus.connectionStatus) {
                    case 'connected':
                        status.connectedHives++;
                        break;
                    case 'disconnected':
                        status.disconnectedHives++;
                        break;
                    case 'error':
                        status.errorHives++;
                        break;
                    default:
                        status.unknownHives++;
                }

                status.hiveDetails.push(hiveStatus);
            }

            return status;

        } catch (error) {
            console.error('❌ Kullanıcı kovan eşleştirme durumu hatası:', error);
            return {
                error: error.message,
                totalHives: 0,
                connectedHives: 0,
                disconnectedHives: 0,
                errorHives: 0,
                unknownHives: 0,
                hiveDetails: []
            };
        }
    }

    /**
     * Kovan bağlantı durumunu analiz et
     * @param {Object} hive - Kovan modeli
     * @returns {Object} Bağlantı durumu detayları
     */
    static getHiveConnectionStatus(hive) {
        const now = new Date();
        const connectionTimeout = 5 * 60 * 1000; // 5 dakika

        // Önce yeni sensör sistemini kontrol et
        if (hive.sensors && hive.sensors.length > 0) {
            const connectedSensors = hive.sensors.filter(s => s.isConnected);
            const recentSensors = hive.sensors.filter(s => 
                s.lastDataReceived && (now - new Date(s.lastDataReceived)) < connectionTimeout
            );

            return {
                hiveId: hive._id,
                hiveName: hive.name,
                apiaryName: hive.apiary?.name,
                connectionStatus: connectedSensors.length > 0 ? 'connected' : 'disconnected',
                totalSensors: hive.sensors.length,
                connectedSensors: connectedSensors.length,
                recentSensors: recentSensors.length,
                lastDataReceived: hive.sensors.reduce((latest, sensor) => {
                    if (!sensor.lastDataReceived) return latest;
                    const sensorTime = new Date(sensor.lastDataReceived);
                    return !latest || sensorTime > latest ? sensorTime : latest;
                }, null),
                routerIds: hive.sensors.map(s => s.routerId),
                sensorIds: hive.sensors.map(s => s.sensorId)
            };
        }

        // Eski sensör sistemini kontrol et (backward compatibility)
        if (hive.sensor) {
            const isRecent = hive.sensor.lastDataReceived && 
                (now - new Date(hive.sensor.lastDataReceived)) < connectionTimeout;

            return {
                hiveId: hive._id,
                hiveName: hive.name,
                apiaryName: hive.apiary?.name,
                connectionStatus: hive.sensor.connectionStatus || 'unknown',
                isConnected: hive.sensor.isConnected,
                isRecent,
                lastDataReceived: hive.sensor.lastDataReceived,
                routerId: hive.sensor.routerId,
                sensorId: hive.sensor.sensorId
            };
        }

        // Sensör bilgisi yok
        return {
            hiveId: hive._id,
            hiveName: hive.name,
            apiaryName: hive.apiary?.name,
            connectionStatus: 'no_sensor',
            message: 'Bu kovan için sensör kaydı bulunamadı'
        };
    }

    /**
     * Koordinatör verisi simüle et (test amaçlı)
     * @param {String} coordinatorAddress - Koordinatör adresi
     * @returns {Object} Simüle koordinatör verisi
     */
    static generateMockCoordinatorData(coordinatorAddress = "192.168.1.100") {
        return {
            coordinatorAddress,
            timestamp: new Date().toISOString(),
            routers: [
                {
                    routerId: "TEST_BMP280_001",
                    routerType: "BMP280",
                    address: "41",
                    sensors: [
                        { sensorId: "BMP_TEMP_001", type: "temperature", value: 34.5, unit: "°C" },
                        { sensorId: "BMP_PRES_001", type: "pressure", value: 1013.25, unit: "hPa" }
                    ],
                    data: {
                        temperature: 34.5,
                        pressure: 1013.25,
                        altitude: 123.4
                    }
                },
                {
                    routerId: "TEST_MICS_001",
                    routerType: "MICS-4514",
                    address: "52",
                    sensors: [
                        { sensorId: "MICS_NO2_001", type: "air_quality", value: 0.05, unit: "ppm" }
                    ],
                    data: {
                        no2: 0.05,
                        co: 0.02
                    }
                }
            ]
        };
    }
}

module.exports = CoordinatorMatchingService;
