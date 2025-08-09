import React, { useState, useEffect } from 'react';
import ApiService from '../services/api';

/**
 * Manuel Router Konfigürasyonu Component'i
 * Kullanıcının gerçek router ID ve sensor ID değerlerini manuel girmesi için
 */
function RouterSelector({ onRouterSelect, selectedRouter, disabled = false }) {
    const [routerForm, setRouterForm] = useState({
        routerId: '',
        sensorId: '',
        name: '',
        description: '',
        sensorType: '',
        parameters: []
    });
    const [availableSensorTypes, setAvailableSensorTypes] = useState([]);
    const [parameterOptions, setParameterOptions] = useState([]);
    const [errors, setErrors] = useState({});

    // Desteklenen sensör tipleri ve parametreleri
    const sensorTypeConfigs = {
        'BMP280': {
            name: 'BMP280 - Çevresel Sensör',
            parameters: ['temperature', 'pressure', 'humidity', 'altitude'],
            description: 'Sıcaklık, Basınç, Nem ve Yükseklik ölçümü'
        },
        'MICS-4514': {
            name: 'MICS-4514 - Hava Kalitesi',
            parameters: ['co', 'no2'],
            description: 'CO ve NO2 gaz seviyelerini ölçer'
        },
        'Load Cell': {
            name: 'Load Cell - Ağırlık Sensörü',
            parameters: ['weight'],
            description: 'Kovan ağırlığını ölçer'
        },
        'MQ2': {
            name: 'MQ2 - Gaz Sensörü',
            parameters: ['gas_level', 'co_level', 'lpg_level'],
            description: 'Yanıcı gazlar, CO ve LPG tespiti'
        },
        'DHT22': {
            name: 'DHT22 - Sıcaklık/Nem',
            parameters: ['temperature', 'humidity'],
            description: 'Sıcaklık ve nem ölçümü'
        },
        'Custom': {
            name: 'Özel Sensör',
            parameters: [],
            description: 'Özel sensör konfigürasyonu'
        }
    };

    useEffect(() => {
        fetchSensorTypes();
    }, []);

    const fetchSensorTypes = async () => {
        try {
            const response = await ApiService.getSensorTypes();
            if (response.data.success) {
                setAvailableSensorTypes(response.data.sensorTypes.map(st => st.key));
            }
        } catch (error) {
            console.warn('Sensör tipleri alınamadı, varsayılan liste kullanılıyor:', error);
            setAvailableSensorTypes(Object.keys(sensorTypeConfigs));
        }
    };

    // Sensör tipi değiştiğinde parametreleri güncelle
    useEffect(() => {
        if (routerForm.sensorType && sensorTypeConfigs[routerForm.sensorType]) {
            const config = sensorTypeConfigs[routerForm.sensorType];
            setParameterOptions(config.parameters);
            setRouterForm(prev => ({
                ...prev,
                parameters: config.parameters,
                description: config.description
            }));
        }
    }, [routerForm.sensorType]);

    const validateForm = () => {
        const newErrors = {};

        if (!routerForm.routerId) {
            newErrors.routerId = 'Router ID zorunludur';
        } else if (!/^\d+$/.test(routerForm.routerId)) {
            newErrors.routerId = 'Router ID sadece sayı olabilir (örn: 107)';
        }

        if (!routerForm.sensorId) {
            newErrors.sensorId = 'Sensor ID zorunludur';
        } else if (!/^\d+$/.test(routerForm.sensorId)) {
            newErrors.sensorId = 'Sensor ID sadece sayı olabilir (örn: 1013)';
        }

        if (!routerForm.name.trim()) {
            newErrors.name = 'Router adı zorunludur';
        }

        if (!routerForm.sensorType) {
            newErrors.sensorType = 'Sensör tipi seçimi zorunludur';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (field, value) => {
        setRouterForm(prev => ({
            ...prev,
            [field]: value
        }));

        // Hata mesajını temizle
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    const handleSubmit = () => {
        if (!validateForm()) return;

        const routerData = {
            ...routerForm,
            routerId: routerForm.routerId.toString(),
            sensorId: routerForm.sensorId.toString()
        };

        onRouterSelect(routerData);
    };

    const handleReset = () => {
        setRouterForm({
            routerId: '',
            sensorId: '',
            name: '',
            description: '',
            sensorType: '',
            parameters: []
        });
        setErrors({});
        onRouterSelect(null);
    };

    if (disabled) {
        return (
            <div className="opacity-50 pointer-events-none">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                    Router konfigürasyonu devre dışı
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    🔌 Router Konfigürasyonu
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                    Gerçek kovanınızda bulunan router ve sensör bilgilerini girin. Bu bilgiler kovanınızın dijital ikizi ile eşleşmelidir.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Router ID */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Router ID *
                    </label>
                    <input
                        type="text"
                        placeholder="Örn: 107"
                        value={routerForm.routerId}
                        onChange={(e) => handleInputChange('routerId', e.target.value)}
                        className={`
                            w-full px-3 py-2 border rounded-lg text-sm
                            ${errors.routerId
                                ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                : 'border-gray-300 dark:border-gray-600'
                            }
                            bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                        `}
                    />
                    {errors.routerId && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.routerId}</p>
                    )}
                </div>

                {/* Sensor ID */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Sensor ID *
                    </label>
                    <input
                        type="text"
                        placeholder="Örn: 1013"
                        value={routerForm.sensorId}
                        onChange={(e) => handleInputChange('sensorId', e.target.value)}
                        className={`
                            w-full px-3 py-2 border rounded-lg text-sm
                            ${errors.sensorId
                                ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                : 'border-gray-300 dark:border-gray-600'
                            }
                            bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                        `}
                    />
                    {errors.sensorId && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.sensorId}</p>
                    )}
                </div>
            </div>

            {/* Router Adı */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Router Adı *
                </label>
                <input
                    type="text"
                    placeholder="Örn: Ana Kovan Sensörü"
                    value={routerForm.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`
                        w-full px-3 py-2 border rounded-lg text-sm
                        ${errors.name
                            ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                            : 'border-gray-300 dark:border-gray-600'
                        }
                        bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                        focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    `}
                />
                {errors.name && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.name}</p>
                )}
            </div>

            {/* Sensör Tipi */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sensör Tipi *
                </label>
                <select
                    value={routerForm.sensorType}
                    onChange={(e) => handleInputChange('sensorType', e.target.value)}
                    className={`
                        w-full px-3 py-2 border rounded-lg text-sm
                        ${errors.sensorType
                            ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                            : 'border-gray-300 dark:border-gray-600'
                        }
                        bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                        focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    `}
                >
                    <option value="">Sensör tipini seçin</option>
                    {availableSensorTypes.map(type => (
                        <option key={type} value={type}>
                            {sensorTypeConfigs[type].name}
                        </option>
                    ))}
                </select>
                {errors.sensorType && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.sensorType}</p>
                )}
                {routerForm.sensorType && sensorTypeConfigs[routerForm.sensorType] && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {sensorTypeConfigs[routerForm.sensorType].description}
                    </p>
                )}
            </div>

            {/* Ölçülecek Parametreler */}
            {parameterOptions.length > 0 && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Ölçülecek Parametreler
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {parameterOptions.map((param, index) => (
                            <span
                                key={index}
                                className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full"
                            >
                                {param}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Açıklama */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Açıklama
                </label>
                <textarea
                    placeholder="Router hakkında ek bilgiler (opsiyonel)"
                    value={routerForm.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                             focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
            </div>

            {/* Butonlar */}
            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={handleSubmit}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium
                             transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    Router Bilgilerini Kaydet
                </button>

                <button
                    type="button"
                    onClick={handleReset}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 
                             rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700
                             transition-colors duration-200"
                >
                    Temizle
                </button>
            </div>

            {/* Seçilen Router Özeti */}
            {selectedRouter && (
                <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm text-green-800 dark:text-green-200 font-medium">
                            Router Konfigürasyonu Tamamlandı
                        </span>
                    </div>

                    <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
                        <div><strong>Router ID:</strong> {selectedRouter.routerId}</div>
                        <div><strong>Sensor ID:</strong> {selectedRouter.sensorId}</div>
                        <div><strong>Ad:</strong> {selectedRouter.name}</div>
                        <div><strong>Tip:</strong> {selectedRouter.sensorType}</div>
                        {selectedRouter.parameters && selectedRouter.parameters.length > 0 && (
                            <div>
                                <strong>Parametreler:</strong> {selectedRouter.parameters.join(', ')}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Bilgilendirme */}
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex items-start space-x-2">
                    <svg className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div className="text-xs text-amber-700 dark:text-amber-300">
                        <p className="font-medium mb-1">Önemli Bilgi:</p>
                        <p>Router ID ve Sensor ID değerleri gerçek kovanınızda bulunan fiziksel cihazların ID'leri olmalıdır.
                            Bu değerler veri akışında kullanılacağı için doğru olması kritiktir.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RouterSelector;
