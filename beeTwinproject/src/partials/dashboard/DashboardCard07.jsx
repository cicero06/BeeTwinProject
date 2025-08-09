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
 * Veri Kaynağı: Backend /api/sensors/router/107/latest ve /api/sensors/router/108/latest
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
    lastUpdate: null
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
        
        // BT107 ve BT108 verilerini paralel çek
        const [bt107Response, bt108Response] = await Promise.all([
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
        ]);

        const bt107Data = bt107Response.ok ? await bt107Response.json() : null;
        const bt108Data = bt108Response.ok ? await bt108Response.json() : null;

        const now = new Date();
        const timeLabel = now.toLocaleTimeString('tr-TR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });

        setTrendData(prevData => {
          const newData = { ...prevData };

          // BT107 verilerini ekle
          if (bt107Data?.success && bt107Data.data) {
            const data = bt107Data.data;
            
            // Maksimum 20 veri noktası tut (son 20 güncelleme)
            const maxPoints = 20;
            
            if (data.temperature !== null && data.temperature !== undefined) {
              newData.bt107.temperature = [...prevData.bt107.temperature, data.temperature].slice(-maxPoints);
            }
            if (data.humidity !== null && data.humidity !== undefined) {
              newData.bt107.humidity = [...prevData.bt107.humidity, data.humidity].slice(-maxPoints);
            }
            if (data.pressure !== null && data.pressure !== undefined) {
              newData.bt107.pressure = [...prevData.bt107.pressure, data.pressure].slice(-maxPoints);
            }
            newData.bt107.timestamps = [...prevData.bt107.timestamps, timeLabel].slice(-maxPoints);
          }

          // BT108 verilerini ekle
          if (bt108Data?.success && bt108Data.data) {
            const data = bt108Data.data;
            
            if (data.co !== null && data.co !== undefined) {
              newData.bt108.co = [...prevData.bt108.co, data.co].slice(-20);
            }
            if (data.no2 !== null && data.no2 !== undefined) {
              newData.bt108.no2 = [...prevData.bt108.no2, data.no2].slice(-20);
            }
            newData.bt108.timestamps = [...prevData.bt108.timestamps, timeLabel].slice(-20);
          }

          newData.lastUpdate = now.toISOString();
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

    // Her 30 saniyede bir güncelle (chart için yeterli)
    const interval = setInterval(fetchTrendData, 30000);

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
        label: 'CO (ppm)',
        data: trendData.bt108.co,
        borderColor: '#f97316',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.4
      },
      {
        label: 'NO2 (ppm)',
        data: trendData.bt108.no2,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.4
      }
    ]
  });

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Zaman'
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: selectedView === 'temperature' ? 'Sıcaklık (°C)' :
                selectedView === 'humidity' ? 'Nem (%)' :
                selectedView === 'pressure' ? 'Basınç (hPa)' :
                'Konsantrasyon (ppm)'
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  };

  return (
    <div className="flex flex-col col-span-full xl:col-span-8 bg-white dark:bg-gray-800 shadow-xs rounded-xl">
      <div className="px-5 pt-5">
        <header className="flex justify-between items-start mb-2">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-indigo-500/10 mr-3">
              <span className="text-indigo-600 dark:text-indigo-400 text-2xl">📈</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">
                Router Veri Trendleri
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                BT107 & BT108 Gerçek Zamanlı Grafikler
              </p>
            </div>
          </div>
        </header>

        {/* Görünüm Seçimi */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setSelectedView('temperature')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              selectedView === 'temperature'
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            🌡️ Sıcaklık
          </button>
          <button
            onClick={() => setSelectedView('humidity')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              selectedView === 'humidity'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            💧 Nem
          </button>
          <button
            onClick={() => setSelectedView('pressure')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              selectedView === 'pressure'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            🌊 Basınç
          </button>
          <button
            onClick={() => setSelectedView('air_quality')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              selectedView === 'air_quality'
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            🌬️ Hava Kalitesi
          </button>
        </div>

        {/* Loading ve Error Durumu */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Grafik verisi yükleniyor...</span>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <div className="text-red-600 dark:text-red-400 mr-2 text-lg">⚠️</div>
              <div>
                <h3 className="text-red-800 dark:text-red-200 font-medium text-sm">
                  Grafik Verisi Hatası
                </h3>
                <p className="text-red-700 dark:text-red-300 text-xs">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Chart Görünümü */}
        {!loading && !error && (
          <div className="h-64 mb-4">
            {selectedView === 'temperature' && trendData.bt107.temperature.length > 0 && (
              <LineChart data={getTemperatureChartData()} options={chartOptions} />
            )}
            {selectedView === 'humidity' && trendData.bt107.humidity.length > 0 && (
              <LineChart data={getHumidityChartData()} options={chartOptions} />
            )}
            {selectedView === 'pressure' && trendData.bt107.pressure.length > 0 && (
              <LineChart data={getPressureChartData()} options={chartOptions} />
            )}
            {selectedView === 'air_quality' && (trendData.bt108.co.length > 0 || trendData.bt108.no2.length > 0) && (
              <LineChart data={getAirQualityChartData()} options={chartOptions} />
            )}
            
            {/* Veri Yok Durumu */}
            {((selectedView === 'temperature' && trendData.bt107.temperature.length === 0) ||
              (selectedView === 'humidity' && trendData.bt107.humidity.length === 0) ||
              (selectedView === 'pressure' && trendData.bt107.pressure.length === 0) ||
              (selectedView === 'air_quality' && trendData.bt108.co.length === 0 && trendData.bt108.no2.length === 0)) && (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <div className="text-4xl mb-2">📊</div>
                  <p>Henüz grafik verisi yok</p>
                  <p className="text-xs">Veriler gelmeye başladığında burada gösterilecek</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* İstatistikler */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="block text-gray-500 dark:text-gray-400">Son Güncelleme</span>
            <span className="text-gray-700 dark:text-gray-300">
              {trendData.lastUpdate ? new Date(trendData.lastUpdate).toLocaleTimeString('tr-TR') : 'Henüz güncellenmedi'}
            </span>
          </div>
          <div>
            <span className="block text-gray-500 dark:text-gray-400">Veri Noktası</span>
            <span className="text-gray-700 dark:text-gray-300">
              {selectedView === 'air_quality' 
                ? Math.max(trendData.bt108.co.length, trendData.bt108.no2.length)
                : trendData.bt107[selectedView]?.length || 0} / 20
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardCard07;
