import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Header from '../../partials/Header';
import Sidebar from '../../partials/Sidebar';
import useRealTimeData from '../../hooks/useRealTimeData';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Kovan durumuna göre marker renkleri
const createHiveIcon = (status) => {
    const colors = {
        'healthy': '#10B981',    // Green
        'warning': '#F59E0B',    // Yellow  
        'critical': '#EF4444',   // Red
        'offline': '#6B7280'     // Gray
    };

    return L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: ${colors[status] || colors.offline}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });
};

function HiveMonitoring() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { sensorData, connectionStatus, mlInsights, isLoading } = useRealTimeData();

    // Sayfa state'leri
    const [selectedHive, setSelectedHive] = useState(null);
    const [viewMode, setViewMode] = useState('map'); // 'map', 'list', 'grid'
    const [filterStatus, setFilterStatus] = useState('all');

    // Kovan verilerini gerçek zamanlı olarak sensorData'dan al
    const [hives, setHives] = useState([]);

    // Gerçek zamanlı sensör verilerinden kovan listesi oluştur
    useEffect(() => {
        if (sensorData.length > 0) {
            // Unique device ID'leri al
            const uniqueDevices = [...new Set(sensorData.map(data => data.deviceId))];

            // Her device için kovan objesi oluştur
            const newHives = uniqueDevices.map(deviceId => {
                const latestData = sensorData
                    .filter(data => data.deviceId === deviceId)
                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

                if (latestData) {
                    const params = latestData.parameters || {};
                    const temp = params.temperature || latestData.temperature;
                    const humidity = params.humidity || latestData.humidity;

                    return {
                        id: deviceId,
                        name: `Kovan ${deviceId}`,
                        location: latestData.coordinates || { lat: 39.925533, lng: 32.866287 },
                        temperature: temp,
                        humidity: humidity,
                        weight: params.weight || latestData.weight,
                        lastUpdate: latestData.timestamp,
                        status: determineHiveStatus(temp, humidity),
                        queenPresent: true, // Varsayılan değer
                        population: temp && temp > 35 ? 'high' : temp && temp > 30 ? 'medium' : 'low'
                    };
                }
                return null;
            }).filter(Boolean);

            setHives(newHives);
        }
    }, [sensorData]);

    // Kovan durumunu belirle
    const determineHiveStatus = (temp, humidity) => {
        if (!temp || !humidity) return 'offline';
        if (temp > 40 || temp < 30 || humidity < 40 || humidity > 80) return 'critical';
        if (temp > 37 || temp < 32 || humidity < 50 || humidity > 75) return 'warning';
        return 'healthy';
    };

    // Filtrelenmiş kovanlar
    const filteredHives = hives.filter(hive =>
        filterStatus === 'all' || hive.status === filterStatus
    );

    // Durum istatistikleri
    const statusStats = {
        total: hives.length,
        healthy: hives.filter(h => h.status === 'healthy').length,
        warning: hives.filter(h => h.status === 'warning').length,
        critical: hives.filter(h => h.status === 'critical').length,
        offline: hives.filter(h => h.status === 'offline').length
    };

    return (
        <div className="flex h-screen overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">

            {/* Sidebar */}
            <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            {/* Content area */}
            <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">

                {/* Site header */}
                <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

                <main className="grow">
                    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">

                        {/* Page header */}
                        <div className="sm:flex sm:justify-between sm:items-center mb-8">
                            <div className="mb-4 sm:mb-0">
                                <h1 className="text-2xl md:text-3xl text-blue-700 dark:text-blue-300 font-bold">
                                    🐝 Kovan İzleme Dashboard
                                </h1>
                                <p className="text-amber-600 dark:text-amber-400 text-sm">
                                    Gerçek zamanlı kovan durumu ve sensör verileri
                                </p>
                            </div>

                            {/* View controls */}
                            <div className="flex items-center space-x-2">
                                {/* Status filter */}
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="form-select text-sm border-gray-200 dark:border-gray-700 rounded-md"
                                >
                                    <option value="all">Tüm Durumlar</option>
                                    <option value="healthy">Sağlıklı</option>
                                    <option value="warning">Uyarı</option>
                                    <option value="critical">Kritik</option>
                                    <option value="offline">Çevrimdışı</option>
                                </select>

                                {/* View mode buttons */}
                                <div className="flex rounded-md shadow-sm">
                                    <button
                                        onClick={() => setViewMode('map')}
                                        className={`px-3 py-2 text-sm font-medium rounded-l-md border ${viewMode === 'map'
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        🗺️ Harita
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`px-3 py-2 text-sm font-medium border-t border-b ${viewMode === 'list'
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        📋 Liste
                                    </button>
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`px-3 py-2 text-sm font-medium rounded-r-md border ${viewMode === 'grid'
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        ⊞ Kartlar
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Status Stats Cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                                            <span className="text-blue-600 dark:text-blue-400 text-sm font-semibold">
                                                {statusStats.total}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                            Toplam Kovan
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Aktif sistem
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                                            <span className="text-green-600 dark:text-green-400 text-sm font-semibold">
                                                {statusStats.healthy}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                            Sağlıklı
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Normal durum
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                                            <span className="text-yellow-600 dark:text-yellow-400 text-sm font-semibold">
                                                {statusStats.warning}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                            Uyarı
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Dikkat gerekli
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                                            <span className="text-red-600 dark:text-red-400 text-sm font-semibold">
                                                {statusStats.critical}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                            Kritik
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Acil müdahale
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                            <span className="text-gray-600 dark:text-gray-400 text-sm font-semibold">
                                                {statusStats.offline}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                            Çevrimdışı
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Bağlantı yok
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Main Content - View based rendering */}
                        {viewMode === 'map' && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-96">
                                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                        Kovan Konumları
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Gerçek zamanlı konum ve durum bilgileri
                                    </p>
                                </div>
                                <div className="h-80">
                                    <MapContainer
                                        center={[39.925533, 32.866287]}
                                        zoom={15}
                                        style={{ height: '100%', width: '100%' }}
                                    >
                                        <TileLayer
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        />
                                        {filteredHives.map(hive => (
                                            <Marker
                                                key={hive.id}
                                                position={[hive.location.lat, hive.location.lng]}
                                                icon={createHiveIcon(hive.status)}
                                                eventHandlers={{
                                                    click: () => setSelectedHive(hive)
                                                }}
                                            >
                                                <Popup>
                                                    <div className="p-2">
                                                        <h4 className="font-semibold">{hive.name}</h4>
                                                        <p className="text-sm">ID: {hive.id}</p>
                                                        <p className="text-sm">Durum: {hive.status}</p>
                                                        {hive.temperature && (
                                                            <p className="text-sm">Sıcaklık: {hive.temperature}°C</p>
                                                        )}
                                                        {hive.humidity && (
                                                            <p className="text-sm">Nem: {hive.humidity}%</p>
                                                        )}
                                                        {hive.weight && (
                                                            <p className="text-sm">Ağırlık: {hive.weight}kg</p>
                                                        )}
                                                    </div>
                                                </Popup>
                                            </Marker>
                                        ))}
                                    </MapContainer>
                                </div>
                            </div>
                        )}

                        {viewMode === 'list' && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                        Kovan Listesi
                                    </h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Kovan
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Durum
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Sıcaklık
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Nem
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Ağırlık
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Son Güncelleme
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {filteredHives.map(hive => (
                                                <tr
                                                    key={hive.id}
                                                    className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                                                    onClick={() => setSelectedHive(hive)}
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                                {hive.name}
                                                            </div>
                                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                {hive.id}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${hive.status === 'healthy' ? 'bg-green-100 text-green-800' :
                                                            hive.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                                                                hive.status === 'critical' ? 'bg-red-100 text-red-800' :
                                                                    'bg-gray-100 text-gray-800'
                                                            }`}>
                                                            {hive.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                        {hive.temperature ? `${hive.temperature}°C` : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                        {hive.humidity ? `${hive.humidity}%` : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                        {hive.weight ? `${hive.weight}kg` : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                        {new Date(hive.lastUpdate).toLocaleString('tr-TR')}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {viewMode === 'grid' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredHives.map(hive => (
                                    <div
                                        key={hive.id}
                                        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow cursor-pointer"
                                        onClick={() => setSelectedHive(hive)}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                                {hive.name}
                                            </h4>
                                            <span className={`w-3 h-3 rounded-full ${hive.status === 'healthy' ? 'bg-green-500' :
                                                hive.status === 'warning' ? 'bg-yellow-500' :
                                                    hive.status === 'critical' ? 'bg-red-500' :
                                                        'bg-gray-500'
                                                }`}></span>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">ID:</span>
                                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{hive.id}</span>
                                            </div>

                                            {hive.temperature && (
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">Sıcaklık:</span>
                                                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{hive.temperature}°C</span>
                                                </div>
                                            )}

                                            {hive.humidity && (
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">Nem:</span>
                                                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{hive.humidity}%</span>
                                                </div>
                                            )}

                                            {hive.weight && (
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">Ağırlık:</span>
                                                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{hive.weight}kg</span>
                                                </div>
                                            )}

                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Ana Arı:</span>
                                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    {hive.queenPresent ? '✅' : '❌'}
                                                </span>
                                            </div>

                                            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    Son güncelleme: {new Date(hive.lastUpdate).toLocaleTimeString('tr-TR')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Selected Hive Detail Modal */}
                        {selectedHive && (
                            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                                <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white dark:bg-gray-800">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                            {selectedHive.name} - Detay Bilgiler
                                        </h3>
                                        <button
                                            onClick={() => setSelectedHive(null)}
                                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-3">
                                            <h4 className="font-semibold text-gray-900 dark:text-gray-100">Genel Bilgiler</h4>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span>Kovan ID:</span>
                                                    <span className="font-medium">{selectedHive.id}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Durum:</span>
                                                    <span className={`font-medium ${selectedHive.status === 'healthy' ? 'text-green-600' :
                                                        selectedHive.status === 'warning' ? 'text-yellow-600' :
                                                            selectedHive.status === 'critical' ? 'text-red-600' :
                                                                'text-gray-600'
                                                        }`}>
                                                        {selectedHive.status}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Ana Arı:</span>
                                                    <span className="font-medium">{selectedHive.queenPresent ? 'Mevcut' : 'Yok'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Populasyon:</span>
                                                    <span className="font-medium">{selectedHive.population}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <h4 className="font-semibold text-gray-900 dark:text-gray-100">Sensör Verileri</h4>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span>Sıcaklık:</span>
                                                    <span className="font-medium">{selectedHive.temperature ? `${selectedHive.temperature}°C` : 'Veri yok'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Nem:</span>
                                                    <span className="font-medium">{selectedHive.humidity ? `${selectedHive.humidity}%` : 'Veri yok'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Ağırlık:</span>
                                                    <span className="font-medium">{selectedHive.weight ? `${selectedHive.weight}kg` : 'Veri yok'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Son Güncelleme:</span>
                                                    <span className="font-medium">{new Date(selectedHive.lastUpdate).toLocaleString('tr-TR')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex justify-end space-x-3">
                                        <button
                                            onClick={() => setSelectedHive(null)}
                                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                                        >
                                            Kapat
                                        </button>
                                        <button
                                            onClick={() => {
                                                // TODO: Navigate to detailed hive page
                                                console.log('Navigate to detailed view for:', selectedHive.id);
                                            }}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                        >
                                            Detaylı Görünüm
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </main>
            </div>
        </div>
    );
}

export default HiveMonitoring;
