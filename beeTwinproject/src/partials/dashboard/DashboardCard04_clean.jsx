import React, { useState, useEffect } from 'react';
import useRealTimeData from '../../hooks/useRealTimeData';
import BarChart from '../../charts/BarChart01';

// Import utilities
import { getCssVariable } from '../../utils/Utils';

/**
 * DashboardCard04 - Router 107 BME280 Nem Seviyeleri
 * 
 * Bu bileşen, dijital ikiz temelli akıllı arı kovanı izleme sisteminin 
 * Router 107 BME280 sensöründen gelen nem verilerini analiz eden katmanını oluşturmaktadır.
 * 
 * Özellikler:
 * - Router 107 BME280 sensöründen gerçek zamanlı nem ölçümleri
 * - Optimal nem aralığı karşılaştırması (%40-60)
 * - Nem anomali tespiti
 * - Trend analizi
 * 
 * Akademik Katkı: Dijital ikiz sisteminin sensör veri analizi 
 * ve "izleme ve görselleştirme" işlevinin nem parametresi bileşeni.
 */

function DashboardCard04() {
    const { sensorData: realTimeSensorData, connectionStatus, isLoading: realTimeLoading } = useRealTimeData();

    const [humidityData, setHumidityData] = useState({
        currentAverage: 0,
        minHumidity: 0,
        maxHumidity: 0,
        optimalRange: { min: 40, max: 60 },
        alertCount: 0,
        dryHives: 0,
        wetHives: 0,
        trendDirection: "stable",
        lastUpdate: null
    });

    // Router 107 (BME280) nem verisi işleme
    useEffect(() => {
        if (realTimeSensorData && realTimeSensorData.length > 0) {
            // Router 107 verilerini filtrele (nem verisi için)
            const router107Data = realTimeSensorData.filter(data =>
                data.routerId === "107" || data.deviceId === "107"
            );

            if (router107Data.length > 0) {
                console.log('💧 Router 107 Real-time humidity data:', router107Data);

                // Nem verilerini çıkar
                const humidityReadings = router107Data
                    .map(reading => reading.parameters?.humidity || reading.humidity)
                    .filter(h => h !== null && h !== undefined);

                if (humidityReadings.length > 0) {
                    const avgHumidity = humidityReadings.reduce((sum, h) => sum + h, 0) / humidityReadings.length;
                    const minHumidity = Math.min(...humidityReadings);
                    const maxHumidity = Math.max(...humidityReadings);

                    // Optimal aralık kontrolü
                    const optimalMin = 40;
                    const optimalMax = 60;

                    const dryReadings = humidityReadings.filter(h => h < optimalMin);
                    const wetReadings = humidityReadings.filter(h => h > optimalMax);
                    const alertCount = dryReadings.length + wetReadings.length;

                    // Trend hesaplama (basit)
                    const getTrend = () => {
                        if (humidityReadings.length < 2) return "stable";
                        const recent = humidityReadings.slice(-3);
                        const older = humidityReadings.slice(-6, -3);
                        if (recent.length === 0 || older.length === 0) return "stable";

                        const recentAvg = recent.reduce((sum, h) => sum + h, 0) / recent.length;
                        const olderAvg = older.reduce((sum, h) => sum + h, 0) / older.length;

                        const diff = recentAvg - olderAvg;
                        if (Math.abs(diff) < 2) return "stable";
                        return diff > 0 ? "rising" : "falling";
                    };

                    setHumidityData({
                        currentAverage: Math.round(avgHumidity * 10) / 10,
                        minHumidity: Math.round(minHumidity * 10) / 10,
                        maxHumidity: Math.round(maxHumidity * 10) / 10,
                        optimalRange: { min: optimalMin, max: optimalMax },
                        alertCount: alertCount,
                        dryHives: dryReadings.length,
                        wetHives: wetReadings.length,
                        trendDirection: getTrend(),
                        lastUpdate: router107Data[router107Data.length - 1].timestamp || new Date().toISOString()
                    });
                }
            }
        }
    }, [realTimeSensorData]);

    // Fallback static data (eğer gerçek veri yoksa)
    const defaultHumidityData = {
        currentAverage: 47.3,
        minHumidity: 38.2,
        maxHumidity: 58.7,
        optimalRange: { min: 40, max: 60 },
        alertCount: 4,
        dryHives: 2,
        wetHives: 2,
        trendDirection: "stable",
        lastUpdate: "2025-08-02T10:30:00Z"
    };

    // Kullanılacak veri (gerçek veri varsa onu, yoksa default)
    const currentData = humidityData.lastUpdate ? humidityData : defaultHumidityData;

    const chartData = {
        labels: [
            'Kovan-DT-001', 'Kovan-DT-002', 'Kovan-DT-003',
            'Kovan-DT-004', 'Kovan-DT-005', 'Kovan-DT-006',
        ],
        datasets: [
            {
                label: 'Nem Seviyeleri (%)',
                data: [
                    currentData.currentAverage - 5,
                    currentData.currentAverage + 3,
                    currentData.currentAverage - 2,
                    currentData.currentAverage + 7,
                    currentData.currentAverage,
                    currentData.currentAverage - 4,
                ],
                backgroundColor: getCssVariable('--color-blue-500'),
                hoverBackgroundColor: getCssVariable('--color-blue-600'),
                barPercentage: 0.7,
                categoryPercentage: 0.7,
                borderRadius: 4,
            },
        ],
    };

    return (
        <div className="flex flex-col col-span-full sm:col-span-6 bg-white dark:bg-gray-800 shadow-xs rounded-xl border border-blue-200 dark:border-gray-700">
            {/* Header - Nem Seviyeleri Başlığı */}
            <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                        💧 Router 107 - BME280 Nem Seviyeleri
                    </h2>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        Optimal Aralık: {currentData.optimalRange.min}-{currentData.optimalRange.max}%
                    </div>
                </div>
                {/* Nem Durumu Göstergesi */}
                <div className="flex items-center space-x-2">
                    <div className={`h-3 w-3 rounded-full ${currentData.currentAverage >= currentData.optimalRange.min &&
                        currentData.currentAverage <= currentData.optimalRange.max
                        ? 'bg-green-500' : 'bg-amber-500'
                        }`}></div>
                    <span className="text-lg font-bold text-gray-800 dark:text-gray-100">
                        {currentData.currentAverage}%
                    </span>
                </div>
                {/* Real-time indicator */}
                {connectionStatus && humidityData.lastUpdate && (
                    <div className="flex items-center space-x-1 ml-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-green-600 dark:text-green-400">Live</span>
                    </div>
                )}
            </header>

            {/* Humidity Metrics */}
            <div className="px-5 py-4">
                <div className="grid grid-cols-3 gap-4 mb-4">
                    {/* Ortalama Nem */}
                    <div className="text-center">
                        <div className="text-xl font-bold text-gray-800 dark:text-gray-100">
                            {currentData.currentAverage}%
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            Ortalama
                        </div>
                    </div>

                    {/* Minimum */}
                    <div className="text-center">
                        <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                            {currentData.minHumidity}%
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            Min
                        </div>
                    </div>

                    {/* Maximum */}
                    <div className="text-center">
                        <div className="text-xl font-bold text-red-600 dark:text-red-400">
                            {currentData.maxHumidity}%
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            Max
                        </div>
                    </div>
                </div>

                {/* Humidity Status */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Optimal Aralık Dışı:</span>
                        <span className={`text-sm font-medium ${currentData.alertCount > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                            {currentData.alertCount} ölçüm
                        </span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Çok Kuru (&lt;40%):</span>
                        <span className="text-sm font-medium text-orange-600">
                            {currentData.dryHives} ölçüm
                        </span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Çok Nemli (&gt;60%):</span>
                        <span className="text-sm font-medium text-blue-600">
                            {currentData.wetHives} ölçüm
                        </span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Trend:</span>
                        <span className={`text-sm font-medium ${currentData.trendDirection === "rising" ? "text-blue-600" :
                                currentData.trendDirection === "falling" ? "text-orange-600" : "text-green-600"
                            }`}>
                            {currentData.trendDirection === "rising" ? "🔺 Yükseliyor" :
                                currentData.trendDirection === "falling" ? "🔻 Düşüyor" : "➡️ Kararlı"}
                        </span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Son Güncelleme:</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(currentData.lastUpdate).toLocaleTimeString('tr-TR')}
                        </span>
                    </div>
                </div>
            </div>

            {/* Humidity Distribution Chart */}
            <div className="grow px-5 pb-5">
                <div className="h-48">
                    <BarChart data={chartData} width={595} height={192} />
                </div>
            </div>
        </div>
    );
}

export default DashboardCard04;
