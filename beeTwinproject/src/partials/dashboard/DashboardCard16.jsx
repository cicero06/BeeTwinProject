import React, { useState, useEffect } from 'react';
import useRealTimeData from '../../hooks/useRealTimeData';

/**
 * DashboardCard16 - Router/Sensor Status
 * 
 * Bu bileşen, kovan içindeki router ve sensor durumlarını 
 * gerçek zamanlı olarak görselleştirir.
 * 
 * Özellikler:
 * - Router ID ve Sensor ID eşleştirmesi
 * - Sensor türü ve bağlantı durumu
 * - Son veri alma zamanı
 * - Aktif/Pasif durum gösterimi
 */

function DashboardCard16() {
    const { sensorData, connectionStatus, isLoading } = useRealTimeData();

    // Router/Sensor konfigürasyonu
    const routerConfig = {
        '107': {
            sensorId: '1013',
            type: 'BMP280',
            name: 'Çevre Sensörü',
            dataTypes: ['Sıcaklık', 'Nem', 'Basınç'],
            isActive: true,
            color: 'bg-emerald-500'
        },
        '108': {
            sensorId: '1002',
            type: 'MICS-4514',
            name: 'Gaz Sensörü',
            dataTypes: ['CO', 'NO₂', 'NH₃', 'Gaz Seviyesi'],
            isActive: true,
            color: 'bg-blue-500'
        },
        '109': {
            sensorId: '1010',
            type: 'Load Sensor',
            name: 'Ağırlık Sensörü',
            dataTypes: ['Ağırlık', 'Yük'],
            isActive: false,
            color: 'bg-gray-400'
        },
        '110': {
            sensorId: '1009',
            type: 'MQ2',
            name: 'Gaz Dedektörü',
            dataTypes: ['Gaz', 'Duman', 'LPG'],
            isActive: false,
            color: 'bg-gray-400'
        }
    };

    // Son veri alma zamanını hesapla
    const getLastDataTime = (routerId) => {
        // Gerçek zamanlı veriden son güncelleme zamanını al
        if (sensorData && sensorData.timestamp) {
            const time = new Date(sensorData.timestamp);
            return time.toLocaleTimeString('tr-TR');
        }
        return 'Veri yok';
    };

    // Bağlantı durumunu kontrol et
    const getConnectionStatus = (routerId) => {
        const config = routerConfig[routerId];
        if (!config.isActive) return 'Pasif';

        if (connectionStatus === 'connected') {
            return 'Bağlı';
        } else if (connectionStatus === 'connecting') {
            return 'Bağlanıyor';
        } else {
            return 'Bağlantı Yok';
        }
    };

    return (
        <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-slate-800 shadow-lg rounded-sm border border-slate-200 dark:border-slate-700">
            <div className="px-5 pt-5">
                <header className="flex justify-between items-start mb-2">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">
                        Router/Sensor Durumu
                    </h2>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                        Kovan 1 - Test Sistemi
                    </div>
                </header>
            </div>

            <div className="flex-grow px-5 pb-5">
                <div className="space-y-3">
                    {Object.entries(routerConfig).map(([routerId, config]) => {
                        const connectionStat = getConnectionStatus(routerId);
                        const lastData = getLastDataTime(routerId);

                        return (
                            <div
                                key={routerId}
                                className={`p-4 rounded-lg border ${config.isActive
                                        ? 'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700'
                                        : 'border-slate-100 dark:border-slate-700 bg-slate-25 dark:bg-slate-800'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${config.color}`}></div>
                                        <div>
                                            <div className="font-medium text-slate-800 dark:text-slate-100">
                                                Router {routerId} → Sensor {config.sensorId}
                                            </div>
                                            <div className="text-sm text-slate-600 dark:text-slate-300">
                                                {config.type} - {config.name}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-sm font-medium ${config.isActive
                                                ? connectionStat === 'Bağlı'
                                                    ? 'text-emerald-600 dark:text-emerald-400'
                                                    : 'text-amber-600 dark:text-amber-400'
                                                : 'text-slate-500 dark:text-slate-400'
                                            }`}>
                                            {connectionStat}
                                        </div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">
                                            {config.isActive ? lastData : 'Geliştirme'}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-1 mt-2">
                                    {config.dataTypes.map((dataType, index) => (
                                        <span
                                            key={index}
                                            className={`text-xs px-2 py-1 rounded ${config.isActive
                                                    ? 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300'
                                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-500'
                                                }`}
                                        >
                                            {dataType}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Özet bilgiler */}
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                            <div className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                                2/4
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-400">
                                Aktif Router
                            </div>
                        </div>
                        <div>
                            <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                                2
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-400">
                                Geliştirmede
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DashboardCard16;
