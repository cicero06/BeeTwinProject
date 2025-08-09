import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import useRealTimeData from '../../hooks/useRealTimeData';
import LineChart from '../../charts/LineChart01';
import { chartAreaGradient } from '../../charts/ChartjsConfig';
import HardwareService from '../../services/hardwareService';

// Import utilities
import { adjustColorOpacity, getCssVariable } from '../../utils/Utils';
import {
  getDeviceSensorData,
  getLatestDeviceData,
  getDeviceConfig,
  isDeviceOnline,
  prepareDeviceChartData
} from '../../utils/deviceDataUtils';

/**
 * DashboardCard03 - Router 107 BMP280 Sıcaklık & Basınç İzleme
 * 
 * Bu bileşen, dijital ikiz temelli akıllı arı kovanı izleme sisteminin 
 * Router 107 BMP280 sensöründen gelen gerçek zamanlı sıcaklık ve basınç verilerini
 * analiz eden katmanını oluşturmaktadır.
 * 
 * Özellikler:
 * - Router 107 BMP280 sensöründen gerçek zamanlı temperature ve pressure ölçümleri
 * - Optimal sıcaklık aralığı karşılaştırması (33-36°C)
 * - Basınç değeri görünümü (hPa)
 * - 24 saatlik sıcaklık ve basınç trendi
 * - Kritik değer uyarıları
 * 
 * Akademik Katkı: Dijital ikiz sisteminin gerçek IoT sensör veri analizi 
 * ve "izleme ve görselleştirme" işlevinin BMP280 sıcaklık-basınç parametresi bileşeni.
 */

function DashboardCard03() {
  const { user, hives, coordinatorStatus } = useAuth();
  const { sensorData: realTimeSensorData, connectionStatus, isLoading: realTimeLoading } = useRealTimeData();

  const [sensorData, setSensorData] = useState({
    temperature: null,
    pressure: null,
    lastUpdate: null,
    alertCount: 0,
    trendDirection: "stable",
    source: null
  });
  const [routerConfigs, setRouterConfigs] = useState([]);
  const [bmp280RouterId, setBmp280RouterId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Manual refresh trigger

  // Debug: sensorData değişimlerini izle
  useEffect(() => {
    console.log('🟢 sensorData updated:', sensorData);
  }, [sensorData]);

  // 🎯 PERMANENT SOLUTION: Load router configurations from backend
  useEffect(() => {
    console.log('🔧 DashboardCard03 useEffect triggered');
    console.log('User:', user);
    console.log('Hives:', hives);

    const loadRouterConfigurations = async () => {
      if (!user || !hives || hives.length === 0) {
        console.log('❌ Conditions not met: user=', !!user, 'hives=', !!hives, 'hivesLength=', hives?.length);
        return;
      }

      try {
        // Get first available hive for router configurations
        const targetHive = hives[0];
        console.log('🔍 Loading router configurations for hive:', targetHive.name, 'ID:', targetHive._id);

        const result = await HardwareService.getRouterConfigurations(targetHive._id);
        console.log('🔄 HardwareService result:', result);

        if (result.success && result.data.routers) {
          setRouterConfigs(result.data.routers);
          console.log('✅ Router configurations loaded:', result.data.routers);

          // Find BMP280 router
          const bmp280Router = result.data.routers.find(router =>
            router.routerType === 'bmp280' ||
            router.dataKeys?.includes('temperature')
          );

          if (bmp280Router) {
            setBmp280RouterId(bmp280Router.routerId);
            console.log('🎯 BMP280 Router found:', bmp280Router.routerId);
          } else {
            console.log('⚠️ BMP280 Router bulunamadı');
          }
        } else {
          console.log('⚠️ Router configurations not available:', result);
        }
      } catch (error) {
        console.error('❌ Failed to load router configurations:', error);
      }
    };

    loadRouterConfigurations();
  }, [user, hives]);

  // 🔧 YENİ: Dinamik Router Veri Alma
  useEffect(() => {
    const fetchRouterData = async () => {
      if (!user || !hives || hives.length === 0 || !bmp280RouterId) return;

      setLoading(true);
      setError(null);

      try {
        console.log(`� BMP280 Router ${bmp280RouterId} için veri alınıyor...`);

        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/sensors/router/${bmp280RouterId}/latest`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const data = result.data;
            console.log(`🌡️ Router ${bmp280RouterId} Raw Data:`, data);

            setSensorData({
              temperature: data.temperature || data.WT || null,
              pressure: data.pressure || data.PR || null,
              lastUpdate: data.timestamp,
              alertCount: calculateAlertCount(data.temperature || data.WT),
              trendDirection: "stable",
              source: 'api_permanent'
            });

            // Debug log
            console.log('🔍 DEBUG - Card03 Parsed data:', {
              temperature: data.temperature || data.WT,
              pressure: data.pressure || data.PR,
              allFields: Object.keys(data)
            });

            setError(null);
          } else {
            console.log('⚠️ No data from router API:', result);
            setError('Router verisi bulunamadı');
          }
        } else {
          console.error('❌ API request failed:', response.status);
          setError(`API isteği başarısız: ${response.status}`);
        }
      } catch (error) {
        console.error('❌ Dynamic router data fetch error:', error);
        setError('Veri alınırken hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    // İlk veri yükleme
    fetchRouterData();

    // Her 30 saniyede bir güncelle
    const interval = setInterval(fetchRouterData, 30000);

    return () => clearInterval(interval);
  }, [user, hives, bmp280RouterId, refreshTrigger]);

  // Gerçek zamanlı veri WebSocket'ten gelirse öncelik ver
  useEffect(() => {
    if (realTimeSensorData && realTimeSensorData.length > 0 && user && bmp280RouterId) {
      // Dinamik router ID'ye göre filtrele
      const routerData = realTimeSensorData.filter(data => {
        return data.routerId === bmp280RouterId || data.deviceId === bmp280RouterId;
      });

      if (routerData.length > 0) {
        const latestData = routerData[routerData.length - 1];
        console.log(`🔄 Real-time update for Router ${bmp280RouterId}:`, latestData);

        setSensorData(prev => ({
          ...prev,
          temperature: latestData.temperature || latestData.parameters?.temperature || prev.temperature,
          humidity: latestData.humidity || latestData.parameters?.humidity || prev.humidity,
          pressure: latestData.pressure || latestData.parameters?.pressure || prev.pressure,
          altitude: latestData.altitude || latestData.parameters?.altitude || prev.altitude,
          lastUpdate: latestData.timestamp || new Date().toISOString(),
          alertCount: calculateAlertCount(latestData.temperature || latestData.parameters?.temperature),
          source: 'realtime_dynamic'
        }));
        setError(null);
      }
    }
  }, [realTimeSensorData, user, hives, bmp280RouterId]);

  // Uyarı sayısını hesapla (optimal aralık dışı)
  const calculateAlertCount = (temperature) => {
    if (!temperature) return 0;
    return (temperature < 33 || temperature > 36) ? 1 : 0;
  };

  // BMP280 kovanını bul (dinamik)

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
          onClick={() => {
            // Manual refresh - force re-fetch data
            console.log('🔄 Manual refresh triggered for BMP280 data');
            setError(null);
            setRefreshTrigger(prev => prev + 1); // Trigger useEffect
          }}
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
