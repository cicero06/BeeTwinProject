import React, { useState, useEffect } from 'react';
import useRealTimeData from '../../hooks/useRealTimeData';
import { useAuth } from '../../contexts/AuthContext';
import BarChart from '../../charts/BarChart01';

/**
 * DashboardCard04 - Router 107 BMP280 Nem Seviyeleri  
 * 
 * Bu bileşen, Router 107 BMP280 sensöründen gelen nem verilerini
 * gerçek zamanlı olarak izleyen özelleştirilmiş dashboard kartıdır.
 * 
 * Özellikler:
 * - Router 107 BMP280 sensöründen gerçek zamanlı nem ölçümleri
 * - API fallback desteği
 * - Optimal nem aralığı karşılaştırması (%50-70 arı kovanı için)
 * - Nem durumu gösterimi
 * 
 * Veri Kaynağı: Backend /api/sensors/router-107 endpoint'i
 */

function DashboardCard04() {
  const { user, hives } = useAuth();
  const { sensorData: realTimeSensorData, connectionStatus } = useRealTimeData();

  const [humidityData, setHumidityData] = useState({
    humidity: null,
    optimalRange: { min: 50, max: 70 }, // Arı kovanı için optimal nem aralığı
    status: 'normal',
    lastUpdate: null,
    source: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Router 107 gerçek zamanlı nem veri işleme
  useEffect(() => {
    if (realTimeSensorData && realTimeSensorData.length > 0 && user) {
      // Kullanıcının kovanlarına ait Router 107 verilerini filtrele
      const userHiveIds = hives?.map(hive => hive.id) || [];

      // Router 107 verilerini filtrele
      const router107Data = realTimeSensorData.filter(data => {
        const isRouter107 = data.routerId === "107" || data.deviceId === "107";
        const isUserHive = !data.hiveId || userHiveIds.includes(data.hiveId) || userHiveIds.includes(data.hive_id);
        return isRouter107 && isUserHive;
      });

      if (router107Data.length > 0) {
        const latestData = router107Data[router107Data.length - 1];
        console.log('💧 Router 107 Real-time humidity data:', latestData);

        const humidity = latestData.parameters?.humidity || latestData.humidity;
        if (humidity !== null && humidity !== undefined) {
          setHumidityData({
            humidity: humidity,
            optimalRange: { min: 50, max: 70 },
            status: humidity >= 50 && humidity <= 70 ? 'optimal' :
              humidity < 50 ? 'dry' : 'wet',
            lastUpdate: latestData.timestamp || new Date().toISOString(),
            source: 'realtime'
          });
          setError(null);
        }
      }
    }
  }, [realTimeSensorData, user, hives]);

  // Fallback API çağrısı (WebSocket bağlantısı yoksa)
  const fetchRouter107HumidityData = async () => {
    if (connectionStatus) {
      console.log('WebSocket aktif, API çağrısı atlanıyor');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/sensors/router-107', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const data = result.data;
          console.log(`💧 Router 107 Humidity Data (${data.source}):`, data);
          setHumidityData({
            humidity: data.humidity || null,
            optimalRange: { min: 50, max: 70 },
            status: data.humidity >= 50 && data.humidity <= 70 ? 'optimal' :
              data.humidity < 50 ? 'dry' : 'wet',
            lastUpdate: data.timestamp || new Date().toISOString(),
            source: data.source || 'unknown'
          });
        } else {
          console.log('⚠️ API response başarısız:', result);
          setError('Nem verisi alınamadı');
        }
      } else {
        throw new Error(`API Error: ${response.status}`);
      }
    } catch (err) {
      console.error('❌ Router 107 nem verisi alınamadı:', err);
      setError(`Bağlantı hatası: ${err.message}`);
      // Hata durumunda null değerler göster
      setHumidityData({
        humidity: null,
        optimalRange: { min: 50, max: 70 },
        status: 'error',
        lastUpdate: null,
        source: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // İlk yükleme ve otomatik güncelleme - 10 dakikalık veri periyoduna uygun
  useEffect(() => {
    fetchRouter107HumidityData();

    // Her 2 dakikada bir kontrol et (veri 10 dakikada bir geldiği için)
    const interval = setInterval(fetchRouter107HumidityData, 120000); // 2 dakika
    return () => clearInterval(interval);
  }, [connectionStatus]);

  // Chart data
  const chartData = {
    labels: ['Mevcut Nem'],
    datasets: [
      {
        label: 'Nem Seviyesi (%)',
        data: [humidityData.humidity || 0],
        backgroundColor: humidityData.status === 'optimal' ? '#10b981' :
          humidityData.status === 'dry' ? '#f59e0b' : '#ef4444',
        borderColor: humidityData.status === 'optimal' ? '#10b981' :
          humidityData.status === 'dry' ? '#f59e0b' : '#ef4444',
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-xs rounded-xl border border-blue-200 dark:border-gray-700">
      {/* Header */}
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">
            💧 Router 107 - BMP280 Kovan Nemi
          </h2>
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <span>Optimal Aralık: %50-70</span>
            {humidityData.source && (
              <span className={`px-2 py-0.5 rounded-full text-xs ${humidityData.source === 'sensor'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                  : humidityData.source === 'realtime'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                    : 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                }`}>
                {humidityData.source === 'sensor' ? '📡 API' :
                  humidityData.source === 'realtime' ? '⚡ WebSocket' : '🎯 Simüle'}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={fetchRouter107HumidityData}
          disabled={loading}
          className={`px-3 py-1 text-xs rounded-lg transition-colors ${loading
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
            }`}
        >
          {loading ? '🔄' : '⟳'} Yenile
        </button>
      </header>

      {/* Humidity Metrics */}
      <div className="px-5 py-4">
        <div className="text-center mb-4">
          <div className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            {humidityData.humidity !== null ? humidityData.humidity.toFixed(1) : '--'}%
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Kovan Nem Seviyesi
          </div>
          <div className={`text-xs mt-2 px-3 py-1 rounded-full inline-block ${humidityData.status === 'optimal'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
              : humidityData.status === 'dry'
                ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                : humidityData.status === 'wet'
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
            }`}>
            {humidityData.status === 'optimal' ? '✅ Optimal' :
              humidityData.status === 'dry' ? '⚠️ Kuru' :
                humidityData.status === 'wet' ? '💧 Nemli' : '❓ Bilinmiyor'}
          </div>
        </div>

        {/* Status Details */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-300">Optimal Aralık:</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {humidityData.optimalRange.min}% - {humidityData.optimalRange.max}%
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-300">Son Güncelleme:</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {humidityData.lastUpdate ? new Date(humidityData.lastUpdate).toLocaleTimeString('tr-TR') : '--:--'}
            </span>
          </div>

          {/* Veri Kaynağı */}
          {humidityData.source && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">Veri Kaynağı:</span>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${humidityData.source === 'sensor' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                  humidityData.source === 'realtime' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' :
                    humidityData.source === 'simulated' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                }`}>
                {humidityData.source === 'sensor' ? 'API' :
                  humidityData.source === 'realtime' ? 'WebSocket' :
                    humidityData.source === 'simulated' ? 'Simüle' : 'Hata'}
              </span>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center text-sm text-red-700 dark:text-red-400">
              <span className="mr-2">⚠️</span>
              {error}
            </div>
          </div>
        )}
      </div>

      {/* Humidity Bar Chart */}
      <div className="grow px-5 pb-5">
        <BarChart data={chartData} width={389} height={96} />
      </div>
    </div>
  );
}

export default DashboardCard04;