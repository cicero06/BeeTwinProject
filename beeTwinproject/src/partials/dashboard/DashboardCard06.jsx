import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import DoughnutChart from '../../charts/DoughnutChart';

/**
 * DashboardCard06 - BT108 Router Hava Kalitesi (MICS-4514)
 * 
 * Bu bileşen, BT108 router'ından (routerId: 108) gelen
 * CO ve NO2 gaz sensörü verilerini gerçek zamanlı izler.
 * 
 * Özellikler:
 * - BT108 router'ından CO (Karbon Monoksit) ölçümleri
 * - BT108 router'ından NO2 (Nitrojen Dioksit) ölçümleri
 * - Hava kalitesi durumu ve uyarıları
 * - Gerçek zamanlı veri güncellemeleri
 * 
 * Veri Kaynağı: Backend /api/sensors/router/108/latest endpoint'i
 */

function DashboardCard06() {
  const { user } = useAuth();

  const [airQualityData, setAirQualityData] = useState({
    co: null,
    no2: null,
    overallScore: null,
    status: 'loading',
    lastUpdate: null,
    source: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // BT108 Router ID (sabit)
  const bt108RouterId = '108';

  // Hava kalitesi skoru hesaplama
  const calculateAirQualityScore = (coValue, no2Value) => {
    if (coValue === null && no2Value === null) return null;
    
    // CO: Normal < 9 ppm, Yüksek > 35 ppm
    // NO2: Normal < 0.1 ppm, Yüksek > 1 ppm
    let score = 100;
    
    if (coValue !== null) {
      if (coValue > 35) score -= 40;
      else if (coValue > 9) score -= 20;
    }
    
    if (no2Value !== null) {
      if (no2Value > 1) score -= 30;
      else if (no2Value > 0.1) score -= 15;
    }
    
    return Math.max(0, score);
  };

  // BT108 Router'dan CO ve NO2 verilerini çek
  useEffect(() => {
    const fetchAirQualityData = async () => {
      if (!user || !bt108RouterId) return;

      setLoading(true);
      setError(null);

      try {
        console.log(`🌬️ BT108 Router ${bt108RouterId} için hava kalitesi verisi alınıyor...`);

        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/sensors/router/${bt108RouterId}/latest`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const data = result.data;
            console.log(`🌬️ Router ${bt108RouterId} Air Quality Data:`, data);

            // CO ve NO2 verilerini al
            const co = data.co || data.CO || null;
            const no2 = data.no2 || data.NO || null;

            const score = calculateAirQualityScore(co, no2);
            const status = score === null ? 'no_data' : 
                         score >= 80 ? 'good' :
                         score >= 60 ? 'moderate' :
                         score >= 40 ? 'poor' : 'hazardous';

            setAirQualityData({
              co: co,
              no2: no2,
              overallScore: score,
              status: status,
              lastUpdate: data.timestamp,
              source: 'router_api'
            });

            // Debug log
            console.log('🔍 DEBUG - Card06 Air Quality:', {
              co: co,
              no2: no2,
              score: score,
              status: status
            });

            setError(null);
          } else {
            console.log('⚠️ No air quality data from router API:', result);
            setError('BT108 router verisi bulunamadı');
          }
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        console.error('❌ BT108 air quality data fetch error:', error);
        setError(`BT108 bağlantı hatası: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    // İlk yükleme
    fetchAirQualityData();

    // Her 20 saniyede bir güncelle
    const interval = setInterval(fetchAirQualityData, 20000);

    return () => clearInterval(interval);
  }, [user, bt108RouterId]);

  // Durum rengini getir
  const getStatusColor = (status) => {
    switch (status) {
      case 'good': return 'text-green-600 dark:text-green-400';
      case 'moderate': return 'text-yellow-600 dark:text-yellow-400';
      case 'poor': return 'text-orange-600 dark:text-orange-400';
      case 'hazardous': return 'text-red-600 dark:text-red-400';
      case 'loading': return 'text-blue-600 dark:text-blue-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  // Durum metni getir
  const getStatusText = (status) => {
    switch (status) {
      case 'good': return 'İyi';
      case 'moderate': return 'Orta';
      case 'poor': return 'Kötü';
      case 'hazardous': return 'Tehlikeli';
      case 'loading': return 'Yükleniyor...';
      case 'no_data': return 'Veri Yok';
      default: return 'Bilinmiyor';
    }
  };

  // Zaman formatı
  const formatTime = (timestamp) => {
    if (!timestamp) return 'Henüz güncellenmedi';
    return new Date(timestamp).toLocaleTimeString('tr-TR');
  };

  return (
    <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-xs rounded-xl">
      <div className="px-5 pt-5">
        <header className="flex justify-between items-start mb-2">
          {/* Icon */}
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-purple-500/10 mr-3">
              <span className="text-purple-600 dark:text-purple-400 text-2xl">🌬️</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">
                Hava Kalitesi
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                BT108 MICS-4514 Sensör
              </p>
            </div>
          </div>
          
          {/* Status indicator */}
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full ${airQualityData.status === 'good' ? 'bg-green-500' : 
              airQualityData.status === 'moderate' ? 'bg-yellow-500' :
              airQualityData.status === 'poor' ? 'bg-orange-500' :
              airQualityData.status === 'hazardous' ? 'bg-red-500 animate-pulse' :
              'bg-gray-400'}`}></div>
            <span className={`text-xs ml-2 ${getStatusColor(airQualityData.status)}`}>
              {getStatusText(airQualityData.status)}
            </span>
          </div>
        </header>

        {/* Loading ve Error Durumu */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Veriler yükleniyor...</span>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <div className="text-red-600 dark:text-red-400 mr-2 text-lg">⚠️</div>
              <div>
                <h3 className="text-red-800 dark:text-red-200 font-medium text-sm">
                  Bağlantı Sorunu
                </h3>
                <p className="text-red-700 dark:text-red-300 text-xs">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Ana Veri Görünümü */}
        {!loading && !error && (
          <>
            {/* CO ve NO2 Değerleri */}
            <div className="space-y-4 mb-6">
              {/* CO Değeri */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      Karbon Monoksit (CO)
                    </h3>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {airQualityData.co !== null ? `${airQualityData.co.toFixed(2)} ppm` : 'N/A'}
                    </p>
                  </div>
                  <div className="text-2xl">🟧</div>
                </div>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Normal: &lt; 9 ppm | Tehlikeli: &gt; 35 ppm
                </div>
              </div>

              {/* NO2 Değeri */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      Nitrojen Dioksit (NO2)
                    </h3>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {airQualityData.no2 !== null ? `${airQualityData.no2.toFixed(2)} ppm` : 'N/A'}
                    </p>
                  </div>
                  <div className="text-2xl">🔴</div>
                </div>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Normal: &lt; 0.1 ppm | Tehlikeli: &gt; 1 ppm
                </div>
              </div>
            </div>

            {/* Genel Hava Kalitesi Skoru */}
            {airQualityData.overallScore !== null && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4 mb-4">
                <div className="text-center">
                  <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                    Genel Hava Kalitesi
                  </h3>
                  <div className="text-3xl font-bold mb-1" style={{
                    color: airQualityData.overallScore >= 80 ? '#10b981' :
                           airQualityData.overallScore >= 60 ? '#f59e0b' :
                           airQualityData.overallScore >= 40 ? '#f97316' : '#ef4444'
                  }}>
                    {airQualityData.overallScore}/100
                  </div>
                  <p className={`text-sm font-medium ${getStatusColor(airQualityData.status)}`}>
                    {getStatusText(airQualityData.status)}
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Teknik Detaylar */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 dark:text-gray-400">
            <div>
              <span className="block">Router ID</span>
              <span className="font-mono text-purple-600 dark:text-purple-400">BT{bt108RouterId}</span>
            </div>
            <div>
              <span className="block">Sensör Tipi</span>
              <span className="text-gray-700 dark:text-gray-300">MICS-4514</span>
            </div>
            <div>
              <span className="block">Son Güncelleme</span>
              <span className="text-gray-700 dark:text-gray-300">{formatTime(airQualityData.lastUpdate)}</span>
            </div>
            <div>
              <span className="block">Güncelleme Sıklığı</span>
              <span className="text-gray-700 dark:text-gray-300">20 saniye</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardCard06;
