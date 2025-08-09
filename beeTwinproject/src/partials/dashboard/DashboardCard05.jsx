import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

/**
 * DashboardCard05 - Load Cell Sensör Durumu (HX711)
 * 
 * Bu bileşen, load cell sensöründen gelen ağırlık verilerini izler.
 * Şu anda veri bağlantısı kurulmamış durumda olduğu için
 * bağlantı sorunları ve sistem durumu gösterilir.
 * 
 * Özellikler:
 * - Load cell sensör bağlantı durumu
 * - Veri alınamıyor uyarıları
 * - Gelecekte: Gerçek zamanlı ağırlık ölçümleri
 * 
 * Veri Kaynağı: Backend /api/sensors/router/109/latest endpoint'i (gelecekte)
 */
function DashboardCard05() {
  const { user } = useAuth();

  const [sensorStatus, setSensorStatus] = useState({
    isConnected: false,
    lastAttempt: null,
    errorMessage: 'Load cell sensör bağlantısı kurulmamış',
    expectedRouter: '109', // Load cell için gelecekte kullanılacak router ID
    sensorType: 'HX711',
    connectionAttempts: 0,
    nextRetry: null
  });

  // Bağlantı durumu simülasyonu
  useEffect(() => {
    const simulateConnectionAttempts = () => {
      const now = new Date();
      const nextRetry = new Date(now.getTime() + 30000); // 30 saniye sonra

      setSensorStatus(prev => ({
        ...prev,
        lastAttempt: now.toISOString(),
        nextRetry: nextRetry.toISOString(),
        connectionAttempts: prev.connectionAttempts + 1,
        errorMessage: prev.connectionAttempts > 3 
          ? 'Load cell sensör bulunamadı. Donanım kontrolü gerekli.'
          : 'Load cell sensör bağlantısı deneniyor...'
      }));
    };

    // İlk deneme
    simulateConnectionAttempts();

    // Her 30 saniyede bir bağlantı denemesi simüle et
    const interval = setInterval(simulateConnectionAttempts, 30000);

    return () => clearInterval(interval);
  }, []);

  // Zaman formatı
  const formatTime = (timestamp) => {
    if (!timestamp) return 'Henüz denenmedi';
    return new Date(timestamp).toLocaleTimeString('tr-TR');
  };

  return (
    <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-xs rounded-xl">
      <div className="px-5 pt-5">
        <header className="flex justify-between items-start mb-2">
          {/* Icon */}
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-red-500/10 mr-3">
              <span className="text-red-600 dark:text-red-400 text-2xl">⚖️</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">
                Load Cell Sensör
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                HX711 Ağırlık Sensörü
              </p>
            </div>
          </div>
          
          {/* Status indicator */}
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-red-600 dark:text-red-400 ml-2">Bağlantı Yok</span>
          </div>
        </header>

        {/* Bağlantı Durumu */}
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
          <div className="flex items-center mb-3">
            <div className="text-red-600 dark:text-red-400 mr-2 text-xl">🔌</div>
            <div>
              <h3 className="text-red-800 dark:text-red-200 font-medium text-sm">
                Sensör Bağlantısı Bulunamadı
              </h3>
              <p className="text-red-700 dark:text-red-300 text-xs">
                {sensorStatus.errorMessage}
              </p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-red-700 dark:text-red-300">Beklenen Router:</span>
              <span className="text-red-800 dark:text-red-200 font-mono">BT{sensorStatus.expectedRouter}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-700 dark:text-red-300">Sensör Tipi:</span>
              <span className="text-red-800 dark:text-red-200">{sensorStatus.sensorType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-700 dark:text-red-300">Son Deneme:</span>
              <span className="text-red-800 dark:text-red-200">{formatTime(sensorStatus.lastAttempt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-700 dark:text-red-300">Deneme Sayısı:</span>
              <span className="text-red-800 dark:text-red-200">{sensorStatus.connectionAttempts}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-700 dark:text-red-300">Sonraki Deneme:</span>
              <span className="text-red-800 dark:text-red-200">{formatTime(sensorStatus.nextRetry)}</span>
            </div>
          </div>
        </div>

        {/* Gelecek Özellikler */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <div className="text-blue-600 dark:text-blue-400 mr-2 text-lg">🔮</div>
            <h3 className="text-blue-800 dark:text-blue-200 font-medium text-sm">
              Planlanan Özellikler
            </h3>
          </div>
          
          <ul className="space-y-1 text-xs text-blue-700 dark:text-blue-300">
            <li className="flex items-center">
              <span className="w-1 h-1 bg-blue-600 rounded-full mr-2"></span>
              Gerçek zamanlı ağırlık ölçümü
            </li>
            <li className="flex items-center">
              <span className="w-1 h-1 bg-blue-600 rounded-full mr-2"></span>
              Bal üretimi trend analizi
            </li>
            <li className="flex items-center">
              <span className="w-1 h-1 bg-blue-600 rounded-full mr-2"></span>
              Günlük/haftalık ağırlık değişimi
            </li>
            <li className="flex items-center">
              <span className="w-1 h-1 bg-blue-600 rounded-full mr-2"></span>
              Alarm sistemi (hırsızlık/saldırı)
            </li>
          </ul>
        </div>

        {/* Teknik Detaylar */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
            <span>Load Cell Sensör Modülü</span>
            <span className="font-mono">HX711 ADC</span>
          </div>
          <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>Otomatik yeniden deneme</span>
            <span>30 saniye</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardCard05;
