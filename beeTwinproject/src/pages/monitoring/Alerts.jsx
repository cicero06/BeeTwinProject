import React, { useState, useEffect } from 'react';
import Header from '../../partials/Header';
import Sidebar from '../../partials/Sidebar';
import useRealTimeData from '../../hooks/useRealTimeData';

function Alerts() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { sensorData, connectionStatus } = useRealTimeData();

    // Alert state'leri
    const [alerts, setAlerts] = useState([]);
    const [filteredAlerts, setFilteredAlerts] = useState([]);
    const [filterStatus, setFilterStatus] = useState('all'); // all, active, resolved, acknowledged
    const [filterSeverity, setFilterSeverity] = useState('all'); // all, critical, warning, info
    const [searchTerm, setSearchTerm] = useState('');

    // Alert seviye konfigürasyonu
    const alertLevels = {
        critical: {
            label: 'Kritik',
            color: 'text-red-600 dark:text-red-400',
            bg: 'bg-red-100 dark:bg-red-900/20',
            icon: '🚨'
        },
        warning: {
            label: 'Uyarı',
            color: 'text-yellow-600 dark:text-yellow-400',
            bg: 'bg-yellow-100 dark:bg-yellow-900/20',
            icon: '⚠️'
        },
        info: {
            label: 'Bilgi',
            color: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-100 dark:bg-blue-900/20',
            icon: 'ℹ️'
        }
    };

    // Alert kuralları
    const alertRules = {
        temperature: {
            critical: { min: 10, max: 40 },
            warning: { min: 15, max: 35 }
        },
        humidity: {
            critical: { min: 20, max: 90 },
            warning: { min: 30, max: 80 }
        },
        weight: {
            critical: { min: 10, max: 100 },
            warning: { min: 15, max: 80 }
        },
        sound: {
            critical: { min: 0, max: 80 },
            warning: { min: 0, max: 60 }
        }
    };

    // Sensör verilerini alert'lere çevir
    useEffect(() => {
        if (sensorData.length > 0) {
            const newAlerts = [];

            sensorData.forEach(data => {
                const params = data.parameters || {};
                const timestamp = new Date(data.timestamp);

                // Her parametre için kontrol et
                Object.entries(alertRules).forEach(([param, rules]) => {
                    const value = params[param] || data[param];
                    if (value === undefined || value === null) return;

                    let severity = null;
                    let message = '';

                    // Kritik seviye kontrolü
                    if (value < rules.critical.min || value > rules.critical.max) {
                        severity = 'critical';
                        message = `${param.charAt(0).toUpperCase() + param.slice(1)} kritik seviyede: ${value}`;
                    }
                    // Uyarı seviyesi kontrolü
                    else if (value < rules.warning.min || value > rules.warning.max) {
                        severity = 'warning';
                        message = `${param.charAt(0).toUpperCase() + param.slice(1)} uyarı seviyesinde: ${value}`;
                    }

                    if (severity) {
                        // Aynı alert'in tekrarını engelle (son 5 dakika içinde)
                        const recentAlert = newAlerts.find(alert =>
                            alert.deviceId === data.deviceId &&
                            alert.parameter === param &&
                            alert.severity === severity &&
                            (timestamp - new Date(alert.timestamp)) < 5 * 60 * 1000
                        );

                        if (!recentAlert) {
                            newAlerts.push({
                                id: `${data.deviceId}-${param}-${timestamp.getTime()}`,
                                deviceId: data.deviceId,
                                parameter: param,
                                value: value,
                                severity: severity,
                                message: message,
                                timestamp: timestamp.toISOString(),
                                status: 'active', // active, acknowledged, resolved
                                location: data.location || 'Bilinmeyen Konum'
                            });
                        }
                    }
                });
            });

            // Mevcut alert'lerle birleştir ve sırala
            setAlerts(prevAlerts => {
                const combined = [...prevAlerts, ...newAlerts];
                // Duplicate'leri temizle
                const unique = combined.filter((alert, index, self) =>
                    index === self.findIndex(a => a.id === alert.id)
                );
                // Zamana göre sırala (en yeni ilk)
                return unique.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            });
        }
    }, [sensorData]);

    // Filtreleme
    useEffect(() => {
        let filtered = alerts;

        // Status filtresi
        if (filterStatus !== 'all') {
            filtered = filtered.filter(alert => alert.status === filterStatus);
        }

        // Severity filtresi
        if (filterSeverity !== 'all') {
            filtered = filtered.filter(alert => alert.severity === filterSeverity);
        }

        // Arama
        if (searchTerm) {
            filtered = filtered.filter(alert =>
                alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                alert.deviceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                alert.location.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredAlerts(filtered);
    }, [alerts, filterStatus, filterSeverity, searchTerm]);

    // Alert durumu güncelle
    const updateAlertStatus = (alertId, newStatus) => {
        setAlerts(prevAlerts =>
            prevAlerts.map(alert =>
                alert.id === alertId
                    ? { ...alert, status: newStatus }
                    : alert
            )
        );
    };

    // Toplu işlemler
    const acknowledgeAllActiveAlerts = () => {
        setAlerts(prevAlerts =>
            prevAlerts.map(alert =>
                alert.status === 'active'
                    ? { ...alert, status: 'acknowledged' }
                    : alert
            )
        );
    };

    // İstatistikler
    const stats = {
        total: alerts.length,
        active: alerts.filter(a => a.status === 'active').length,
        critical: alerts.filter(a => a.severity === 'critical' && a.status === 'active').length,
        warning: alerts.filter(a => a.severity === 'warning' && a.status === 'active').length
    };

    return (
        <div className="flex h-screen overflow-hidden bg-gradient-to-br from-red-50 via-orange-50 to-yellow-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">

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
                                <h1 className="text-2xl md:text-3xl text-red-700 dark:text-red-300 font-bold">
                                    🚨 Uyarı ve Alarmlar
                                </h1>
                                <p className="text-orange-600 dark:text-orange-400 text-sm">
                                    Sistem uyarıları ve alarm yönetimi
                                </p>
                            </div>

                            {/* Connection status & Quick actions */}
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                    <div className={`w-3 h-3 rounded-full ${connectionStatus ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        {connectionStatus ? 'Canlı İzleme' : 'Bağlantı Kesildi'}
                                    </span>
                                </div>

                                {stats.active > 0 && (
                                    <button
                                        onClick={acknowledgeAllActiveAlerts}
                                        className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                                    >
                                        Tümünü Onayla
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Statistics Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center">
                                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                        <span className="text-xl">📊</span>
                                    </div>
                                    <div className="ml-3">
                                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                            {stats.total}
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                            Toplam Uyarı
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                                        <span className="text-xl">🔴</span>
                                    </div>
                                    <div className="ml-3">
                                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                            {stats.active}
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                            Aktif Uyarı
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center">
                                    <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                                        <span className="text-xl">🚨</span>
                                    </div>
                                    <div className="ml-3">
                                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                            {stats.critical}
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                            Kritik Uyarı
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center">
                                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                                        <span className="text-xl">⚠️</span>
                                    </div>
                                    <div className="ml-3">
                                        <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                                            {stats.warning}
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                            Uyarı Seviyesi
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                                {/* Search */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Arama
                                    </label>
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Uyarı, cihaz veya konum ara..."
                                        className="form-input w-full border-gray-200 dark:border-gray-700 rounded-md text-sm"
                                    />
                                </div>

                                {/* Status Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Durum
                                    </label>
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        className="form-select w-full border-gray-200 dark:border-gray-700 rounded-md text-sm"
                                    >
                                        <option value="all">Tüm Durumlar</option>
                                        <option value="active">Aktif</option>
                                        <option value="acknowledged">Onaylandı</option>
                                        <option value="resolved">Çözüldü</option>
                                    </select>
                                </div>

                                {/* Severity Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Önem Derecesi
                                    </label>
                                    <select
                                        value={filterSeverity}
                                        onChange={(e) => setFilterSeverity(e.target.value)}
                                        className="form-select w-full border-gray-200 dark:border-gray-700 rounded-md text-sm"
                                    >
                                        <option value="all">Tüm Seviyeler</option>
                                        <option value="critical">Kritik</option>
                                        <option value="warning">Uyarı</option>
                                        <option value="info">Bilgi</option>
                                    </select>
                                </div>

                                {/* Clear Filters */}
                                <div className="flex items-end">
                                    <button
                                        onClick={() => {
                                            setSearchTerm('');
                                            setFilterStatus('all');
                                            setFilterSeverity('all');
                                        }}
                                        className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                                    >
                                        🗑️ Filtreleri Temizle
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Alerts List */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    Uyarı Listesi
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {filteredAlerts.length} uyarı gösteriliyor
                                </p>
                            </div>

                            {filteredAlerts.length === 0 ? (
                                <div className="p-8 text-center">
                                    <div className="text-6xl mb-4">🎉</div>
                                    <div className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                                        Uyarı Bulunamadı
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {alerts.length === 0
                                            ? 'Henüz hiç uyarı oluşmamış. Sistem normal çalışıyor.'
                                            : 'Filtrelenen kriterlere uygun uyarı bulunamadı.'
                                        }
                                    </div>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {filteredAlerts.map((alert) => {
                                        const level = alertLevels[alert.severity];
                                        return (
                                            <div key={alert.id} className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${level.bg}`}>
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-start space-x-3">
                                                        <div className="text-2xl">{level.icon}</div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center space-x-2 mb-1">
                                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${level.color} ${level.bg}`}>
                                                                    {level.label}
                                                                </span>
                                                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                                    {alert.deviceId}
                                                                </span>
                                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                    {alert.location}
                                                                </span>
                                                            </div>
                                                            <div className="text-sm text-gray-900 dark:text-gray-100 mb-1">
                                                                {alert.message}
                                                            </div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                {new Date(alert.timestamp).toLocaleString('tr-TR')}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center space-x-2">
                                                        {/* Status badge */}
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${alert.status === 'active'
                                                                ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                                                : alert.status === 'acknowledged'
                                                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                                                    : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                                            }`}>
                                                            {alert.status === 'active' ? 'Aktif' :
                                                                alert.status === 'acknowledged' ? 'Onaylandı' : 'Çözüldü'}
                                                        </span>

                                                        {/* Action buttons */}
                                                        {alert.status === 'active' && (
                                                            <button
                                                                onClick={() => updateAlertStatus(alert.id, 'acknowledged')}
                                                                className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                                                            >
                                                                Onayla
                                                            </button>
                                                        )}

                                                        {alert.status === 'acknowledged' && (
                                                            <button
                                                                onClick={() => updateAlertStatus(alert.id, 'resolved')}
                                                                className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                                                            >
                                                                Çöz
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Alert Rules Info */}
                        <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                            <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-3">
                                📋 Uyarı Kuralları
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                {Object.entries(alertRules).map(([param, rules]) => (
                                    <div key={param} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                        <div className="font-medium text-gray-900 dark:text-gray-100 mb-2 capitalize">
                                            {param === 'temperature' ? 'Sıcaklık' :
                                                param === 'humidity' ? 'Nem' :
                                                    param === 'weight' ? 'Ağırlık' :
                                                        param === 'sound' ? 'Ses' : param}
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-red-600 dark:text-red-400">
                                                🚨 Kritik: {rules.critical.min}-{rules.critical.max}
                                            </div>
                                            <div className="text-yellow-600 dark:text-yellow-400">
                                                ⚠️ Uyarı: {rules.warning.min}-{rules.warning.max}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </main>
            </div>
        </div>
    );
}

export default Alerts;
