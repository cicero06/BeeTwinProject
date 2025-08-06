import React, { useState } from 'react';

/**
 * Kullanıcı Bazlı ID Önerisi Sistemi
 * Her kullanıcı için benzersiz Router ve Sensor ID'leri önerir
 */
const UserBasedIdGenerator = ({ userId, userName, onSelectId, type = 'router' }) => {
    const [suggestions, setSuggestions] = useState([]);
    const [customPrefix, setCustomPrefix] = useState('');

    // Kullanıcı adından prefix oluştur
    const generateUserPrefix = () => {
        if (!userName) return 'USER';

        const words = userName.split(' ');
        if (words.length >= 2) {
            // İsim Soyisim -> İS formatı
            return (words[0].substring(0, 2) + words[1].substring(0, 2)).toUpperCase();
        } else {
            // Tek kelime -> İlk 4 harf
            return words[0].substring(0, 4).toUpperCase();
        }
    };

    // Router ID önerileri
    const generateRouterIdSuggestions = (routerType, hiveIndex, routerIndex) => {
        const userPrefix = customPrefix || generateUserPrefix();
        const routerTypeMap = {
            'bmp280': '107',
            'mics4514': '108',
            'loadcell': '109',
            'mq2': '110'
        };

        const baseNum = routerTypeMap[routerType] || '100';
        const hiveNum = String(hiveIndex + 1).padStart(2, '0');

        return [
            `${userPrefix}R${baseNum}H${hiveNum}`,
            `${userPrefix}_${baseNum}_${hiveNum}`,
            `R${baseNum}${userPrefix}${hiveNum}`,
            `${baseNum}${userPrefix}H${hiveNum}`,
            `${userPrefix}${baseNum}${Math.random().toString(36).substr(2, 3).toUpperCase()}`
        ];
    };

    // Sensor ID önerileri
    const generateSensorIdSuggestions = (routerId, sensorType, sensorIndex) => {
        const sensorTypeMap = {
            'temp': 'T',
            'humidity': 'H',
            'pressure': 'P',
            'co': 'C',
            'no2': 'N',
            'gasLevel': 'G',
            'weight': 'W',
            'deltaWeight': 'DW',
            'smoke': 'S',
            'lpg': 'L'
        };

        const sensorCode = sensorTypeMap[sensorType] || 'S';
        const routerBase = routerId || 'ROUTER';

        return [
            `${routerBase}${sensorCode}${sensorIndex + 1}`,
            `${routerBase}_S${sensorIndex + 1}`,
            `S${sensorIndex + 1}_${routerBase}`,
            `${routerBase}${sensorCode}`,
            `${sensorCode}${routerBase.substring(-4)}${sensorIndex + 1}`
        ];
    };

    const generateSuggestions = (config) => {
        if (type === 'router') {
            return generateRouterIdSuggestions(
                config.routerType,
                config.hiveIndex,
                config.routerIndex
            );
        } else {
            return generateSensorIdSuggestions(
                config.routerId,
                config.sensorType,
                config.sensorIndex
            );
        }
    };

    return (
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded border">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    💡 ID Önerileri ({type === 'router' ? 'Router' : 'Sensör'})
                </span>
                <button
                    onClick={() => {
                        const newSuggestions = generateSuggestions();
                        setSuggestions(newSuggestions);
                    }}
                    className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    🔄 Yenile
                </button>
            </div>

            {/* Özel Prefix */}
            <div className="mb-2">
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Kişisel Prefix:
                </label>
                <input
                    type="text"
                    value={customPrefix}
                    onChange={(e) => setCustomPrefix(e.target.value.toUpperCase())}
                    placeholder={generateUserPrefix()}
                    maxLength={6}
                    className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
            </div>

            {/* Öneriler */}
            {suggestions.length > 0 && (
                <div className="space-y-1">
                    <label className="block text-xs text-gray-600 dark:text-gray-400">
                        Önerilen ID'ler:
                    </label>
                    <div className="grid grid-cols-1 gap-1">
                        {suggestions.map((suggestion, index) => (
                            <button
                                key={index}
                                onClick={() => onSelectId(suggestion)}
                                className="text-left px-2 py-1 text-xs bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                💭 {type === 'router' ? 'Router' : 'Sensör'} ID'niz sistemde benzersiz olmalıdır
            </div>
        </div>
    );
};

export default UserBasedIdGenerator;
