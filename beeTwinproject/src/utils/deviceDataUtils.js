/**
 * Device ID Merkezli Veri Yönetim Utility'leri
 * BT107, BT108, BT109, BT110 cihazları için standardize edilmiş veri işleme
 */

/**
 * Device ID'ye göre sensor verilerini filtreler
 * @param {Array} sensorData - Ham sensor verileri
 * @param {string} deviceId - Device ID (BT107, BT108, vb.)
 * @param {Array} userHiveIds - Kullanıcının kovan ID'leri (opsiyonel)
 * @returns {Array} Filtrelenmiş sensor verileri
 */
export const getDeviceSensorData = (sensorData, deviceId, userHiveIds = []) => {
    if (!sensorData || !Array.isArray(sensorData) || !deviceId) {
        console.log('❌ getDeviceSensorData - Invalid input:', { sensorData: !!sensorData, deviceId });
        return [];
    }

    console.log(`🔍 Filtering for device ${deviceId}:`, {
        totalData: sensorData.length,
        userHiveIds: userHiveIds.length,
        sampleData: sensorData.slice(0, 2)
    });

    const filteredData = sensorData.filter(data => {
        // Debug: Ham veri yapısı
        console.log(`🔍 Raw data sample:`, data);

        // Device ID kontrolü - birden fazla format destekle
        const isTargetDevice =
            // Tam device ID eşleşmesi (BT107)
            data.deviceId === deviceId ||
            data.device_id === deviceId ||
            // Router ID eşleşmesi (107 -> BT107)
            data.routerId === deviceId.replace('BT', '') ||
            data.router_id === deviceId.replace('BT', '') ||
            // Alternatif formatlar
            `BT${data.routerId}` === deviceId ||
            `BT${data.router_id}` === deviceId ||
            data.deviceId === deviceId.replace('BT', '') ||
            data.device_id === deviceId.replace('BT', '');

        console.log(`🔍 ${deviceId} check for data:`, {
            deviceId: data.deviceId,
            device_id: data.device_id,
            routerId: data.routerId,
            router_id: data.router_id,
            isTargetDevice,
            expectedDeviceId: deviceId,
            expectedRouterId: deviceId.replace('BT', '')
        });

        // Kullanıcı kovan kontrolü (opsiyonel)
        if (userHiveIds.length > 0) {
            const isUserHive = !data.hiveId ||
                userHiveIds.includes(data.hiveId) ||
                userHiveIds.includes(data.hive_id);
            return isTargetDevice && isUserHive;
        }

        return isTargetDevice;
    });

    console.log(`✅ ${deviceId} filtered result:`, filteredData.length, 'items');
    return filteredData;
};

/**
 * Device'ın son sensor verilerini alır
 * @param {Array} sensorData - Ham sensor verileri
 * @param {string} deviceId - Device ID
 * @param {Array} userHiveIds - Kullanıcının kovan ID'leri
 * @returns {Object|null} Son sensor verisi
 */
export const getLatestDeviceData = (sensorData, deviceId, userHiveIds = []) => {
    const deviceData = getDeviceSensorData(sensorData, deviceId, userHiveIds);

    if (deviceData.length === 0) {
        return null;
    }

    // En son veriyi al
    return deviceData[deviceData.length - 1];
};

/**
 * Device için belirli sensör tipindeki verileri alır
 * @param {Array} sensorData - Ham sensor verileri
 * @param {string} deviceId - Device ID
 * @param {string} sensorType - Sensor tipi (temperature, humidity, co2, vb.)
 * @param {Array} userHiveIds - Kullanıcının kovan ID'leri
 * @returns {Array} Sensor değerleri
 */
export const getDeviceSensorValues = (sensorData, deviceId, sensorType, userHiveIds = []) => {
    const deviceData = getDeviceSensorData(sensorData, deviceId, userHiveIds);

    return deviceData
        .map(data => data.parameters?.[sensorType] || data[sensorType])
        .filter(value => value !== null && value !== undefined);
};

/**
 * Device'ın online durumunu kontrol eder
 * @param {Array} sensorData - Ham sensor verileri
 * @param {string} deviceId - Device ID
 * @param {number} timeoutMinutes - Timeout süresi (dakika)
 * @returns {boolean} Device online durumu
 */
export const isDeviceOnline = (sensorData, deviceId, timeoutMinutes = 5) => {
    const latestData = getLatestDeviceData(sensorData, deviceId);

    if (!latestData || !latestData.timestamp) {
        return false;
    }

    const lastSeen = new Date(latestData.timestamp);
    const timeoutThreshold = new Date(Date.now() - (timeoutMinutes * 60 * 1000));

    return lastSeen > timeoutThreshold;
};

