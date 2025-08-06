import React, { useState } from 'react';
import MultiRouterHiveForm from './MultiRouterHiveForm';

const HiveHardwareMappingForm = ({ apiaries, setApiaries }) => {
    // ÇOKlu ROUTER KONFİGÜRASYON SİSTEMİ
    const multiRouterPresets = {
        'multi-router-standard': {
            name: 'BeeTwin 4-Router Sistemi (Standart)',
            description: 'Kovan başına 4 router: BMP280, MICS-4514, Load Cell, MQ2',
            coordinatorAddress: '34',
            channel: 23,
            routerTemplates: [
                {
                    routerType: 'bmp280',
                    routerName: 'Router 107 - BMP280',
                    address: '41',
                    sensors: [
                        { sensorType: 'temp', sensorName: 'Sıcaklık', unit: '°C' },
                        { sensorType: 'pressure', sensorName: 'Basınç', unit: 'hPa' },
                        { sensorType: 'humidity', sensorName: 'Nem', unit: '%' }
                    ],
                    icon: '🌡️',
                    color: 'bg-green-100 text-green-800'
                },
                {
                    routerType: 'mics4514',
                    routerName: 'Router 108 - MICS-4514',
                    address: '52',
                    sensors: [
                        { sensorType: 'co', sensorName: 'CO Seviyesi', unit: 'ppm' },
                        { sensorType: 'no2', sensorName: 'NO2 Seviyesi', unit: 'ppm' },
                        { sensorType: 'gasLevel', sensorName: 'Genel Gaz', unit: 'ppm' }
                    ],
                    icon: '💨',
                    color: 'bg-purple-100 text-purple-800'
                },
                {
                    routerType: 'loadcell',
                    routerName: 'Router 109 - Load Cell',
                    address: '66',
                    sensors: [
                        { sensorType: 'weight', sensorName: 'Kovan Ağırlığı', unit: 'kg' },
                        { sensorType: 'deltaWeight', sensorName: 'Ağırlık Değişimi', unit: 'kg' }
                    ],
                    icon: '⚖️',
                    color: 'bg-orange-100 text-orange-800'
                },
                {
                    routerType: 'mq2',
                    routerName: 'Router 110 - MQ2',
                    address: '58',
                    sensors: [
                        { sensorType: 'smoke', sensorName: 'Duman Seviyesi', unit: 'ppm' },
                        { sensorType: 'lpg', sensorName: 'LPG Seviyesi', unit: 'ppm' },
                        { sensorType: 'gasLevel', sensorName: 'Genel Gaz', unit: 'ppm' }
                    ],
                    icon: '🔥',
                    color: 'bg-red-100 text-red-800'
                }
            ]
        }
    };

    // ESKİ TEK ROUTER SİSTEMİ (Backward Compatibility)
    const legacySingleRouterPresets = {
        'preset-1': {
            name: 'BeeTwin Tek Router (Eski Sistem)',
            coordinatorAddress: '34',
            channel: 23,
            routers: [
                {
                    routerId: '107',
                    routerType: 'bmp280',
                    address: '41',
                    sensorIds: ['1013'],
                    dataKeys: ['temperature', 'humidity']
                }
            ]
        }
    };

    const [selectedPreset, setSelectedPreset] = useState('multi-router-standard');
    const [systemMode, setSystemMode] = useState('multi-router'); // 'multi-router' veya 'legacy'

    // Legacy sistemi fonksiyonları (tek router için)
    const updateHiveHardware = (apiaryIndex, hiveIndex, field, value) => {
        const updatedApiaries = [...apiaries];
        updatedApiaries[apiaryIndex].hives[hiveIndex].hardware[field] = value;
        setApiaries(updatedApiaries);
    };

    const removeHive = (apiaryIndex, hiveIndex) => {
        const updatedApiaries = [...apiaries];
        updatedApiaries[apiaryIndex].hives.splice(hiveIndex, 1);
        setApiaries(updatedApiaries);
    };

    const addLegacyHiveToApiary = (apiaryIndex) => {
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

        updatedApiaries[apiaryIndex].hives.push({
            name: `Kovan ${currentHives + 1}`,
            hiveNumber: currentHives + 1,
            hiveType: 'langstroth',
            description: '',
            hardware: {
                routerId: '',
                sensorId: '',
                coordinatorAddress: '34',
                channel: 23,
                routers: []
            }
        });

        setApiaries(updatedApiaries);
    };

    return (
        <div className="space-y-6">
            {/* Sistem Modu Seçimi */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-4 rounded-lg border">
                <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100 mb-3">
                    🔧 Donanım Sistemi Seçimi
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                        onClick={() => setSystemMode('multi-router')}
                        className={`p-4 rounded-lg border-2 transition-all ${systemMode === 'multi-router'
                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                : 'border-gray-300 hover:border-green-300'
                            }`}
                    >
                        <div className="flex items-center space-x-3">
                            <span className="text-2xl">🚀</span>
                            <div className="text-left">
                                <div className="font-semibold text-green-700 dark:text-green-300">
                                    4-Router Sistemi (YENİ)
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    Kovan başına 4 router, çoklu sensör desteği
                                </div>
                                <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                                    ✅ BMP280 + MICS-4514 + Load Cell + MQ2
                                </div>
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => setSystemMode('legacy')}
                        className={`p-4 rounded-lg border-2 transition-all ${systemMode === 'legacy'
                                ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                                : 'border-gray-300 hover:border-amber-300'
                            }`}
                    >
                        <div className="flex items-center space-x-3">
                            <span className="text-2xl">⚙️</span>
                            <div className="text-left">
                                <div className="font-semibold text-amber-700 dark:text-amber-300">
                                    Tek Router (ESKİ)
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    Kovan başına 1 router, basit sistem
                                </div>
                                <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                    ⚠️ Backward compatibility
                                </div>
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            {/* Preset Seçimi */}
            {systemMode === 'multi-router' && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                        📋 Donanım Preset Seçimi
                    </h4>
                    <select
                        value={selectedPreset}
                        onChange={(e) => setSelectedPreset(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                        {Object.entries(multiRouterPresets).map(([key, preset]) => (
                            <option key={key} value={key}>
                                {preset.name} - {preset.description}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Çoklu Router Sistemi */}
            {systemMode === 'multi-router' ? (
                <MultiRouterHiveForm
                    apiaries={apiaries}
                    setApiaries={setApiaries}
                />
            ) : (
                /* Legacy Tek Router Sistemi */
                <div className="space-y-4">
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
                        <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                            ⚠️ Legacy Tek Router Sistemi
                        </h4>
                        <p className="text-amber-700 dark:text-amber-300 text-sm">
                            Bu mod sadece eski sistemlerle uyumluluk için korunmuştur.
                            Yeni projeler için 4-Router sistemini tercih edin.
                        </p>
                    </div>

                    {/* Legacy Arılık Listesi */}
                    <div className="space-y-4">
                        {apiaries.map((apiary, apiaryIndex) => (
                            <div key={apiaryIndex} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-white">
                                            🏡 {apiary.name || `Arılık ${apiaryIndex + 1}`}
                                        </h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            📍 {apiary.location} • 🏠 {apiary.hiveCount || 0} kovan
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => addLegacyHiveToApiary(apiaryIndex)}
                                        className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded text-sm"
                                    >
                                        🏠 Kovan Ekle
                                    </button>
                                </div>

                                {/* Legacy Kovan Listesi */}
                                {apiary.hives && apiary.hives.map((hive, hiveIndex) => (
                                    <div key={hiveIndex} className="bg-gray-50 dark:bg-gray-700 p-3 rounded border mb-2">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium text-sm">🏠 {hive.name}</span>
                                            <button
                                                onClick={() => removeHive(apiaryIndex, hiveIndex)}
                                                className="text-red-600 hover:text-red-800 dark:text-red-400 text-xs"
                                            >
                                                🗑️
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-xs font-medium mb-1">Router ID</label>
                                                <input
                                                    type="text"
                                                    value={hive.hardware?.routerId || ''}
                                                    onChange={(e) => updateHiveHardware(apiaryIndex, hiveIndex, 'routerId', e.target.value)}
                                                    placeholder="107"
                                                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium mb-1">Sensor ID</label>
                                                <input
                                                    type="text"
                                                    value={hive.hardware?.sensorId || ''}
                                                    onChange={(e) => updateHiveHardware(apiaryIndex, hiveIndex, 'sensorId', e.target.value)}
                                                    placeholder="1013"
                                                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default HiveHardwareMappingForm;
