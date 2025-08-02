import React, { useState, useEffect } from 'react';
import Header from '../../partials/Header';
import Sidebar from '../../partials/Sidebar';
import useRealTimeData from '../../hooks/useRealTimeData';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Leaflet icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const apiaryIcon = new L.Icon({
    iconUrl: '/src/images/beehive-marker.svg',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
});

function Apiaries() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { sensorData, connectionStatus } = useRealTimeData();

    // State management
    const [apiaries, setApiaries] = useState([]);
    const [selectedApiary, setSelectedApiary] = useState(null);
    const [viewMode, setViewMode] = useState('cards'); // 'cards', 'table', 'map'
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('view'); // 'view', 'add', 'edit'
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('name'); // 'name', 'location', 'hiveCount', 'status'

    // Form data for add/edit
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        location: '',
        coordinates: { lat: 39.9334, lng: 32.8597 }, // Ankara default
        description: '',
        owner: '',
        phone: '',
        email: '',
        establishedDate: '',
        hiveCapacity: 20,
        status: 'active'
    });

    // Mock data (gerçek uygulamada API'den gelecek)
    useEffect(() => {
        const mockApiaries = [
            {
                id: 'APY001',
                name: 'Merkez Arılık',
                location: 'Ankara, Çankaya',
                coordinates: { lat: 39.9334, lng: 32.8597 },
                description: 'Ana arılık lokasyonu',
                owner: 'Ahmet Yılmaz',
                phone: '+90 555 123 4567',
                email: 'ahmet@beetwin.com',
                establishedDate: '2023-01-15',
                hiveCapacity: 50,
                currentHives: 35,
                status: 'active',
                lastInspection: '2024-01-15',
                health: 'good'
            },
            {
                id: 'APY002',
                name: 'Orman Arılığı',
                location: 'Bolu, Abant',
                coordinates: { lat: 40.6077, lng: 31.2654 },
                description: 'Orman içi arılık',
                owner: 'Fatma Demir',
                phone: '+90 555 987 6543',
                email: 'fatma@beetwin.com',
                establishedDate: '2023-03-20',
                hiveCapacity: 30,
                currentHives: 28,
                status: 'active',
                lastInspection: '2024-01-10',
                health: 'excellent'
            },
            {
                id: 'APY003',
                name: 'Dağ Arılığı',
                location: 'Trabzon, Uzungöl',
                coordinates: { lat: 40.6197, lng: 40.2906 },
                description: 'Yüksek rakım arılığı',
                owner: 'Mehmet Kaya',
                phone: '+90 555 456 7890',
                email: 'mehmet@beetwin.com',
                establishedDate: '2023-05-10',
                hiveCapacity: 25,
                currentHives: 20,
                status: 'seasonal',
                lastInspection: '2024-01-05',
                health: 'warning'
            }
        ];
        setApiaries(mockApiaries);
    }, []);

    // Sensör verilerinden kovan sayılarını güncelle
    useEffect(() => {
        if (sensorData.length > 0) {
            setApiaries(prevApiaries =>
                prevApiaries.map(apiary => {
                    const apiaryDevices = sensorData.filter(data =>
                        data.location && data.location.includes(apiary.location.split(',')[0])
                    );
                    return {
                        ...apiary,
                        activeDevices: apiaryDevices.length,
                        lastDataReceived: apiaryDevices.length > 0
                            ? new Date(Math.max(...apiaryDevices.map(d => new Date(d.timestamp)))).toISOString()
                            : null
                    };
                })
            );
        }
    }, [sensorData]);

    // Filtreleme ve sıralama
    const filteredAndSortedApiaries = apiaries
        .filter(apiary =>
            apiary.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            apiary.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
            apiary.owner.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'location':
                    return a.location.localeCompare(b.location);
                case 'hiveCount':
                    return b.currentHives - a.currentHives;
                case 'status':
                    return a.status.localeCompare(b.status);
                default:
                    return 0;
            }
        });

    // Modal functions
    const openModal = (mode, apiary = null) => {
        setModalMode(mode);
        if (apiary) {
            setSelectedApiary(apiary);
            setFormData(apiary);
        } else {
            setSelectedApiary(null);
            setFormData({
                id: '',
                name: '',
                location: '',
                coordinates: { lat: 39.9334, lng: 32.8597 },
                description: '',
                owner: '',
                phone: '',
                email: '',
                establishedDate: '',
                hiveCapacity: 20,
                status: 'active'
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedApiary(null);
        setModalMode('view');
    };

    // Form submit
    const handleSubmit = (e) => {
        e.preventDefault();

        if (modalMode === 'add') {
            const newApiary = {
                ...formData,
                id: `APY${(apiaries.length + 1).toString().padStart(3, '0')}`,
                currentHives: 0,
                lastInspection: null,
                health: 'good'
            };
            setApiaries(prev => [...prev, newApiary]);
        } else if (modalMode === 'edit') {
            setApiaries(prev =>
                prev.map(apiary =>
                    apiary.id === formData.id ? formData : apiary
                )
            );
        }

        closeModal();
    };

    // Delete apiary
    const deleteApiary = (id) => {
        if (window.confirm('Bu arılığı silmek istediğinizden emin misiniz?')) {
            setApiaries(prev => prev.filter(apiary => apiary.id !== id));
            closeModal();
        }
    };

    // Status helper
    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
            case 'inactive': return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
            case 'seasonal': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
            case 'maintenance': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400';
            default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400';
        }
    };

    const getHealthColor = (health) => {
        switch (health) {
            case 'excellent': return 'text-green-600';
            case 'good': return 'text-blue-600';
            case 'warning': return 'text-yellow-600';
            case 'critical': return 'text-red-600';
            default: return 'text-gray-600';
        }
    };

    // Statistics
    const stats = {
        total: apiaries.length,
        active: apiaries.filter(a => a.status === 'active').length,
        totalHives: apiaries.reduce((sum, a) => sum + a.currentHives, 0),
        capacity: apiaries.reduce((sum, a) => sum + a.hiveCapacity, 0)
    };

    return (
        <div className="flex h-screen overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">

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
                                <h1 className="text-2xl md:text-3xl text-green-700 dark:text-green-300 font-bold">
                                    🏡 Arılık Yönetimi
                                </h1>
                                <p className="text-emerald-600 dark:text-emerald-400 text-sm">
                                    Arılık lokasyonları ve genel yönetim
                                </p>
                            </div>

                            <div className="flex items-center space-x-3">
                                <div className="flex items-center space-x-2">
                                    <div className={`w-3 h-3 rounded-full ${connectionStatus ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        {connectionStatus ? 'Canlı Veri' : 'Çevrimdışı'}
                                    </span>
                                </div>

                                <button
                                    onClick={() => openModal('add')}
                                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                                >
                                    ➕ Yeni Arılık
                                </button>
                            </div>
                        </div>

                        {/* Statistics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center">
                                    <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                                        <span className="text-xl">🏡</span>
                                    </div>
                                    <div className="ml-3">
                                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                            {stats.total}
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                            Toplam Arılık
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                                        <span className="text-xl">✅</span>
                                    </div>
                                    <div className="ml-3">
                                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                            {stats.active}
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                            Aktif Arılık
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center">
                                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                                        <span className="text-xl">🍯</span>
                                    </div>
                                    <div className="ml-3">
                                        <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                                            {stats.totalHives}
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                            Toplam Kovan
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center">
                                    <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                                        <span className="text-xl">📊</span>
                                    </div>
                                    <div className="ml-3">
                                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                            {Math.round((stats.totalHives / stats.capacity) * 100)}%
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                            Kapasite Kullanımı
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Filters and Search */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">

                                {/* Search */}
                                <div className="flex-1 max-w-md">
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Arılık, konum veya sahip ara..."
                                        className="form-input w-full border-gray-200 dark:border-gray-700 rounded-md text-sm"
                                    />
                                </div>

                                {/* Sort */}
                                <div className="flex items-center space-x-4">
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="form-select border-gray-200 dark:border-gray-700 rounded-md text-sm"
                                    >
                                        <option value="name">İsme Göre</option>
                                        <option value="location">Konuma Göre</option>
                                        <option value="hiveCount">Kovan Sayısına Göre</option>
                                        <option value="status">Duruma Göre</option>
                                    </select>

                                    {/* View Mode */}
                                    <div className="flex rounded-md shadow-sm">
                                        <button
                                            onClick={() => setViewMode('cards')}
                                            className={`px-3 py-2 text-xs font-medium rounded-l-md border ${viewMode === 'cards'
                                                    ? 'bg-green-600 text-white border-green-600'
                                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            🗃️ Kartlar
                                        </button>
                                        <button
                                            onClick={() => setViewMode('table')}
                                            className={`px-3 py-2 text-xs font-medium border-t border-b ${viewMode === 'table'
                                                    ? 'bg-green-600 text-white border-green-600'
                                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            📋 Tablo
                                        </button>
                                        <button
                                            onClick={() => setViewMode('map')}
                                            className={`px-3 py-2 text-xs font-medium rounded-r-md border ${viewMode === 'map'
                                                    ? 'bg-green-600 text-white border-green-600'
                                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            🗺️ Harita
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content based on view mode */}
                        {viewMode === 'cards' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredAndSortedApiaries.map((apiary) => (
                                    <div key={apiary.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                                                    {apiary.name}
                                                </h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    📍 {apiary.location}
                                                </p>
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(apiary.status)}`}>
                                                {apiary.status === 'active' ? 'Aktif' :
                                                    apiary.status === 'inactive' ? 'Pasif' :
                                                        apiary.status === 'seasonal' ? 'Mevsimlik' : 'Bakımda'}
                                            </span>
                                        </div>

                                        <div className="space-y-3 mb-4">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600 dark:text-gray-400">Kovan Sayısı:</span>
                                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                                    {apiary.currentHives} / {apiary.hiveCapacity}
                                                </span>
                                            </div>

                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600 dark:text-gray-400">Sahip:</span>
                                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                                    {apiary.owner}
                                                </span>
                                            </div>

                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600 dark:text-gray-400">Sağlık Durumu:</span>
                                                <span className={`font-medium ${getHealthColor(apiary.health)}`}>
                                                    {apiary.health === 'excellent' ? '🟢 Mükemmel' :
                                                        apiary.health === 'good' ? '🔵 İyi' :
                                                            apiary.health === 'warning' ? '🟡 Uyarı' : '🔴 Kritik'}
                                                </span>
                                            </div>

                                            {apiary.lastInspection && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600 dark:text-gray-400">Son Kontrol:</span>
                                                    <span className="font-medium text-gray-900 dark:text-gray-100">
                                                        {new Date(apiary.lastInspection).toLocaleDateString('tr-TR')}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => openModal('view', apiary)}
                                                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                                            >
                                                👁️ Görüntüle
                                            </button>
                                            <button
                                                onClick={() => openModal('edit', apiary)}
                                                className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
                                            >
                                                ✏️ Düzenle
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {viewMode === 'table' && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Arılık
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Konum
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Sahip
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Kovan
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Durum
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Sağlık
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    İşlemler
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {filteredAndSortedApiaries.map((apiary) => (
                                                <tr key={apiary.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                                {apiary.name}
                                                            </div>
                                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                {apiary.id}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                        📍 {apiary.location}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div>
                                                            <div className="text-sm text-gray-900 dark:text-gray-100">{apiary.owner}</div>
                                                            <div className="text-sm text-gray-500 dark:text-gray-400">{apiary.phone}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                        {apiary.currentHives} / {apiary.hiveCapacity}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(apiary.status)}`}>
                                                            {apiary.status === 'active' ? 'Aktif' :
                                                                apiary.status === 'inactive' ? 'Pasif' :
                                                                    apiary.status === 'seasonal' ? 'Mevsimlik' : 'Bakımda'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`text-sm font-medium ${getHealthColor(apiary.health)}`}>
                                                            {apiary.health === 'excellent' ? '🟢 Mükemmel' :
                                                                apiary.health === 'good' ? '🔵 İyi' :
                                                                    apiary.health === 'warning' ? '🟡 Uyarı' : '🔴 Kritik'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                        <button
                                                            onClick={() => openModal('view', apiary)}
                                                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                                        >
                                                            👁️
                                                        </button>
                                                        <button
                                                            onClick={() => openModal('edit', apiary)}
                                                            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                                                        >
                                                            ✏️
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {viewMode === 'map' && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                                <div className="h-96 rounded-lg overflow-hidden">
                                    <MapContainer
                                        center={[39.9334, 32.8597]}
                                        zoom={6}
                                        style={{ height: '100%', width: '100%' }}
                                    >
                                        <TileLayer
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        />
                                        {filteredAndSortedApiaries.map((apiary) => (
                                            <Marker
                                                key={apiary.id}
                                                position={[apiary.coordinates.lat, apiary.coordinates.lng]}
                                                icon={apiaryIcon}
                                            >
                                                <Popup>
                                                    <div className="p-2">
                                                        <h4 className="font-semibold text-gray-900 mb-2">{apiary.name}</h4>
                                                        <div className="text-sm space-y-1">
                                                            <div>📍 {apiary.location}</div>
                                                            <div>👤 {apiary.owner}</div>
                                                            <div>🍯 {apiary.currentHives}/{apiary.hiveCapacity} kovan</div>
                                                            <div className="mt-2">
                                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(apiary.status)}`}>
                                                                    {apiary.status === 'active' ? 'Aktif' :
                                                                        apiary.status === 'inactive' ? 'Pasif' :
                                                                            apiary.status === 'seasonal' ? 'Mevsimlik' : 'Bakımda'}
                                                                </span>
                                                            </div>
                                                            <div className="mt-2 space-x-1">
                                                                <button
                                                                    onClick={() => openModal('view', apiary)}
                                                                    className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                                                                >
                                                                    Detay
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Popup>
                                            </Marker>
                                        ))}
                                    </MapContainer>
                                </div>
                            </div>
                        )}

                    </div>
                </main>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                    {modalMode === 'view' ? '🏡 Arılık Detayları' :
                                        modalMode === 'add' ? '➕ Yeni Arılık Ekle' : '✏️ Arılık Düzenle'}
                                </h3>
                                <button
                                    onClick={closeModal}
                                    className="text-gray-400 hover:text-gray-600 text-2xl"
                                >
                                    ✕
                                </button>
                            </div>

                            {modalMode === 'view' && selectedApiary && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Arılık Adı
                                            </label>
                                            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                                {selectedApiary.name}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Durum
                                            </label>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedApiary.status)}`}>
                                                {selectedApiary.status === 'active' ? 'Aktif' :
                                                    selectedApiary.status === 'inactive' ? 'Pasif' :
                                                        selectedApiary.status === 'seasonal' ? 'Mevsimlik' : 'Bakımda'}
                                            </span>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Konum
                                            </label>
                                            <div className="text-gray-900 dark:text-gray-100">
                                                📍 {selectedApiary.location}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Sahip
                                            </label>
                                            <div className="text-gray-900 dark:text-gray-100">
                                                👤 {selectedApiary.owner}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Telefon
                                            </label>
                                            <div className="text-gray-900 dark:text-gray-100">
                                                📞 {selectedApiary.phone}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                E-posta
                                            </label>
                                            <div className="text-gray-900 dark:text-gray-100">
                                                📧 {selectedApiary.email}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Kovan Sayısı
                                            </label>
                                            <div className="text-gray-900 dark:text-gray-100">
                                                🍯 {selectedApiary.currentHives} / {selectedApiary.hiveCapacity}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Sağlık Durumu
                                            </label>
                                            <span className={`font-medium ${getHealthColor(selectedApiary.health)}`}>
                                                {selectedApiary.health === 'excellent' ? '🟢 Mükemmel' :
                                                    selectedApiary.health === 'good' ? '🔵 İyi' :
                                                        selectedApiary.health === 'warning' ? '🟡 Uyarı' : '🔴 Kritik'}
                                            </span>
                                        </div>
                                    </div>

                                    {selectedApiary.description && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Açıklama
                                            </label>
                                            <div className="text-gray-900 dark:text-gray-100">
                                                {selectedApiary.description}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-end space-x-3 pt-4">
                                        <button
                                            onClick={() => openModal('edit', selectedApiary)}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                        >
                                            ✏️ Düzenle
                                        </button>
                                        <button
                                            onClick={() => deleteApiary(selectedApiary.id)}
                                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                                        >
                                            🗑️ Sil
                                        </button>
                                    </div>
                                </div>
                            )}

                            {(modalMode === 'add' || modalMode === 'edit') && (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Arılık Adı *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.name}
                                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                                className="form-input w-full border-gray-200 dark:border-gray-700 rounded-md"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Konum *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.location}
                                                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                                                className="form-input w-full border-gray-200 dark:border-gray-700 rounded-md"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Sahip *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.owner}
                                                onChange={(e) => setFormData(prev => ({ ...prev, owner: e.target.value }))}
                                                className="form-input w-full border-gray-200 dark:border-gray-700 rounded-md"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Telefon
                                            </label>
                                            <input
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                                className="form-input w-full border-gray-200 dark:border-gray-700 rounded-md"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                E-posta
                                            </label>
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                                className="form-input w-full border-gray-200 dark:border-gray-700 rounded-md"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Kovan Kapasitesi
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={formData.hiveCapacity}
                                                onChange={(e) => setFormData(prev => ({ ...prev, hiveCapacity: parseInt(e.target.value) }))}
                                                className="form-input w-full border-gray-200 dark:border-gray-700 rounded-md"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Kuruluş Tarihi
                                            </label>
                                            <input
                                                type="date"
                                                value={formData.establishedDate}
                                                onChange={(e) => setFormData(prev => ({ ...prev, establishedDate: e.target.value }))}
                                                className="form-input w-full border-gray-200 dark:border-gray-700 rounded-md"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Durum
                                            </label>
                                            <select
                                                value={formData.status}
                                                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                                                className="form-select w-full border-gray-200 dark:border-gray-700 rounded-md"
                                            >
                                                <option value="active">Aktif</option>
                                                <option value="inactive">Pasif</option>
                                                <option value="seasonal">Mevsimlik</option>
                                                <option value="maintenance">Bakımda</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Açıklama
                                        </label>
                                        <textarea
                                            rows="3"
                                            value={formData.description}
                                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                            className="form-textarea w-full border-gray-200 dark:border-gray-700 rounded-md"
                                        />
                                    </div>

                                    <div className="flex justify-end space-x-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                                        >
                                            İptal
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                                        >
                                            {modalMode === 'add' ? '➕ Ekle' : '💾 Kaydet'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

export default Apiaries;
