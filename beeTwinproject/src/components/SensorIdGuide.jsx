import React from 'react';

/**
 * Sensor ID Rehberi Komponenti  
 * Router ID'ye uyumlu Sensor ID önerileri sunar
 */
const SensorIdGuide = ({ routerId, onSuggestionClick }) => {
    // Router ID'ye göre uyumlu Sensor ID önerileri
    const generateSensorSuggestions = (routerId) => {
        if (!routerId) {
            return [
                'S1001', 'S1002', 'S1003',
                'SEN001', 'SEN002', 'SEN003'
            ];
        }

        const baseId = routerId.replace(/[^a-zA-Z0-9]/g, '');
        const suggestions = [];

        // Router ID tabanlı öneriler
        suggestions.push(`${baseId}S01`);  // AHMET107S01
        suggestions.push(`${baseId}S02`);  // AHMET107S02
        suggestions.push(`S${baseId}`);    // SAHMET107
        suggestions.push(`${baseId.slice(-3)}001`); // 107001
        suggestions.push(`${baseId.slice(0, 3)}S${Math.floor(Math.random() * 99).toString().padStart(2, '0')}`); // AHMS47
        suggestions.push(`SEN${baseId.slice(-4)}`); // SEN107

        return suggestions.slice(0, 6);
    };

    const suggestions = generateSensorSuggestions(routerId);

    // Sensör tipi bilgileri
    const sensorTypes = {
        'BMP280': {
            description: 'Sıcaklık, Basınç, Nem',
            example: '1013',
            color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
        },
        'MICS-4514': {
            description: 'Hava Kalitesi (CO, NO2)',
            example: '1002',
            color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
        },
        'Load Cell': {
            description: 'Ağırlık Sensörü',
            example: '1010',
            color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
        },
        'MQ2': {
            description: 'Gaz/Duman Sensörü',
            example: '1009',
            color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
        }
    };

    return (
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2 flex items-center">
                🔧 Sensor ID Rehberi
            </h4>

            <div className="text-sm text-green-800 dark:text-green-200 mb-3">
                <p className="mb-2">
                    <strong>Router ID:</strong> <code className="bg-white dark:bg-gray-700 px-2 py-1 rounded">{routerId || 'Henüz seçilmedi'}</code>
                </p>

                <div className="bg-green-100 dark:bg-green-800/30 p-2 rounded mb-3">
                    <strong>📡 Bilinen Sensör Tipleri:</strong>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                        {Object.entries(sensorTypes).map(([type, info]) => (
                            <div key={type} className={`p-2 rounded text-xs ${info.color}`}>
                                <div className="font-medium">{type}</div>
                                <div>{info.description}</div>
                                <div className="font-mono mt-1">Örnek: {info.example}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-blue-100 dark:bg-blue-800/30 p-2 rounded mb-3">
                    <strong>💡 Sensor ID Kuralları:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Router ID ile uyumlu olmalı</li>
                        <li>Sistem genelinde benzersiz olmalı</li>
                        <li>3-20 karakter arası önerilir</li>
                        <li>Harf, rakam ve - kullanabilirsiniz</li>
                    </ul>
                </div>
            </div>

            <div className="space-y-2">
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    🎯 {routerId ? `${routerId} için` : 'Genel'} Sensor ID Önerileri:
                </p>
                <div className="grid grid-cols-2 gap-2">
                    {suggestions.map((suggestion, index) => (
                        <button
                            key={index}
                            onClick={() => onSuggestionClick && onSuggestionClick(suggestion)}
                            className="text-left px-3 py-2 bg-white dark:bg-gray-700 border border-green-200 dark:border-green-600 rounded hover:bg-green-50 dark:hover:bg-green-800/20 transition-colors"
                        >
                            <code className="text-green-600 dark:text-green-300 font-mono">
                                {suggestion}
                            </code>
                        </button>
                    ))}
                </div>
            </div>

            <div className="mt-3 p-2 bg-amber-100 dark:bg-amber-900/20 rounded text-xs text-amber-800 dark:text-amber-200">
                <strong>⚠️ Önemli:</strong> Physical sensörünüzde bu ID'yi kullanmayı unutmayın. Router ve Sensor ID eşleşmesi çok önemli!
            </div>
        </div>
    );
};

export default SensorIdGuide;
