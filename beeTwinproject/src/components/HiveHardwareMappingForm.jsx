import React, { useState } from 'react';

const HiveHardwareMappingForm = ({ apiaries, setApiaries }) => {
    // Prototip donanım konfigürasyonları
    const hardwarePresets = {
        'preset-1': {
            name: 'BeeTwin Prototip Set 1',
            coordinatorAddress: '34',
            channel: 23,
            routers: [
                {
                    routerId: '107',
                    routerType: 'bmp280',
                    address: '41',
                    sensorIds: ['1013'],
                    dataKeys: ['temperature', 'humidity']
                },
                {
                    routerId: '108',
                    routerType: 'mics4514',
                    address: '52',
                    sensorIds: ['1002'],
                    dataKeys: ['co2', 'nh3']
                },
                {
                    routerId: '109',
                    routerType: 'loadcell',
                    address: '66',
                    sensorIds: ['1010'],
                    dataKeys: ['weight']
                },
                {
                    routerId: '110',
                    routerType: 'mq2',
                    address: '58',
                    sensorIds: ['1009'],
                    dataKeys: ['smoke', 'lpg']
                }
            ]
        }
    };

    const [selectedPreset, setSelectedPreset] = useState('');
    const [expandedApiary, setExpandedApiary] = useState(null);
    const [expandedHive, setExpandedHive] = useState(null);

    const addHiveToApiary = (apiaryIndex) => {
        const updatedApiaries = [...apiaries];
        if (!updatedApiaries[apiaryIndex].hives) {
            updatedApiaries[apiaryIndex].hives = [];
        }

        // Kovan sayısı kontrolü
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

    const generateAllHivesForApiary = (apiaryIndex) => {
        const updatedApiaries = [...apiaries];
        const apiary = updatedApiaries[apiaryIndex];
        const targetHiveCount = apiary.hiveCount || 0;
        const currentHiveCount = apiary.hives?.length || 0;

        if (targetHiveCount <= currentHiveCount) {
            alert('Bu arılık için zaten yeterli kovan tanımlanmış.');
            return;
        }

        if (!apiary.hives) {
            apiary.hives = [];
        }

        // Eksik kovanları oluştur
        for (let i = currentHiveCount; i < targetHiveCount; i++) {
            apiary.hives.push({
                name: `${apiary.name || `Arılık ${apiaryIndex + 1}`} - Kovan ${i + 1}`,
                hiveNumber: i + 1,
                hiveType: 'langstroth',
                description: `${apiary.name || `Arılık ${apiaryIndex + 1}`} arılığındaki ${i + 1}. kovan`,
                hardware: {
                    routerId: '',
                    sensorId: '',
                    coordinatorAddress: '34',
                    channel: 23,
                    routers: []
                }
            });
        }

        setApiaries(updatedApiaries);
    };

    const updateHiveHardware = (apiaryIndex, hiveIndex, field, value) => {
        const updatedApiaries = [...apiaries];
        if (!updatedApiaries[apiaryIndex].hives[hiveIndex].hardware) {
            updatedApiaries[apiaryIndex].hives[hiveIndex].hardware = {};
        }
        updatedApiaries[apiaryIndex].hives[hiveIndex].hardware[field] = value;
        setApiaries(updatedApiaries);
    };

    const applyHardwarePreset = (apiaryIndex, hiveIndex, presetKey) => {
        const preset = hardwarePresets[presetKey];
        if (!preset) return;

        const updatedApiaries = [...apiaries];
        updatedApiaries[apiaryIndex].hives[hiveIndex].hardware = {
            routerId: preset.routers[0]?.routerId || '',
            sensorId: preset.routers[0]?.sensorIds[0] || '',
            coordinatorAddress: preset.coordinatorAddress,
            channel: preset.channel,
            routers: preset.routers
        };
        setApiaries(updatedApiaries);
    };

    const applyPresetToAllHives = (apiaryIndex, presetKey) => {
        const preset = hardwarePresets[presetKey];
        if (!preset) return;

        const updatedApiaries = [...apiaries];
        const apiary = updatedApiaries[apiaryIndex];

        if (!apiary.hives || apiary.hives.length === 0) {
            alert('Önce kovanları oluşturun, sonra donanım eşleştirmesi yapın.');
            return;
        }

        // Her kovana sıralı şekilde router ata
        apiary.hives.forEach((hive, hiveIndex) => {
            const routerIndex = hiveIndex % preset.routers.length; // Eğer kovan sayısı router sayısından fazlaysa döngüsel olarak ata
            const router = preset.routers[routerIndex];

            hive.hardware = {
                routerId: router.routerId,
                sensorId: `${router.sensorIds[0]}${String(hiveIndex + 1).padStart(2, '0')}`, // Benzersiz sensor ID
                coordinatorAddress: preset.coordinatorAddress,
                channel: preset.channel,
                routers: [router]
            };
        });

        setApiaries(updatedApiaries);
        alert(`${apiary.name || `Arılık ${apiaryIndex + 1}`} için toplu donanım eşleştirmesi tamamlandı!`);
    };

    const removeHive = (apiaryIndex, hiveIndex) => {
        const updatedApiaries = [...apiaries];
        updatedApiaries[apiaryIndex].hives.splice(hiveIndex, 1);
        setApiaries(updatedApiaries);
    };

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    🔧 Kovan-Donanım Eşleştirme
                </h3>
                <p className="text-blue-700 dark:text-blue-300 text-sm">
                    Her kovanın fiziksel donanımlarını (Router ID, Sensor ID) ile eşleştirin.
                    Bu bilgiler sensör verilerinin doğru kovana atanması için gereklidir.
                </p>
            </div>

            {/* Donanım Preset Seçimi */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    🎛️ Hazır Donanım Konfigürasyonu
                </label>
                <select
                    value={selectedPreset}
                    onChange={(e) => setSelectedPreset(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
                >
                    <option value="">Manuel Konfigürasyon</option>
                    <option value="preset-1">BeeTwin Prototip Set 1 (4 Router)</option>
                </select>

                {selectedPreset && (
                    <div className="mt-3 p-3 bg-white dark:bg-gray-700 rounded border">
                        <h4 className="font-medium text-sm mb-2">Donanım Detayları:</h4>
                        <div className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
                            <div>📡 Coordinator: Adres {hardwarePresets[selectedPreset].coordinatorAddress}, Kanal {hardwarePresets[selectedPreset].channel}</div>
                            {hardwarePresets[selectedPreset].routers.map((router, idx) => (
                                <div key={idx}>
                                    🔗 Router {router.routerId} ({router.routerType}): Adres {router.address}, Sensor {router.sensorIds.join(', ')}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
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

                        {/* Arılık Özet Bilgisi */}
                        <div className="grid grid-cols-3 gap-4 mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    {apiary.hives?.length || 0}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">Tanımlı Kovan</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {apiary.hives?.filter(hive => hive.hardware?.routerId && hive.hardware?.sensorId).length || 0}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">Donanım Eşleştirilmiş</div>
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
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => addHiveToApiary(apiaryIndex)}
                                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                                            disabled={(apiary.hives?.length || 0) >= (apiary.hiveCount || 0)}
                                        >
                                            🏠 Tek Kovan Ekle
                                        </button>
                                        <button
                                            onClick={() => generateAllHivesForApiary(apiaryIndex)}
                                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                                            disabled={(apiary.hives?.length || 0) >= (apiary.hiveCount || 0)}
                                        >
                                            🏠 Tüm Kovanları Oluştur
                                        </button>
                                        {selectedPreset && (apiary.hives?.length || 0) > 0 && (
                                            <button
                                                onClick={() => applyPresetToAllHives(apiaryIndex, selectedPreset)}
                                                className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm"
                                            >
                                                🎛️ Toplu Preset Uygula
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Kovan Listesi */}
                                {apiary.hives && apiary.hives.map((hive, hiveIndex) => (
                                    <div key={hiveIndex} className="bg-gray-50 dark:bg-gray-700 p-3 rounded border">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center space-x-2">
                                                <span className="font-medium text-sm">🏠 {hive.name}</span>
                                                <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded">
                                                    {hive.hardware?.routerId && hive.hardware?.sensorId
                                                        ? `Router ${hive.hardware.routerId} - Sensor ${hive.hardware.sensorId}`
                                                        : 'Donanım Atanmamış'
                                                    }
                                                </span>
                                            </div>
                                            <div className="flex space-x-1">
                                                <button
                                                    onClick={() => setExpandedHive(expandedHive === `${apiaryIndex}-${hiveIndex}` ? null : `${apiaryIndex}-${hiveIndex}`)}
                                                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-xs"
                                                >
                                                    {expandedHive === `${apiaryIndex}-${hiveIndex}` ? '🔧 Kapat' : '🔧 Ayarla'}
                                                </button>
                                                <button
                                                    onClick={() => removeHive(apiaryIndex, hiveIndex)}
                                                    className="text-red-600 hover:text-red-800 dark:text-red-400 text-xs"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>

                                        {expandedHive === `${apiaryIndex}-${hiveIndex}` && (
                                            <div className="mt-3 space-y-3 border-t pt-3">
                                                {/* Preset Uygulama */}
                                                {selectedPreset && (
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => applyHardwarePreset(apiaryIndex, hiveIndex, selectedPreset)}
                                                            className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-xs"
                                                        >
                                                            🎛️ Preset Uygula
                                                        </button>
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs font-medium mb-1">Router ID</label>
                                                        <input
                                                            type="text"
                                                            value={hive.hardware?.routerId || ''}
                                                            onChange={(e) => updateHiveHardware(apiaryIndex, hiveIndex, 'routerId', e.target.value)}
                                                            placeholder="107"
                                                            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 dark:bg-gray-600 dark:text-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium mb-1">Sensor ID</label>
                                                        <input
                                                            type="text"
                                                            value={hive.hardware?.sensorId || ''}
                                                            onChange={(e) => updateHiveHardware(apiaryIndex, hiveIndex, 'sensorId', e.target.value)}
                                                            placeholder="1013"
                                                            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 dark:bg-gray-600 dark:text-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium mb-1">Coordinator Adres</label>
                                                        <input
                                                            type="text"
                                                            value={hive.hardware?.coordinatorAddress || '34'}
                                                            onChange={(e) => updateHiveHardware(apiaryIndex, hiveIndex, 'coordinatorAddress', e.target.value)}
                                                            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 dark:bg-gray-600 dark:text-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium mb-1">Kanal</label>
                                                        <input
                                                            type="number"
                                                            value={hive.hardware?.channel || 23}
                                                            onChange={(e) => updateHiveHardware(apiaryIndex, hiveIndex, 'channel', parseInt(e.target.value))}
                                                            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 dark:bg-gray-600 dark:text-white"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Router Detayları */}
                                                {hive.hardware?.routers && hive.hardware.routers.length > 0 && (
                                                    <div className="bg-white dark:bg-gray-600 p-2 rounded border">
                                                        <h5 className="text-xs font-medium mb-2">🔗 Router Detayları:</h5>
                                                        <div className="space-y-1">
                                                            {hive.hardware.routers.map((router, routerIdx) => (
                                                                <div key={routerIdx} className="text-xs text-gray-600 dark:text-gray-300">
                                                                    Router {router.routerId} ({router.routerType}):
                                                                    Adres {router.address},
                                                                    Sensörler [{router.sensorIds.join(', ')}],
                                                                    Veri [{router.dataKeys.join(', ')}]
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
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

export default HiveHardwareMappingForm;
