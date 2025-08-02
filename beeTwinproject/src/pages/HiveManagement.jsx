import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';

function HiveManagement() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [hives, setHives] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingHive, setEditingHive] = useState(null);
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
        const routerId = prompt(`Router ID girin (mevcut: ${hive.sensor?.routerId || 'Yok'}):`);
        if (routerId === null) return;

        const sensorId = prompt(`Sensor ID girin (mevcut: ${hive.sensor?.sensorId || 'Yok'}):`);
        if (sensorId === null) return;

        if (routerId && sensorId) {
            handleSensorPair(hive._id, routerId, sensorId);
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
        </div>
    );
}

export default HiveManagement;
