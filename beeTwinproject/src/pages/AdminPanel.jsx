import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/api';

// Hives Tab Component
const HivesTab = () => {
    const [hives, setHives] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [apiaries, setApiaries] = useState([]);
    const [newHive, setNewHive] = useState({
        name: '',
        description: '',
        apiaryId: '',
        hiveType: '',
        sensor: {
            routerId: '',
            sensorId: '',
        }
    });

    useEffect(() => {
        loadHives();
        loadApiaries();
    }, []);

    const loadHives = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/admin/hives', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setHives(data.data.hives || []);
            }
        } catch (error) {
            console.error('Hives loading error:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadApiaries = async () => {
        try {
            const result = await ApiService.getAdminApiaries();
            if (result.success) {
                setApiaries(result.data.apiaries || []);

            } else {
                console.error('❌ Admin apiaries loading error:', result.error);
            }
        } catch (error) {
            console.error('❌ Apiaries loading error:', error);
        }
    };

    const handleAddHive = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/hives', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newHive)
            });

            if (response.ok) {
                loadHives();
                setShowAddForm(false);
                setNewHive({
                    name: '',
                    description: '',
                    apiaryId: '',
                    hiveType: '',
                    sensor: { routerId: '', sensorId: '' }
                });
                alert('Kovan başarıyla eklendi!');
            } else {
                const data = await response.json();
                alert(data.message || 'Kovan eklenirken hata oluştu');
            }
        } catch (error) {
            console.error('Add hive error:', error);
            alert('Kovan eklenirken hata oluştu');
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
                loadHives();
                alert('Sensör eşleştirmesi başarıyla güncellendi!');
            } else {
                const data = await response.json();
                alert(data.message || 'Sensör eşleştirme hatası');
            }
        } catch (error) {
            console.error('Sensor pair error:', error);
            alert('Sensör eşleştirme hatası');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Kovan Yönetimi</h2>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    🏠 Yeni Kovan Ekle
                </button>
            </div>

            {/* Add Hive Form Modal */}
            {showAddForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Yeni Kovan Ekle</h3>
                        <form onSubmit={handleAddHive} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Kovan Adı</label>
                                <input
                                    type="text"
                                    value={newHive.name}
                                    onChange={(e) => setNewHive({ ...newHive, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Açıklama</label>
                                <textarea
                                    value={newHive.description}
                                    onChange={(e) => setNewHive({ ...newHive, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
                                    rows="3"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Arılık</label>
                                <select
                                    value={newHive.apiaryId}
                                    onChange={(e) => setNewHive({ ...newHive, apiaryId: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
                                    required
                                >
                                    <option value="">Arılık Seçin</option>
                                    {apiaries.map(apiary => (
                                        <option key={apiary._id} value={apiary._id}>{apiary.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Kovan Tipi</label>
                                <select
                                    value={newHive.hiveType}
                                    onChange={(e) => setNewHive({ ...newHive, hiveType: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
                                    required
                                >
                                    <option value="">Tip Seçin</option>
                                    <option value="langstroth">Langstroth</option>
                                    <option value="top-bar">Top Bar</option>
                                    <option value="warre">Warré</option>
                                    <option value="other">Diğer</option>
                                </select>
                            </div>

                            <div className="border-t pt-4">
                                <h4 className="font-medium mb-3 text-gray-900 dark:text-white">Sensör Bilgileri (Opsiyonel)</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Router ID</label>
                                        <input
                                            type="text"
                                            value={newHive.sensor.routerId}
                                            onChange={(e) => setNewHive({
                                                ...newHive,
                                                sensor: { ...newHive.sensor, routerId: e.target.value }
                                            })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
                                            placeholder="1"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Sensor ID</label>
                                        <input
                                            type="text"
                                            value={newHive.sensor.sensorId}
                                            onChange={(e) => setNewHive({
                                                ...newHive,
                                                sensor: { ...newHive.sensor, sensorId: e.target.value }
                                            })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
                                            placeholder="001"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-lg transition-colors"
                                >
                                    Kovan Ekle
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowAddForm(false)}
                                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
                                >
                                    İptal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Hives List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                {loading ? (
                    <div className="p-6 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto"></div>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">Kovanlar yükleniyor...</p>
                    </div>
                ) : hives.length === 0 ? (
                    <div className="p-6 text-center">
                        <div className="text-4xl mb-2">🏠</div>
                        <p className="text-gray-600 dark:text-gray-400">Henüz kovan bulunmamaktadır.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Kovan</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Arılık</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Sensör</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Durum</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                                {hives.map((hive) => (
                                    <tr key={hive._id}>
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="font-medium text-gray-900 dark:text-white">{hive.name}</div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">{hive.hiveType}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                            {hive.apiary?.name || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm">
                                                {hive.sensor?.routerId && hive.sensor?.sensorId ? (
                                                    <span className="text-green-600 dark:text-green-400">
                                                        Router {hive.sensor.routerId} - Sensor {hive.sensor.sensorId}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-500 dark:text-gray-400">Sensör Yok</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2 py-1 text-xs rounded-full ${hive.sensor?.isConnected
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                                }`}>
                                                {hive.sensor?.isConnected ? 'Bağlı' : 'Bağlı Değil'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => {
                                                    const routerId = prompt('Router ID:', hive.sensor?.routerId || '');
                                                    const sensorId = prompt('Sensor ID:', hive.sensor?.sensorId || '');
                                                    if (routerId !== null && sensorId !== null) {
                                                        handleSensorPair(hive._id, routerId, sensorId);
                                                    }
                                                }}
                                                className="text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200"
                                            >
                                                Sensör Eşleştir
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

function AdminPanel() {
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [adminData, setAdminData] = useState({});
    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const navigate = useNavigate();

    // Admin istatistikleri (API'den gelecek)
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalBeekeepers: 0,
        totalApiaries: 0,
        totalHives: 0,
        systemAlerts: 0,
        recentUsers: [],
        systemHealth: {}
    });

    useEffect(() => {
        // Admin kontrolü ve veri yüklemesi
        const user = ApiService.getCurrentUser();
        if (!user || user.userType !== 'admin') {
            navigate('/');
            return;
        }

        setAdminData(user);
        loadAdminData();
    }, [navigate]);

    const loadAdminData = async () => {
        try {
            setLoading(true);
            // Gerçek API çağrıları
            setStats({
                totalUsers: 156,
                totalBeekeepers: 142,
                totalApiaries: 45,
                totalHives: 378,
                systemAlerts: 7,
                recentUsers: [
                    { id: 1, name: 'Ahmet Yılmaz', email: 'ahmet@example.com', role: 'Arıcı', status: 'Aktif', joinDate: '2024-07-14' },
                    { id: 2, name: 'Fatma Kaya', email: 'fatma@example.com', role: 'Arıcı', status: 'Aktif', joinDate: '2024-07-13' }
                ],
                systemHealth: {
                    database: 98,
                    api: 99,
                    sensors: 95,
                    storage: 87
                }
            });
        } catch (error) {
            console.error('Admin data loading error:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadUsers = async () => {
        try {
            setUsersLoading(true);
            const token = localStorage.getItem('token');

            const response = await fetch('http://localhost:5000/api/users', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setUsers(data.data.users || []);
            } else {
                console.error('Users fetch failed:', response.status);
                setUsers([]);
            }
        } catch (error) {
            console.error('Users loading error:', error);
            setUsers([]);
        } finally {
            setUsersLoading(false);
        }
    };

    const handleLogout = () => {
        ApiService.logout();
        navigate('/');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            {/* Admin Header */}
            <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                                    <span className="text-white font-bold text-xl">🐝</span>
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">BeeTwin Admin</h1>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Sistem Yönetim Paneli</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            {/* Admin User Info */}
                            <div className="flex items-center space-x-3">
                                <div className="text-right">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {adminData.firstName} {adminData.lastName}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Sistem Yöneticisi</p>
                                </div>
                                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                                    <span className="text-white font-semibold">
                                        {adminData.firstName?.charAt(0)}{adminData.lastName?.charAt(0)}
                                    </span>
                                </div>
                            </div>

                            {/* Logout Button */}
                            <button
                                onClick={handleLogout}
                                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                                title="Çıkış Yap"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Navigation Tabs */}
            <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="px-6">
                    <div className="flex space-x-8">
                        {[
                            { id: 'overview', name: 'Genel Bakış', icon: '📊' },
                            { id: 'users', name: 'Kullanıcılar', icon: '👥' },
                            { id: 'hives', name: 'Kovanlar', icon: '🏠' },
                            { id: 'apiaries', name: 'Arılıklar', icon: '🏡' },
                            { id: 'sensors', name: 'Sensörler', icon: '📡' },
                            { id: 'alerts', name: 'Uyarılar', icon: '⚠️' },
                            { id: 'settings', name: 'Ayarlar', icon: '⚙️' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    if (tab.id === 'users') {
                                        loadUsers();
                                    }
                                }}
                                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${activeTab === tab.id
                                    ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                    }`}
                            >
                                <span>{tab.icon}</span>
                                <span>{tab.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="p-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Kullanıcı</p>
                                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalUsers}</p>
                                        <p className="text-sm text-green-600 dark:text-green-400">+12% bu ay</p>
                                    </div>
                                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                                        <span className="text-2xl">👥</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Aktif Arıcı</p>
                                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalBeekeepers}</p>
                                        <p className="text-sm text-green-600 dark:text-green-400">+8% bu ay</p>
                                    </div>
                                    <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/20 rounded-lg flex items-center justify-center">
                                        <span className="text-2xl">🐝</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Arılık</p>
                                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalApiaries}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{stats.totalHives} kovan</p>
                                    </div>
                                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                                        <span className="text-2xl">🏡</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Sistem Uyarıları</p>
                                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.systemAlerts}</p>
                                        <p className="text-sm text-red-600 dark:text-red-400">Dikkat gerekli</p>
                                    </div>
                                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                                        <span className="text-2xl">⚠️</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* System Health & Recent Users */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sistem Durumu</h3>
                                <div className="space-y-4">
                                    {Object.entries(stats.systemHealth).map(([key, value]) => (
                                        <div key={key} className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">
                                                {key === 'database' ? 'Veritabanı' :
                                                    key === 'api' ? 'API' :
                                                        key === 'sensors' ? 'Sensörler' : 'Depolama'}
                                            </span>
                                            <div className="flex items-center space-x-2">
                                                <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full ${value >= 95 ? 'bg-green-500' :
                                                            value >= 85 ? 'bg-yellow-500' : 'bg-red-500'
                                                            }`}
                                                        style={{ width: `${value}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                                    {value}%
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Son Kayıt Olan Kullanıcılar</h3>
                                <div className="space-y-3">
                                    {stats.recentUsers.map((user) => (
                                        <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                                    <span className="text-white text-xs font-semibold">
                                                        {user.name.split(' ').map(n => n[0]).join('')}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                                                </div>
                                            </div>
                                            <span className={`px-2 py-1 text-xs rounded-full ${user.status === 'Aktif'
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                                }`}>
                                                {user.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Kayıtlı Kullanıcılar
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    Sistemde kayıtlı tüm kullanıcıları görüntüleyin
                                </p>
                            </div>

                            {usersLoading ? (
                                <div className="p-6 text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto"></div>
                                    <p className="text-gray-600 dark:text-gray-400 mt-2">Kullanıcılar yükleniyor...</p>
                                </div>
                            ) : users.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    Kullanıcı
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    Email
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    Tip
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    Kayıt Tarihi
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    Durum
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {users.map((user) => (
                                                <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                                                <span className="text-white text-sm font-semibold">
                                                                    {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                                                                </span>
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                                    {user.firstName} {user.lastName}
                                                                </div>
                                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                    {user.location}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                        {user.email}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 py-1 text-xs rounded-full ${user.userType === 'admin'
                                                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
                                                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400'
                                                            }`}>
                                                            {user.userType === 'admin' ? 'Admin' : 'Arıcı'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                        {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 py-1 text-xs rounded-full ${user.isActive
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                                            }`}>
                                                            {user.isActive ? 'Aktif' : 'Pasif'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="p-6 text-center">
                                    <p className="text-gray-600 dark:text-gray-400">Henüz kayıtlı kullanıcı bulunmuyor.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Hives Tab */}
                {activeTab === 'hives' && (
                    <HivesTab />
                )}

                {/* Other tabs content - placeholder for now */}
                {activeTab !== 'overview' && activeTab !== 'users' && activeTab !== 'hives' && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">🚧</div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Bölümü
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Bu bölüm yakında kullanıma açılacak.
                            </p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default AdminPanel;