/**
 * Device konfigürasyonları
 * Her device için sensor tipleri ve özellikleri
 */
export const DEVICE_CONFIGS = {
    BT107: {
        name: "Router 107",
        sensorType: "BME280",
        description: "Çevresel Sensör",
        sensors: ['temperature', 'humidity', 'pressure'],
        icon: "🌡️",
        color: "blue",
        optimalRanges: {
            temperature: { min: 20, max: 35 },
            humidity: { min: 40, max: 80 },
            pressure: { min: 101000, max: 102000 }
        }
    },
    BT108: {
        name: "Router 108",
        sensorType: "MICS-4514",
        description: "Hava Kalitesi Sensörü",
        sensors: ['co', 'no2'],
        icon: "🌬️",
        color: "green",
        optimalRanges: {
            co: { min: 0, max: 1000 },
            no2: { min: 0, max: 50 }
        }
    },
    BT109: {
        name: "Router 109",
        sensorType: "Weight",
        description: "Ağırlık Sensörü",
        sensors: ['weight'],
        icon: "⚖️",
        color: "purple",
        optimalRanges: {
            weight: { min: 15, max: 40 }
        }
    },
    BT110: {
        name: "Router 110",
        sensorType: "MQ2",
        description: "Gaz Sensörü",
        sensors: ['mq2', 'gas'],
        icon: "🔥",
        color: "red",
        optimalRanges: {
            mq2: { min: 0, max: 1000 },
            gas: { min: 0, max: 1000 }
        }
    }
};

/**
 * Device konfigürasyonunu alır
 * @param {string} deviceId - Device ID
 * @returns {Object} Device konfigürasyonu
 */
export const getDeviceConfig = (deviceId) => {
    return DEVICE_CONFIGS[deviceId] || null;
};

/**
 * Tüm kullanılabilir device'ları listeler
 * @returns {Array} Device ID'leri
 */
export const getAvailableDevices = () => {
    return Object.keys(DEVICE_CONFIGS);
};

/**
 * Device için chart verisi hazırlar
 * @param {Array} sensorData - Ham sensor verileri
 * @param {string} deviceId - Device ID  
 * @param {string} sensorType - Sensor tipi
 * @param {number} dataPoints - Veri noktası sayısı
 * @returns {Object} Chart verisi
 */
export const prepareDeviceChartData = (sensorData, deviceId, sensorType, dataPoints = 10) => {
    const deviceData = getDeviceSensorData(sensorData, deviceId);
    const config = getDeviceConfig(deviceId);

    // Son N veriyi al
    const recentData = deviceData.slice(-dataPoints);

    const labels = recentData.map((_, index) => `${dataPoints - index} dk önce`).reverse();
    const values = recentData.map(data => data.parameters?.[sensorType] || data[sensorType] || 0);

    return {
        labels,
        datasets: [{
            label: `${config?.name || deviceId} ${sensorType}`,
            data: values,
            borderColor: `var(--color-${config?.color || 'blue'}-500)`,
            backgroundColor: `var(--color-${config?.color || 'blue'}-100)`,
        }]
    };
};

/**
 * Device durumu özeti
 * @param {Array} sensorData - Ham sensor verileri
 * @param {string} deviceId - Device ID
 * @returns {Object} Device durum özeti
 */
export const getDeviceStatusSummary = (sensorData, deviceId) => {
    const config = getDeviceConfig(deviceId);
    const latestData = getLatestDeviceData(sensorData, deviceId);
    const isOnline = isDeviceOnline(sensorData, deviceId);

    if (!latestData) {
        return {
            deviceId,
            name: config?.name || deviceId,
            status: 'offline',
            isOnline: false,
            lastSeen: null,
            sensors: {}
        };
    }

    const sensors = {};
    config?.sensors.forEach(sensorType => {
        const value = latestData.parameters?.[sensorType] || latestData[sensorType];
        const range = config.optimalRanges[sensorType];

        let status = 'normal';
        if (range && value !== null && value !== undefined) {
            if (value < range.min || value > range.max) {
                status = 'warning';
            }
        }

        sensors[sensorType] = {
            value,
            status,
            range
        };
    });

    return {
        deviceId,
        name: config?.name || deviceId,
        status: isOnline ? 'online' : 'offline',
        isOnline,
        lastSeen: latestData.timestamp,
        sensors
    };
};
