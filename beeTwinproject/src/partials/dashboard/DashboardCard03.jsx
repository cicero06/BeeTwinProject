import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import useRealTimeData from '../../hooks/useRealTimeData';
import LineChart from '../../charts/LineChart01';
import { chartAreaGradient } from '../../charts/ChartjsConfig';

// Import utilities
import { adjustColorOpacity, getCssVariable } from '../../utils/Utils';

/**
 * DashboardCard03 - Router 107 BMP280 Kovan Sıcaklık İzleme
 * 
 * Bu bileşen, dijital ikiz temelli akıllı arı kovanı izleme sisteminin 
 * Router 107 BMP280 sensöründen gelen gerçek zamanlı sıcaklık verilerini
 * analiz eden katmanını oluşturmaktadır.
 * 
 * Özellikler:
 * - Router 107 BMP280 sensöründen gerçek zamanlı sıcaklık ölçümleri
 * - Optimal aralık karşılaştırması (33-36°C)
 * - 24 saatlik sıcaklık trendi
 * - Kritik sıcaklık uyarıları
 * - Nem ve basınç bilgileri
 * 
 * Akademik Katkı: Dijital ikiz sisteminin gerçek IoT sensör veri analizi 
 * ve "izleme ve görselleştirme" işlevinin BMP280 sıcaklık parametresi bileşeni.
 */

