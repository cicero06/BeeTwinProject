/**
 * Router Konfigürasyon Sistemi
 * Kullanıcının manuel olarak girdiği router verilerini işlemek için
 */

// Desteklenen sensör tipleri ve veri anahtarları
const supportedSensorTypes = {
    'BMP280': {
        name: 'BMP280 - Çevresel Sensör',
        supportedKeys: {
            'WT': { parameter: 'temperature', unit: '°C' },
            'PR': { parameter: 'pressure', unit: 'hPa' },
            'WH': { parameter: 'humidity', unit: '%' },
            'AL': { parameter: 'altitude', unit: 'm' }
        },
        defaultParameters: ['temperature', 'pressure', 'humidity', 'altitude']
    },
    'MICS-4514': {
        name: 'MICS-4514 - Hava Kalitesi',
        supportedKeys: {
            'CO': { parameter: 'co', unit: 'ppm' },
            'NO': { parameter: 'no2', unit: 'ppm' }
        },
        defaultParameters: ['co', 'no2']
    },
    'Load Cell': {
        name: 'Load Cell - Ağırlık Sensörü',
        supportedKeys: {
            'WG': { parameter: 'weight', unit: 'kg' }
        },
        defaultParameters: ['weight']
    },
    'MQ2': {
        name: 'MQ2 - Gaz Sensörü',
        supportedKeys: {
            'GS': { parameter: 'gas_level', unit: 'ppm' },
            'CO': { parameter: 'co_level', unit: 'ppm' },
            'LPG': { parameter: 'lpg_level', unit: 'ppm' }
        },
        defaultParameters: ['gas_level', 'co_level', 'lpg_level']
    },
    'DHT22': {
        name: 'DHT22 - Sıcaklık/Nem',
        supportedKeys: {
            'WT': { parameter: 'temperature', unit: '°C' },
            'WH': { parameter: 'humidity', unit: '%' }
        },
        defaultParameters: ['temperature', 'humidity']
    },
    'Custom': {
        name: 'Özel Sensör',
        supportedKeys: {},
        defaultParameters: []
    }
};

// Router verilerini doğrula
function validateRouterData(routerData) {
    const errors = [];

    // Router ID kontrolü
    if (!routerData.routerId) {
        errors.push('Router ID zorunludur');
    } else if (!/^\d+$/.test(routerData.routerId.toString())) {
        errors.push('Router ID sadece sayı olabilir');
    }

    // Sensor ID kontrolü
    if (!routerData.sensorId) {
        errors.push('Sensor ID zorunludur');
    } else if (!/^\d+$/.test(routerData.sensorId.toString())) {
        errors.push('Sensor ID sadece sayı olabilir');
    }

    // Sensör tipi kontrolü
    if (!routerData.sensorType || !supportedSensorTypes[routerData.sensorType]) {
        errors.push('Geçersiz sensör tipi');
    }

    // Router adı kontrolü
    if (!routerData.name || routerData.name.trim().length === 0) {
        errors.push('Router adı zorunludur');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

// Router konfigürasyonunu oluştur
function createRouterConfig(routerData) {
    const validation = validateRouterData(routerData);
    if (!validation.isValid) {
        throw new Error(`Router validation failed: ${validation.errors.join(', ')}`);
    }

    const sensorTypeConfig = supportedSensorTypes[routerData.sensorType];

    return {
        routerId: routerData.routerId.toString(),
        name: routerData.name.trim(),
        description: routerData.description || sensorTypeConfig.name,
        sensors: [{
            sensorId: routerData.sensorId.toString(),
            sensorType: routerData.sensorType,
            dataKeys: Object.entries(sensorTypeConfig.supportedKeys).map(([key, config]) => ({
                key,
                parameter: config.parameter,
                unit: config.unit
            }))
        }],
        sensorType: routerData.sensorType,
        parameters: routerData.parameters || sensorTypeConfig.defaultParameters
    };
}

// Belirli bir router'ın sensör verilerini parse etmek için
function parseRouterData(routerId, dataKey, value) {
    // Bu fonksiyon runtime'da çalışacak
    // Router konfigürasyonu veritabanından gelecek
    return {
        routerId: routerId.toString(),
        dataKey,
        value: parseFloat(value),
        timestamp: new Date()
    };
}

// Desteklenen sensör tiplerini getir
function getSupportedSensorTypes() {
    return Object.keys(supportedSensorTypes).map(key => ({
        key,
        ...supportedSensorTypes[key]
    }));
}

// Belirli bir sensör tipinin desteklediği veri anahtarlarını getir
function getSensorTypeKeys(sensorType) {
    if (!supportedSensorTypes[sensorType]) {
        return null;
    }
    return supportedSensorTypes[sensorType].supportedKeys;
}

module.exports = {
    supportedSensorTypes,
    validateRouterData,
    createRouterConfig,
    parseRouterData,
    getSupportedSensorTypes,
    getSensorTypeKeys
};
