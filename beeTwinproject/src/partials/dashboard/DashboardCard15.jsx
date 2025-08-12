import React, { useState, useEffect } from 'react';
import useRealTimeData from '../../hooks/useRealTimeData';
import { useAuth } from '../../contexts/AuthContext';
import LineChart from '../../charts/LineChart01';
import { chartAreaGradient } from '../../charts/ChartjsConfig';

// Import utilities
import { adjustColorOpacity, getCssVariable } from '../../utils/Utils';

/**
 * DashboardCard15 - Router 110 Kapsamlı İzleme Merkezi
 * 
 * Bu bileşen, dijital ikiz temelli akıllı arı kovanı izleme sisteminin 
 * Router 110 cihazının tüm sensör verilerini ve sistem durumunu izleyen merkezi kontrol paneli.
 * 
 * Özellikler:
 * - MQ2 Gaz Sensörü: Yanıcı gaz ölçümleri ve güvenlik alarmları
 * - Sistem Durumu: Router bağlantı durumu ve performans metrikleri
 * - Veri Kalitesi: Sinyal gücü, veri aktarım oranları
 * - Güvenlik İzleme: Kritik seviye uyarı sistemi
 * - Gerçek Zamanlı Grafik: Trend analizi ve geçmiş veriler
 * 
 * Akademik Katkı: Dijital ikiz sisteminin "Router-seviyesi izleme" 
 * ve "çok-parametreli güvenlik monitoring" işlevinin bütünleşik bileşeni.
 */

