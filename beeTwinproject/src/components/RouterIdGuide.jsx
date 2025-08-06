import React from 'react';

/**
 * Router ID Rehberi Komponenti
 * Kullanıcılara benzersiz Router ID önerileri sunar
 */
const RouterIdGuide = ({ onSuggestionClick }) => {
    // Kullanıcı dostu Router ID önerileri
    const generateSuggestions = () => {
        const userId = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
        const timestamp = Date.now().toString().slice(-4);

        return [
            `R${userId}01`, // R745601
            `RT${timestamp}`, // RT3847  
            `BT${userId}`, // BT7456
            `HV${userId.slice(0, 2)}${Math.floor(Math.random() * 99).toString().padStart(2, '0')}`, // HV7432
            `IOT${Math.floor(Math.random() * 999).toString().padStart(3, '0')}`, // IOT234
            `MY${userId.slice(-3)}`, // MY456
        ];
    };

    const suggestions = generateSuggestions();

    return (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center">
                💡 Router ID Rehberi
            </h4>

            <div className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                <p className="mb-2">
                    <strong>Önemli:</strong> Router ID'ler sistem genelinde benzersiz olmalıdır.
                    Aynı Router ID'yi başka bir kullanıcı kullanamasın.
                </p>

                <div className="bg-blue-100 dark:bg-blue-800/30 p-2 rounded mb-3">
                    <strong>✅ İyi Örnekler:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Kişisel önek + numara: <code>AHMET107</code>, <code>MEHMET108</code></li>
                        <li>Tarih tabanlı: <code>R20250805</code>, <code>BT0508</code></li>
                        <li>Bölge + numara: <code>ANKARA01</code>, <code>IST107</code></li>
                        <li>UUID tarzı: <code>BT4F2A</code>, <code>HV8E3C</code></li>
                    </ul>
                </div>

                <div className="bg-red-100 dark:bg-red-800/30 p-2 rounded mb-3">
                    <strong>❌ Kaçınılması Gerekenler:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Genel isimler: <code>Router1</code>, <code>Test</code>, <code>Sensor</code></li>
                        <li>Sadece rakam: <code>107</code>, <code>108</code></li>
                        <li>Çok kısa: <code>R1</code>, <code>A</code></li>
                    </ul>
                </div>
            </div>

            <div className="space-y-2">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    🎲 Sizin İçin Benzersiz Öneriler:
                </p>
                <div className="grid grid-cols-2 gap-2">
                    {suggestions.map((suggestion, index) => (
                        <button
                            key={index}
                            onClick={() => onSuggestionClick && onSuggestionClick(suggestion)}
                            className="text-left px-3 py-2 bg-white dark:bg-gray-700 border border-blue-200 dark:border-blue-600 rounded hover:bg-blue-50 dark:hover:bg-blue-800/20 transition-colors"
                        >
                            <code className="text-blue-600 dark:text-blue-300 font-mono">
                                {suggestion}
                            </code>
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => window.location.reload()}
                    className="w-full mt-2 px-3 py-1 text-xs bg-blue-100 dark:bg-blue-800/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-700/40 transition-colors"
                >
                    🔄 Yeni Öneriler Üret
                </button>
            </div>

            <div className="mt-3 p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded text-xs text-yellow-800 dark:text-yellow-200">
                <strong>💡 İpucu:</strong> Router ID'nizi bir yere not edin. Physical Router'ınızda da bu ID'yi kullanacaksınız.
            </div>
        </div>
    );
};

export default RouterIdGuide;
