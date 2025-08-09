import React, { useState, useEffect } from 'react';
import DoughnutChart from '../../charts/DoughnutChart';
import { useAuth } from '../../contexts/AuthContext';

/**
 * DashboardCard08 - Router Durumu Özeti (Pie Chart Gösterimi)
 * 
 * Bu bileşen, sistemdeki tüm router'ların durumunu
 * ve veri dağılımını pie chart ile görselleştirir.
 * 
 * Özellikler:
 * - Router bağlantı durumu dağılımı
 * - Veri tiplerinin yüzdelik gösterimi
 * - Sistem health durumu
 * - Interactive chart görünümü
 * 
 * Veri Kaynağı: BT107, BT108 router durumları
 */

function DashboardCard08() {
  const { user } = useAuth();

  const [routerStats, setRouterStats] = useState({
    routers: {
      BT107: { status: 'offline', dataTypes: [], lastSeen: null },
      BT108: { status: 'offline', dataTypes: [], lastSeen: null }
    },
    systemHealth: 0,
    dataDistribution: {},
    lastUpdate: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedChart, setSelectedChart] = useState('status'); // status, data_types

  // Router durumlarını kontrol et
  useEffect(() => {
    const checkRouterStatus = async () => {
      if (!user) return;

      try {
        setError(null);
        const token = localStorage.getItem('token');
        
        // BT107 ve BT108 durumlarını kontrol et
        const checkPromises = [
          fetch('http://localhost:5000/api/sensors/router/107/latest', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }),
          fetch('http://localhost:5000/api/sensors/router/108/latest', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
        ];

        const [bt107Response, bt108Response] = await Promise.all(checkPromises);

        const bt107Data = bt107Response.ok ? await bt107Response.json() : null;
        const bt108Data = bt108Response.ok ? await bt108Response.json() : null;

        const newStats = {
          routers: {
            BT107: {
              status: bt107Data?.success ? 'online' : 'offline',
              dataTypes: [],
              lastSeen: bt107Data?.data?.timestamp || null
            },
            BT108: {
              status: bt108Data?.success ? 'online' : 'offline', 
              dataTypes: [],
              lastSeen: bt108Data?.data?.timestamp || null
            }
          },
          dataDistribution: {},
          lastUpdate: new Date().toISOString()
        };

        // BT107 veri tiplerini analiz et
        if (bt107Data?.success && bt107Data.data) {
          const data = bt107Data.data;
          if (data.temperature) newStats.routers.BT107.dataTypes.push('Sıcaklık');
          if (data.humidity) newStats.routers.BT107.dataTypes.push('Nem');
          if (data.pressure) newStats.routers.BT107.dataTypes.push('Basınç');
        }

        // BT108 veri tiplerini analiz et
        if (bt108Data?.success && bt108Data.data) {
          const data = bt108Data.data;
          if (data.co) newStats.routers.BT108.dataTypes.push('CO');
          if (data.no2) newStats.routers.BT108.dataTypes.push('NO2');
        }

        // Veri dağılımını hesapla
        const allDataTypes = [
          ...newStats.routers.BT107.dataTypes,
          ...newStats.routers.BT108.dataTypes
        ];
        
        newStats.dataDistribution = allDataTypes.reduce((acc, type) => {
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {});

        // Sistem sağlığını hesapla
        const onlineRouters = Object.values(newStats.routers).filter(r => r.status === 'online').length;
        const totalRouters = Object.keys(newStats.routers).length;
        newStats.systemHealth = Math.round((onlineRouters / totalRouters) * 100);

        setRouterStats(newStats);
        setLoading(false);
      } catch (error) {
        console.error('❌ Router status check error:', error);
        setError(`Durum kontrolü hatası: ${error.message}`);
        setLoading(false);
      }
    };

    // İlk kontrol
    checkRouterStatus();

    // Her 45 saniyede bir kontrol et
    const interval = setInterval(checkRouterStatus, 45000);

    return () => clearInterval(interval);
  }, [user]);

  // Chart data hazırlama
  const getStatusChartData = () => {
    const onlineCount = Object.values(routerStats.routers).filter(r => r.status === 'online').length;
    const offlineCount = Object.values(routerStats.routers).filter(r => r.status === 'offline').length;

    return {
      labels: ['Çevrimiçi Router', 'Çevrimdışı Router'],
      datasets: [{
        data: [onlineCount, offlineCount],
        backgroundColor: [
          '#10b981', // Green for online
          '#ef4444'  // Red for offline
        ],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    };
  };

  const getDataTypesChartData = () => {
    const labels = Object.keys(routerStats.dataDistribution);
    const data = Object.values(routerStats.dataDistribution);
    const colors = [
      '#f59e0b', // Amber for temperature
      '#3b82f6', // Blue for humidity  
      '#10b981', // Green for pressure
      '#f97316', // Orange for CO
      '#ef4444'  // Red for NO2
    ];

    return {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors.slice(0, labels.length),
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    };
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true
        }
      }
    }
  };

  return (
    <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-xs rounded-xl">
      <div className="px-5 pt-5">
        <header className="flex justify-between items-start mb-2">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-emerald-500/10 mr-3">
              <span className="text-emerald-600 dark:text-emerald-400 text-2xl">🍰</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">
                Router Durum Özeti
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Sistem sağlığı ve veri dağılımı
              </p>
            </div>
          </div>
          
          {/* Sistem Sağlığı */}
          <div className="text-right">
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {routerStats.systemHealth}%
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Sistem Sağlığı
            </div>
          </div>
        </header>

        {/* Chart Seçimi */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setSelectedChart('status')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              selectedChart === 'status'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            📊 Router Durumu
          </button>
          <button
            onClick={() => setSelectedChart('data_types')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              selectedChart === 'data_types'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            📈 Veri Dağılımı
          </button>
        </div>

        {/* Loading ve Error Durumu */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Durum kontrol ediliyor...</span>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <div className="text-red-600 dark:text-red-400 mr-2 text-lg">⚠️</div>
              <div>
                <h3 className="text-red-800 dark:text-red-200 font-medium text-sm">
                  Durum Kontrolü Hatası
                </h3>
                <p className="text-red-700 dark:text-red-300 text-xs">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Chart Görünümü */}
        {!loading && !error && (
          <>
            <div className="h-48 mb-4">
              {selectedChart === 'status' && (
                <DoughnutChart data={getStatusChartData()} options={chartOptions} />
              )}
              {selectedChart === 'data_types' && Object.keys(routerStats.dataDistribution).length > 0 && (
                <DoughnutChart data={getDataTypesChartData()} options={chartOptions} />
              )}
              
              {selectedChart === 'data_types' && Object.keys(routerStats.dataDistribution).length === 0 && (
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📊</div>
                    <p>Henüz veri dağılımı yok</p>
                  </div>
                </div>
              )}
            </div>

            {/* Router Detayları */}
            <div className="space-y-3 mb-4">
              {Object.entries(routerStats.routers).map(([routerId, info]) => (
                <div key={routerId} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${
                        info.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <span className="font-medium text-gray-800 dark:text-gray-200">{routerId}</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-md ${
                      info.status === 'online' 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                      {info.status === 'online' ? 'Çevrimiçi' : 'Çevrimdışı'}
                    </span>
                  </div>
                  
                  {info.dataTypes.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Veri Tipleri:</div>
                      <div className="flex flex-wrap gap-1">
                        {info.dataTypes.map((type, index) => (
                          <span key={index} className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 px-2 py-1 rounded-md">
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {info.lastSeen && (
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Son görülme: {new Date(info.lastSeen).toLocaleTimeString('tr-TR')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Teknik Detaylar */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 dark:text-gray-400">
            <div>
              <span className="block">Toplam Router</span>
              <span className="text-gray-700 dark:text-gray-300">{Object.keys(routerStats.routers).length}</span>
            </div>
            <div>
              <span className="block">Aktif Veri Tipi</span>
              <span className="text-gray-700 dark:text-gray-300">{Object.keys(routerStats.dataDistribution).length}</span>
            </div>
            <div>
              <span className="block">Son Kontrol</span>
              <span className="text-gray-700 dark:text-gray-300">
                {routerStats.lastUpdate ? new Date(routerStats.lastUpdate).toLocaleTimeString('tr-TR') : 'Henüz kontrol edilmedi'}
              </span>
            </div>
            <div>
              <span className="block">Kontrol Sıklığı</span>
              <span className="text-gray-700 dark:text-gray-300">45 saniye</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardCard08;
