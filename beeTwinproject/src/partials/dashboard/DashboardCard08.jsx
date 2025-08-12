import React, { useState, useEffect } from 'react';
import DoughnutChart from '../../charts/DoughnutChart';
import { useAuth } from '../../contexts/AuthContext';

/**
 * DashboardCard08 - Router Durumu Özeti (Bağlantı Durumu Gösterimi)
 * 
 * Bu bileşen, sistemdeki tüm router'ların canlı bağlantı durumunu
 * ve sistem sağlığını görselleştirir.
 * 
 * Özellikler:
 * - Router bağlantı durumu dağılımı (Canlı/Yakın/Eski/Çevrimdışı)
 * - Gerçek zamanlı bağlantı kontrolü
 * - Sistem health durumu
 * - Veri yaşı gösterimi
 * 
 * Veri Kaynağı: BT107, BT108 router latest API'leri
 */

function DashboardCard08() {
  const { user } = useAuth();

  const [routerStats, setRouterStats] = useState({
    routers: {
      BT107: {
        status: 'offline',
        connectionStatus: 'disconnected',
        dataAge: null,
        isRealTime: false,
        dataTypes: [],
        lastSeen: null
      },
      BT108: {
        status: 'offline',
        connectionStatus: 'disconnected',
        dataAge: null,
        isRealTime: false,
        dataTypes: [],
        lastSeen: null
      }
    },
    systemHealth: 0,
    connectionSummary: {
      live: 0,
      recent: 0,
      old: 0,
      offline: 0
    },
    lastUpdate: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Router durumlarını kontrol et
  useEffect(() => {
    const checkRouterStatus = async () => {
      if (!user) return;

      try {
        setError(null);
        const token = localStorage.getItem('token');

        console.log('🔍 Card08 router durumları kontrol ediliyor...');

        // BT107 ve BT108 durumlarını kontrol et
        const [bt107Response, bt108Response] = await Promise.all([
          fetch('http://localhost:5000/api/sensors/router/107/latest', {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
          }),
          fetch('http://localhost:5000/api/sensors/router/108/latest', {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
          })
        ]);

        const now = new Date();

        // BT107 durumunu analiz et
        let bt107Status = {
          status: 'offline',
          connectionStatus: 'disconnected',
          dataAge: null,
          isRealTime: false,
          dataTypes: [],
          lastSeen: null
        };

        if (bt107Response.ok) {
          const bt107Data = await bt107Response.json();
          if (bt107Data.success && bt107Data.data) {
            const data = bt107Data.data;
            bt107Status.status = 'online';
            bt107Status.lastSeen = data.timestamp;

            // Veri yaşını hesapla
            if (data.timestamp) {
              const dataTime = new Date(data.timestamp);
              const ageMinutes = Math.round((now - dataTime) / 1000 / 60);
              bt107Status.dataAge = ageMinutes;

              if (ageMinutes <= 5) {
                bt107Status.connectionStatus = 'live';
                bt107Status.isRealTime = true;
              } else if (ageMinutes <= 30) {
                bt107Status.connectionStatus = 'recent';
              } else if (ageMinutes <= 120) {
                bt107Status.connectionStatus = 'old';
              } else {
                bt107Status.connectionStatus = 'very_old';
              }
            }

            // Veri tiplerini tespit et
            if (data.temperature !== null && data.temperature !== undefined) bt107Status.dataTypes.push('Sıcaklık');
            if (data.humidity !== null && data.humidity !== undefined) bt107Status.dataTypes.push('Nem');
            if (data.pressure !== null && data.pressure !== undefined) bt107Status.dataTypes.push('Basınç');

            console.log(`📊 BT107 durum: ${bt107Status.connectionStatus}, yaş: ${bt107Status.dataAge}dk`);
          }
        }

        // BT108 durumunu analiz et
        let bt108Status = {
          status: 'offline',
          connectionStatus: 'disconnected',
          dataAge: null,
          isRealTime: false,
          dataTypes: [],
          lastSeen: null
        };

        if (bt108Response.ok) {
          const bt108Data = await bt108Response.json();
          if (bt108Data.success && bt108Data.data) {
            const data = bt108Data.data;
            bt108Status.status = 'online';
            bt108Status.lastSeen = data.timestamp;

            // Veri yaşını hesapla
            if (data.timestamp) {
              const dataTime = new Date(data.timestamp);
              const ageMinutes = Math.round((now - dataTime) / 1000 / 60);
              bt108Status.dataAge = ageMinutes;

              if (ageMinutes <= 5) {
                bt108Status.connectionStatus = 'live';
                bt108Status.isRealTime = true;
              } else if (ageMinutes <= 30) {
                bt108Status.connectionStatus = 'recent';
              } else if (ageMinutes <= 120) {
                bt108Status.connectionStatus = 'old';
              } else {
                bt108Status.connectionStatus = 'very_old';
              }
            }

            // Veri tiplerini tespit et
            if (data.co !== null && data.co !== undefined) bt108Status.dataTypes.push('CO');
            if (data.no2 !== null && data.no2 !== undefined) bt108Status.dataTypes.push('NO2');

            console.log(`📊 BT108 durum: ${bt108Status.connectionStatus}, yaş: ${bt108Status.dataAge}dk`);
          }
        }

        // Bağlantı özetini hesapla
        const connectionSummary = { live: 0, recent: 0, old: 0, offline: 0 };

        [bt107Status, bt108Status].forEach(router => {
          if (router.connectionStatus === 'live') connectionSummary.live++;
          else if (router.connectionStatus === 'recent') connectionSummary.recent++;
          else if (router.connectionStatus === 'old') connectionSummary.old++;
          else connectionSummary.offline++;
        });

        // Sistem sağlığını hesapla (0-100)
        const totalRouters = 2;
        const liveRouters = connectionSummary.live;
        const recentRouters = connectionSummary.recent;
        const systemHealth = Math.round(((liveRouters * 100) + (recentRouters * 70)) / totalRouters);

        setRouterStats({
          routers: {
            BT107: bt107Status,
            BT108: bt108Status
          },
          systemHealth: systemHealth,
          connectionSummary: connectionSummary,
          lastUpdate: now.toISOString()
        });

        setLoading(false);
      } catch (error) {
        console.error('❌ Router status check error:', error);
        setError(`Router durum kontrolü hatası: ${error.message}`);
        setLoading(false);
      }
    };

    // İlk kontrol
    checkRouterStatus();

    // Her 30 saniyede bir kontrol et
    const interval = setInterval(checkRouterStatus, 30000);

    return () => clearInterval(interval);
  }, [user]);

  // Bağlantı durumu chart verisi
  const getConnectionStatusChartData = () => {
    const { connectionSummary } = routerStats;

    return {
      labels: ['🟢 Canlı', '🔵 Yakın', '🟡 Eski', '🔴 Çevrimdışı'],
      datasets: [{
        data: [
          connectionSummary.live,
          connectionSummary.recent,
          connectionSummary.old,
          connectionSummary.offline
        ],
        backgroundColor: [
          '#10b981', // Yeşil - Canlı
          '#3b82f6', // Mavi - Yakın
          '#f59e0b', // Sarı - Eski  
          '#ef4444'  // Kırmızı - Çevrimdışı
        ],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    };
  };

  if (loading) {
    return (
      <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-xs rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="px-5 py-4 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Router durumları kontrol ediliyor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-xs rounded-xl border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">
              🔗 Router Bağlantı Durumu
            </h2>
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <span>Sistem Sağlığı: {routerStats.systemHealth}%</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${routerStats.systemHealth >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                  routerStats.systemHealth >= 50 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
                    'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                }`}>
                {routerStats.systemHealth >= 80 ? '✅ İyi' :
                  routerStats.systemHealth >= 50 ? '⚠️ Orta' : '❌ Kötü'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Router Status Cards */}
      <div className="px-5 py-4">
        <div className="space-y-3 mb-4">
          {/* BT107 Status */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-3 ${routerStats.routers.BT107.connectionStatus === 'live' ? 'bg-green-500' :
                  routerStats.routers.BT107.connectionStatus === 'recent' ? 'bg-blue-500' :
                    routerStats.routers.BT107.connectionStatus === 'old' ? 'bg-yellow-500' :
                      'bg-red-500'
                }`}></div>
              <div>
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  BT107 - BMP280
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {routerStats.routers.BT107.dataTypes.join(', ') || 'Veri yok'}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-xs font-medium ${routerStats.routers.BT107.isRealTime ? 'text-green-600' : 'text-gray-500'
                }`}>
                {routerStats.routers.BT107.dataAge !== null ? `${routerStats.routers.BT107.dataAge}dk önce` : 'Veri yok'}
              </div>
              <div className={`text-xs px-2 py-0.5 rounded-full ${routerStats.routers.BT107.connectionStatus === 'live' ? 'bg-green-100 text-green-700' :
                  routerStats.routers.BT107.connectionStatus === 'recent' ? 'bg-blue-100 text-blue-700' :
                    routerStats.routers.BT107.connectionStatus === 'old' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                }`}>
                {routerStats.routers.BT107.connectionStatus === 'live' ? '🟢 Canlı' :
                  routerStats.routers.BT107.connectionStatus === 'recent' ? '🔵 Yakın' :
                    routerStats.routers.BT107.connectionStatus === 'old' ? '🟡 Eski' :
                      '🔴 Çevrimdışı'}
              </div>
            </div>
          </div>

          {/* BT108 Status */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-3 ${routerStats.routers.BT108.connectionStatus === 'live' ? 'bg-green-500' :
                  routerStats.routers.BT108.connectionStatus === 'recent' ? 'bg-blue-500' :
                    routerStats.routers.BT108.connectionStatus === 'old' ? 'bg-yellow-500' :
                      'bg-red-500'
                }`}></div>
              <div>
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  BT108 - Hava Kalitesi
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {routerStats.routers.BT108.dataTypes.join(', ') || 'Veri yok'}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-xs font-medium ${routerStats.routers.BT108.isRealTime ? 'text-green-600' : 'text-gray-500'
                }`}>
                {routerStats.routers.BT108.dataAge !== null ? `${routerStats.routers.BT108.dataAge}dk önce` : 'Veri yok'}
              </div>
              <div className={`text-xs px-2 py-0.5 rounded-full ${routerStats.routers.BT108.connectionStatus === 'live' ? 'bg-green-100 text-green-700' :
                  routerStats.routers.BT108.connectionStatus === 'recent' ? 'bg-blue-100 text-blue-700' :
                    routerStats.routers.BT108.connectionStatus === 'old' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                }`}>
                {routerStats.routers.BT108.connectionStatus === 'live' ? '🟢 Canlı' :
                  routerStats.routers.BT108.connectionStatus === 'recent' ? '🔵 Yakın' :
                    routerStats.routers.BT108.connectionStatus === 'old' ? '🟡 Eski' :
                      '🔴 Çevrimdışı'}
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center text-sm text-red-700 dark:text-red-400">
              <span className="mr-2">⚠️</span>
              {error}
            </div>
          </div>
        )}
      </div>

      {/* Connection Status Chart */}
      <div className="grow px-5 pb-5">
        <div className="h-64">
          <DoughnutChart data={getConnectionStatusChartData()} width={300} height={200} />
        </div>

        {/* Chart Legend */}
        <div className="mt-3 flex justify-center">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span>Canlı: {routerStats.connectionSummary.live}</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span>Yakın: {routerStats.connectionSummary.recent}</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
              <span>Eski: {routerStats.connectionSummary.old}</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <span>Çevrimdışı: {routerStats.connectionSummary.offline}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Son Güncelleme: {routerStats.lastUpdate ? new Date(routerStats.lastUpdate).toLocaleTimeString('tr-TR') : '--:--'}
        </div>
      </div>
    </div>
  );
}

export default DashboardCard08;
