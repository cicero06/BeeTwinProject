import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import LineChart from '../../charts/LineChart01';
import { chartAreaGradient } from '../../charts/ChartjsConfig';
import EditMenu from '../../components/DropdownEditMenu';
import { useAuth } from '../../contexts/AuthContext';

// Import utilities
import { adjustColorOpacity, getCssVariable } from '../../utils/Utils';

/**
 * DashboardCard02 - Kritik Uyarılar
 * 
 * Bu bileşen, dijital ikiz temelli akıllı arı kovanı izleme sisteminin 
 * kritik alarm ve uyarı yönetim katmanını oluşturmaktadır.
 * 
 * Özellikler:
 * - Acil müdahale gerektiren durumlar
 * - Kritik alarm sayısı ve türleri
 * - Son 24 saat uyarı geçmişi
 * - Öncelik bazlı alarm kategorileri
 * 
 * Akademik Katkı: Dijital ikiz sisteminin "karar destek" 
 * işlevini destekleyen kritik durum analiz bileşeni.
 */

function DashboardCard02() {
  const { user, hives, apiaries, coordinatorStatus } = useAuth();
  const [alertData, setAlertData] = useState({
    criticalAlerts: 0,
    warningAlerts: 0,
    infoAlerts: 0,
    totalAlerts: 0,
    recentAlerts: [],
    networkStatus: "Normal"
  });

  // Router veri durumları - BT107 ve BT108
  const [routerData, setRouterData] = useState({
    BT107: { status: 'loading', data: null, lastUpdate: null },
    BT108: { status: 'loading', data: null, lastUpdate: null }
  });

  // Geçmiş uyarı verilerini chart için state
  const [alertHistory, setAlertHistory] = useState({
    labels: [],
    data: [],
    lastFetched: null
  });

  // Router verilerini çek
  useEffect(() => {
    const fetchRouterData = async () => {
      if (!user?.token) return;

      const routers = ['107', '108'];
      const newRouterData = { ...routerData };

      for (const routerId of routers) {
        try {
          const response = await fetch(`/api/sensors/router/${routerId}/latest`, {
            headers: {
              'Authorization': `Bearer ${user.token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const result = await response.json();
            const deviceId = `BT${routerId}`;

            // 🎯 GERÇEK ZAMANLI BAĞLANTI KONTROLÜ
            let connectionStatus = 'disconnected';
            let isRealTime = false;
            let ageMinutes = null;

            if (result.data?.timestamp) {
              const dataTime = new Date(result.data.timestamp);
              const now = new Date();
              const timeDiff = now - dataTime;
              ageMinutes = Math.round(timeDiff / 1000 / 60);
              const fiveMinutes = 5 * 60 * 1000; // 5 dakika ms
              const oneHour = 60 * 60 * 1000; // 1 saat ms

              if (timeDiff <= fiveMinutes) {
                connectionStatus = 'connected';
                isRealTime = true;
              } else if (timeDiff <= oneHour) {
                connectionStatus = 'old_data';
                isRealTime = false;
              } else {
                connectionStatus = 'very_old_data';
                isRealTime = false;
              }

              console.log(`🚨 Card02 Router ${routerId} timestamp check:`, {
                dataTime: dataTime.toISOString(),
                now: now.toISOString(),
                timeDiff: `${ageMinutes} dakika`,
                status: connectionStatus,
                isRealTime
              });
            } else {
              connectionStatus = 'no_data';
            }

            newRouterData[deviceId] = {
              status: connectionStatus,
              data: result.data,
              lastUpdate: new Date(),
              routerType: result.routerType,
              isRealTime: isRealTime,
              ageMinutes: ageMinutes
            };
          } else {
            newRouterData[`BT${routerId}`] = {
              status: 'error',
              data: null,
              lastUpdate: new Date()
            };
          }
        } catch (error) {
          console.error(`❌ Router ${routerId} data fetch error:`, error);
          newRouterData[`BT${routerId}`] = {
            status: 'error',
            data: null,
            lastUpdate: new Date()
          };
        }
      }

      setRouterData(newRouterData);
    };

    fetchRouterData();
    const interval = setInterval(fetchRouterData, 15000); // 15 saniyede bir güncelle

    return () => clearInterval(interval);
  }, [user?.token]);

  // Geçmiş uyarı verilerini çek ve chart için hazırla
  useEffect(() => {
    const fetchAlertHistory = async () => {
      if (!user?.token) return;

      try {
        console.log('📊 Card02 - Fetching alert history for chart...');

        // Son 30 günlük uyarı geçmişini simüle et (gerçek API endpoint'i geliştirildiğinde burası güncellenecek)
        const last30Days = [];
        const alertCounts = [];
        const currentDate = new Date();

        for (let i = 29; i >= 0; i--) {
          const date = new Date(currentDate);
          date.setDate(date.getDate() - i);
          const dateStr = date.toLocaleDateString('tr-TR', { month: '2-digit', day: '2-digit' });
          last30Days.push(dateStr);

          // Router verisi ve koordinatör durumuna göre dinamik uyarı sayısı hesapla
          let dailyAlerts = 0;

          if (coordinatorStatus?.connectionRate) {
            if (coordinatorStatus.connectionRate < 50) {
              dailyAlerts += Math.floor(Math.random() * 5) + 3; // 3-7 uyarı
            } else if (coordinatorStatus.connectionRate < 80) {
              dailyAlerts += Math.floor(Math.random() * 3) + 1; // 1-3 uyarı
            } else {
              dailyAlerts += Math.floor(Math.random() * 2); // 0-1 uyarı
            }
          } else {
            // Fallback: rastgele değerler
            dailyAlerts = Math.floor(Math.random() * 4);
          }

          alertCounts.push(dailyAlerts);
        }

        setAlertHistory({
          labels: last30Days,
          data: alertCounts,
          lastFetched: new Date().toISOString()
        });

        console.log('📊 Card02 - Alert history updated:', {
          dayCount: last30Days.length,
          avgAlerts: (alertCounts.reduce((a, b) => a + b, 0) / alertCounts.length).toFixed(1)
        });

      } catch (error) {
        console.error('❌ Card02 - Alert history fetch error:', error);
      }
    };

    fetchAlertHistory();

    // Her 5 dakikada bir güncelle
    const interval = setInterval(fetchAlertHistory, 5 * 60 * 1000);
    return () => clearInterval(interval);

  }, [user?.token, coordinatorStatus?.connectionRate]);

  // Generate dynamic alerts based on coordinator and hive data
  useEffect(() => {
    console.log('🚨 Card02 - Alert generation triggered', { coordinatorStatus: !!coordinatorStatus, hiveCount: coordinatorStatus?.hiveDetails?.length });

    if (coordinatorStatus && coordinatorStatus.hiveDetails && coordinatorStatus.hiveDetails.length > 0) {
      const alerts = [];
      let criticalCount = 0;
      let warningCount = 0;
      let infoCount = 0;

      // Use coordinator data for accurate alerts
      coordinatorStatus.hiveDetails.forEach((hiveDetail) => {
        // Critical: Disconnected hives
        if (hiveDetail.status === 'disconnected' || hiveDetail.status === 'error') {
          alerts.push({
            id: alerts.length + 1,
            type: "critical",
            message: `${hiveDetail.name}: Koordinatör bağlantısı kesildi`,
            time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
            hiveId: hiveDetail.id,
            source: 'coordinator'
          });
          criticalCount++;
        }

        // Warning: Connected but no recent data
        if (hiveDetail.status === 'connected' && !hiveDetail.hasRecentData) {
          alerts.push({
            id: alerts.length + 1,
            type: "warning",
            message: `${hiveDetail.name}: Sensör verisi gecikmiş`,
            time: hiveDetail.lastSeen ?
              new Date(hiveDetail.lastSeen).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) :
              'Bilinmiyor',
            hiveId: hiveDetail.id,
            source: 'coordinator'
          });
          warningCount++;
        }

        // Info: Healthy and connected hives
        if (hiveDetail.status === 'connected' && hiveDetail.hasRecentData) {
          alerts.push({
            id: alerts.length + 1,
            type: "info",
            message: `${hiveDetail.name}: Tüm sistemler normal (${hiveDetail.routerCount} router)`,
            time: hiveDetail.lastSeen ?
              new Date(hiveDetail.lastSeen).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) :
              'Şimdi',
            hiveId: hiveDetail.id,
            source: 'coordinator'
          });
          infoCount++;
        }
      });

      // Add network status alerts
      if (coordinatorStatus.connectionRate < 50) {
        alerts.unshift({
          id: 0,
          type: "critical",
          message: `Ağ durumu kritik: %${coordinatorStatus.connectionRate} bağlantı oranı`,
          time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
          source: 'network'
        });
        criticalCount++;
      } else if (coordinatorStatus.connectionRate < 80) {
        alerts.unshift({
          id: 0,
          type: "warning",
          message: `Ağ durumu uyarı: %${coordinatorStatus.connectionRate} bağlantı oranı`,
          time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
          source: 'network'
        });
        warningCount++;
      }

      setAlertData({
        criticalAlerts: criticalCount,
        warningAlerts: warningCount,
        infoAlerts: infoCount,
        totalAlerts: alerts.length,
        recentAlerts: alerts.slice(0, 5), // Show only latest 5
        networkStatus: criticalCount > 0 ? "Kritik" :
          warningCount > 0 ? "Uyarı" : "Normal",
        coordinatorConnectionRate: coordinatorStatus.connectionRate,
        lastCoordinatorActivity: coordinatorStatus.lastActivity
      });

      console.log('🚨 Card02 - Alert data set:', {
        criticalCount,
        warningCount,
        infoCount,
        totalAlerts: alerts.length,
        networkStatus: criticalCount > 0 ? "Kritik" : warningCount > 0 ? "Uyarı" : "Normal"
      });
    } else if (hives && hives.length > 0) {
      // Fallback to legacy hive data when coordinator data unavailable
      const alerts = [];
      let criticalCount = 0;
      let warningCount = 0;
      let infoCount = 0;

      hives.forEach((hive, index) => {
        // Check sensor connection status
        if (hive.sensor && !hive.sensor.isConnected) {
          alerts.push({
            id: alerts.length + 1,
            type: "critical",
            message: `${hive.name}: Sensör bağlantısı kesildi`,
            time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
            hiveId: hive._id,
            source: 'legacy'
          });
          criticalCount++;
        }

        // Random alerts for demonstration when real data unavailable
        if (Math.random() > 0.7) {
          alerts.push({
            id: alerts.length + 1,
            type: "warning",
            message: `${hive.name}: Veri kontrolü gerekli`,
            time: new Date(Date.now() - Math.random() * 3600000).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
            hiveId: hive._id,
            source: 'legacy'
          });
          warningCount++;
        }
      });

      setAlertData({
        criticalAlerts: criticalCount,
        warningAlerts: warningCount,
        infoAlerts: Math.max(1, hives.length - criticalCount - warningCount),
        totalAlerts: alerts.length,
        recentAlerts: alerts.slice(0, 5),
        networkStatus: criticalCount > 0 ? "Kritik" : "Normal",
        coordinatorConnectionRate: null,
        lastCoordinatorActivity: null
      });
    }
  }, [coordinatorStatus, hives]);

  // Geçmiş uyarı verilerini çek ve chart için hazırla
  useEffect(() => {
    const fetchAlertHistory = async () => {
      if (!user?.token) return;

      try {
        console.log('📊 Card02 - Fetching alert history for chart...');

        // Son 30 günlük uyarı geçmişini simüle et (gerçek API endpoint'i geliştirildiğinde burası güncellenecek)
        const last30Days = [];
        const alertCounts = [];
        const currentDate = new Date();

        for (let i = 29; i >= 0; i--) {
          const date = new Date(currentDate);
          date.setDate(date.getDate() - i);
          const dateStr = date.toLocaleDateString('tr-TR', { month: '2-digit', day: '2-digit' });
          last30Days.push(dateStr);

          // Router verisi ve koordinatör durumuna göre dinamik uyarı sayısı hesapla
          let dailyAlerts = 0;

          if (coordinatorStatus?.connectionRate) {
            if (coordinatorStatus.connectionRate < 50) {
              dailyAlerts += Math.floor(Math.random() * 5) + 3; // 3-7 uyarı
            } else if (coordinatorStatus.connectionRate < 80) {
              dailyAlerts += Math.floor(Math.random() * 3) + 1; // 1-3 uyarı
            } else {
              dailyAlerts += Math.floor(Math.random() * 2); // 0-1 uyarı
            }
          } else {
            // Fallback: rastgele değerler
            dailyAlerts = Math.floor(Math.random() * 4);
          }

          alertCounts.push(dailyAlerts);
        }

        setAlertHistory({
          labels: last30Days,
          data: alertCounts,
          lastFetched: new Date().toISOString()
        });

        console.log('📊 Card02 - Alert history updated:', {
          dayCount: last30Days.length,
          avgAlerts: (alertCounts.reduce((a, b) => a + b, 0) / alertCounts.length).toFixed(1)
        });

      } catch (error) {
        console.error('❌ Card02 - Alert history fetch error:', error);
      }
    };

    fetchAlertHistory();

    // Her 5 dakikada bir güncelle
    const interval = setInterval(fetchAlertHistory, 5 * 60 * 1000);
    return () => clearInterval(interval);

  }, [user?.token, coordinatorStatus?.connectionRate]);

  // Default alert data when no user data is available
  const defaultAlertData = {
    criticalAlerts: 3,
    warningAlerts: 7,
    infoAlerts: 12,
    totalAlerts: 22,
    recentAlerts: [
      { id: 1, type: "critical", message: "Kovan-DT-003: Yüksek sıcaklık (38.1°C)", time: "10:28", hiveId: "DT-003" },
      { id: 2, type: "warning", message: "Kovan-DT-007: Düşük ağırlık tespit edildi", time: "09:45", hiveId: "DT-007" },
      { id: 3, type: "critical", message: "Kovan-DT-012: Sensör bağlantısı kesildi", time: "08:33", hiveId: "DT-012" },
    ],
    networkStatus: "Normal"
  };

  // Use user-specific data if available, otherwise use default
  const currentAlertData = user && hives && hives.length > 0 ? alertData : defaultAlertData;

  // Chart data - tarihsel uyarı verilerini kullan
  const chartData = {
    labels: alertHistory.labels.length > 0 ? alertHistory.labels : [
      '12-01', '13-01', '14-01', '15-01', '16-01', '17-01', '18-01',
      '19-01', '20-01', '21-01', '22-01', '23-01', '24-01', '25-01',
      '26-01', '27-01', '28-01', '29-01', '30-01', '31-01', '01-02',
      '02-02', '03-02', '04-02', '05-02', '06-02', '07-02', '08-02',
      '09-02', '10-02', '11-02', '12-02'
    ],
    datasets: [
      // Kritik Uyarılar - Kırmızı çizgi
      {
        label: 'Kritik Uyarılar',
        data: alertHistory.data.length > 0 ?
          alertHistory.data.map(count => Math.floor(count * 0.3)) : // Kritik uyarılar toplam uyarıların %30'u
          [2, 1, 3, 1, 0, 1, 0, 2, 1, 0, 3, 2, 1, 0, 1, 2, 0, 1, 3, 2, 1, 0, 2, 1, 1, 0, 2, 1, 0, 1, 2, 1],
        fill: false,
        backgroundColor: getCssVariable('--color-red-500'),
        borderColor: getCssVariable('--color-red-500'),
        borderWidth: 3,
        pointRadius: 2,
        pointHoverRadius: 4,
        pointBackgroundColor: getCssVariable('--color-red-500'),
        pointHoverBackgroundColor: getCssVariable('--color-red-500'),
        pointBorderWidth: 0,
        pointHoverBorderWidth: 0,
        clip: 20,
        tension: 0.2,
      },
      // Toplam Uyarılar - Mor çizgi (gradient ile)
      {
        label: 'Toplam Uyarılar',
        data: alertHistory.data.length > 0 ? alertHistory.data : [
          6, 4, 8, 5, 2, 4, 1, 7, 5, 3, 9, 6, 4, 2, 5, 7, 3, 4, 8, 6, 5, 2, 6, 4, 4, 2, 6, 4, 2, 4, 6, 4
        ],
        fill: true,
        backgroundColor: function (context) {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          return chartAreaGradient(ctx, chartArea, [
            { stop: 0, color: adjustColorOpacity(getCssVariable('--color-violet-500'), 0) },
            { stop: 1, color: adjustColorOpacity(getCssVariable('--color-violet-500'), 0.2) }
          ]);
        },
        borderColor: getCssVariable('--color-violet-500'),
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 3,
        pointBackgroundColor: getCssVariable('--color-violet-500'),
        pointHoverBackgroundColor: getCssVariable('--color-violet-500'),
        pointBorderWidth: 0,
        pointHoverBorderWidth: 0,
        clip: 20,
        tension: 0.2,
      },
      // Uyarı Uyarıları - Turuncu çizgi  
      {
        label: 'Uyarı Seviyesi',
        data: alertHistory.data.length > 0 ?
          alertHistory.data.map(count => Math.floor(count * 0.5)) : // Uyarı seviyesi toplam uyarıların %50'si
          [3, 2, 4, 2, 1, 2, 1, 3, 2, 1, 4, 3, 2, 1, 2, 3, 1, 2, 4, 3, 2, 1, 3, 2, 2, 1, 3, 2, 1, 2, 3, 2],
        borderColor: adjustColorOpacity(getCssVariable('--color-orange-500'), 0.8),
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 3,
        pointBackgroundColor: adjustColorOpacity(getCssVariable('--color-orange-500'), 0.8),
        pointHoverBackgroundColor: adjustColorOpacity(getCssVariable('--color-orange-500'), 0.8),
        pointBorderWidth: 0,
        pointHoverBorderWidth: 0,
        clip: 20,
        tension: 0.2,
      },
    ],
  };

  return (
    <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-xs rounded-xl border border-red-200 dark:border-gray-700">
      {/* Header - Kritik Uyarılar Başlığı */}
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Kritik Uyarılar
          </h2>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Acil Müdahale Gerekli
          </div>
        </div>
        {/* Durum Göstergesi */}
        <div className="flex items-center space-x-2">
          <div className={`h-3 w-3 rounded-full ${alertData.criticalAlerts > 0 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
            {currentAlertData.criticalAlerts > 0 ? 'Kritik' : 'Normal'}
          </span>
        </div>
      </header>

      {/* Alert Statistics */}
      <div className="px-5 py-4">
        <div className="grid grid-cols-3 gap-4 mb-4">
          {/* Kritik Uyarılar */}
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {currentAlertData.criticalAlerts}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Kritik
            </div>
          </div>

          {/* Uyarı Seviyesi */}
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {currentAlertData.warningAlerts}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Uyarı
            </div>
          </div>

          {/* Bilgi Seviyesi */}
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {currentAlertData.infoAlerts}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Bilgi
            </div>
          </div>
        </div>

        {/* Son Uyarılar */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Son Uyarılar:
          </h4>
          {currentAlertData.recentAlerts.map(alert => (
            <div key={alert.id} className="flex items-start justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex-1">
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mb-1 ${alert.type === 'critical' ? 'bg-red-100 text-red-800' :
                  alert.type === 'warning' ? 'bg-amber-100 text-amber-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                  {alert.type === 'critical' ? 'KRİTİK' : alert.type === 'warning' ? 'UYARI' : 'BİLGİ'}
                </div>
                <div className="text-sm text-gray-800 dark:text-gray-200">
                  {alert.message}
                </div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                {alert.time}
              </div>
            </div>
          ))}
        </div>

        {/* Router Veri Durumu */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Router Veri Akışı:
          </h4>
          <div className="space-y-3">
            {Object.entries(routerData).map(([deviceId, router]) => (
              <div key={deviceId} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {deviceId}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      ({router.routerType || 'Unknown'})
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className={`h-2 w-2 rounded-full ${router.status === 'connected' ? 'bg-green-500 animate-pulse' :
                        router.status === 'old_data' ? 'bg-yellow-500' :
                          router.status === 'very_old_data' ? 'bg-orange-500' :
                            router.status === 'no_data' ? 'bg-amber-500' :
                              'bg-red-500'
                      }`}></div>
                    <span className={`text-xs font-medium ${router.status === 'connected' ? 'text-green-600 dark:text-green-400' :
                        router.status === 'old_data' ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-red-600 dark:text-red-400'
                      }`}>
                      {router.status === 'connected' ? `Canlı (${router.ageMinutes || 0}dk)` :
                        router.status === 'old_data' ? `Eski (${router.ageMinutes}dk)` :
                          router.status === 'very_old_data' ? `Çok Eski (${router.ageMinutes}dk)` :
                            router.status === 'no_data' ? 'Veri Yok' :
                              'Hata'}
                    </span>
                  </div>
                </div>

                {/* Veri detayları */}
                {router.data && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(router.data.data || {}).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">{key}:</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {typeof value === 'number' ? value.toFixed(2) : value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {router.lastUpdate && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Son güncelleme: {router.lastUpdate.toLocaleTimeString('tr-TR')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardCard02;
