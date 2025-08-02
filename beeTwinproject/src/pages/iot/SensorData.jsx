import React, { useState, useEffect } from 'react';
import Header from '../../partials/Header';
import Sidebar from '../../partials/Sidebar';
import useRealTimeData from '../../hooks/useRealTimeData';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TimeScale
} from 'chart.js';
import 'chartjs-adapter-moment';

// Chart.js kayıt
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TimeScale
);

function SensorData() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { sensorData, connectionStatus, isLoading } = useRealTimeData();

    // Sayfa state'leri
    const [selectedDevice, setSelectedDevice] = useState('all');
    const [selectedParameter, setSelectedParameter] = useState('temperature');
    const [timeRange, setTimeRange] = useState('1h'); // 1h, 6h, 24h, 7d
    const [viewMode, setViewMode] = useState('chart'); // 'chart', 'table', 'raw'

    // Sensör parametreleri
    const parameters = {
        temperature: { label: 'Sıcaklık', unit: '°C', color: '#EF4444' },
        humidity: { label: 'Nem', unit: '%', color: '#3B82F6' },
        weight: { label: 'Ağırlık', unit: 'kg', color: '#10B981' },
        sound: { label: 'Ses Seviyesi', unit: 'dB', color: '#F59E0B' },
        vibration: { label: 'Titreşim', unit: 'Hz', color: '#8B5CF6' }
    };

    // Time range seçenekleri
    const timeRanges = {
        '1h': { label: '1 Saat', minutes: 60 },
        '6h': { label: '6 Saat', minutes: 360 },
        '24h': { label: '24 Saat', minutes: 1440 },
        '7d': { label: '7 Gün', minutes: 10080 }
    };

    // Filtrelenmiş veri
    const [filteredData, setFilteredData] = useState([]);
    const [uniqueDevices, setUniqueDevices] = useState([]);

    useEffect(() => {
        if (sensorData.length > 0) {
            // Unique cihazları bul
            const devices = [...new Set(sensorData.map(data => data.deviceId))];
            setUniqueDevices(devices);

            // Zaman aralığına göre filtrele
            const now = new Date();
            const timeLimit = new Date(now.getTime() - timeRanges[timeRange].minutes * 60000);

            let filtered = sensorData.filter(data => new Date(data.timestamp) >= timeLimit);

            // Cihaza göre filtrele
            if (selectedDevice !== 'all') {
                filtered = filtered.filter(data => data.deviceId === selectedDevice);
            }

            // Timestamp'e göre sırala
            filtered.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

            setFilteredData(filtered);
        }
    }, [sensorData, selectedDevice, timeRange]);

    // Chart verisi hazırla
    const prepareChartData = () => {
        if (!filteredData.length) return null;

        const labels = filteredData.map(data => new Date(data.timestamp));
        const datasets = [];

        if (selectedDevice === 'all') {
            // Tüm cihazlar için ayrı line'lar
            uniqueDevices.forEach((deviceId, index) => {
                const deviceData = filteredData.filter(data => data.deviceId === deviceId);
                const values = deviceData.map(data => {
                    const params = data.parameters || {};
                    return params[selectedParameter] || data[selectedParameter] || null;
                });

                const colors = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];

                datasets.push({
                    label: deviceId,
                    data: deviceData.map((data, i) => ({
                        x: new Date(data.timestamp),
                        y: values[i]
                    })),
                    borderColor: colors[index % colors.length],
                    backgroundColor: colors[index % colors.length] + '20',
                    tension: 0.1,
                    fill: false
                });
            });
        } else {
            // Tek cihaz için tek line
            const values = filteredData.map(data => {
                const params = data.parameters || {};
                return params[selectedParameter] || data[selectedParameter] || null;
            });

            datasets.push({
                label: `${selectedDevice} - ${parameters[selectedParameter].label}`,
                data: filteredData.map((data, i) => ({
                    x: new Date(data.timestamp),
                    y: values[i]
                })),
                borderColor: parameters[selectedParameter].color,
                backgroundColor: parameters[selectedParameter].color + '20',
                tension: 0.1,
                fill: true
            });
        }

        return { datasets };
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: `${parameters[selectedParameter].label} Değerleri`
            }
        },
        scales: {
            x: {
                type: 'time',
                time: {
                    displayFormats: {
                        minute: 'HH:mm',
                        hour: 'HH:mm',
                        day: 'DD/MM'
                    }
                },
                title: {
                    display: true,
                    text: 'Zaman'
                }
            },
            y: {
                title: {
                    display: true,
                    text: `${parameters[selectedParameter].label} (${parameters[selectedParameter].unit})`
                }
            }
        },
        interaction: {
            intersect: false,
            mode: 'index'
        }
    };

    // Tablo için veri hazırla
    const prepareTableData = () => {
        return filteredData.slice(-100); // Son 100 kayıt
    };

    // İstatistikler hesapla
    const calculateStats = () => {
        if (!filteredData.length) return null;

        const values = filteredData
            .map(data => {
                const params = data.parameters || {};
                return params[selectedParameter] || data[selectedParameter];
            })
            .filter(val => val !== null && val !== undefined);

        if (!values.length) return null;

        const min = Math.min(...values);
        const max = Math.max(...values);
        const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
        const latest = values[values.length - 1];

        return { min, max, avg, latest, count: values.length };
    };

    const stats = calculateStats();

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
                                    📊 Sensör Verileri
                                </h1>
                                <p className="text-amber-600 dark:text-amber-400 text-sm">
                                    Gerçek zamanlı sensör ölçümleri ve geçmiş veriler
                                </p>
                            </div>

                            {/* Connection status */}
                            <div className="flex items-center space-x-2">
                                <div className={`w-3 h-3 rounded-full ${connectionStatus ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {connectionStatus ? 'Canlı Bağlantı' : 'Bağlantı Kesildi'}
                                </span>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                                {/* Device Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Cihaz Seçimi
                                    </label>
                                    <select
                                        value={selectedDevice}
                                        onChange={(e) => setSelectedDevice(e.target.value)}
                                        className="form-select w-full border-gray-200 dark:border-gray-700 rounded-md text-sm"
                                    >
                                        <option value="all">Tüm Cihazlar</option>
                                        {uniqueDevices.map(device => (
                                            <option key={device} value={device}>{device}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Parameter Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Parametre
                                    </label>
                                    <select
                                        value={selectedParameter}
                                        onChange={(e) => setSelectedParameter(e.target.value)}
                                        className="form-select w-full border-gray-200 dark:border-gray-700 rounded-md text-sm"
                                    >
                                        {Object.entries(parameters).map(([key, param]) => (
                                            <option key={key} value={key}>{param.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Time Range Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Zaman Aralığı
                                    </label>
                                    <select
                                        value={timeRange}
                                        onChange={(e) => setTimeRange(e.target.value)}
                                        className="form-select w-full border-gray-200 dark:border-gray-700 rounded-md text-sm"
                                    >
                                        {Object.entries(timeRanges).map(([key, range]) => (
                                            <option key={key} value={key}>{range.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* View Mode */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Görünüm
                                    </label>
                                    <div className="flex rounded-md shadow-sm">
                                        <button
                                            onClick={() => setViewMode('chart')}
                                            className={`px-3 py-2 text-xs font-medium rounded-l-md border ${viewMode === 'chart'
                                                    ? 'bg-blue-600 text-white border-blue-600'
                                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            📈 Grafik
                                        </button>
                                        <button
                                            onClick={() => setViewMode('table')}
                                            className={`px-3 py-2 text-xs font-medium rounded-r-md border-t border-b border-r ${viewMode === 'table'
                                                    ? 'bg-blue-600 text-white border-blue-600'
                                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            📋 Tablo
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Statistics Cards */}
                        {stats && (
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                        {stats.latest?.toFixed(2)}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        Güncel Değer
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {parameters[selectedParameter].unit}
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                        {stats.avg?.toFixed(2)}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        Ortalama
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {parameters[selectedParameter].unit}
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                        {stats.max?.toFixed(2)}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        Maksimum
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {parameters[selectedParameter].unit}
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                        {stats.min?.toFixed(2)}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        Minimum
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {parameters[selectedParameter].unit}
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                                    <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                                        {stats.count}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        Ölçüm Sayısı
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        kayıt
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Main Content */}
                        {viewMode === 'chart' && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                <div className="h-96">
                                    {prepareChartData() ? (
                                        <Line data={prepareChartData()} options={chartOptions} />
                                    ) : (
                                        <div className="flex items-center justify-center h-full">
                                            <div className="text-center">
                                                <div className="text-6xl mb-4">📊</div>
                                                <div className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                                                    Veri Bekleniyor
                                                </div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    {isLoading ? 'Veriler yükleniyor...' : 'Henüz veri alınmadı'}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {viewMode === 'table' && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                        Sensör Veri Tablosu
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Son {prepareTableData().length} kayıt gösteriliyor
                                    </p>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Zaman
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Cihaz ID
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Sıcaklık (°C)
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Nem (%)
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Ağırlık (kg)
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Ses (dB)
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {prepareTableData().reverse().map((data, index) => {
                                                const params = data.parameters || {};
                                                return (
                                                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                            {new Date(data.timestamp).toLocaleString('tr-TR')}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                                            {data.deviceId}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                            {params.temperature || data.temperature || '-'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                            {params.humidity || data.humidity || '-'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                            {params.weight || data.weight || '-'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                            {params.sound || data.sound || '-'}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Export/Download */}
                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => {
                                    // TODO: Implement data export
                                    console.log('Export data:', filteredData);
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                            >
                                📄 Verileri Dışa Aktar
                            </button>
                        </div>

                    </div>
                </main>
            </div>
        </div>
    );
}

export default SensorData;
