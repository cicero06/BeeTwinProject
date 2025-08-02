import React, { useState, useEffect } from 'react';
import useRealTimeData from '../../hooks/useRealTimeData';
import { useAuth } from '../../contexts/AuthContext';
import LineChart from '../../charts/LineChart01';
import { chartAreaGradient } from '../../charts/ChartjsConfig';

// Import utilities
import { adjustColorOpacity, getCssVariable } from '../../utils/Utils';

/**
 * DashboardCard15 - Router 110 MQ2 Gaz Sensörü
 * 
 * Bu bileşen, dijital ikiz temelli akıllı arı kovanı izleme sisteminin 
 * Router 110 MQ2 sensöründen gelen yanıcı gaz verilerini analiz eden katmanını oluşturmaktadır.
 * 
 * Özellikler:
 * - MQ2 sensöründen gerçek zamanlı yanıcı gaz ölçümleri
 * - Güvenlik alarm sistemi
 * - Gaz seviyesi trend analizi
 * - Kritik seviye uyarı sistemi
 * 
 * Akademik Katkı: Dijital ikiz sisteminin güvenlik monitoring
 * ve "karar destek" işlevinin yanıcı gaz parametresi bileşeni.
 */

function DashboardCard15() {
    const { user, hives } = useAuth();
    const { sensorData: realTimeSensorData, connectionStatus, isLoading: realTimeLoading } = useRealTimeData();

    const [mq2Data, setMq2Data] = useState({
        gasLevel: 0,
        safetyStatus: "No Data",
        alertLevel: "Normal",
        lastUpdate: null,
        trend: "stable",
        maxLevel: 0,
        avgLevel: 0
    });

    const [chartData, setChartData] = useState([]);
    const [chartLabels, setChartLabels] = useState([]);
    const [loading, setLoading] = useState(true);

    // Router 110 (MQ2) gerçek zamanlı veri işleme - Kullanıcıya özel filtre
    useEffect(() => {
        if (realTimeSensorData && realTimeSensorData.length > 0 && user) {
            // Kullanıcının kovanlarına ait Router 110 verilerini filtrele
            const userHiveIds = hives?.map(hive => hive.id) || [];

            // Router 110 verilerini filtrele ve kullanıcının kovanlarıyla eşleştir
            const router110Data = realTimeSensorData.filter(data => {
                const isRouter110 = data.routerId === "110" || data.deviceId === "110";
                // Eğer hiveId belirtilmişse, kullanıcının kovanlarından olmalı
                const isUserHive = !data.hiveId || userHiveIds.includes(data.hiveId) || userHiveIds.includes(data.hive_id);
                return isRouter110 && isUserHive;
            });

            if (router110Data.length > 0) {
                const latestData = router110Data[router110Data.length - 1];
                console.log('🔥 Router 110 Real-time MQ2 gas data:', latestData);

                const gasLevel = latestData.parameters?.mq2 ||
                    latestData.parameters?.gas ||
                    latestData.mq2 ||
                    latestData.gas || 0;

                // Güvenlik durumu belirleme
                const getSafetyStatus = (level) => {
                    if (level > 2000) return "Critical";
                    if (level > 1000) return "Warning";
                    if (level > 0) return "Safe";
                    return "No Data";
                };

                // Alert seviyesi belirleme
                const getAlertLevel = (level) => {
                    if (level > 2000) return "Critical";
                    if (level > 1000) return "Warning";
                    return "Normal";
                };

                // Trend hesaplama (basit)
                const getTrend = (currentLevel, previousLevel) => {
                    if (!previousLevel) return "stable";
                    const diff = currentLevel - previousLevel;
                    if (Math.abs(diff) < 50) return "stable";
                    return diff > 0 ? "rising" : "falling";
                };

                // Chart data güncelleme (son 10 okuma)
                const gasLevels = router110Data.slice(-10).map(reading =>
                    reading.parameters?.mq2 || reading.parameters?.gas || reading.mq2 || reading.gas || 0
                );

                const labels = router110Data.slice(-10).map((_, index) =>
                    new Date(Date.now() - (9 - index) * 30000).toLocaleTimeString('tr-TR', {
                        hour: '2-digit',
                        minute: '2-digit'
                    })
                );

                const maxLevel = Math.max(...gasLevels);
                const avgLevel = gasLevels.reduce((sum, level) => sum + level, 0) / gasLevels.length;

                setMq2Data({
                    gasLevel,
                    safetyStatus: getSafetyStatus(gasLevel),
                    alertLevel: getAlertLevel(gasLevel),
                    lastUpdate: latestData.timestamp || new Date().toISOString(),
                    trend: getTrend(gasLevel, mq2Data.gasLevel),
                    maxLevel: Math.round(maxLevel),
                    avgLevel: Math.round(avgLevel * 10) / 10
                });

                setChartData(gasLevels);
                setChartLabels(labels);
                setLoading(false);
            }
        }
    }, [realTimeSensorData, user, hives]);

    // Chart configuration
    const chartConfig = {
        labels: chartLabels,
        datasets: [
            {
                label: 'MQ2 Gaz Seviyesi',
                data: chartData,
                borderColor: mq2Data.alertLevel === 'Critical' ? '#ef4444' :
                    mq2Data.alertLevel === 'Warning' ? '#f59e0b' : '#10b981',
                backgroundColor: function (context) {
                    const chart = context.chart;
                    const { ctx, chartArea } = chart;
                    if (!chartArea) return null;
                    return chartAreaGradient(ctx, chartArea, [
                        {
                            stop: 0, color: `rgba(${mq2Data.alertLevel === 'Critical' ? '239, 68, 68' :
                                mq2Data.alertLevel === 'Warning' ? '245, 158, 11' : '16, 185, 129'}, 0)`
                        },
                        {
                            stop: 1, color: `rgba(${mq2Data.alertLevel === 'Critical' ? '239, 68, 68' :
                                mq2Data.alertLevel === 'Warning' ? '245, 158, 11' : '16, 185, 129'}, 0.2)`
                        }
                    ]);
                },
                borderWidth: 2,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 3,
                pointBackgroundColor: mq2Data.alertLevel === 'Critical' ? '#ef4444' :
                    mq2Data.alertLevel === 'Warning' ? '#f59e0b' : '#10b981',
                fill: true,
            },
        ],
    };

    return (
        <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-xs rounded-xl border border-gray-200 dark:border-gray-700">
            {/* Header - MQ2 Gaz Sensörü Başlığı */}
            <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">
                        🔥 Router 110 - MQ2 Gaz Sensörü
                    </h2>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        Yanıcı Gaz ve Güvenlik Monitoring
                    </div>
                </div>
                {/* Güvenlik Durumu Göstergesi */}
                <div className="flex items-center space-x-2">
                    <div className={`h-3 w-3 rounded-full ${mq2Data.safetyStatus === "Safe" ? 'bg-green-500' :
                            mq2Data.safetyStatus === "Warning" ? 'bg-amber-500' :
                                mq2Data.safetyStatus === "Critical" ? 'bg-red-500 animate-pulse' : 'bg-gray-400'
                        }`}></div>
                    <span className={`text-sm font-medium ${mq2Data.safetyStatus === "Safe" ? 'text-green-600' :
                            mq2Data.safetyStatus === "Warning" ? 'text-amber-600' :
                                mq2Data.safetyStatus === "Critical" ? 'text-red-600' : 'text-gray-600'
                        }`}>
                        {mq2Data.safetyStatus === "Safe" ? "Güvenli" :
                            mq2Data.safetyStatus === "Warning" ? "Uyarı" :
                                mq2Data.safetyStatus === "Critical" ? "KRİTİK" : "Veri Yok"}
                    </span>
                </div>
                {/* Real-time indicator */}
                {connectionStatus && mq2Data.lastUpdate && (
                    <div className="flex items-center space-x-1 ml-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-green-600 dark:text-green-400">Live</span>
                    </div>
                )}
            </header>

            {/* MQ2 Gas Metrics */}
            <div className="px-5 py-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                    {/* Anlık Gaz Seviyesi */}
                    <div className="text-center">
                        <div className={`text-2xl font-bold ${mq2Data.alertLevel === "Critical" ? "text-red-600" :
                                mq2Data.alertLevel === "Warning" ? "text-amber-600" : "text-green-600"
                            }`}>
                            {loading ? '--' : mq2Data.gasLevel}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            Anlık (ppm)
                        </div>
                    </div>

                    {/* Ortalama Seviye */}
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {loading ? '--' : mq2Data.avgLevel}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            Ortalama (ppm)
                        </div>
                    </div>
                </div>

                {/* Güvenlik Uyarısı */}
                {mq2Data.alertLevel !== "Normal" && (
                    <div className={`mb-4 p-3 rounded-lg border ${mq2Data.alertLevel === "Critical" ?
                            "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" :
                            "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
                        }`}>
                        <div className="flex items-center space-x-2">
                            <span className={mq2Data.alertLevel === "Critical" ? "text-red-500" : "text-amber-500"}>
                                {mq2Data.alertLevel === "Critical" ? "🚨" : "⚠️"}
                            </span>
                            <div>
                                <div className={`text-sm font-medium ${mq2Data.alertLevel === "Critical" ?
                                        "text-red-800 dark:text-red-200" :
                                        "text-amber-800 dark:text-amber-200"
                                    }`}>
                                    {mq2Data.alertLevel === "Critical" ?
                                        "KRİTİK DURUM: Yüksek gaz seviyesi!" :
                                        "UYARI: Gaz seviyesi normal değerlerin üzerinde"
                                    }
                                </div>
                                <div className={`text-xs ${mq2Data.alertLevel === "Critical" ?
                                        "text-red-600 dark:text-red-400" :
                                        "text-amber-600 dark:text-amber-400"
                                    }`}>
                                    Acil kontrol gerekebilir - güvenlik protokollerini uygulayın
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Status Summary */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Maksimum Seviye:</span>
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            {mq2Data.maxLevel} ppm
                        </span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Trend:</span>
                        <span className={`text-sm font-medium ${mq2Data.trend === "rising" ? "text-red-600" :
                                mq2Data.trend === "falling" ? "text-green-600" : "text-blue-600"
                            }`}>
                            {mq2Data.trend === "rising" ? "🔺 Yükseliyor" :
                                mq2Data.trend === "falling" ? "🔻 Düşüyor" : "➡️ Kararlı"}
                        </span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Son Ölçüm:</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            {mq2Data.lastUpdate ?
                                new Date(mq2Data.lastUpdate).toLocaleTimeString('tr-TR') :
                                'Veri yok'
                            }
                        </span>
                    </div>
                </div>
            </div>

            {/* Gas Level Trend Chart */}
            <div className="grow px-5 pb-5">
                <div className="h-32">
                    <LineChart data={chartConfig} width={389} height={128} />
                </div>
            </div>
        </div>
    );
}

export default DashboardCard15;
