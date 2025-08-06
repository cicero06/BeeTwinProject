import React, { useState, useEffect } from 'react';
import useRealTimeData from '../../hooks/useRealTimeData';
import { useAuth } from '../../contexts/AuthContext';
import DoughnutChart from '../../charts/DoughnutChart';

// Import utilities
import { getCssVariable } from '../../utils/Utils';

/**
 * DashboardCard06 - Router 108 MICS-4514 Hava Kalitesi
 * 
 * Bu bileşen, Router 108 MICS-4514 sensöründen gelen hava kalitesi verilerini
 * gerçek zamanlı olarak izleyen özelleştirilmiş dashboard kartıdır.
 * 
 * Özellikler:
 * - Router 108 MICS-4514 sensöründen CO, NO2 gaz seviyesi ölçümleri
 * - API fallback desteği
 * - Hava kalitesi durumu gösterimi
 * - Gaz seviyesi uyarıları
 * 
 * Veri Kaynağı: Backend /api/sensors/router-108 endpoint'i
 */

function DashboardCard06() {
  const { user, hives } = useAuth();
  const { sensorData: realTimeSensorData, connectionStatus, isLoading: realTimeLoading } = useRealTimeData();

  const [airQualityData, setAirQualityData] = useState({
    co: null,
    no2: null,
    overallScore: null,
    status: 'normal',
    lastUpdate: null,
    source: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Router 108 gerçek zamanlı hava kalitesi veri işleme
  useEffect(() => {
    if (realTimeSensorData && realTimeSensorData.length > 0 && user) {
      // Kullanıcının kovanlarına ait Router 108 verilerini filtrele
      const userHiveIds = hives?.map(hive => hive.id) || [];

      // Router 108 verilerini filtrele
      const router108Data = realTimeSensorData.filter(data => {
        const isRouter108 = data.routerId === "108" || data.deviceId === "108";
        const isUserHive = !data.hiveId || userHiveIds.includes(data.hiveId) || userHiveIds.includes(data.hive_id);
        return isRouter108 && isUserHive;
      });

      if (router108Data.length > 0) {
        const latestData = router108Data[router108Data.length - 1];
        console.log('🌬️ Router 108 Real-time air quality data:', latestData);

        const co = latestData.parameters?.co || latestData.co;
        const no2 = latestData.parameters?.no2 || latestData.no2;

        if (co !== null || no2 !== null) {
          // Genel hava kalitesi skoru hesapla (basit)
          const score = calculateAirQualityScore(co, no2);

          setAirQualityData({
            co: co,
            no2: no2,
            gasLevel: gasLevel,
            overallScore: score,
            status: score >= 80 ? 'good' : score >= 60 ? 'moderate' : 'poor',
            lastUpdate: latestData.timestamp || new Date().toISOString(),
            source: 'realtime'
          });
          setError(null);
        }
      }
    }
  }, [realTimeSensorData, user, hives]);

  // Hava kalitesi skoru hesaplama fonksiyonu
  const calculateAirQualityScore = (co, no2) => {
    if (!co && !no2) return null;

    // Basit scoring sistemi (0-100)
    let score = 100;

    // CO seviyesi kontrolü (ppm)
    if (co > 2) score -= 30;
    else if (co > 1) score -= 15;

    // NO2 seviyesi kontrolü (ppm)  
    if (no2 > 1.5) score -= 25;
    else if (no2 > 0.8) score -= 10;

    return Math.max(0, Math.min(100, score));
  };

  // Fallback API çağrısı (WebSocket bağlantısı yoksa)
  const fetchRouter108AirQualityData = async () => {
    if (connectionStatus) {
      console.log('WebSocket aktif, API çağrısı atlanıyor');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/sensors/router-108', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const data = result.data;
          console.log(`🌬️ Router 108 Air Quality Data (${data.source}):`, data);

          const score = calculateAirQualityScore(data.co, data.no2);

          setAirQualityData({
            co: data.co || null,
            no2: data.no2 || null,
            overallScore: score,
            status: score >= 80 ? 'good' : score >= 60 ? 'moderate' : 'poor',
            lastUpdate: data.timestamp || new Date().toISOString(),
            source: data.source || 'unknown'
          });
        } else {
          console.log('⚠️ API response başarısız:', result);
          setError('Hava kalitesi verisi alınamadı');
        }
      } else {
        throw new Error(`API Error: ${response.status}`);
      }
    } catch (err) {
      console.error('❌ Router 108 hava kalitesi verisi alınamadı:', err);
      setError(`Bağlantı hatası: ${err.message}`);
      // Hata durumunda null değerler göster
      setAirQualityData({
        co: null,
        no2: null,
        nh3: null,
        gasLevel: null,
        overallScore: null,
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
    fetchRouter108AirQualityData();

    // Her 2 dakikada bir kontrol et (veri 10 dakikada bir geldiği için)
    const interval = setInterval(fetchRouter108AirQualityData, 120000); // 2 dakika
    return () => clearInterval(interval);
  }, [connectionStatus]);

  // Chart data for air quality visualization
  const chartData = {
    labels: ['İyi', 'Orta', 'Kötü'],
    datasets: [
      {
        label: 'Hava Kalitesi',
        data: [
          airQualityData.status === 'good' ? 100 : 0,
          airQualityData.status === 'moderate' ? 100 : 0,
          airQualityData.status === 'poor' ? 100 : 0
        ],
        backgroundColor: [
          '#10b981', // green for good
          '#f59e0b', // yellow for moderate  
          '#ef4444'  // red for poor
        ],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-xs rounded-xl border border-green-200 dark:border-gray-700">
      {/* Header */}
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">
            🌬️ Router 108 - MICS-4514 Hava Kalitesi
          </h2>
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <span>CO, NO2, NH3 Gaz Seviyeleri</span>
            {airQualityData.source && (
              <span className={`px-2 py-0.5 rounded-full text-xs ${airQualityData.source === 'sensor'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                : airQualityData.source === 'realtime'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                  : 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                }`}>
                {airQualityData.source === 'sensor' ? '📡 API' :
                  airQualityData.source === 'realtime' ? '⚡ WebSocket' : '🎯 Simüle'}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={fetchRouter108AirQualityData}
          disabled={loading}
          className={`px-3 py-1 text-xs rounded-lg transition-colors ${loading
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-green-50 hover:bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
            }`}
        >
          {loading ? '🔄' : '⟳'} Yenile
        </button>
      </header>

      {/* Air Quality Metrics */}
      <div className="px-5 py-4">
        {/* Overall Score */}
        <div className="text-center mb-4">
          <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {airQualityData.overallScore !== null ? Math.round(airQualityData.overallScore) : '--'}/100
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Genel Hava Kalitesi Skoru
          </div>
          <div className={`text-xs mt-2 px-3 py-1 rounded-full inline-block ${airQualityData.status === 'good'
            ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
            : airQualityData.status === 'moderate'
              ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
              : airQualityData.status === 'poor'
                ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
            }`}>
            {airQualityData.status === 'good' ? '✅ İyi' :
              airQualityData.status === 'moderate' ? '⚠️ Orta' :
                airQualityData.status === 'poor' ? '❌ Kötü' : '❓ Bilinmiyor'}
          </div>
        </div>

        {/* Gas Level Details */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {airQualityData.co !== null && airQualityData.co !== undefined ? airQualityData.co.toFixed(2) : '--'} ppm
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">CO Seviyesi</div>
          </div>

          <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {airQualityData.no2 !== null && airQualityData.no2 !== undefined ? airQualityData.no2.toFixed(2) : '--'} ppm
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">NO2 Seviyesi</div>
          </div>
        </div>

        {/* Status Details */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-300">Genel Gaz Seviyesi:</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {airQualityData.gasLevel !== null && airQualityData.gasLevel !== undefined ? airQualityData.gasLevel.toFixed(1) : '--'}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-300">Son Güncelleme:</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {airQualityData.lastUpdate ? new Date(airQualityData.lastUpdate).toLocaleTimeString('tr-TR') : '--:--'}
            </span>
          </div>

          {/* Veri Kaynağı */}
          {airQualityData.source && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">Veri Kaynağı:</span>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${airQualityData.source === 'sensor' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                airQualityData.source === 'realtime' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' :
                  airQualityData.source === 'simulated' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400' :
                    'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                }`}>
                {airQualityData.source === 'sensor' ? 'API' :
                  airQualityData.source === 'realtime' ? 'WebSocket' :
                    airQualityData.source === 'simulated' ? 'Simüle' : 'Hata'}
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

      {/* Air Quality Doughnut Chart */}
      <div className="grow px-5 pb-5">
        <DoughnutChart data={chartData} width={389} height={96} />
      </div>
    </div>
  );
}

export default DashboardCard06;
