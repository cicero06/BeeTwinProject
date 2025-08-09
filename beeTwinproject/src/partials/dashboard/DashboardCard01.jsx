import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import LineChart from '../../charts/LineChart01';
import { chartAreaGradient } from '../../charts/ChartjsConfig';
import EditMenu from '../../components/DropdownEditMenu';
import useRealTimeData from '../../hooks/useRealTimeData';
import { useAuth } from '../../contexts/AuthContext';

// Import utilities
import { adjustColorOpacity, getCssVariable } from '../../utils/Utils';

/**
 * DashboardCard01 - Sistem Durumu Özeti
 * 
 * Bu bileşen, dijital ikiz temelli akıllı arı kovanı izleme sisteminin 
 * genel sistem durumunu ve performans metriklerini görselleştirir.
 * 
 * Özellikler:
 * - Toplam aktif kovan sayısı
 * - Sistem sağlığı skoru
 * - LoRa ağ bağlantı durumu
 * - Genel performans trend analizi
 * 
 * Akademik Katkı: Dijital ikiz sisteminin "izleme ve görselleştirme" 
 * işlevinin sistem seviyesi genel bakış bileşeni.
 */

function DashboardCard01() {
  const { sensorData, connectionStatus, mlInsights, isLoading } = useRealTimeData();
  const { user, apiaries, hives, getStats, coordinatorStatus } = useAuth();

  // Get user-specific stats
  const userStats = getStats ? getStats() : { totalApiaries: 0, totalHives: 0, connectedHives: 0 };

  // State for system metrics
  const [systemData, setSystemData] = useState({
    totalHives: 0,
    activeHives: 0,
    offlineHives: 0,
    warningHives: 0,
    systemHealth: 0,
    networkStatus: "No Data",
    lastUpdate: null
  });

  // State for router status - BT107 ve BT108
  const [routerStatus, setRouterStatus] = useState({
    BT107: { status: 'disconnected', lastSeen: null, data: null },
    BT108: { status: 'disconnected', lastSeen: null, data: null }
  });

  // Router verilerini çek - BT107 ve BT108
  useEffect(() => {
    const fetchRouterData = async () => {
      if (!user?.token) return;

      const routers = ['107', '108'];
      const newRouterStatus = { ...routerStatus };

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
            
            newRouterStatus[deviceId] = {
              status: result.data ? 'connected' : 'no_data',
              lastSeen: result.data?.timestamp || null,
              data: result.data,
              type: result.routerType
            };
            
            console.log(`✅ Router ${routerId} data fetched:`, result.data);
          } else {
            newRouterStatus[`BT${routerId}`] = {
              status: 'error',
              lastSeen: null,
              data: null
            };
            console.log(`❌ Router ${routerId} fetch failed:`, response.status);
          }
        } catch (error) {
          console.error(`❌ Router ${routerId} fetch error:`, error);
          newRouterStatus[`BT${routerId}`] = {
            status: 'error',
            lastSeen: null,
            data: null
          };
        }
      }

      setRouterStatus(newRouterStatus);
    };

    fetchRouterData();
    const interval = setInterval(fetchRouterData, 30000); // 30 saniyede bir güncelle

    return () => clearInterval(interval);
  }, [user?.token]);

  // Update system data based on real-time sensor data and coordinator data
  useEffect(() => {
    try {
      console.log('🔄 DashboardCard01 - Data Updated:', user?.email, {
        apiaries: apiaries?.length,
        hives: hives?.length,
        userStats,
        coordinatorData: coordinatorStatus
      });

      // Use REAL coordinator data when available
      const realTotalHives = coordinatorStatus?.totalHives || userStats.totalHives || 0;
      const realConnectedHives = coordinatorStatus?.connectedHives || userStats.connectedHives || 0;
      const realOfflineHives = coordinatorStatus?.disconnectedHives || Math.max(0, realTotalHives - realConnectedHives);

      // Get warning hives from coordinator data
      const warningCount = coordinatorStatus?.warningHives || 0;

      // Use coordinator system health or calculate our own
      const calculateSystemHealth = () => {
        if (coordinatorStatus?.connectionRate !== undefined) {
          // Use coordinator calculated connection rate
          return coordinatorStatus.connectionRate;
        }

        // Fallback calculation
        if (realTotalHives === 0) return 0;
        const connectedRatio = realConnectedHives / realTotalHives;
        const warningRatio = warningCount / realTotalHives;
        const baseHealth = connectedRatio * 100;
        const warningPenalty = warningRatio * 20;
        return Math.max(0, Math.min(100, baseHealth - warningPenalty));
      };

      // Determine network status
      const getNetworkStatus = () => {
        if (connectionStatus) return "WebSocket Live";
        if (coordinatorStatus?.lastActivity) return "Coordinator Connected";
        if (realConnectedHives > 0) return "Database Connected";
        if (realTotalHives > 0) return "Hives Offline";
        return "No Hives";
      };

      setSystemData({
        totalHives: realTotalHives,
        activeHives: realConnectedHives,
        offlineHives: realOfflineHives,
        warningHives: warningCount,
        systemHealth: calculateSystemHealth(),
        networkStatus: getNetworkStatus(),
        lastUpdate: coordinatorStatus?.lastActivity || new Date().toISOString()
      });

      console.log('📊 DashboardCard01 - Updated Stats:', {
        totalHives: realTotalHives,
        connectedHives: realConnectedHives,
        systemHealth: calculateSystemHealth(),
        coordinatorAvailable: !!coordinatorStatus
      });
      let warningHives = 0;
      if (hives && Array.isArray(hives) && hives.length > 0) {
        warningHives = hives.filter(hive => {
          if (!hive) return false;
          // Sensör bağlı değilse uyarı
          if (!hive.sensor?.isConnected) return true;
          // Kovan aktif değilse uyarı
          if (!hive.isActive) return true;
          return false;
        }).length;
      }

      console.log('📊 DashboardCard01 - Final Update:', {
        realTotalHives,
        realConnectedHives,
        warningHives,
        calculateSystemHealth: calculateSystemHealth()
      });

      if (sensorData && Array.isArray(sensorData) && sensorData.length > 0) {
        // Get unique device IDs from sensor data
        const uniqueDevices = [...new Set(sensorData.map(data => data.deviceId))];
        const totalHives = Math.max(uniqueDevices.length, userStats.totalHives || 0);

        // Calculate active hives (devices with recent data - last 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const activeDevices = sensorData.filter(data =>
          new Date(data.timestamp) > fiveMinutesAgo
        );
        const activeHives = [...new Set(activeDevices.map(data => data.deviceId))].length;

        // Calculate system health based on ML insights
        let systemHealth = 75; // Base health
        if (mlInsights) {
          systemHealth = Math.round(mlInsights.modelAccuracy * 100);
        }

        // Determine network status
        const networkStatus = connectionStatus ? "Stable" : "Disconnected";

        setSystemData(prev => ({
          ...prev,
          totalHives: Math.max(totalHives, prev.totalHives), // Don't decrease total
          activeHives,
          offlineHives: Math.max(0, prev.totalHives - activeHives),
          systemHealth,
          networkStatus,
          lastUpdate: new Date().toISOString()
        }));
      }
    } catch (error) {
      console.error('❌ DashboardCard01 useEffect error:', error);
    }
  }, [sensorData, connectionStatus, mlInsights, userStats.totalHives, userStats.connectedHives, getStats, user, apiaries, hives]);

  // Dijital ikiz sistemi için sistem durumu verileri
  // Artık gerçek zamanlı WebSocket verileri kullanılıyor

  const chartData = {
    labels: [
      '12-01-2022',
      '01-01-2023',
      '02-01-2023',
      '03-01-2023',
      '04-01-2023',
      '05-01-2023',
      '06-01-2023',
      '07-01-2023',
      '08-01-2023',
      '09-01-2023',
      '10-01-2023',
      '11-01-2023',
      '12-01-2023',
      '01-01-2024',
      '02-01-2024',
      '03-01-2024',
      '04-01-2024',
      '05-01-2024',
      '06-01-2024',
      '07-01-2024',
      '08-01-2024',
      '09-01-2024',
      '10-01-2024',
      '11-01-2024',
      '12-01-2024',
      '01-01-2025',
    ],
    datasets: [
      // Indigo line
      {
        data: [732, 610, 610, 504, 504, 504, 349, 349, 504, 342, 504, 610, 391, 192, 154, 273, 191, 191, 126, 263, 349, 252, 423, 622, 470, 532],
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
      // Gray line
      {
        data: [532, 532, 532, 404, 404, 314, 314, 314, 314, 314, 234, 314, 234, 234, 314, 314, 314, 388, 314, 202, 202, 202, 202, 314, 720, 642],
        borderColor: adjustColorOpacity(getCssVariable('--color-gray-500'), 0.25),
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 3,
        pointBackgroundColor: adjustColorOpacity(getCssVariable('--color-gray-500'), 0.25),
        pointHoverBackgroundColor: adjustColorOpacity(getCssVariable('--color-gray-500'), 0.25),
        pointBorderWidth: 0,
        pointHoverBorderWidth: 0,
        clip: 20,
        tension: 0.2,
      },
    ],
  };

  return (
    <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-xs rounded-xl border border-amber-200 dark:border-gray-700">
      {/* Header - Sistem Durumu Başlığı */}
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Sistem Durumu Özeti
          </h2>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Dijital İkiz Monitöring
          </div>
        </div>
        {/* Sistem Sağlığı ve Bağlantı Göstergesi */}
        <div className="flex items-center space-x-4">
          {/* WebSocket Bağlantı Durumu */}
          <div className="flex items-center space-x-1">
            <div className={`h-2 w-2 rounded-full ${connectionStatus ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {connectionStatus ? 'Online' : 'Offline'}
            </span>
          </div>

          {/* Sistem Sağlığı */}
          <div className="flex items-center space-x-2">
            <div className={`h-3 w-3 rounded-full ${systemData.systemHealth > 80 ? 'bg-green-500' : systemData.systemHealth > 60 ? 'bg-amber-500' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {systemData.systemHealth}%
            </span>
          </div>
        </div>
      </header>

      {/* Metrics - Gerçek Zamanlı İstatistikler */}
      <div className="px-5 py-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Toplam Kovan */}
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              {isLoading ? (
                <div className="animate-pulse h-8 bg-gray-200 dark:bg-gray-600 rounded"></div>
              ) : (
                systemData.totalHives
              )}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Toplam Kovan
            </div>
          </div>

          {/* Aktif Kovan */}
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {isLoading ? (
                <div className="animate-pulse h-8 bg-gray-200 dark:bg-gray-600 rounded"></div>
              ) : (
                systemData.activeHives
              )}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Aktif Kovan
            </div>
          </div>
        </div>

        {/* Durum Bilgileri */}
        <div className="mt-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-300">Uyarı:</span>
            <span className="text-sm font-medium text-amber-600">{systemData.warningHives} kovan</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-300">Offline:</span>
            <span className="text-sm font-medium text-red-600">{systemData.offlineHives} kovan</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-300">LoRa Ağ:</span>
            <span className="text-sm font-medium text-green-600">{systemData.networkStatus}</span>
          </div>
          
          {/* Router Durumları - BT107 ve BT108 */}
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Router Durumu:</div>
            {Object.entries(routerStatus).map(([deviceId, status]) => (
              <div key={deviceId} className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-600 dark:text-gray-300">
                  {deviceId} ({status.type || 'Unknown'}):
                </span>
                <div className="flex items-center space-x-1">
                  <div className={`h-2 w-2 rounded-full ${
                    status.status === 'connected' ? 'bg-green-500' : 
                    status.status === 'no_data' ? 'bg-amber-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    {status.status === 'connected' ? 'Aktif' : 
                     status.status === 'no_data' ? 'Veri Yok' : 'Hata'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardCard01;
