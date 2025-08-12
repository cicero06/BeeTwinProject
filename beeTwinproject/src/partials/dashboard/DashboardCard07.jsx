import React, { useState, useEffect } from 'react';
import LineChart from '../../charts/LineChart01';
import { useAuth } from '../../contexts/AuthContext';

/**
 * DashboardCard07 - Router Veri Trendleri (Chart Gösterimi)
 * 
 * Bu bileşen, BT107 ve BT108 router'larından gelen
 * sensör verilerinin zaman içindeki değişimini grafiklerle gösterir.
 * 
 * Özellikler:
 * - BT107: Sıcaklık, nem, basınç trend grafikleri
 * - BT108: CO ve NO2 gaz seviyesi trend grafikleri
 * - Gerçek zamanlı veri akışı
 * - Interactive chart görünümü
 * 
 * Veri Kaynağı: Backend /api/sensors/router/107/history ve /api/sensors/router/108/history
 */

function DashboardCard07() {
  const { user } = useAuth();

  const [trendData, setTrendData] = useState({
    bt107: {
      temperature: [],
      humidity: [],
      pressure: [],
      timestamps: []
    },
    bt108: {
      co: [],
      no2: [],
      timestamps: []
    },
    lastUpdate: null,
    connectionStatus: {
      bt107: 'disconnected',
      bt108: 'disconnected'
    },
    dataAge: {
      bt107: null,
      bt108: null
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedView, setSelectedView] = useState('temperature'); // temperature, humidity, pressure, air_quality

  // Router verilerini düzenli olarak çek ve trend datayı güncelle
  useEffect(() => {
    const fetchTrendData = async () => {
      if (!user) return;

      try {
        setError(null);
        const token = localStorage.getItem('token');

        console.log('📈 Card07 trend verileri alınıyor...');

        // BT107 ve BT108 için zamansal veriler çek (6 saatlik)
        const [bt107Response, bt108Response] = await Promise.all([
          fetch(`http://localhost:5000/api/sensors/router/107/history?hours=6&limit=20`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
          }),
          fetch(`http://localhost:5000/api/sensors/router/108/history?hours=6&limit=20`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
          })
        ]);

        const now = new Date();

        // BT107 verilerini işle
        let bt107Data = { temperature: [], humidity: [], pressure: [], timestamps: [] };
        let bt107ConnectionStatus = 'disconnected';
        let bt107DataAge = null;

        if (bt107Response.ok) {
          const bt107Result = await bt107Response.json();
          if (bt107Result.success && bt107Result.data.readings.length > 0) {
            const readings = bt107Result.data.readings;

            // Verileri işle
            bt107Data = {
              temperature: readings.map(r => r.temperature).filter(v => v !== null),
              humidity: readings.map(r => r.humidity).filter(v => v !== null),
              pressure: readings.map(r => r.pressure ? r.pressure / 100 : null).filter(v => v !== null), // hPa'ya çevir
              timestamps: readings.map(r => {
                const date = new Date(r.timestamp);
                return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
              })
            };

            // Bağlantı durumunu kontrol et
            const latestReading = readings[readings.length - 1];
            if (latestReading) {
              const dataTime = new Date(latestReading.timestamp);
              const ageMinutes = Math.round((now - dataTime) / 1000 / 60);
              bt107DataAge = ageMinutes;

              if (ageMinutes <= 5) bt107ConnectionStatus = 'live';
              else if (ageMinutes <= 30) bt107ConnectionStatus = 'recent';
              else if (ageMinutes <= 120) bt107ConnectionStatus = 'old';
              else bt107ConnectionStatus = 'very_old';
            }

            console.log(`📊 BT107 trend veri: ${readings.length} kayıt, durum: ${bt107ConnectionStatus}`);
          }
        }

        // BT108 verilerini işle
        let bt108Data = { co: [], no2: [], timestamps: [] };
        let bt108ConnectionStatus = 'disconnected';
        let bt108DataAge = null;

        if (bt108Response.ok) {
          const bt108Result = await bt108Response.json();
          if (bt108Result.success && bt108Result.data.readings.length > 0) {
            const readings = bt108Result.data.readings;

            bt108Data = {
              co: readings.map(r => r.co).filter(v => v !== null),
              no2: readings.map(r => r.no2).filter(v => v !== null),
              timestamps: readings.map(r => {
                const date = new Date(r.timestamp);
                return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
              })
            };

            // Bağlantı durumunu kontrol et
            const latestReading = readings[readings.length - 1];
            if (latestReading) {
              const dataTime = new Date(latestReading.timestamp);
              const ageMinutes = Math.round((now - dataTime) / 1000 / 60);
              bt108DataAge = ageMinutes;

              if (ageMinutes <= 5) bt108ConnectionStatus = 'live';
              else if (ageMinutes <= 30) bt108ConnectionStatus = 'recent';
              else if (ageMinutes <= 120) bt108ConnectionStatus = 'old';
              else bt108ConnectionStatus = 'very_old';
            }

            console.log(`📊 BT108 trend veri: ${readings.length} kayıt, durum: ${bt108ConnectionStatus}`);
          }
        }

        setTrendData(prevData => {
          const newData = {
            bt107: bt107Data,
            bt108: bt108Data,
            lastUpdate: now.toISOString(),
            connectionStatus: {
              bt107: bt107ConnectionStatus,
              bt108: bt108ConnectionStatus
            },
            dataAge: {
              bt107: bt107DataAge,
              bt108: bt108DataAge
            }
          };

          console.log('📈 Card07 trend data updated:', {
            bt107Points: newData.bt107.temperature.length,
            bt108Points: newData.bt108.co.length,
            lastUpdate: newData.lastUpdate
          });

          return newData;
        });

        setLoading(false);
      } catch (error) {
        console.error('❌ Trend data fetch error:', error);
        setError(`Veri alım hatası: ${error.message}`);
        setLoading(false);
      }
    };

    // İlk yükleme
    fetchTrendData();

    // Her 2 dakikada bir güncelle (chart için uygun)
    const interval = setInterval(fetchTrendData, 120000);

    return () => clearInterval(interval);
  }, [user]);

  // Chart data hazırlama fonksiyonları
  const getTemperatureChartData = () => ({
    labels: trendData.bt107.timestamps,
    datasets: [{
      label: 'Kovan Sıcaklığı (°C)',
      data: trendData.bt107.temperature,
      borderColor: '#f59e0b',
      backgroundColor: 'rgba(245, 158, 11, 0.1)',
      borderWidth: 2,
      fill: true,
      tension: 0.4
    }]
  });

  const getHumidityChartData = () => ({
    labels: trendData.bt107.timestamps,
    datasets: [{
      label: 'Kovan Nemi (%)',
      data: trendData.bt107.humidity,
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderWidth: 2,
      fill: true,
      tension: 0.4
    }]
  });

  const getPressureChartData = () => ({
    labels: trendData.bt107.timestamps,
    datasets: [{
      label: 'Atmosfer Basıncı (hPa)',
      data: trendData.bt107.pressure,
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      borderWidth: 2,
      fill: true,
      tension: 0.4
    }]
  });

  const getAirQualityChartData = () => ({
    labels: trendData.bt108.timestamps,
    datasets: [
      {
        label: 'CO Seviyesi (ppm)',
        data: trendData.bt108.co,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.4
      },
      {
        label: 'NO2 Seviyesi (ppb)',
        data: trendData.bt108.no2,
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.4
      }
    ]
  });

  // Seçili görünüm için chart data'sını döndür
  const getCurrentChartData = () => {
    switch (selectedView) {
      case 'temperature':
        return getTemperatureChartData();
      case 'humidity':
        return getHumidityChartData();
      case 'pressure':
        return getPressureChartData();
      case 'air_quality':
        return getAirQualityChartData();
      default:
        return getTemperatureChartData();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col col-span-full xl:col-span-8 bg-white dark:bg-gray-800 shadow-xs rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="px-5 py-4 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Trend verileri yükleniyor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col col-span-full xl:col-span-8 bg-white dark:bg-gray-800 shadow-xs rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="px-5 py-4">
        {/* Header */}
        <header className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1 flex items-center gap-2">
                📈 Sensör Veri Trendleri
                {/* Bağlantı Durumu */}
                {trendData.connectionStatus && (
                  <div className="flex gap-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${trendData.connectionStatus.bt107 === 'live' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                      trendData.connectionStatus.bt107 === 'recent' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' :
                        trendData.connectionStatus.bt107 === 'old' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
                          'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                      BT107: {
                        trendData.connectionStatus.bt107 === 'live' ? `🟢 ${trendData.dataAge.bt107}dk` :
                          trendData.connectionStatus.bt107 === 'recent' ? `🔵 ${trendData.dataAge.bt107}dk` :
                            trendData.connectionStatus.bt107 === 'old' ? `🟡 ${trendData.dataAge.bt107}dk` :
                              `🔴 ${trendData.dataAge.bt107}dk`
                      }
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${trendData.connectionStatus.bt108 === 'live' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                      trendData.connectionStatus.bt108 === 'recent' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' :
                        trendData.connectionStatus.bt108 === 'old' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
                          'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                      BT108: {
                        trendData.connectionStatus.bt108 === 'live' ? `🟢 ${trendData.dataAge.bt108}dk` :
                          trendData.connectionStatus.bt108 === 'recent' ? `🔵 ${trendData.dataAge.bt108}dk` :
                            trendData.connectionStatus.bt108 === 'old' ? `🟡 ${trendData.dataAge.bt108}dk` :
                              `🔴 ${trendData.dataAge.bt108}dk`
                      }
                    </span>
                  </div>
                )}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                BT107 & BT108 Zamansal Grafikler (6 Saatlik)
              </p>
            </div>
          </div>
        </header>

        {/* Görünüm Seçimi */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setSelectedView('temperature')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${selectedView === 'temperature'
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
          >
            🌡️ Sıcaklık
          </button>
          <button
            onClick={() => setSelectedView('humidity')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${selectedView === 'humidity'
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
          >
            💧 Nem
          </button>
          <button
            onClick={() => setSelectedView('pressure')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${selectedView === 'pressure'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
          >
            🌊 Basınç
          </button>
          <button
            onClick={() => setSelectedView('air_quality')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${selectedView === 'air_quality'
              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
          >
            🌬️ Hava Kalitesi
          </button>
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

        {/* Chart */}
        <div className="grow">
          <div className="h-64">
            <LineChart data={getCurrentChartData()} width={800} height={256} />
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
            <span>Son Güncelleme: {trendData.lastUpdate ? new Date(trendData.lastUpdate).toLocaleTimeString('tr-TR') : '--:--'}</span>
            <span>
              Veri Noktaları: BT107({trendData.bt107.temperature.length}) BT108({trendData.bt108.co.length})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardCard07;
