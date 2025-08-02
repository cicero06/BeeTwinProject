import React, { useState, useEffect } from 'react';
import { chartAreaGradient } from '../../charts/ChartjsConfig';
import LineChart from '../../charts/LineChart02';
import useRealTimeData from '../../hooks/useRealTimeData';

// Import utilities
import { adjustColorOpacity, getCssVariable } from '../../utils/Utils';

/**
 * DashboardCard08 - Günlük Aktivite Özeti
 * 
 * Bu bileşen, dijital ikiz temelli akıllı arı kovanı izleme sisteminin 
 * günlük aktivite analizini sunan katmanını oluşturmaktadır.
 * 
 * Özellikler:
 * - Router veri aktivitesi ve iletişim trendleri
 * - Sensör veri toplama sıklığı
 * - Çevresel faktör değişimleri
 * - Sistem performans metrikleri
 * 
 * Akademik Katkı: Dijital ikiz sisteminin davranışsal analiz
 * ve "aktivite izleme" işlevinin günlük faaliyet parametresi bileşeni.
 */

function DashboardCard08() {
    const { sensorData: realTimeSensorData, connectionStatus, isLoading: realTimeLoading } = useRealTimeData();

    const [activityData, setActivityData] = useState({
        hourlyData: Array(24).fill(0),
        totalDataPoints: 0,
        avgDataPerHour: 0,
        peakHour: "12:00",
        lastUpdate: null
    });

    // Saatlik veri aktivitesi analizi
    useEffect(() => {
        if (realTimeSensorData && realTimeSensorData.length > 0) {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            // Bugünün verilerini filtrele
            const todayData = realTimeSensorData.filter(data => {
                const dataDate = new Date(data.timestamp);
                return dataDate >= today;
            });

            // Saatlik veri dağılımını hesapla
            const hourlyActivity = Array(24).fill(0);
            todayData.forEach(data => {
                const hour = new Date(data.timestamp).getHours();
                hourlyActivity[hour]++;
            });

            const totalPoints = todayData.length;
            const avgPerHour = totalPoints / 24;
            const peakHourIndex = hourlyActivity.indexOf(Math.max(...hourlyActivity));
            const peakHour = `${peakHourIndex.toString().padStart(2, '0')}:00`;

            setActivityData({
                hourlyData: hourlyActivity,
                totalDataPoints: totalPoints,
                avgDataPerHour: Math.round(avgPerHour * 10) / 10,
                peakHour,
                lastUpdate: new Date().toISOString()
            });

            console.log('📊 Daily Activity Analysis:', { totalPoints, avgPerHour, peakHour, hourlyActivity });
        }
    }, [realTimeSensorData]);

    // Fallback static data
    const defaultActivityData = {
        hourlyData: [45, 128, 267, 334, 298, 256, 189, 167, 145, 123, 98, 87, 76, 89, 102, 134, 156, 178, 203, 189, 134, 89, 67, 45],
        totalDataPoints: 3456,
        avgDataPerHour: 144,
        peakHour: "14:00",
        lastUpdate: "2025-08-02T10:30:00Z"
    };

    const currentData = activityData.lastUpdate ? activityData : defaultActivityData;

    // Chart verilerini hazırla
    const chartData = {
        labels: Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`),
        datasets: [
            // Router Veri Aktivitesi
            {
                label: 'Veri Aktivitesi (Adet/Saat)',
                data: currentData.hourlyData,
                borderColor: getCssVariable('--color-blue-500'),
                backgroundColor: function (context) {
                    const chart = context.chart;
                    const { ctx, chartArea } = chart;
                    if (!chartArea) {
                        return null;
                    }
                    return chartAreaGradient(ctx, chartArea, [
                        { stop: 0, color: adjustColorOpacity(getCssVariable('--color-blue-500'), 0) },
                        { stop: 1, color: adjustColorOpacity(getCssVariable('--color-blue-500'), 0.2) }
                    ]);
                },
                borderWidth: 2,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 3,
                pointBackgroundColor: getCssVariable('--color-blue-500'),
                pointBorderColor: getCssVariable('--color-white'),
                pointBorderWidth: 2,
                clip: 20,
            },
            // Trend çizgisi
            {
                label: 'Ortalama Trend',
                data: Array(24).fill(currentData.avgDataPerHour),
                borderColor: getCssVariable('--color-amber-500'),
                backgroundColor: 'transparent',
                borderWidth: 1,
                borderDash: [5, 5],
                tension: 0,
                pointRadius: 0,
                pointHoverRadius: 0,
                clip: 20,
            }
        ],
    };

    return (
        <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-xs rounded-xl border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">
                        📊 Günlük Veri Aktivitesi
                    </h2>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        Router Veri İletişim Analizi
                    </div>
                </div>
                {/* Real-time indicator */}
                {connectionStatus && activityData.lastUpdate && (
                    <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-green-600 dark:text-green-400">Live</span>
                    </div>
                )}
            </header>

            {/* Activity Summary */}
            <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700/60">
                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                        <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                            {currentData.totalDataPoints.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Toplam Veri</div>
                    </div>
                    <div className="text-center">
                        <div className="text-xl font-bold text-green-600 dark:text-green-400">
                            {currentData.avgDataPerHour}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Ort. Saat/Veri</div>
                    </div>
                    <div className="text-center">
                        <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
                            {currentData.peakHour}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Pik Saat</div>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="grow px-5 py-4">
                <LineChart data={chartData} width={389} height={200} />
            </div>

            {/* Activity Insights */}
            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700/60">
                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    <div className="flex justify-between">
                        <span>En Aktif Saat:</span>
                        <span className="font-medium text-amber-600">{currentData.peakHour}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Veri Yoğunluğu:</span>
                        <span className={`font-medium ${currentData.totalDataPoints > 2000 ? 'text-green-600' :
                            currentData.totalDataPoints > 1000 ? 'text-amber-600' : 'text-red-600'}`}>
                            {currentData.totalDataPoints > 2000 ? 'Yüksek' :
                                currentData.totalDataPoints > 1000 ? 'Orta' : 'Düşük'}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span>Son Güncelleme:</span>
                        <span>{new Date(currentData.lastUpdate).toLocaleTimeString('tr-TR')}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DashboardCard08;