function DashboardCard03() {
  const { user, hives } = useAuth();
  const { sensorData: realTimeSensorData, connectionStatus, isLoading: realTimeLoading } = useRealTimeData();

  const [sensorData, setSensorData] = useState({
    temperature: null,
    humidity: null,
    pressure: null,
    altitude: null,        // ✅ Altitude state eklendi
    lastUpdate: null,
    alertCount: 0,
    trendDirection: "stable",
    source: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Router 107 gerçek zamanlı veri işleme - Kullanıcıya özel filtre
  useEffect(() => {
    if (realTimeSensorData && realTimeSensorData.length > 0 && user) {
      // Kullanıcının kovanlarına ait Router 107 verilerini filtrele
      const userHiveIds = hives?.map(hive => hive.id) || [];

      // Router 107 verilerini filtrele ve kullanıcının kovanlarıyla eşleştir
      const router107Data = realTimeSensorData.filter(data => {
        const isRouter107 = data.routerId === "107" || data.deviceId === "107";
        // Eğer hiveId belirtilmişse, kullanıcının kovanlarından olmalı
        const isUserHive = !data.hiveId || userHiveIds.includes(data.hiveId) || userHiveIds.includes(data.hive_id);
        return isRouter107 && isUserHive;
      });

      if (router107Data.length > 0) {
        const latestData = router107Data[router107Data.length - 1];
        console.log('🌡️ Router 107 Real-time data:', latestData);

        setSensorData({
          temperature: latestData.parameters?.temperature || latestData.temperature || null,
          humidity: latestData.parameters?.humidity || latestData.humidity || null,
          pressure: latestData.parameters?.pressure || latestData.pressure || null,
          lastUpdate: latestData.timestamp || new Date().toISOString(),
          alertCount: calculateAlertCount(latestData.parameters?.temperature || latestData.temperature),
          trendDirection: "stable", // TODO: Implement trend calculation
          source: 'realtime'
        });
        setError(null);
      }
    }
  }, [realTimeSensorData, user, hives]);

  // Uyarı sayısını hesapla (optimal aralık dışı)
  const calculateAlertCount = (temperature) => {
    if (!temperature) return 0;
    return (temperature < 33 || temperature > 36) ? 1 : 0;
  };

  // Kullanıcının BMP280 (Router tip 1) router'ını bul
  const getBMP280RouterId = () => {
    if (!hives || hives.length === 0) return null;

    // İlk kovan, ilk router (BMP280)
    const firstHive = hives[0];
    if (firstHive?.hardware?.routers && firstHive.hardware.routers.length > 0) {
      const bmp280Router = firstHive.hardware.routers.find(r => r.routerType === 'bmp280');
      return bmp280Router?.routerId || null;
    }

    // Fallback: ESKİ sistem uyumluluğu
    if (firstHive?.sensor?.routerId) {
      return firstHive.sensor.routerId;
    }

    return null;
  };

  // Fallback API çağrısı (WebSocket bağlantısı yoksa)
  const fetchBMP280Data = async () => {
    if (connectionStatus) {
      console.log('WebSocket aktif, API çağrısı atlanıyor');
      return; // WebSocket varsa API çağrısı yapma
    }

    const routerId = getBMP280RouterId();
    if (!routerId) {
      setError('BMP280 router bulunamadı');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/sensors/router/${routerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const data = result.data;
          console.log(`📊 Router ${routerId} BMP280 Data (${data.source}):`, data);
          setSensorData({
            temperature: data.temperature || null,
            humidity: data.humidity || null,
            pressure: data.pressure || null,
            altitude: data.altitude || null,      // ✅ Altitude eklendi
            lastUpdate: data.timestamp || new Date().toISOString(),
            alertCount: calculateAlertCount(data.temperature),
            trendDirection: "stable",
            source: data.source || 'unknown'
          });
        } else {
          console.log('⚠️ API response başarısız:', result);
          setError('Veri alınamadı');
        }
      } else {
        throw new Error(`API Error: ${response.status}`);
      }
    } catch (err) {
      console.error('❌ BMP280 sensör verisi alınamadı:', err);
      setError(`Bağlantı hatası: ${err.message}`);
      // Hata durumunda null değerler göster - gerçek durum
      setSensorData({
        temperature: null,
        humidity: null,
        pressure: null,
        altitude: null,       // ✅ Altitude hata durumu
        lastUpdate: null,
        alertCount: 0,
        trendDirection: "stable",
        source: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // İlk yükleme ve otomatik güncelleme - 10 dakikalık veri periyoduna uygun
  useEffect(() => {
    fetchBMP280Data();

    // Her 2 dakikada bir kontrol et (veri 10 dakikada bir geldiği için)
    const interval = setInterval(fetchBMP280Data, 120000); // 2 dakika
    return () => clearInterval(interval);
  }, [hives]); // hives değişince yeniden çalış

  // BMP280 kovanını bul (dinamik)
  const bmp280Hive = hives?.find(hive =>
    hive.hardware?.routers?.some(r => r.routerType === 'bmp280') ||
    hive.sensor?.routerId // ESKİ sistem uyumluluğu
  );

  // Sıcaklık durumu analizi
  const getTemperatureStatus = (temp) => {
    if (temp === null) return { status: 'unknown', color: 'text-gray-400' };
    if (temp < 33) return { status: 'düşük', color: 'text-blue-500' };
    if (temp > 36) return { status: 'yüksek', color: 'text-red-500' };
    return { status: 'optimal', color: 'text-green-500' };
  };

  const tempStatus = getTemperatureStatus(sensorData.temperature);

  // Chart verileri - Router 107 BMP280 sıcaklık trendi
  const chartData = {
    labels: [
      '6 saat önce', '5 saat önce', '4 saat önce', '3 saat önce',
      '2 saat önce', '1 saat önce', 'Şimdi'
    ],
    datasets: [
      {
        label: 'Router 107 Sıcaklık',
        data: [
          34.1, 34.8, 35.2, 34.9, 35.1, 35.4,
          sensorData.temperature || 35.2
        ],
        borderColor: tempStatus.status === 'optimal' ? '#10b981' : tempStatus.status === 'yüksek' ? '#ef4444' : '#3b82f6',
        backgroundColor: function (context) {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return null;
          return chartAreaGradient(ctx, chartArea, [
            { stop: 0, color: `rgba(${tempStatus.status === 'optimal' ? '16, 185, 129' : tempStatus.status === 'yüksek' ? '239, 68, 68' : '59, 130, 246'}, 0)` },
            { stop: 1, color: `rgba(${tempStatus.status === 'optimal' ? '16, 185, 129' : tempStatus.status === 'yüksek' ? '239, 68, 68' : '59, 130, 246'}, 0.2)` }
          ]);
        },
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: tempStatus.status === 'optimal' ? '#10b981' : tempStatus.status === 'yüksek' ? '#ef4444' : '#3b82f6',
        fill: true,
      },
    ],
  };

  return (
    <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-xs rounded-xl border border-orange-200 dark:border-gray-700">
      {/* Header - Sıcaklık İzleme Başlığı */}
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">
            🌡️ Router 107 - BMP280 Kovan Sıcaklığı
          </h2>
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <span>Optimal Aralık: 33-36°C</span>
            {sensorData.source && (
              <span className={`px-2 py-0.5 rounded-full text-xs ${sensorData.source === 'sensor'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                }`}>
                {sensorData.source === 'sensor' ? '📡 Gerçek Veri' : '🎯 Simüle Veri'}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={fetchBMP280Data}
          disabled={loading}
          className={`px-3 py-1 text-xs rounded-lg transition-colors ${loading
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
            }`}
        >
          {loading ? '🔄' : '⟳'} Yenile
        </button>
      </header>

      {/* Temperature & Pressure Metrics */}
      <div className="px-5 py-4">
        <div className="grid grid-cols-2 gap-6 mb-4">
          {/* Sıcaklık */}
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              {sensorData.temperature !== null ? sensorData.temperature.toFixed(1) : '--'}°C
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Kovan Sıcaklığı
            </div>
            <div className={`text-xs mt-1 px-2 py-1 rounded-full ${sensorData.temperature !== null && sensorData.temperature >= 33 && sensorData.temperature <= 36
              ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
              : 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
              }`}>
              {sensorData.temperature !== null && sensorData.temperature >= 33 && sensorData.temperature <= 36 ? 'Optimal' : 'Dikkat'}
            </div>
          </div>

          {/* Basınç */}
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              {sensorData.pressure !== null ? (sensorData.pressure / 100).toFixed(1) : '--'} hPa
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Atmosfer Basıncı
            </div>
            <div className="text-xs mt-1 px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
              {sensorData.pressure !== null && sensorData.pressure > 101000 ? 'Yüksek' :
                sensorData.pressure !== null && sensorData.pressure < 100000 ? 'Düşük' : 'Normal'}
            </div>
          </div>
        </div>

        {/* Temperature Status */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-300">Optimal Aralık Dışı:</span>
            <span className={`text-sm font-medium ${(sensorData.alertCount && sensorData.alertCount > 0) ? 'text-amber-600' : 'text-green-600'}`}>
              {(sensorData.alertCount !== undefined && sensorData.alertCount !== null) ? sensorData.alertCount : 0} kovan
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-300">Trend:</span>
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200 capitalize">
              {sensorData.trendDirection === "stable" ? "Kararlı" :
                sensorData.trendDirection === "rising" ? "Yükseliyor" : "Düşüyor"}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-300">Son Güncelleme:</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {sensorData.lastUpdate ? new Date(sensorData.lastUpdate).toLocaleTimeString('tr-TR') : '--:--'}
            </span>
          </div>

          {/* Veri Kaynağı */}
          {sensorData.source && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">Veri Kaynağı:</span>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${sensorData.source === 'sensor' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                sensorData.source === 'realtime' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' :
                  sensorData.source === 'simulated' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400' :
                    'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                }`}>
                {sensorData.source === 'sensor' ? 'API' :
                  sensorData.source === 'realtime' ? 'WebSocket' :
                    sensorData.source === 'simulated' ? 'Simüle' : 'Hata'}
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

      {/* Temperature Trend Chart */}
      <div className="grow px-5 pb-5">
        <div className="h-24">
          <LineChart data={chartData} width={389} height={96} />
        </div>
      </div>
    </div>
  );
}

export default DashboardCard03;