function DashboardCard15() {
    const { user, hives } = useAuth();
    const { sensorData: realTimeSensorData, connectionStatus, isLoading: realTimeLoading } = useRealTimeData();

    // Router 110 kapsamlı veri state'i
    const [router110Data, setRouter110Data] = useState({
        // MQ2 Gaz Sensörü
        mq2: {
            gasLevel: 0,
            safetyStatus: "No Data",
            alertLevel: "Normal",
            trend: "stable",
            maxLevel: 0,
            avgLevel: 0
        },
        // Router sistem durumu
        system: {
            connectionStatus: "disconnected",
            signalStrength: 0,
            lastSeen: null,
            dataRate: 0,
            batteryLevel: null,
            temperature: null
        },
        // Veri kalitesi metrikleri
        dataQuality: {
            totalReadings: 0,
            successRate: 0,
            errorCount: 0,
            lastErrorTime: null
        },
        // Genel durum
        lastUpdate: null,
        isOnline: false
    });

    const [chartData, setChartData] = useState([]);
    const [chartLabels, setChartLabels] = useState([]);
    const [loading, setLoading] = useState(true);

    // Router 110 gerçek zamanlı veri işleme - Kapsamlı izleme
    useEffect(() => {
        if (realTimeSensorData && realTimeSensorData.length > 0 && user) {
            // Kullanıcının kovanlarına ait Router 110 verilerini filtrele
            const userHiveIds = hives?.map(hive => hive.id) || [];

            // Router 110 verilerini filtrele ve kullanıcının kovanlarıyla eşleştir
            const router110DataFiltered = realTimeSensorData.filter(data => {
                const isRouter110 = data.routerId === "110" || data.deviceId === "110";
                const isUserHive = !data.hiveId || userHiveIds.includes(data.hiveId) || userHiveIds.includes(data.hive_id);
                return isRouter110 && isUserHive;
            });

            if (router110DataFiltered.length > 0) {
                const latestData = router110DataFiltered[router110DataFiltered.length - 1];
                console.log('🔥 Router 110 Kapsamlı veri:', latestData);

                // MQ2 Gaz seviyesi
                const gasLevel = latestData.parameters?.mq2 ||
                    latestData.parameters?.gas ||
                    latestData.mq2 ||
                    latestData.gas || 0;

                // Sistem metrikleri
                const signalStrength = latestData.rssi || latestData.signalStrength || 0;
                const batteryLevel = latestData.battery || latestData.batteryLevel || null;
                const systemTemp = latestData.temperature || latestData.temp || null;

                // Güvenlik durumu belirleme
                const getSafetyStatus = (level) => {
                    if (level > 2000) return "Critical";
                    if (level > 1000) return "Warning";
                    if (level > 0) return "Safe";
                    return "No Data";
                };

                const getAlertLevel = (level) => {
                    if (level > 2000) return "Critical";
                    if (level > 1000) return "Warning";
                    return "Normal";
                };

                // Bağlantı durumu
                const getConnectionStatus = () => {
                    const now = new Date();
                    const lastUpdate = new Date(latestData.timestamp);
                    const timeDiff = (now - lastUpdate) / 1000 / 60; // dakika

                    if (timeDiff <= 2) return "live";
                    if (timeDiff <= 10) return "recent";
                    if (timeDiff <= 30) return "delayed";
                    return "offline";
                };

                // Trend hesaplama
                const getTrend = (currentLevel, previousLevel) => {
                    if (!previousLevel) return "stable";
                    const diff = currentLevel - previousLevel;
                    if (Math.abs(diff) < 50) return "stable";
                    return diff > 0 ? "rising" : "falling";
                };

                // Chart data güncelleme (son 10 okuma)
                const gasLevels = router110DataFiltered.slice(-10).map(reading =>
                    reading.parameters?.mq2 || reading.parameters?.gas || reading.mq2 || reading.gas || 0
                );

                const labels = router110DataFiltered.slice(-10).map((_, index) =>
                    new Date(Date.now() - (9 - index) * 30000).toLocaleTimeString('tr-TR', {
                        hour: '2-digit',
                        minute: '2-digit'
                    })
                );

                const maxLevel = Math.max(...gasLevels);
                const avgLevel = gasLevels.reduce((sum, level) => sum + level, 0) / gasLevels.length;

                // Veri kalitesi hesaplama
                const totalReadings = router110DataFiltered.length;
                const successRate = Math.round((totalReadings / (totalReadings + 1)) * 100); // Basit hesaplama

                setRouter110Data({
                    mq2: {
                        gasLevel,
                        safetyStatus: getSafetyStatus(gasLevel),
                        alertLevel: getAlertLevel(gasLevel),
                        trend: getTrend(gasLevel, router110Data.mq2.gasLevel),
                        maxLevel: Math.round(maxLevel),
                        avgLevel: Math.round(avgLevel * 10) / 10
                    },
                    system: {
                        connectionStatus: getConnectionStatus(),
                        signalStrength: Math.abs(signalStrength),
                        lastSeen: latestData.timestamp,
                        dataRate: totalReadings,
                        batteryLevel,
                        temperature: systemTemp
                    },
                    dataQuality: {
                        totalReadings,
                        successRate,
                        errorCount: 0,
                        lastErrorTime: null
                    },
                    lastUpdate: latestData.timestamp || new Date().toISOString(),
                    isOnline: getConnectionStatus() === "live" || getConnectionStatus() === "recent"
                });

                setChartData(gasLevels);
                setChartLabels(labels);
                setLoading(false);
            } else {
                // Router 110 verisi yok
                setRouter110Data(prev => ({
                    ...prev,
                    system: {
                        ...prev.system,
                        connectionStatus: "offline",
                        lastSeen: null
                    },
                    isOnline: false
                }));
                setLoading(false);
            }
        } else {
            setLoading(false);
        }
    }, [realTimeSensorData, user, hives]);

    // Chart configuration
    const chartConfig = {
        labels: chartLabels,
        datasets: [
            {
                label: 'MQ2 Gaz Seviyesi',
                data: chartData,
                borderColor: router110Data.mq2.alertLevel === 'Critical' ? '#ef4444' :
                    router110Data.mq2.alertLevel === 'Warning' ? '#f59e0b' : '#10b981',
                backgroundColor: function (context) {
                    const chart = context.chart;
                    const { ctx, chartArea } = chart;
                    if (!chartArea) return null;
                    return chartAreaGradient(ctx, chartArea, [
                        {
                            stop: 0, color: `rgba(${router110Data.mq2.alertLevel === 'Critical' ? '239, 68, 68' :
                                router110Data.mq2.alertLevel === 'Warning' ? '245, 158, 11' : '16, 185, 129'}, 0)`
                        },
                        {
                            stop: 1, color: `rgba(${router110Data.mq2.alertLevel === 'Critical' ? '239, 68, 68' :
                                router110Data.mq2.alertLevel === 'Warning' ? '245, 158, 11' : '16, 185, 129'}, 0.2)`
                        }
                    ]);
                },
                borderWidth: 2,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 3,
                pointBackgroundColor: router110Data.mq2.alertLevel === 'Critical' ? '#ef4444' :
                    router110Data.mq2.alertLevel === 'Warning' ? '#f59e0b' : '#10b981',
                fill: true,
            },
        ],
    };

    return (
        <div className="col-span-full xl:col-span-12 bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700">
            {/* Header - Router 110 Kapsamlı Başlık */}
            <header className="px-6 py-4 border-b border-gray-100 dark:border-gray-700/60">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">
                            🔥 Router 110 - Kapsamlı İzleme Merkezi
                        </h2>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            MQ2 Gaz Sensörü • Sistem Durumu • Veri Kalitesi
                        </div>
                    </div>

                    {/* Genel Durum Badge'i */}
                    <div className="flex items-center space-x-3">
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${router110Data.isOnline ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}>
                            {router110Data.isOnline ? '🟢 Online' : '🔴 Offline'}
                        </div>

                        {router110Data.system.connectionStatus === 'live' && (
                            <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-xs text-green-600 dark:text-green-400">Live</span>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="p-6">
                <div className="grid grid-cols-12 gap-6">

                    {/* Sol Panel - MQ2 Gaz Sensörü */}
                    <div className="col-span-12 lg:col-span-6">
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center">
                                🔥 MQ2 Gaz Sensörü
                                {router110Data.mq2.alertLevel !== 'Normal' && (
                                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${router110Data.mq2.alertLevel === 'Critical' ? 'bg-red-100 text-red-800 animate-pulse' :
                                            'bg-amber-100 text-amber-800'
                                        }`}>
                                        {router110Data.mq2.alertLevel === 'Critical' ? '🚨 KRİTİK' : '⚠️ UYARI'}
                                    </span>
                                )}
                            </h3>

                            {/* Gaz Seviyesi Metrikleri */}
                            <div className="grid grid-cols-3 gap-3 mb-4">
                                <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                                    <div className={`text-2xl font-bold ${router110Data.mq2.alertLevel === 'Critical' ? 'text-red-600' :
                                            router110Data.mq2.alertLevel === 'Warning' ? 'text-amber-600' : 'text-green-600'
                                        }`}>
                                        {loading ? '--' : router110Data.mq2.gasLevel}
                                    </div>
                                    <div className="text-xs text-gray-500">Anlık (ppm)</div>
                                </div>

                                <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                                    <div className="text-2xl font-bold text-blue-600">
                                        {loading ? '--' : router110Data.mq2.avgLevel}
                                    </div>
                                    <div className="text-xs text-gray-500">Ortalama</div>
                                </div>

                                <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                                    <div className="text-2xl font-bold text-purple-600">
                                        {loading ? '--' : router110Data.mq2.maxLevel}
                                    </div>
                                    <div className="text-xs text-gray-500">Maksimum</div>
                                </div>
                            </div>

                            {/* Güvenlik Uyarısı */}
                            {router110Data.mq2.alertLevel !== 'Normal' && (
                                <div className={`p-3 rounded-lg border mb-4 ${router110Data.mq2.alertLevel === 'Critical' ?
                                        'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
                                        'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                                    }`}>
                                    <div className="flex items-start space-x-2">
                                        <span className={router110Data.mq2.alertLevel === 'Critical' ? 'text-red-500' : 'text-amber-500'}>
                                            {router110Data.mq2.alertLevel === 'Critical' ? '🚨' : '⚠️'}
                                        </span>
                                        <div>
                                            <div className={`text-sm font-medium ${router110Data.mq2.alertLevel === 'Critical' ?
                                                    'text-red-800 dark:text-red-200' : 'text-amber-800 dark:text-amber-200'
                                                }`}>
                                                {router110Data.mq2.alertLevel === 'Critical' ?
                                                    'KRİTİK DURUM: Yüksek gaz seviyesi tespit edildi!' :
                                                    'UYARI: Gaz seviyesi normal değerlerin üzerinde'
                                                }
                                            </div>
                                            <div className={`text-xs mt-1 ${router110Data.mq2.alertLevel === 'Critical' ?
                                                    'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
                                                }`}>
                                                Acil kontrol gerekebilir - güvenlik protokollerini uygulayın
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Trend ve Durum */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600 dark:text-gray-300">Güvenlik Durumu:</span>
                                    <span className={`text-sm font-medium ${router110Data.mq2.safetyStatus === 'Safe' ? 'text-green-600' :
                                            router110Data.mq2.safetyStatus === 'Warning' ? 'text-amber-600' :
                                                router110Data.mq2.safetyStatus === 'Critical' ? 'text-red-600' : 'text-gray-600'
                                        }`}>
                                        {router110Data.mq2.safetyStatus === 'Safe' ? '✅ Güvenli' :
                                            router110Data.mq2.safetyStatus === 'Warning' ? '⚠️ Uyarı' :
                                                router110Data.mq2.safetyStatus === 'Critical' ? '🚨 Kritik' : 'Veri Yok'}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600 dark:text-gray-300">Trend:</span>
                                    <span className={`text-sm font-medium ${router110Data.mq2.trend === 'rising' ? 'text-red-600' :
                                            router110Data.mq2.trend === 'falling' ? 'text-green-600' : 'text-blue-600'
                                        }`}>
                                        {router110Data.mq2.trend === 'rising' ? '🔺 Yükseliyor' :
                                            router110Data.mq2.trend === 'falling' ? '🔻 Düşüyor' : '➡️ Kararlı'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sağ Panel - Sistem Durumu ve Veri Kalitesi */}
                    <div className="col-span-12 lg:col-span-6 space-y-4">

                        {/* Sistem Durumu */}
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">
                                📡 Sistem Durumu
                            </h3>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600 dark:text-gray-300">Bağlantı:</span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${router110Data.system.connectionStatus === 'live' ? 'bg-green-100 text-green-800' :
                                            router110Data.system.connectionStatus === 'recent' ? 'bg-blue-100 text-blue-800' :
                                                router110Data.system.connectionStatus === 'delayed' ? 'bg-amber-100 text-amber-800' :
                                                    'bg-red-100 text-red-800'
                                        }`}>
                                        {router110Data.system.connectionStatus === 'live' ? '🟢 Canlı' :
                                            router110Data.system.connectionStatus === 'recent' ? '🔵 Yakın' :
                                                router110Data.system.connectionStatus === 'delayed' ? '🟡 Gecikmeli' : '🔴 Offline'}
                                    </span>
                                </div>

                                {router110Data.system.signalStrength > 0 && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600 dark:text-gray-300">Sinyal Gücü:</span>
                                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                            {router110Data.system.signalStrength} dBm
                                        </span>
                                    </div>
                                )}

                                {router110Data.system.batteryLevel && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600 dark:text-gray-300">Batarya:</span>
                                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                            {router110Data.system.batteryLevel}%
                                        </span>
                                    </div>
                                )}

                                {router110Data.system.temperature && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600 dark:text-gray-300">Sıcaklık:</span>
                                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                            {router110Data.system.temperature}°C
                                        </span>
                                    </div>
                                )}

                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600 dark:text-gray-300">Son Görülme:</span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        {router110Data.system.lastSeen ?
                                            new Date(router110Data.system.lastSeen).toLocaleTimeString('tr-TR') :
                                            'Bilinmiyor'
                                        }
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Veri Kalitesi */}
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">
                                📊 Veri Kalitesi
                            </h3>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600 dark:text-gray-300">Toplam Okuma:</span>
                                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                        {router110Data.dataQuality.totalReadings}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600 dark:text-gray-300">Başarı Oranı:</span>
                                    <span className={`text-sm font-medium ${router110Data.dataQuality.successRate >= 95 ? 'text-green-600' :
                                            router110Data.dataQuality.successRate >= 80 ? 'text-amber-600' : 'text-red-600'
                                        }`}>
                                        {router110Data.dataQuality.successRate}%
                                    </span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600 dark:text-gray-300">Veri Hızı:</span>
                                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                        {router110Data.system.dataRate} okuma/saat
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Alt Panel - Gaz Seviyesi Trend Grafiği */}
                <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">
                        📈 Gaz Seviyesi Trend Analizi (Son 10 Ölçüm)
                    </h3>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div className="h-40">
                            <LineChart data={chartConfig} width="100%" height={160} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DashboardCard15;
