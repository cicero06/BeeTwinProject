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
        airQuality: 'Connecting...',
        connectionStatus: 'disconnected',
        dataAge: null,
        isRealTime: false
    });
    const [realTimeData, setRealTimeData] = useState({});
    const [loading, setLoading] = useState(true);
    const [apiaryStats, setApiaryStats] = useState({});
    const [hiveConnectionStates, setHiveConnectionStates] = useState({}); // Her arılık için bağlantı durumları

    // Arılık ve kovan durumu kontrolü - otomatik seçim YOK
    useEffect(() => {
        console.log('🏡 DashboardCard12 - Apiaries Updated:', user?.email, 'apiaries:', apiaries?.length);

        if (apiaries && apiaries.length > 0) {
            // Seçili arılığın hala listede olup olmadığını kontrol et
            const currentApiaryStillExists = apiaries.find(a => (a._id || a.id) === selectedApiary);
            if (selectedApiary && !currentApiaryStillExists) {
                console.log('⚠️ Seçili arılık listede bulunamadı, seçimi temizle');
                setSelectedApiary(null);
                setSelectedHive(null);
            }
        } else if (!apiaries || apiaries.length === 0) {
            console.log('⚠️ Kullanıcının kayıtlı arılığı bulunamadı');
            setSelectedApiary(null);
            setSelectedHive(null);
        }
    }, [apiaries, user?.email, selectedApiary]);

    useEffect(() => {
        console.log('🐝 DashboardCard12 - Hives Updated:', user?.email, 'selectedApiary:', selectedApiary, 'hives:', hives?.length);

        if (selectedApiary && hives && hives.length > 0) {
            // Seçili arılığa ait kovanları filtrele
            const apiaryHives = hives.filter(hive => {
                const hiveApiaryId = hive.apiary?._id || hive.apiary?.id || hive.apiary_id || hive.apiary;
                return hiveApiaryId === selectedApiary;
            });

            console.log('🔍 Arılığa ait kovanlar:', apiaryHives.length, apiaryHives.map(h => h.name));

            // Seçili kovanın bu arılığa ait olup olmadığını kontrol et
            if (selectedHive) {
                const currentHiveInApiary = apiaryHives.find(h => (h._id || h.id) === selectedHive);
                if (!currentHiveInApiary) {
                    console.log('⚠️ Seçili kovan bu arılığa ait değil, seçimi temizle');
                    setSelectedHive(null);
                }
            }
        } else if (!selectedApiary) {
            console.log('⚠️ Arılık seçilmediği için kovan seçimi temizlendi');
            setSelectedHive(null);
        } else if (!hives || hives.length === 0) {
            console.log('⚠️ Kullanıcının kayıtlı kovanı bulunamadı');
            setSelectedHive(null);
        }
    }, [selectedApiary, hives, user?.email, selectedHive]);

    // Gerçek zamanlı sensor verilerini çek
    const fetchLatestSensorData = async (hiveId) => {
        try {
            const hive = hives.find(h => h._id === hiveId);
            if (!hive || !hive.sensor?.routerId) {
                setSensorData({
                    temperature: null,
                    humidity: null,
                    weight: null,
                    airQuality: 'Router Disconnected',
                    connectionStatus: 'disconnected',
                    dataAge: null,
                    isRealTime: false
                });
                return;
            }

            const token = localStorage.getItem('token');
            // Router ID'sine göre doğru endpoint'i oluştur
            const routerId = hive.sensor.routerId;
            const endpoint = `http://localhost:5000/api/sensors/router/${routerId}/latest`;

            console.log(`📡 Fetching data for Router ${routerId} from:`, endpoint);

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

                    // 🎯 DINAMIK BAĞLANTI KONTROLÜ
                    let connectionStatus = 'disconnected';
                    let dataAge = null;
                    let isRealTime = false;

                    if (data.timestamp) {
                        const dataTime = new Date(data.timestamp);
                        const now = new Date();
                        const ageMs = now - dataTime;
                        const ageMinutes = Math.round(ageMs / 1000 / 60);
                        dataAge = ageMinutes;

                        if (ageMinutes <= 5) {
                            connectionStatus = 'live';
                            isRealTime = true;
                        } else if (ageMinutes <= 30) {
                            connectionStatus = 'recent';
                            isRealTime = false;
                        } else if (ageMinutes <= 120) {
                            connectionStatus = 'old';
                            isRealTime = false;
                        } else {
                            connectionStatus = 'very_old';
                            isRealTime = false;
                        }

                        console.log(`🕐 Card12 Router ${routerId} veri yaşı: ${ageMinutes} dakika (${connectionStatus})`);
                    }

                    setSensorData({
                        temperature: data.temperature || null,
                        humidity: data.humidity || null,
                        weight: data.weight || null,
                        pressure: data.pressure || null,
                        airQuality: data.temperature > 36 ? 'Warning' : 'Good',
                        lastUpdate: data.timestamp,
                        source: data.source || 'unknown',
                        // Yeni bağlantı bilgileri
                        connectionStatus: connectionStatus,
                        dataAge: dataAge,
                        isRealTime: isRealTime,
                        timestamp: data.timestamp
                    });
                    setRealTimeData(data);
                } else {
                    console.log('⚠️ API response başarısız:', result);
                    setSensorData({
                        temperature: null,
                        humidity: null,
                        weight: null,
                        airQuality: 'No Data Available',
                        connectionStatus: 'disconnected',
                        dataAge: null,
                        isRealTime: false
                    });
                }
            }
        } catch (error) {
            console.error('Sensor data fetch error:', error);
            setSensorData({
                temperature: null,
                humidity: null,
                weight: null,
                airQuality: 'Connection Error',
                connectionStatus: 'disconnected',
                dataAge: null,
                isRealTime: false
            });
        } finally {
            setLoading(false);
        }
    };

    // Seçili kovan değiştiğinde sensör verilerini çek
    useEffect(() => {
        if (selectedHive) {
            console.log('🔄 Kovan değişti, sensör verileri yükleniyor:', selectedHive);
            fetchLatestSensorData(selectedHive);
        } else {
            console.log('❌ Kovan seçilmedi, sensör verileri temizlendi');
            setSensorData({
                temperature: null,
                humidity: null,
                weight: null,
                airQuality: 'Select Hive',
                connectionStatus: 'disconnected',
                dataAge: null,
                isRealTime: false
            });
            setLoading(false);
        }
    }, [selectedHive, hives]);

    // Derived variables
    const currentApiary = apiaries && apiaries.find(a => (a._id || a.id) === selectedApiary);
    const currentHive = hives && hives.find(h => h._id === selectedHive);
    const apiaryHives = hives && hives.filter(hive => hive.apiary?._id === selectedApiary) || [];

    // Harita merkez pozisyonu - seçili arılığın koordinatları veya İstanbul
    const centerPosition = React.useMemo(() => {
        if (currentApiary && currentApiary.location?.coordinates?.latitude && currentApiary.location?.coordinates?.longitude) {
            return [currentApiary.location.coordinates.latitude, currentApiary.location.coordinates.longitude];
        }
        return [41.0082, 28.9784]; // İstanbul varsayılan koordinatları
    }, [currentApiary]);

    // 📶 Bağlantı durumuna göre marker rengi belirle
    const getMarkerColor = (apiary) => {
        const stats = apiaryStats[apiary._id];
        if (!stats) return '#6B7280'; // Gri - veri yok

        // En iyi bağlantı durumunu kullan
        if (stats.live > 0) return '#22C55E'; // Yeşil - Canlı bağlantı
        if (stats.recent > 0) return '#3B82F6'; // Mavi - Yakın zamanlı
        if (stats.old > 0) return '#F59E0B'; // Turuncu - Eski
        if (stats.very_old > 0) return '#EF4444'; // Kırmızı - Çok eski
        return '#6B7280'; // Gri - Bağlantı yok
    };

    // 🏷️ Bağlantı durumu etiketi oluştur
    const getConnectionBadge = (apiary) => {
        const stats = apiaryStats[apiary._id];
        if (!stats) return { text: 'Unknown', class: 'bg-gray-500' };

        // En iyi durumu göster
        if (stats.live > 0) return { text: 'Live', class: 'bg-green-500' };
        if (stats.recent > 0) return { text: 'Recent', class: 'bg-blue-500' };
        if (stats.old > 0) return { text: 'Old Data', class: 'bg-yellow-500' };
        if (stats.very_old > 0) return { text: 'Very Old', class: 'bg-orange-500' };
        return { text: 'Disconnected', class: 'bg-gray-500' };
    };

    // 🗺️ Arılık ikonu oluştur (bağlantı durumuna göre renkli)
    const createApiaryIcon = (apiary) => {
        const iconColor = getMarkerColor(apiary);

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

    // Basit 3D dijital ikiz bileşeni
    const HiveDigitalTwin = ({ hive, sensorData, loading }) => {
        if (!hive) {
            return (
                <div className="text-center text-gray-500 py-4">
                    <div className="text-4xl mb-2">🔍</div>
                    <div className="text-sm">Kovan seçiniz</div>
                    <div className="text-xs text-gray-400 mt-1">
                        Dijital ikiz görüntülenecek
                    </div>
                </div>
            );
        }

        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
                <div className="text-center mb-4">
                    <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100">
                        {hive.name || `Kovan ${hive._id.slice(-4)}`}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        ID: {hive._id.slice(-4)}
                    </p>
                </div>

                {/* 3D Kovan Görselleştirmesi */}
                <div className="relative bg-gradient-to-b from-amber-100 to-amber-200 dark:from-amber-900 dark:to-amber-800 rounded-lg p-6 mb-4 min-h-[200px] flex items-center justify-center">
                    <div className="text-6xl animate-pulse">🏠</div>
                    <div className="absolute bottom-2 right-2 text-xs text-amber-700 dark:text-amber-300">
                        3D Model Placeholder
                    </div>
                </div>

                {/* Sensör Verileri */}
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg">
                            <div className="text-xs text-blue-600 dark:text-blue-400">Sıcaklık</div>
                            <div className="text-lg font-bold text-blue-800 dark:text-blue-200">
                                {loading ? '...' : sensorData.temperature ? `${sensorData.temperature}°C` : 'N/A'}
                            </div>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded-lg">
                            <div className="text-xs text-green-600 dark:text-green-400">Nem</div>
                            <div className="text-lg font-bold text-green-800 dark:text-green-200">
                                {loading ? '...' : sensorData.humidity ? `${sensorData.humidity}%` : 'N/A'}
                            </div>
                        </div>
                    </div>

                    <div className="bg-purple-50 dark:bg-purple-900/30 p-3 rounded-lg">
                        <div className="text-xs text-purple-600 dark:text-purple-400">Ağırlık</div>
                        <div className="text-lg font-bold text-purple-800 dark:text-purple-200">
                            {loading ? '...' : sensorData.weight ? `${sensorData.weight} kg` : 'N/A'}
                        </div>
                    </div>

                    {/* Bağlantı Durumu */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Durum:</span>
                        <span className={`px-2 py-1 rounded-full text-xs text-white ${sensorData.connectionStatus === 'live' ? 'bg-green-500' :
                                sensorData.connectionStatus === 'recent' ? 'bg-blue-500' :
                                    sensorData.connectionStatus === 'old' ? 'bg-yellow-500' :
                                        'bg-gray-500'
                            }`}>
                            {sensorData.connectionStatus === 'live' ? '🟢 Canlı' :
                                sensorData.connectionStatus === 'recent' ? '🔵 Yakın' :
                                    sensorData.connectionStatus === 'old' ? '🟡 Eski' :
                                        '🔴 Bağlı Değil'}
                        </span>
                    </div>
                </div>

                {/* Aksiyon Butonları */}
                <div className="flex space-x-2 mt-4">
                    <button className="flex-1 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors">
                        📊 Geçmiş Veriler
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
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                            🗺️ Kovan Dijital İkiz ve Lokasyon Haritası
                            {currentApiary && (
                                <span className="text-base font-normal text-gray-600 dark:text-gray-400 ml-2">
                                    - {currentApiary.name || `Arılık ${currentApiary._id.slice(-4)}`}
                                </span>
                            )}
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {currentApiary
                                ? `${currentApiary.name || 'Arılık'} haritası ve kovan listesi üzerinden dijital ikiz seçimi`
                                : 'Arılık haritası ve kovan listesi üzerinden dijital ikiz seçimi'
                            }
                        </p>
                    </div>

                    {/* 📊 Gerçek Zamanlı Bağlantı Durumu */}
                    <div className="flex items-center space-x-4">
                        {/* Sistem Durumu */}
                        <div className="text-right">
                            <div className="text-sm font-medium text-gray-800 dark:text-gray-100">
                                Sistem Durumu
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                                {sensorData.connectionStatus === 'live' && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                        🟢 Canlı Bağlantı
                                    </span>
                                )}
                                {sensorData.connectionStatus === 'recent' && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                        🔵 Yakın Zamanlı
                                    </span>
                                )}
                                {sensorData.connectionStatus === 'old' && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                        🟡 Eski Veri
                                    </span>
                                )}
                                {(sensorData.connectionStatus === 'very_old' || sensorData.connectionStatus === 'disconnected') && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                        🔴 Bağlantı Kesildi
                                    </span>
                                )}
                                {sensorData.dataAge !== null && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {sensorData.dataAge} dk önce
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="p-6">
                <div className="grid grid-cols-12 gap-6">

                    {/* Sol Üst - Arılık Listesi */}
                    <div className="col-span-12 lg:col-span-3">
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 h-full">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center">
                                    🏠 Arılıklarım
                                    <span className="ml-2 text-sm font-normal text-gray-500">
                                        ({apiaries?.length || 0})
                                    </span>
                                    {loading && (
                                        <span className="ml-2 text-xs text-blue-500 animate-pulse">yükleniyor...</span>
                                    )}
                                </h3>

                                <button
                                    onClick={() => {
                                        console.log('🔄 Arılık listesi yenileniyor...');
                                        // AuthContext'den veri yenile
                                        window.location.reload(); // Geçici çözüm - daha sonra optimize edilebilir
                                    }}
                                    className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                                    title="Arılık listesini yenile"
                                >
                                    🔄
                                </button>
                            </div>

                            {loading ? (
                                <div className="text-center text-gray-500 py-4">
                                    <div className="animate-pulse">Arılıklar yükleniyor...</div>
                                </div>
                            ) : !apiaries || apiaries.length === 0 ? (
                                <div className="text-center text-gray-500 py-8">
                                    <div className="text-4xl mb-2">🏗️</div>
                                    <div className="text-sm">Henüz arılık eklenmemiş</div>
                                    <div className="text-xs text-gray-400 mt-1">
                                        İlk arılığınızı eklemek için yönetim panelini kullanın
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-80 overflow-y-auto">
                                    {apiaries.map((apiary, index) => {
                                        const apiaryHiveCount = hives && hives.filter(h => h.apiary?._id === apiary._id).length || 0;
                                        const activeHiveCount = hives && hives.filter(h => h.apiary?._id === apiary._id && h.sensor?.isConnected).length || 0;

                                        return (
                                            <button
                                                key={apiary._id}
                                                onClick={() => {
                                                    console.log('🏠 Arılık seçildi:', apiary.name, 'ID:', apiary._id);
                                                    setSelectedApiary(apiary._id);

                                                    // Kovan seçimini temizle - kullanıcı manuel seçecek
                                                    setSelectedHive(null);
                                                    console.log('🔄 Kovan seçimi temizlendi, kullanıcı listeden seçecek');
                                                }}
                                                className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${selectedApiary === apiary._id
                                                    ? 'bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-500 shadow-md transform scale-105'
                                                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-sm'
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center">
                                                            <span className="text-lg mr-2">📍</span>
                                                            <div className="font-medium text-gray-800 dark:text-gray-100 truncate">
                                                                {apiary.name || `Arılık ${index + 1}`}
                                                            </div>
                                                            {selectedApiary === apiary._id && (
                                                                <span className="ml-2 text-amber-600 text-sm animate-pulse">🎯</span>
                                                            )}
                                                        </div>

                                                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                            <div className="flex items-center space-x-2">
                                                                <span>🐝 {apiaryHiveCount} kovan</span>
                                                                {activeHiveCount > 0 && (
                                                                    <span className="text-green-600">• {activeHiveCount} aktif</span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {apiary.location && (
                                                            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1 truncate">
                                                                📍 {typeof apiary.location === 'string' ? apiary.location : apiary.location.address}
                                                            </div>
                                                        )}

                                                        {/* Koordinat durumu */}
                                                        <div className="flex items-center mt-2">
                                                            {apiary.location?.coordinates?.latitude && apiary.location?.coordinates?.longitude ? (
                                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                                    🗺️ Haritada
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                                                    📍 Konum yok
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col items-end space-y-1 ml-2">
                                                        {/* Bağlantı durumu */}
                                                        <div className={`px-2 py-1 rounded-full text-xs text-white ${getConnectionBadge(apiary).class}`}>
                                                            {getConnectionBadge(apiary).text}
                                                        </div>

                                                        {selectedApiary === apiary._id && (
                                                            <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                                                SEÇİLİ
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Seçili arılık bilgisi */}
                            {selectedApiary && currentApiary ? (
                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        <div className="font-medium text-gray-800 dark:text-gray-100 mb-1">
                                            📍 Seçili Arılık:
                                        </div>
                                        <div className="font-semibold text-amber-600 dark:text-amber-400">
                                            {currentApiary.name || `Arılık ${currentApiary._id.slice(-4)}`}
                                        </div>
                                        {currentApiary.location?.coordinates?.latitude && currentApiary.location?.coordinates?.longitude && (
                                            <div className="text-xs mt-1 text-gray-500">
                                                🌍 {currentApiary.location.coordinates.latitude.toFixed(6)}, {currentApiary.location.coordinates.longitude.toFixed(6)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                                    <div className="text-center text-gray-500 py-2">
                                        <div className="text-sm">👆 Yukarıdan bir arılık seçin</div>
                                        <div className="text-xs mt-1">Harita ve kovan listesi görüntülenecek</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sol Panel - Harita ve Arılık Detayları */}
                    <div className="col-span-12 lg:col-span-6 space-y-4">

                        {/* Harita */}
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">
                                🌍 Arılık Konumu
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                {currentApiary ? `${currentApiary.name || 'Arılık'} konumu` : 'Arılık seçildikten sonra konum gösterilecek'}
                            </p>
                            <div className="h-64 rounded-lg overflow-hidden">
                                {selectedApiary && currentApiary ? (
                                    <MapContainer
                                        key={`map-${selectedApiary}`} // Force re-render when apiary changes
                                        center={centerPosition}
                                        zoom={15}
                                        style={{ height: '100%', width: '100%' }}
                                    >
                                        <TileLayer
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        />

                                        {/* Seçili Arılık Marker'ı */}
                                        {currentApiary.location?.coordinates?.latitude && currentApiary.location?.coordinates?.longitude ? (
                                            <Marker
                                                key={currentApiary._id}
                                                position={[currentApiary.location.coordinates.latitude, currentApiary.location.coordinates.longitude]}
                                                icon={createApiaryIcon(currentApiary)}
                                            >
                                                <Popup>
                                                    <div className="text-center">
                                                        <h4 className="font-bold">{currentApiary.name || `Arılık ${currentApiary._id.slice(-4)}`}</h4>
                                                        <p className="text-sm">{apiaryHives.length} kovan</p>
                                                        <p className="text-sm">{apiaryHives.filter(h => h.sensor?.isConnected).length} aktif</p>
                                                        {currentApiary.location?.address && <p className="text-xs text-gray-600">{currentApiary.location.address}</p>}

                                                        {/* 📶 Bağlantı durumu badge'i */}
                                                        <div className="mt-2">
                                                            <span className={`inline-block px-2 py-1 text-xs rounded-full text-white ${getConnectionBadge(currentApiary).class}`}>
                                                                {getConnectionBadge(currentApiary).text}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </Popup>
                                            </Marker>
                                        ) : (
                                            <div className="absolute top-4 left-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 py-2 rounded z-1000">
                                                ⚠️ Bu arılığın koordinat bilgisi eksik
                                            </div>
                                        )}
                                    </MapContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-600 rounded-lg">
                                        <div className="text-center text-gray-500">
                                            <p className="text-lg">📍 Arılık Seçiniz</p>
                                            <p className="text-sm">Yukarıdan bir arılık seçtikten sonra harita görüntülenecek</p>
                                            {!selectedApiary && (
                                                <p className="text-xs mt-2">Henüz arılık seçilmemiş</p>
                                            )}
                                            {selectedApiary && !currentApiary && (
                                                <p className="text-xs mt-2">Seçili arılık bulunamadı</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 📍 Koordinat bilgisi eksik olan arılıklar için yardım */}
                            {selectedApiary && currentApiary && (!currentApiary.location?.coordinates?.latitude || !currentApiary.location?.coordinates?.longitude) && (
                                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0">
                                            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <h4 className="text-sm font-medium text-yellow-800">
                                                Bu arılık için konum bilgisi eksik
                                            </h4>
                                            <p className="mt-1 text-sm text-yellow-700">
                                                Arılığın haritada görünmesi için koordinat bilgilerinin eklenmesi gerekiyor.
                                                Arılık yönetimi sayfasından konum bilgisini güncelleyebilirsiniz.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
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
                                    🔄 Yenile
                                </button>
                            </div>
                            <div className="space-y-2">
                                {!selectedApiary ? (
                                    <div className="text-center text-gray-500 py-8">
                                        <div className="text-4xl mb-2">🏠</div>
                                        <div className="text-sm">Önce sol taraftan bir arılık seçin</div>
                                        <div className="text-xs text-gray-400 mt-1">
                                            Arılık seçtikten sonra o arılığın kovanları burada listelenecek
                                        </div>
                                    </div>
                                ) : apiaryHives.length === 0 ? (
                                    <div className="text-center text-gray-500 py-8">
                                        <div className="text-4xl mb-2">🔍</div>
                                        <div className="text-sm">Bu arılıkta henüz kovan yok</div>
                                        <div className="text-xs text-gray-400 mt-1">
                                            Kovan eklemek için yönetim panelini kullanın
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        {!selectedHive && (
                                            <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
                                                <div className="flex items-center">
                                                    <div className="text-blue-600 dark:text-blue-400 text-sm">
                                                        👇 Aşağıdan bir kovan seçin
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {apiaryHives.map(hive => (
                                            <button
                                                key={hive._id}
                                                onClick={() => {
                                                    console.log('🐝 Kovan seçildi:', hive.name, 'ID:', hive._id);
                                                    setSelectedHive(hive._id);

                                                    // Sensör verilerini hemen yükle
                                                    setTimeout(() => {
                                                        if (fetchLatestSensorData) {
                                                            fetchLatestSensorData(hive._id);
                                                        }
                                                    }, 100);
                                                }}
                                                className={`w-full text-left p-3 rounded-lg transition-colors mb-2 ${selectedHive === hive._id
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
                                                        {hiveConnectionStates[hive._id] ? (
                                                            <div className={`px-2 py-1 rounded-full text-xs text-white ${hiveConnectionStates[hive._id].class}`}>
                                                                {hiveConnectionStates[hive._id].text}
                                                            </div>
                                                        ) : (
                                                            <div className="px-2 py-1 rounded-full text-xs text-white bg-gray-500">
                                                                Kontrol ediliyor...
                                                            </div>
                                                        )}

                                                        {selectedHive === hive._id && (
                                                            <div className="text-xs text-amber-600 dark:text-amber-400">
                                                                🎯 Seçili
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sağ Panel - Dijital İkiz */}
                    <div className="col-span-12 lg:col-span-3">
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 h-full">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center">
                                🎯 Dijital İkiz
                                {selectedHive && currentHive && (
                                    <span className="ml-2 text-sm font-normal text-gray-500">
                                        - {currentHive.name || `Kovan ${currentHive._id.slice(-4)}`}
                                    </span>
                                )}
                            </h3>

                            {selectedHive && currentHive ? (
                                <HiveDigitalTwin hive={currentHive} sensorData={sensorData} loading={loading} />
                            ) : (
                                <div className="text-center text-gray-500 py-8">
                                    <div className="text-4xl mb-2">🔍</div>
                                    <div className="text-sm">Kovan seçiniz</div>
                                    <div className="text-xs text-gray-400 mt-1">
                                        {!selectedApiary
                                            ? 'Önce bir arılık seçin'
                                            : apiaryHives.length === 0
                                                ? 'Bu arılıkta kovan bulunmuyor'
                                                : 'Soldan bir kovan seçin'
                                        }
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DashboardCard12;
