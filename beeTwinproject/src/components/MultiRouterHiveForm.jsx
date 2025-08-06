import React, { useState } from 'react';

/**
 * Dinamik Router Kovan Kayıt Formu
 * Her kullanıcı ve kovan için benzersiz Router ID'leri oluşturur
 */
const MultiRouterHiveForm = ({ apiaries, setApiaries, userId }) => {
    const [expandedApiary, setExpandedApiary] = useState(null);
    const [expandedHive, setExpandedHive] = useState(null);
    const [expandedRouter, setExpandedRouter] = useState(null);

    // Benzersiz Router ID üretici
    const generateUniqueRouterId = (userId, apiaryIndex, hiveIndex, routerIndex) => {
        // Format: U{userId}A{apiaryIndex}H{hiveIndex}R{routerIndex}
        const shortUserId = userId.slice(-4); // Son 4 karakter
        return `${100 + apiaryIndex * 20 + hiveIndex * 4 + routerIndex}`; // 100, 101, 102, 103, 104, 105, etc.
    };

    // Benzersiz Sensor ID üretici  
    const generateUniqueSensorId = (routerId) => {
        return `${parseInt(routerId) + 1000}`; // Router 100 → Sensor 1100
    };

    // Standard router tipleri - DİNAMİK ID'ler
    const getStandardRouters = (userId, apiaryIndex, hiveIndex) => [
        {
            id: 'router-1',
            name: 'Router 1 - BMP280',
            type: 'bmp280',
            description: 'Sıcaklık, Basınç, Nem, Yükseklik Sensörü',
            address: '41',
            routerId: generateUniqueRouterId(userId, apiaryIndex, hiveIndex, 0),
            sensorId: generateUniqueSensorId(generateUniqueRouterId(userId, apiaryIndex, hiveIndex, 0)),
            sensors: [
                { id: 'temp', name: 'Sıcaklık', unit: '°C' },
                { id: 'pressure', name: 'Basınç', unit: 'hPa' },
                { id: 'humidity', name: 'Nem', unit: '%' },
                { id: 'altitude', name: 'Yükseklik', unit: 'm' }
            ],
            icon: '🌡️',
            color: 'bg-green-100 text-green-800'
        },
        {
            id: 'router-2',
            name: 'Router 2 - MICS-4514',
            type: 'mics4514',
            description: 'Hava Kalitesi Sensörü',
            address: '52',
            routerId: generateUniqueRouterId(userId, apiaryIndex, hiveIndex, 1),
            sensorId: generateUniqueSensorId(generateUniqueRouterId(userId, apiaryIndex, hiveIndex, 1)),
            sensors: [
                { id: 'co', name: 'CO Seviyesi', unit: 'ppm' },
                { id: 'no2', name: 'NO2 Seviyesi', unit: 'ppm' }
            ],
            icon: '💨',
            color: 'bg-purple-100 text-purple-800'
        },
        {
            id: 'router-3',
            name: 'Router 3 - Load Cell',
            type: 'loadcell',
            description: 'Ağırlık Sensörü',
            address: '66',
            routerId: generateUniqueRouterId(userId, apiaryIndex, hiveIndex, 2),
            sensorId: generateUniqueSensorId(generateUniqueRouterId(userId, apiaryIndex, hiveIndex, 2)),
            sensors: [
                { id: 'weight', name: 'Kovan Ağırlığı', unit: 'kg' },
                { id: 'deltaWeight', name: 'Ağırlık Değişimi', unit: 'kg' }
            ],
            icon: '⚖️',
            color: 'bg-orange-100 text-orange-800'
        },
        {
            id: 'router-4',
            name: 'Router 4 - MQ2',
            type: 'mq2',
            description: 'Gaz/Duman Sensörü',
            address: '58',
            routerId: generateUniqueRouterId(userId, apiaryIndex, hiveIndex, 3),
            sensorId: generateUniqueSensorId(generateUniqueRouterId(userId, apiaryIndex, hiveIndex, 3)),
            sensors: [
                { id: 'smoke', name: 'Duman Seviyesi', unit: 'ppm' },
                { id: 'lpg', name: 'LPG Seviyesi', unit: 'ppm' },
                { id: 'gasLevel', name: 'Genel Gaz', unit: 'ppm' }
            ],
            icon: '🔥',
            color: 'bg-red-100 text-red-800'
        }
    ];

    // Kovan ekleme
    const addHiveToApiary = (apiaryIndex) => {
        if (!userId) {
            alert('Kullanıcı girişi gereklidir!');
            return;
        }

        const updatedApiaries = [...apiaries];
        if (!updatedApiaries[apiaryIndex].hives) {
            updatedApiaries[apiaryIndex].hives = [];
        }

        const maxHives = updatedApiaries[apiaryIndex].hiveCount || 0;
        const currentHives = updatedApiaries[apiaryIndex].hives.length;

        if (currentHives >= maxHives) {
            alert(`Bu arılıkta maksimum ${maxHives} kovan tanımlanabilir.`);
            return;
        }

        // Dinamik router ID'leri ile kovan oluştur
        const standardRouters = getStandardRouters(userId, apiaryIndex, currentHives);

        const newHive = {
            name: `Kovan ${currentHives + 1}`,
            hiveNumber: currentHives + 1,
            hiveType: 'langstroth',
            description: '',
            hardware: {
                coordinatorAddress: '34',
                channel: 23,
                routers: standardRouters.map(routerTemplate => ({
                    routerType: routerTemplate.type,
                    routerName: routerTemplate.name,
                    address: routerTemplate.address,
                    routerId: routerTemplate.routerId,     // DİNAMİK ID
                    sensors: routerTemplate.sensors.map(sensor => ({
                        sensorType: sensor.id,
                        sensorName: sensor.name,
                        sensorId: routerTemplate.sensorId, // DİNAMİK SENSOR ID
                        unit: sensor.unit,
                        isActive: true
                    })),
                    isActive: true,
                    icon: routerTemplate.icon,
                    color: routerTemplate.color
                }))
            }
        };

        updatedApiaries[apiaryIndex].hives.push(newHive);
        setApiaries(updatedApiaries);
    };

    // Router ID güncelleme
    const updateRouterData = (apiaryIndex, hiveIndex, routerIndex, field, value) => {
        const updatedApiaries = [...apiaries];
        updatedApiaries[apiaryIndex].hives[hiveIndex].hardware.routers[routerIndex][field] = value;
        setApiaries(updatedApiaries);
    };

    // Sensor ID güncelleme
    const updateSensorData = (apiaryIndex, hiveIndex, routerIndex, sensorIndex, field, value) => {
        const updatedApiaries = [...apiaries];
        updatedApiaries[apiaryIndex].hives[hiveIndex].hardware.routers[routerIndex].sensors[sensorIndex][field] = value;
        setApiaries(updatedApiaries);
    };

    // Kovan silme
    const removeHive = (apiaryIndex, hiveIndex) => {
        const updatedApiaries = [...apiaries];
        updatedApiaries[apiaryIndex].hives.splice(hiveIndex, 1);
        setApiaries(updatedApiaries);
    };

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    🔧 Manuel Router Sistemi
                </h3>
                <p className="text-blue-700 dark:text-blue-300 text-sm">
                    Her router ve sensor için koordinatörünüzden aldığınız gerçek ID'leri manuel olarak girebilirsiniz.
                    Bu sayede sisteminizle tam entegrasyon sağlanır.
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white/50 p-2 rounded">
                        <strong>Router ID:</strong> Koordinatörden alınan gerçek router ID'si
                    </div>
                    <div className="bg-white/50 p-2 rounded">
                        <strong>Sensor ID:</strong> Router'a bağlı sensor ID'si
                    </div>
                    <div className="bg-white/50 p-2 rounded">
                        <strong>Örnek Router:</strong> 100, 107, 108, 109
                    </div>
                    <div className="bg-white/50 p-2 rounded">
                        <strong>Örnek Sensor:</strong> 1, 2, 3, 4
                    </div>
                </div>
            </div>

            {/* Arılık ve Kovan Listesi */}
            <div className="space-y-4">
                {apiaries.map((apiary, apiaryIndex) => (
                    <div key={apiaryIndex} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                    🏡 {apiary.name || `Arılık ${apiaryIndex + 1}`}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    📍 {apiary.location} • 🏠 {apiary.hiveCount || 0} kovan kapasitesi
                                </p>
                            </div>
                            <button
                                onClick={() => setExpandedApiary(expandedApiary === apiaryIndex ? null : apiaryIndex)}
                                className="text-amber-600 hover:text-amber-800 dark:text-amber-400"
                            >
                                {expandedApiary === apiaryIndex ? '📖 Kapat' : '📋 Kovanları Yönet'}
                            </button>
                        </div>

                        {/* Arılık Özet */}
                        <div className="grid grid-cols-4 gap-4 mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    {apiary.hives?.length || 0}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">Tanımlı Kovan</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {apiary.hives?.reduce((total, hive) =>
                                        total + (hive.hardware?.routers?.filter(r => r.routerId).length || 0), 0
                                    ) || 0}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">Aktif Router</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                    {apiary.hives?.reduce((total, hive) =>
                                        total + (hive.hardware?.routers?.reduce((routerTotal, router) =>
                                            routerTotal + (router.sensors?.filter(s => s.sensorId).length || 0), 0
                                        ) || 0), 0
                                    ) || 0}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">Aktif Sensör</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                                    {(apiary.hiveCount || 0) - (apiary.hives?.length || 0)}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">Eksik Kovan</div>
                            </div>
                        </div>

                        {expandedApiary === apiaryIndex && (
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        Kovan Yönetimi ({apiary.hives?.length || 0}/{apiary.hiveCount || 0})
                                    </span>
                                    <button
                                        onClick={() => addHiveToApiary(apiaryIndex)}
                                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                                        disabled={(apiary.hives?.length || 0) >= (apiary.hiveCount || 0)}
                                    >
                                        🏠 Yeni Kovan Ekle
                                    </button>
                                </div>

                                {/* Kovan Listesi */}
                                {apiary.hives && apiary.hives.map((hive, hiveIndex) => (
                                    <div key={hiveIndex} className="bg-gray-50 dark:bg-gray-700 p-4 rounded border">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center space-x-2">
                                                <span className="font-medium text-sm">🏠 {hive.name}</span>
                                                <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded">
                                                    {hive.hardware?.routers?.filter(r => r.routerId).length || 0}/4 Router
                                                </span>
                                            </div>
                                            <div className="flex space-x-1">
                                                <button
                                                    onClick={() => setExpandedHive(expandedHive === `${apiaryIndex}-${hiveIndex}` ? null : `${apiaryIndex}-${hiveIndex}`)}
                                                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-xs"
                                                >
                                                    {expandedHive === `${apiaryIndex}-${hiveIndex}` ? '🔧 Kapat' : '🔧 Router Ayarla'}
                                                </button>
                                                <button
                                                    onClick={() => removeHive(apiaryIndex, hiveIndex)}
                                                    className="text-red-600 hover:text-red-800 dark:text-red-400 text-xs"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>

                                        {/* Router Listesi */}
                                        {expandedHive === `${apiaryIndex}-${hiveIndex}` && (
                                            <div className="space-y-3 border-t pt-3">
                                                {hive.hardware?.routers?.map((router, routerIndex) => (
                                                    <div key={routerIndex} className="bg-white dark:bg-gray-600 p-3 rounded border">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center space-x-2">
                                                                <span className="text-lg">{router.icon}</span>
                                                                <span className="font-medium text-sm">{router.routerName}</span>
                                                                <span className={`text-xs px-2 py-1 rounded ${router.color}`}>
                                                                    {router.routerType.toUpperCase()}
                                                                </span>
                                                            </div>
                                                            <button
                                                                onClick={() => setExpandedRouter(expandedRouter === `${apiaryIndex}-${hiveIndex}-${routerIndex}` ? null : `${apiaryIndex}-${hiveIndex}-${routerIndex}`)}
                                                                className="text-amber-600 hover:text-amber-800 dark:text-amber-400 text-xs"
                                                            >
                                                                {expandedRouter === `${apiaryIndex}-${hiveIndex}-${routerIndex}` ? '⚙️ Kapat' : '⚙️ Yapılandır'}
                                                            </button>
                                                        </div>

                                                        {/* Router Konfigürasyonu */}
                                                        {expandedRouter === `${apiaryIndex}-${hiveIndex}-${routerIndex}` && (
                                                            <div className="space-y-3 border-t pt-3">
                                                                {/* Router ID - MANUEL GİRİŞ */}
                                                                <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded">
                                                                    <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                                                                        Router ID (Manuel Giriş)
                                                                    </label>
                                                                    <input
                                                                        type="text"
                                                                        value={router.routerId || ''}
                                                                        onChange={(e) => updateRouterData(apiaryIndex, hiveIndex, routerIndex, 'routerId', e.target.value)}
                                                                        placeholder="Router ID giriniz (örn: 100)"
                                                                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                                                                    />
                                                                    <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                                                        💡 Koordinatörünüzdeki router ID'sini girin
                                                                    </div>
                                                                </div>

                                                                {/* Sensörler - MANUEL GİRİŞ */}
                                                                <div>
                                                                    <h6 className="text-xs font-medium mb-2">📡 Sensörler (Manuel ID Girişi):</h6>
                                                                    <div className="space-y-2">
                                                                        {router.sensors?.map((sensor, sensorIndex) => (
                                                                            <div key={sensorIndex} className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                                                                                <div className="flex items-center justify-between mb-2">
                                                                                    <span className="text-xs font-medium">{sensor.sensorName} ({sensor.unit})</span>
                                                                                    <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded">
                                                                                        Manuel
                                                                                    </span>
                                                                                </div>
                                                                                <div className="bg-white dark:bg-gray-700 p-2 rounded border">
                                                                                    <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                                                                                        Sensor ID:
                                                                                    </label>
                                                                                    <input
                                                                                        type="text"
                                                                                        value={sensor.sensorId || ''}
                                                                                        onChange={(e) => updateSensorData(apiaryIndex, hiveIndex, routerIndex, sensorIndex, 'sensorId', e.target.value)}
                                                                                        placeholder="Sensor ID giriniz"
                                                                                        className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                                                                                    />
                                                                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                                                        Koordinatörden alınan sensor ID
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MultiRouterHiveForm;
