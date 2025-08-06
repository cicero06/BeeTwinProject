import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../../contexts/AuthContext';
import useRealTimeData from '../../hooks/useRealTimeData';

/**
 * DashboardCard12 - Kovan Dijital İkiz ve Lokasyon Haritası
 * 
 * Sistemin en kritik bileşenlerinden biri olan "Kovan Dijital İkiz ve Lokasyon Haritası" bölümü,
 * her arılığın harita üzerinde coğrafi olarak konumlandırılmasını ve bu arılıklara bağlı kovanların
 * dijital ikizlerinin interaktif olarak görselleştirilmesini sağlar.
 * 
 * Özellikler:
 * - Coğrafi harita üzerinde arılık konumları
 * - Arılık seçimi ile kovan listesi
 * - Blender ile oluşturulan 3D dijital kovan modeli
 * - Gerçek zamanlı sensör veri senkronizasyonu
 * - Görsel renk kodlaması (sıcaklık, nem, ağırlık)
 * - İnteraktif 3D model navigasyonu
 * - Anomali tespit ve görsel uyarı sistemi
 */

function DashboardCard12() {
  const { user, hives, apiaries } = useAuth();
  const { sensorData: realTimeSensorData, connectionStatus, isLoading: realTimeLoading } = useRealTimeData();

  // Güvenlik kontrolü: apiaries veya hives undefined ise early return
  if (apiaries === undefined || hives === undefined) {
    return (
      <div className="col-span-full xl:col-span-6 bg-white dark:bg-gray-800 shadow-xs rounded-xl">
        <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">🗺️ Harita Görünümü</h2>
        </header>
        <div className="p-5">
          <div className="text-center text-gray-500">Veriler yükleniyor...</div>
        </div>
      </div>
    );
  }

  // Debug log
  console.log('🗺️ DashboardCard12 render:', {
    user: user?.email,
    apiaries: apiaries?.length,
    hives: hives?.length,
    realTimeSensorData: realTimeSensorData?.length,
    connectionStatus
  });

  // State yönetimi
  const [selectedApiary, setSelectedApiary] = useState(null);
  const [selectedHive, setSelectedHive] = useState(null);
  const [view3D, setView3D] = useState(true);
  const [sensorData, setSensorData] = useState({
    temperature: null,
    humidity: null,
    weight: null,
    airQuality: 'Connecting...'
  });
  const [realTimeData, setRealTimeData] = useState({});
  const [loading, setLoading] = useState(true);

  // İlk arılık ve kovan seçimi - kullanıcının kendi verilerine göre
  useEffect(() => {
    console.log('🏡 DashboardCard12 - Apiaries Updated:', user?.email, 'apiaries:', apiaries?.length);
    if (apiaries && apiaries.length > 0 && !selectedApiary) {
      // Kullanıcının ilk arılığını seç
      console.log('🔍 First apiary structure:', apiaries[0]);
      const firstApiaryId = apiaries[0]._id || apiaries[0].id;
      setSelectedApiary(firstApiaryId);
      console.log('🏡 İlk arılık seçildi:', apiaries[0].name, 'ID:', firstApiaryId);
    } else if (!apiaries || apiaries.length === 0) {
      console.log('⚠️ Kullanıcının kayıtlı arılığı bulunamadı');
      setSelectedApiary(null);
    }
  }, [apiaries, selectedApiary, user]);

  useEffect(() => {
    console.log('🐝 DashboardCard12 - Hives Updated:', user?.email, 'selectedApiary:', selectedApiary, 'hives:', hives?.length);
    if (selectedApiary && hives && hives.length > 0 && !selectedHive) {
      // Seçili arılığa ait kovanları filtrele
      const apiaryHives = hives.filter(hive => {
        const hiveApiaryId = hive.apiary?._id || hive.apiary?.id || hive.apiary_id;
        return hiveApiaryId === selectedApiary;
      });
      console.log('🔍 Arılığa ait kovanlar:', apiaryHives.length, apiaryHives.map(h => h.name));
      if (apiaryHives.length > 0) {
        const firstHiveId = apiaryHives[0]._id || apiaryHives[0].id;
        setSelectedHive(firstHiveId);
        console.log('🐝 İlk kovan seçildi:', apiaryHives[0].name, 'ID:', firstHiveId);
      }
    } else if (!hives || hives.length === 0) {
      console.log('⚠️ Kullanıcının kayıtlı kovanı bulunamadı');
      setSelectedHive(null);
    }
  }, [selectedApiary, hives, selectedHive, user]);

  // Gerçek zamanlı sensor verilerini çek
  const fetchLatestSensorData = async (hiveId) => {
    try {
      const hive = hives.find(h => h._id === hiveId);
      if (!hive || !hive.sensor?.routerId) {
        setSensorData({
          temperature: null,
          humidity: null,
          weight: null,
          airQuality: 'Router Disconnected'
        });
        return;
      }

      const token = localStorage.getItem('token');
      // Router ID'sine göre doğru endpoint'i seç
      let endpoint;
      if (hive.sensor.routerId === 107) {
        endpoint = 'http://localhost:5000/api/sensors/router-107';
      } else if (hive.sensor.routerId === 108) {
        endpoint = 'http://localhost:5000/api/sensors/router-108';
      } else {
        console.warn(`Bilinmeyen Router ID: ${hive.sensor.routerId}`);
        return;
      }

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const data = result.data;
          console.log(`📍 Router ${hive.sensor.routerId} Data (${data.source}):`, data);
          setSensorData({
            temperature: data.temperature || null,
            humidity: data.humidity || null,
            weight: data.weight || null,
            pressure: data.pressure || null,
            airQuality: data.temperature > 36 ? 'Warning' : 'Good',
            lastUpdate: data.timestamp,
            source: data.source || 'unknown'
          });
          setRealTimeData(data);
        } else {
          console.log('⚠️ API response başarısız:', result);
          setSensorData({
            temperature: null,
            humidity: null,
            weight: null,
            airQuality: 'No Data Available'
          });
        }
      }
    } catch (error) {
      console.error('Sensor data fetch error:', error);
      // NO FAKE DATA - Show actual error state
      setSensorData({
        temperature: null,
        humidity: null,
        weight: null,
        airQuality: 'Connection Error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Gerçek zamanlı veri güncellemesi
  useEffect(() => {
    if (realTimeSensorData && realTimeSensorData.length > 0 && selectedHive) {
      // Seçili kovan için en son veriyi bul
      const hive = hives.find(h => h._id === selectedHive);
      if (hive && hive.sensor?.routerId) {
        const latestData = realTimeSensorData
          .filter(data => data.deviceId === hive.sensor.routerId)
          .slice(-1)[0];

        if (latestData) {
          console.log('🔄 Real-time data update for hive:', hive.name, latestData);
          setSensorData({
            temperature: latestData.temperature || latestData.parameters?.temperature || null,
            humidity: latestData.humidity || latestData.parameters?.humidity || null,
            weight: latestData.weight || latestData.parameters?.weight || null,
            airQuality: connectionStatus ? 'Live Data' : 'Offline',
            lastUpdate: latestData.timestamp
          });
          setRealTimeData(latestData);
        }
      }
    }
  }, [realTimeSensorData, selectedHive, hives, connectionStatus]);

  // Seçili kovan değiştiğinde sensor verilerini güncelle
  useEffect(() => {
    if (selectedHive) {
      setLoading(true);
      fetchLatestSensorData(selectedHive);

      // Her 5 saniyede bir güncelle (sadece WebSocket bağlantısı yoksa)
      if (!connectionStatus) {
        const interval = setInterval(() => {
          fetchLatestSensorData(selectedHive);
        }, 5000);

        return () => clearInterval(interval);
      } else {
        setLoading(false);
      }
    }
  }, [selectedHive, hives]);

  // Harita merkez pozisyonu - kullanıcının ilk arılığı veya İstanbul
  const centerPosition = selectedApiary && apiaries && apiaries.length > 0
    ? [apiaries.find(a => a._id === selectedApiary)?.coordinates?.latitude || 41.0082,
    apiaries.find(a => a._id === selectedApiary)?.coordinates?.longitude || 28.9784]
    : [41.0082, 28.9784];

  // Seçili arılık ve kovan bilgileri
  const currentApiary = apiaries && apiaries.find(a => a._id === selectedApiary);
  const currentHive = hives && hives.find(h => h._id === selectedHive);
  const apiaryHives = hives && hives.filter(hive => hive.apiary?._id === selectedApiary) || [];
  const createApiaryIcon = (status) => {
    const iconColor = status === 'active' ? '#10b981' :
      status === 'warning' ? '#f59e0b' : '#3b82f6';

    return new L.Icon({
      iconUrl: `data:image/svg+xml;base64,${btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="${iconColor}" width="32" height="32">
          <path d="M16 2L18 10L26 12L18 14L16 22L14 14L6 12L14 10L16 2Z"/>
          <circle cx="16" cy="16" r="4" fill="white"/>
        </svg>
      `)}`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
  };

  // Kovan durumuna göre renk
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'maintenance': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  // Sensör verisi renk kodlaması
  const getSensorColor = (value, type) => {
    if (value === null || value === undefined) return 'text-gray-400';

    switch (type) {
      case 'temperature':
        if (value > 36) return 'text-red-500';
        if (value < 33) return 'text-blue-500';
        return 'text-green-500';
      case 'humidity':
        if (value > 65) return 'text-red-500';
        if (value < 55) return 'text-blue-500';
        return 'text-green-500';
      case 'weight':
        if (value < 45) return 'text-red-500';
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };

  // 3D Model Simülasyonu
  const HiveDigitalTwin = ({ hive, sensorData, loading }) => {
    if (!hive) {
      return (
        <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-600">
          <div className="text-center text-gray-500 py-8">
            <p>Lütfen bir kovan seçin</p>
          </div>
        </div>
      );
    }

    return (
      <div className="relative bg-gradient-to-br from-amber-50 to-orange-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 border-2 border-amber-200 dark:border-gray-600">

        {/* 3D Model Container */}
        <div className="relative h-64 bg-gradient-to-b from-blue-100 to-green-100 dark:from-gray-700 dark:to-gray-600 rounded-lg mb-4 flex items-center justify-center overflow-hidden">

          {/* 3D Kovan Modeli - Blender Simülasyonu */}
          <div className="relative w-32 h-40 transform-gpu">
            {/* Kovan Gövdesi */}
            <div className={`absolute inset-0 rounded-lg opacity-20`}
              style={{
                background: `linear-gradient(45deg, 
                     ${sensorData.temperature !== null && sensorData.temperature > 36 ? '#fca5a5' :
                    sensorData.temperature !== null && sensorData.temperature < 33 ? '#93c5fd' : '#86efac'} 0%, 
                     ${sensorData.temperature !== null && sensorData.temperature > 36 ? '#ef4444' :
                    sensorData.temperature !== null && sensorData.temperature < 33 ? '#3b82f6' : '#10b981'} 100%)`
              }}>
            </div>

            {/* Kovan Kutusu */}
            <div className="absolute inset-2 bg-amber-200 dark:bg-amber-300 rounded-lg border-2 border-amber-600 shadow-lg">
              <div className="absolute inset-1 bg-gradient-to-b from-amber-100 to-amber-200 rounded-md">

                {/* Çerçeveler */}
                <div className="absolute inset-x-2 top-2 space-y-1">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-4 bg-amber-600 dark:bg-amber-700 rounded-sm opacity-80" />
                  ))}
                </div>

                {/* Arı Aktivitesi Simülasyonu */}
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className={`absolute w-1 h-1 rounded-full ${hive.status === 'active' ? 'bg-yellow-400' :
                        hive.status === 'warning' ? 'bg-orange-400' : 'bg-gray-400'
                        } animate-pulse`}
                      style={{
                        left: `${20 + Math.random() * 60}%`,
                        top: `${20 + Math.random() * 60}%`,
                        animationDelay: `${i * 0.3}s`
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Kovan Kapağı */}
            <div className="absolute -top-1 inset-x-1 h-4 bg-amber-800 dark:bg-amber-900 rounded-t-lg shadow-md" />

            {/* Giriş Deliği */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-6 h-2 bg-amber-900 dark:bg-amber-950 rounded-full" />

            {/* Durum Işığı */}
            <div className={`absolute -top-2 -right-2 w-3 h-3 rounded-full ${getStatusColor(hive.status)} shadow-lg animate-pulse`} />
          </div>
        </div>

        {/* Dijital İkiz Başlığı */}
        <div className="text-center mb-4">
          <h3 className="text-lg font-bold text-amber-800 dark:text-amber-200">
            {currentHive?.name || 'Kovan Seçilmedi'}
          </h3>
          <p className="text-sm text-amber-600 dark:text-amber-400">Dijital İkiz Modeli</p>
          <div className="mt-2 flex items-center justify-center space-x-2">
            {/* Real-time Data Status */}
            {connectionStatus ? (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-600 dark:text-green-400">🔴 Canlı Veri Akışı</span>
              </>
            ) : loading ? (
              <>
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-yellow-600 dark:text-yellow-400">📡 Veriler Güncelleniyor...</span>
              </>
            ) : currentHive?.sensor?.isConnected ? (
              <>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-blue-600 dark:text-blue-400">📊 Router {currentHive.sensor.routerId}</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-xs text-red-600 dark:text-red-400">⚠️ Router Bağlı Değil</span>
              </>
            )}
          </div>
          {/* Data Source Indicator */}
          <div className="text-xs text-gray-400 mt-1 flex items-center justify-center space-x-1">
            <span>Kaynak:</span>
            {connectionStatus ? (
              <span className="text-green-500 font-medium">WebSocket</span>
            ) : sensorData.airQuality === 'Live Data' ? (
              <span className="text-blue-500 font-medium">Database</span>
            ) : sensorData.airQuality === 'Simulated Data' ? (
              <span className="text-orange-500 font-medium">Simülasyon</span>
            ) : (
              <span className="text-gray-500 font-medium">Offline</span>
            )}
          </div>
          {sensorData.lastUpdate && (
            <div className="text-xs text-gray-400 mt-1">
              Son Güncelleme: {new Date(sensorData.lastUpdate).toLocaleTimeString('tr-TR')}
            </div>
          )}
        </div>

        {/* Gerçek Zamanlı Sensör Verileri */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">Sıcaklık</span>
              <span className="text-xs text-gray-400">🌡️</span>
            </div>
            <div className={`text-lg font-bold ${getSensorColor(sensorData.temperature, 'temperature')}`}>
              {sensorData.temperature !== null ? `${sensorData.temperature.toFixed(1)}°C` : 'N/A'}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">Nem</span>
              <span className="text-xs text-gray-400">💧</span>
            </div>
            <div className={`text-lg font-bold ${getSensorColor(sensorData.humidity, 'humidity')}`}>
              {sensorData.humidity !== null ? `${sensorData.humidity.toFixed(1)}%` : 'N/A'}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">Ağırlık</span>
              <span className="text-xs text-gray-400">⚖️</span>
            </div>
            <div className={`text-lg font-bold ${getSensorColor(sensorData.weight, 'weight')}`}>
              {sensorData.weight !== null ? `${sensorData.weight.toFixed(1)} kg` : 'N/A'}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">Hava Kalitesi</span>
              <span className="text-xs text-gray-400">🌬️</span>
            </div>
            <div className={`text-lg font-bold ${sensorData.airQuality === 'Good' ? 'text-green-500' : 'text-red-500'}`}>
              {sensorData.airQuality}
            </div>
          </div>
        </div>

        {/* Anomali Tespit Uyarısı */}
        {(sensorData.temperature > 36 || sensorData.humidity > 65 || (sensorData.weight !== null && sensorData.weight < 45)) && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-red-500">⚠️</span>
              <div>
                <div className="text-sm font-medium text-red-800 dark:text-red-200">Anomali Tespit Edildi</div>
                <div className="text-xs text-red-600 dark:text-red-400">
                  {sensorData.temperature > 36 && 'Yüksek sıcaklık '}
                  {sensorData.humidity > 65 && 'Yüksek nem '}
                  {sensorData.weight !== null && sensorData.weight < 45 && 'Düşük ağırlık '}
                  tespit edildi.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Etkileşim Butonları */}
        <div className="flex space-x-2 mt-4">
          <button
            onClick={() => setView3D(!view3D)}
            className="flex-1 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {view3D ? '📊 Veri Görünümü' : '🔄 3D Görünüm'}
          </button>
          <button className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
            📈 Detaylı Analiz
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="col-span-full bg-white dark:bg-gray-800 shadow-lg rounded-lg">
      <header className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
          🗺️ Kovan Dijital İkiz ve Lokasyon Haritası
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Arılık haritası ve kovan listesi üzerinden dijital ikiz seçimi
        </p>
      </header>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Sol Panel - Harita ve Arılık Seçimi */}
          <div className="space-y-4">

            {/* Arılık Seçimi */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">
                📍 Arılık Seçimi
              </h3>
              {loading ? (
                <div className="text-center text-gray-500">Arılıklar yükleniyor...</div>
              ) : !apiaries || apiaries.length === 0 ? (
                <div className="text-center text-gray-500">Henüz arılık eklenmemiş</div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {apiaries.map((apiary) => {
                    const apiaryHiveCount = hives && hives.filter(h => h.apiary?._id === apiary._id).length || 0;
                    const activeHiveCount = hives && hives.filter(h => h.apiary?._id === apiary._id && h.sensor?.isConnected).length || 0;

                    return (
                      <button
                        key={apiary._id}
                        onClick={() => {
                          setSelectedApiary(apiary._id);
                          const firstHive = hives.find(h => h.apiary?._id === apiary._id);
                          if (firstHive) setSelectedHive(firstHive._id);
                        }}
                        className={`text-left p-3 rounded-lg transition-colors ${selectedApiary === apiary._id
                          ? 'bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-500'
                          : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                      >
                        <div className="font-medium text-gray-800 dark:text-gray-100">
                          {apiary.name || `Arılık ${apiary._id.slice(-4)}`}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {apiaryHiveCount} kovan • {activeHiveCount} aktif
                        </div>
                        {apiary.location && (
                          <div className="text-xs text-gray-500 dark:text-gray-500">
                            📍 {typeof apiary.location === 'string' ? apiary.location : apiary.location.address}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Harita */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">
                🌍 Arılık Konumları
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Haritadaki marker'lara tıklayarak arılık seçin
              </p>
              <div className="h-64 rounded-lg overflow-hidden">
                {apiaries && apiaries.length > 0 && selectedApiary ? (
                  <MapContainer
                    center={centerPosition}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />

                    {/* Arılık Marker'ları */}
                    {apiaries.map((apiary) => {
                      if (!apiary.coordinates?.latitude || !apiary.coordinates?.longitude) return null;

                      const apiaryHiveCount = hives && hives.filter(h => h.apiary?._id === apiary._id).length || 0;
                      const activeHiveCount = hives && hives.filter(h => h.apiary?._id === apiary._id && h.sensor?.isConnected).length || 0;
                      const status = activeHiveCount === apiaryHiveCount ? 'active' : activeHiveCount > 0 ? 'warning' : 'maintenance';

                      return (
                        <Marker
                          key={apiary._id}
                          position={[apiary.coordinates.latitude, apiary.coordinates.longitude]}
                          icon={createApiaryIcon(status)}
                          eventHandlers={{
                            click: () => {
                              setSelectedApiary(apiary._id);
                              const firstHive = hives.find(h => h.apiary?._id === apiary._id);
                              if (firstHive) setSelectedHive(firstHive._id);
                            }
                          }}
                        >
                          <Popup>
                            <div className="text-center">
                              <h4 className="font-bold">{apiary.name || `Arılık ${apiary._id.slice(-4)}`}</h4>
                              <p className="text-sm">{apiaryHiveCount} kovan</p>
                              <p className="text-sm">{activeHiveCount} aktif</p>
                              {apiary.location && <p className="text-xs text-gray-600">{apiary.location}</p>}
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}
                  </MapContainer>
                ) : (
                  <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-600 rounded-lg">
                    <div className="text-center text-gray-500">
                      <p>Konum bilgisi bulunamadı</p>
                      <p className="text-sm">Arılık koordinatları ayarlanmamış</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Kovan Listesi */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  🐝 {currentApiary?.name || 'Arılık'} - Kovan Listesi
                </h3>
                <button
                  onClick={() => {
                    // Refresh sensor data
                    if (selectedHive) {
                      fetchLatestSensorData(selectedHive);
                    }
                  }}
                  className="text-sm px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  � Yenile
                </button>
              </div>
              <div className="space-y-2">
                {apiaryHives.length === 0 ? (
                  <div className="text-center text-gray-500 py-4">
                    Bu arılıkta henüz kovan yok
                  </div>
                ) : (
                  apiaryHives.map(hive => (
                    <button
                      key={hive._id}
                      onClick={() => setSelectedHive(hive._id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${selectedHive === hive._id
                        ? 'bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-500 ring-2 ring-amber-200'
                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-800 dark:text-gray-100 flex items-center">
                            {hive.name || `Kovan ${hive._id.slice(-4)}`}
                            {selectedHive === hive._id && (
                              <span className="ml-2 text-amber-600 text-sm">🎯</span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Router: {hive.sensor?.routerId || 'Bağlı değil'} •
                            Sensor: {hive.sensor?.sensorId || 'Yok'}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className={`px-2 py-1 rounded-full text-xs text-white ${getStatusColor(hive.sensor?.isConnected ? 'active' : 'maintenance')}`}>
                            {hive.sensor?.isConnected ? 'Aktif' : 'Bağlı Değil'}
                          </div>
                          {selectedHive === hive._id && (
                            <div className="text-xs text-amber-600 dark:text-amber-400">
                              🎯 Seçili
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sağ Panel - Dijital İkiz */}
          <div>
            <HiveDigitalTwin hive={currentHive} sensorData={sensorData} loading={loading} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardCard12;