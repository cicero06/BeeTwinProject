import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import useRealTimeData from '../hooks/useRealTimeData';
import LineChart from '../charts/LineChart01';

// Import utilities
import { adjustColorOpacity, getCssVariable } from '../utils/Utils';

import {
    getDeviceConfig,
    getDeviceSensorData,
    getLatestDeviceData
} from '../utils/deviceDataUtils';

/**
 * DeviceCard - Device ID Merkezli Dashboard Kartı
 */
function DeviceCard({ deviceId, chartType = 'line' }) {
    const { user, hives } = useAuth();
    const { sensorData: realTimeSensorData, connectionStatus } = useRealTimeData();

    // Device konfigürasyonunu al
    const deviceConfig = getDeviceConfig(deviceId);

    const [deviceData, setDeviceData] = useState({
        sensors: {},
        isOnline: false,
        lastUpdate: null,
        alertCount: 0,
        trend: "stable"
    });
    const [chartData, setChartData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Helper function - sensor birimlerini al
    const getSensorUnit = (sensorType) => {
        const units = {
            temperature: '°C',
            humidity: '%',
            pressure: 'Pa',
            co2: 'ppm',
            nh3: 'ppm',
            voc: 'ppb',
            weight: 'kg',
            mq2: 'ppm',
            gas: 'ppm',
            co: 'ppm',
            no2: 'ppm'
        };
        return units[sensorType] || '';
    };

    // Test verisi oluştur (fallback)
    const generateTestData = () => {
        if (!deviceConfig) return null;

        console.log(`🧪 ${deviceId} - Generating fallback test data`);

        const testData = {
            deviceId: deviceId,
            routerId: deviceId.replace('BT', ''),
            parameters: {},
            timestamp: new Date().toISOString()
        };

        deviceConfig.sensors.forEach(sensorType => {
            const range = deviceConfig.optimalRanges[sensorType];
            if (range) {
                const value = (range.min + range.max) / 2 + (Math.random() - 0.5) * 10;
                testData.parameters[sensorType] = Math.round(value * 10) / 10;
            }
        });

        return testData;
    };

    // API'den gerçek veri çekme
    const fetchDeviceData = async () => {
        if (!deviceConfig || !user) return;

        setLoading(true);
        try {
            const routerId = deviceId.replace('BT', ''); // BT107 -> 107
            const token = localStorage.getItem('token');

            console.log(`📡 ${deviceId} - Fetching real data from API for router:`, routerId);

            const response = await fetch(`http://localhost:5000/api/sensors/router/${routerId}/latest`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();

                if (result.success && result.data) {
                    console.log(`✅ ${deviceId} - Real API data received:`, result.data);
                    console.log(`🔍 ${deviceId} - Available data keys:`, Object.keys(result.data));
                    console.log(`🔍 ${deviceId} - Expected sensors:`, deviceConfig.sensors);

                    // Sensor verilerini hazırla
                    const sensors = {};
                    deviceConfig.sensors.forEach(sensorType => {
                        const value = result.data[sensorType];
                        console.log(`🔍 ${deviceId} - ${sensorType}: ${value} (from API)`);
                        const range = deviceConfig.optimalRanges[sensorType];

                        let status = 'normal';
                        if (range && value !== null && value !== undefined) {
                            if (value < range.min || value > range.max) {
                                status = 'warning';
                            }
                        }

                        sensors[sensorType] = {
                            value,
                            status,
                            range,
                            unit: getSensorUnit(sensorType)
                        };
                    });

                    setDeviceData({
                        sensors,
                        isOnline: true,
                        lastUpdate: result.data.timestamp || new Date().toISOString(),
                        alertCount: Object.values(sensors).filter(s => s.status === 'warning').length,
                        trend: "stable"
                    });

                    return result.data;
                }
            } else {
                console.log(`⚠️ ${deviceId} - API response not OK:`, response.status);
            }
        } catch (error) {
            console.error(`❌ ${deviceId} - API fetch error:`, error);
        }

        return null;
    };

    // Device veri işleme - Gerçek API + WebSocket + Fallback
    useEffect(() => {
        if (!deviceConfig || !user) {
            setLoading(false);
            return;
        }

        console.log(`🔍 DeviceCard ${deviceId} - Processing real data...`);

        // 1. Önce WebSocket'ten gelen real-time veriyi kontrol et
        const userHiveIds = user.hives || [];
        const realtimeDeviceData = getDeviceSensorData(realTimeSensorData, deviceId, userHiveIds);

        if (realtimeDeviceData.length > 0) {
            console.log(`🔄 ${deviceId} - Using WebSocket real-time data:`, realtimeDeviceData);
            const latestData = getLatestDeviceData(realTimeSensorData, deviceId, userHiveIds);

            if (latestData) {
                console.log(`🔍 ${deviceId} - Latest WebSocket data:`, latestData);
                console.log(`🔍 ${deviceId} - Available WebSocket keys:`, Object.keys(latestData));
                console.log(`🔍 ${deviceId} - Parameters:`, latestData.parameters);

                // Real-time veriden sensor bilgilerini çıkar
                const sensors = {};
                deviceConfig.sensors.forEach(sensorType => {
                    const value = latestData.parameters?.[sensorType] || latestData[sensorType];
                    console.log(`🔍 ${deviceId} - WebSocket ${sensorType}: ${value}`);
                    const range = deviceConfig.optimalRanges[sensorType]; let status = 'normal';
                    if (range && value !== null && value !== undefined) {
                        if (value < range.min || value > range.max) {
                            status = 'warning';
                        }
                    }

                    sensors[sensorType] = {
                        value,
                        status,
                        range,
                        unit: getSensorUnit(sensorType)
                    };
                });

                setDeviceData({
                    sensors,
                    isOnline: connectionStatus,
                    lastUpdate: latestData.timestamp || new Date().toISOString(),
                    alertCount: Object.values(sensors).filter(s => s.status === 'warning').length,
                    trend: "stable"
                });

                // Chart verisi
                if (deviceConfig.sensors.length > 0) {
                    const primarySensor = deviceConfig.sensors[0];
                    const chartValues = realtimeDeviceData.slice(-10).map(data =>
                        data.parameters?.[primarySensor] || data[primarySensor] || 0
                    );

                    const mockChartData = {
                        labels: Array.from({ length: chartValues.length }, (_, i) => `${chartValues.length - i} dk`),
                        datasets: [{
                            label: `${deviceConfig.name} ${primarySensor}`,
                            data: chartValues,
                            borderColor: getCssVariable(`--color-${deviceConfig.color}-500`),
                            backgroundColor: adjustColorOpacity(getCssVariable(`--color-${deviceConfig.color}-500`), 0.1),
                        }]
                    };
                    setChartData(mockChartData);
                }

                setLoading(false);
                return;
            }
        }

        // 2. WebSocket verisi yoksa API'den çek
        fetchDeviceData().then(apiData => {
            if (!apiData) {
                // 3. API verisi de yoksa test verisi kullan
                console.log(`🧪 ${deviceId} - No real data, using test data`);
                const testData = generateTestData();

                if (testData) {
                    // Test veriden sensor bilgilerini çıkar
                    const sensors = {};
                    deviceConfig.sensors.forEach(sensorType => {
                        const value = testData.parameters[sensorType];
                        const range = deviceConfig.optimalRanges[sensorType];

                        let status = 'normal';
                        if (range && value !== null && value !== undefined) {
                            if (value < range.min || value > range.max) {
                                status = 'warning';
                            }
                        }

                        sensors[sensorType] = {
                            value,
                            status,
                            range,
                            unit: getSensorUnit(sensorType)
                        };
                    });

                    setDeviceData({
                        sensors,
                        isOnline: false, // Test verisi olduğu için offline
                        lastUpdate: testData.timestamp,
                        alertCount: Object.values(sensors).filter(s => s.status === 'warning').length,
                        trend: "stable"
                    });

                    // Chart verisi
                    if (deviceConfig.sensors.length > 0) {
                        const primarySensor = deviceConfig.sensors[0];
                        const mockChartData = {
                            labels: Array.from({ length: 10 }, (_, i) => `${10 - i} dk`),
                            datasets: [{
                                label: `${deviceConfig.name} ${primarySensor}`,
                                data: Array.from({ length: 10 }, () => {
                                    const range = deviceConfig.optimalRanges[primarySensor];
                                    return range ? range.min + Math.random() * (range.max - range.min) : Math.random() * 100;
                                }),
                                borderColor: getCssVariable(`--color-${deviceConfig.color}-500`),
                                backgroundColor: adjustColorOpacity(getCssVariable(`--color-${deviceConfig.color}-500`), 0.1),
                            }]
                        };
                        setChartData(mockChartData);
                    }
                }
            }

            setLoading(false);
        });

    }, [deviceId, deviceConfig, realTimeSensorData, connectionStatus, user]);

    // Auto-refresh için API polling
    useEffect(() => {
        if (!deviceConfig || !user) return;

        const interval = setInterval(() => {
            // Eğer WebSocket bağlantısı varsa polling yapma
            if (connectionStatus) {
                console.log(`🔄 ${deviceId} - WebSocket active, skipping API polling`);
                return;
            }

            // WebSocket yoksa API'den veri çek
            console.log(`📡 ${deviceId} - Polling API for fresh data`);
            fetchDeviceData();
        }, 10000); // 10 saniyede bir API'yi kontrol et

        return () => clearInterval(interval);
    }, [deviceConfig, user, connectionStatus]);

    // Status rengini al
    const getStatusColor = (status) => {
        switch (status) {
            case 'normal': return 'text-green-600 dark:text-green-400';
            case 'warning': return 'text-amber-600 dark:text-amber-400';
            case 'critical': return 'text-red-600 dark:text-red-400';
            default: return 'text-gray-600 dark:text-gray-400';
        }
    };

    // Loading state
    if (loading || !deviceConfig) {
        return (
            <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-xs rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="px-5 py-4 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                        <div className="text-sm text-gray-500">Device yükleniyor...</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-xs rounded-xl border border-${deviceConfig.color}-200 dark:border-gray-700`}>
            {/* Header */}
            <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                        {deviceConfig.icon} {deviceConfig.name}
                    </h2>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        {deviceConfig.sensorType} - {deviceConfig.description}
                    </div>
                </div>

                {/* Status Indicator */}
                <div className="flex items-center space-x-2">
                    <div className={`h-3 w-3 rounded-full ${deviceData.isOnline
                        ? 'bg-green-500 animate-pulse'
                        : 'bg-red-500'
                        }`}></div>
                    <span className={`text-sm font-medium ${deviceData.isOnline
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                        }`}>
                        {deviceData.isOnline ? 'Online' : 'Offline'}
                    </span>
                </div>
            </header>

            {/* Sensor Values */}
            <div className="px-5 py-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                    {Object.entries(deviceData.sensors).map(([sensorType, sensorInfo]) => (
                        <div key={sensorType} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 capitalize">
                                {sensorType}
                            </div>
                            <div className={`text-lg font-bold ${getStatusColor(sensorInfo.status)}`}>
                                {sensorInfo.value !== null && sensorInfo.value !== undefined
                                    ? `${sensorInfo.value.toFixed(1)}${sensorInfo.unit}`
                                    : 'N/A'
                                }
                            </div>
                            {sensorInfo.range && (
                                <div className="text-xs text-gray-400">
                                    Optimal: {sensorInfo.range.min}-{sensorInfo.range.max}{sensorInfo.unit}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Chart */}
                {chartData && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg">
                        <LineChart
                            data={chartData}
                            width={389}
                            height={128}
                        />
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700/60">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${deviceData.isOnline
                            ? 'bg-blue-500 animate-pulse'
                            : 'bg-amber-500'
                            }`}></div>
                        <span>
                            {deviceData.isOnline ? 'Gerçek Veri' : 'Test Verisi'}
                        </span>
                    </div>
                    <div>
                        {deviceData.lastUpdate && (
                            <span>Son güncelleme: {new Date(deviceData.lastUpdate).toLocaleTimeString('tr-TR')}</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DeviceCard;
