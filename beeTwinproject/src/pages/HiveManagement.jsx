import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';
import RouterIdGuide from '../components/RouterIdGuide';
import SensorIdGuide from '../components/SensorIdGuide';

function HiveManagement() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [hives, setHives] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingHive, setEditingHive] = useState(null);

    // Modal dialog states
    const [showSensorModal, setShowSensorModal] = useState(false);
    const [selectedHive, setSelectedHive] = useState(null);
    const [routerId, setRouterId] = useState('');
    const [sensorId, setSensorId] = useState('');

    const { user } = useAuth();

    useEffect(() => {
        loadHives();
    }, []);

    const loadHives = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            if (!token) {
                console.error('Token bulunamadı');
                return;
            }

            const response = await fetch('http://localhost:5000/api/users/hives', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Hives API Response:', data); // Debug için
                setHives(data.data || []);
            } else {
                const errorData = await response.json();
                console.error('Hives loading failed:', errorData);
            }
        } catch (error) {
            console.error('Hives loading error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSensorPair = async (hiveId, routerId, sensorId) => {
        try {
            const token = localStorage.getItem('token');

            const response = await fetch(`http://localhost:5000/api/hives/${hiveId}/sensor`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ routerId, sensorId })
            });

            if (response.ok) {
                alert('✅ Sensör eşleştirmesi başarıyla güncellendi!');
                loadHives(); // Refresh data
                setEditingHive(null);
            } else {
                const data = await response.json();
                alert(`❌ ${data.message || 'Sensör eşleştirme hatası'}`);
            }
        } catch (error) {
            console.error('Sensor pairing error:', error);
            alert('❌ Sensör eşleştirme hatası');
        }
    };

    const openSensorDialog = (hive) => {
        setSelectedHive(hive);
        setRouterId(hive.sensor?.routerId || '');
        setSensorId(hive.sensor?.sensorId || '');
        setShowSensorModal(true);
    };

    const closeSensorModal = () => {
        setShowSensorModal(false);
        setSelectedHive(null);
        setRouterId('');
        setSensorId('');
    };

    const handleSensorSubmit = () => {
        if (selectedHive && routerId && sensorId) {
            handleSensorPair(selectedHive._id, routerId, sensorId);
            closeSensorModal();
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-100">
                <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
                <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
                    <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
                    <div className="flex items-center justify-center h-full">
                        <div className="text-amber-600 text-xl">⏳ Kovanlar yükleniyor...</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-100">
            <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
                <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

                <main className="grow">
                    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">

                        {/* Page Header */}
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-blue-700 mb-2">🏠 Kovan Yönetimi</h1>
                            <p className="text-amber-600">Kovanlarınızı yönetin ve sensör eşleştirmesi yapın</p>
                        </div>

                        {/* Hives Grid */}
                        {hives.length === 0 ? (
                            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                                <div className="text-gray-400 text-6xl mb-4">🐝</div>
                                <h3 className="text-xl font-semibold text-gray-600 mb-2">Henüz kovan bulunamadı</h3>
                                <p className="text-gray-500">Dashboard'dan yeni arılık ve kovan oluşturun.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {hives.map((hive) => (
                                    <div key={hive._id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">

                                        {/* Hive Header */}
                                        <div className="bg-gradient-to-r from-amber-400 to-orange-400 p-4 text-white">
                                            <h3 className="font-bold text-lg">{hive.name || `Kovan ${hive.number}`}</h3>
                                            <p className="text-amber-100 text-sm">Kovan #{hive.number}</p>
                                        </div>

                                        {/* Hive Info */}
                                        <div className="p-4">
                                            <div className="space-y-3">

                                                {/* Status */}
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-600">Durum:</span>
                                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${hive.status === 'active'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {hive.status === 'active' ? '🟢 Aktif' : '🔴 Pasif'}
                                                    </span>
                                                </div>

                                                {/* Sensor Status */}
                                                <div className="bg-gray-50 rounded-lg p-3">
                                                    <h4 className="font-semibold text-gray-700 mb-2">📡 Sensör Durumu</h4>

                                                    {hive.sensor?.routerId && hive.sensor?.sensorId ? (
                                                        <div className="space-y-1">
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-600">Router ID:</span>
                                                                <span className="font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                                                                    {hive.sensor.routerId}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-600">Sensor ID:</span>
                                                                <span className="font-mono bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                                                                    {hive.sensor.sensorId}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-600">Bağlantı:</span>
                                                                <span className={`px-2 py-1 rounded text-sm ${hive.sensor.isConnected
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : 'bg-red-100 text-red-800'
                                                                    }`}>
                                                                    {hive.sensor.isConnected ? '✅ Bağlı' : '❌ Bağlı Değil'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-gray-500 text-center py-2">
                                                            ⚠️ Sensör eşleştirmesi yapılmamış
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Action Button */}
                                                <button
                                                    onClick={() => openSensorDialog(hive)}
                                                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-4 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium"
                                                >
                                                    🔧 Sensör Eşleştir
                                                </button>

                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Help Section */}
                        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
                            <h3 className="font-bold text-blue-800 mb-3">📋 Sensör Eşleştirme Rehberi</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
                                <div>
                                    <h4 className="font-semibold mb-2">🔸 Router 107 (BME280):</h4>
                                    <ul className="space-y-1 text-blue-600">
                                        <li>• Sıcaklık sensörü</li>
                                        <li>• Nem sensörü</li>
                                        <li>• Basınç sensörü</li>
                                        <li>• Sensor ID: 1013</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-2">🔸 Router 108 (MICS-4514):</h4>
                                    <ul className="space-y-1 text-blue-600">
                                        <li>• CO gaz sensörü</li>
                                        <li>• NO2 gaz sensörü</li>
                                        <li>• Hava kalitesi</li>
                                        <li>• Sensor ID: 1002</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                    </div>
                </main>
            </div>

            {/* Sensor Configuration Modal */}
            {showSensorModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                    🔧 Sensör Eşleştirme - {selectedHive?.name}
                                </h2>
                                <button
                                    onClick={closeSensorModal}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Sol taraf: Form */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Router ID
                                        </label>
                                        <input
                                            type="text"
                                            value={routerId}
                                            onChange={(e) => setRouterId(e.target.value)}
                                            placeholder="Örnek: AHMET107, BT2025"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Sensor ID
                                        </label>
                                        <input
                                            type="text"
                                            value={sensorId}
                                            onChange={(e) => setSensorId(e.target.value)}
                                            placeholder="Örnek: AHMET107S01, 1013"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>

                                    <div className="flex space-x-3 pt-4">
                                        <button
                                            onClick={handleSensorSubmit}
                                            disabled={!routerId || !sensorId}
                                            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg transition-colors"
                                        >
                                            ✅ Kaydet
                                        </button>
                                        <button
                                            onClick={closeSensorModal}
                                            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
                                        >
                                            ❌ İptal
                                        </button>
                                    </div>
                                </div>

                                {/* Sağ taraf: Rehberler */}
                                <div className="space-y-4">
                                    <RouterIdGuide onSuggestionClick={setRouterId} />
                                    <SensorIdGuide routerId={routerId} onSuggestionClick={setSensorId} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default HiveManagement;
