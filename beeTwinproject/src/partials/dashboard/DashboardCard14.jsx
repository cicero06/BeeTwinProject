import React, { useState, useEffect } from 'react';
import useRealTimeData from '../../hooks/useRealTimeData';

/**
 * DashboardCard14 - ML Real-Time Insights
 * 
 * Bu kart dijital ikiz sisteminin makine öğrenmesi katmanını görselleştirir:
 * - Gerçek zamanlı anomali tespiti
 * - Trend analizleri ve tahminler
 * - ML model performans metrikleri
 * - WebSocket bağlantı durumu
 */

function DashboardCard14() {
    const {
        mlInsights,
        anomalies,
        trends,
        connectionStatus,
        alerts,
        isLoading,
        error,
        clearAlert,
        refreshMLInsights
    } = useRealTimeData();

    const [refreshing, setRefreshing] = useState(false);

    // Manual refresh handler
    const handleRefresh = async () => {
        setRefreshing(true);
        await refreshMLInsights();
        setTimeout(() => setRefreshing(false), 1000);
    };

    // Get connection status color
    const getConnectionColor = () => {
        return connectionStatus ? 'text-green-500' : 'text-red-500';
    };

    // Get anomaly severity color
    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'critical': return 'text-red-600 bg-red-100';
            case 'high': return 'text-orange-600 bg-orange-100';
            case 'medium': return 'text-yellow-600 bg-yellow-100';
            case 'low': return 'text-blue-600 bg-blue-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
                <div className="px-5 pt-5">
                    <header className="flex justify-between items-start mb-2">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
                            ML Anlayışları
                        </h2>
                    </header>
                </div>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
            <div className="px-5 pt-5">
                <header className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                        {/* Brain Icon SVG */}
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                            ML Anlayışları
                        </h2>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Connection Status */}
                        {connectionStatus ? (
                            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728" />
                            </svg>
                        )}

                        {/* Refresh Button */}
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    </div>
                </header>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}

                {/* ML Performance Summary */}
                {mlInsights && (
                    <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 rounded-lg">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-600 dark:text-gray-300">Model Doğruluğu</span>
                                <div className="text-lg font-semibold text-purple-600">
                                    {(mlInsights.modelAccuracy * 100).toFixed(1)}%
                                </div>
                            </div>
                            <div>
                                <span className="text-gray-600 dark:text-gray-300">Analiz Edilen</span>
                                <div className="text-lg font-semibold text-blue-600">
                                    {mlInsights.processedReadings || 0}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Recent Alerts */}
                {alerts.length > 0 && (
                    <div className="mb-4">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            Aktif Uyarılar ({alerts.length})
                        </h3>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                            {alerts.slice(0, 3).map((alert) => (
                                <div
                                    key={alert.id}
                                    className={`p-2 rounded text-xs flex justify-between items-center ${getSeverityColor(alert.severity)}`}
                                >
                                    <span className="truncate">{alert.message}</span>
                                    <button
                                        onClick={() => clearAlert(alert.id)}
                                        className="ml-2 text-gray-500 hover:text-gray-700"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recent Anomalies */}
                <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        Son Anomaliler
                    </h3>
                    {anomalies.length > 0 ? (
                        <div className="space-y-2 max-h-24 overflow-y-auto">
                            {anomalies.slice(0, 2).map((anomaly, index) => (
                                <div key={index} className="p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs">
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium">{anomaly.deviceId}</span>
                                        <span className={`px-1 rounded ${getSeverityColor(anomaly.severity)}`}>
                                            {anomaly.severity}
                                        </span>
                                    </div>
                                    <div className="text-gray-600 dark:text-gray-400 truncate">
                                        {anomaly.parameter}: {anomaly.value}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-gray-500 dark:text-gray-400">Anomali tespit edilmedi</p>
                    )}
                </div>

                {/* Recent Trends */}
                <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        Trend Tahminleri
                    </h3>
                    {trends.length > 0 ? (
                        <div className="space-y-2">
                            {trends.slice(0, 2).map((trend, index) => (
                                <div key={index} className="p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs">
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium">{trend.parameter}</span>
                                        <span className={`flex items-center gap-1 ${trend.direction === 'up' ? 'text-red-600' :
                                                trend.direction === 'down' ? 'text-blue-600' : 'text-gray-600'
                                            }`}>
                                            <svg className={`w-3 h-3 ${trend.direction === 'down' ? 'transform rotate-180' : ''
                                                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                            </svg>
                                            {trend.confidence}%
                                        </span>
                                    </div>
                                    <div className="text-gray-600 dark:text-gray-400">
                                        {trend.prediction}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-gray-500 dark:text-gray-400">Trend verisi bekleniyor</p>
                    )}
                </div>
            </div>

            {/* Status Bar */}
            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">
                        {connectionStatus ? 'Canlı Bağlantı' : 'Bağlantı Kesildi'}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                        {new Date().toLocaleTimeString('tr-TR')}
                    </span>
                </div>
            </div>
        </div>
    );
}

export default DashboardCard14;
