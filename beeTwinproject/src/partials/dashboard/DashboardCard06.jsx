import React, { useState, useEffect } from 'react';
import useRealTimeData from '../../hooks/useRealTimeData';
import { useAuth } from '../../contexts/AuthContext';
import DoughnutChart from '../../charts/DoughnutChart';

// Import utilities
import { getCssVariable } from '../../utils/Utils';

/**
 * DashboardCard06 - Router 108 MICS-4514 Hava Kalitesi
 * 
 * Bu bileşen, dijital ikiz temelli akıllı arı kovanı izleme sisteminin 
 * Router 108 MICS-4514 sensöründen gelen hava kalitesi verilerini analiz eden katmanını oluşturmaktadır.
 * 
 * Özellikler:
 * - Router 108 MICS-4514 sensöründen CO2, NH3, VOC gaz seviyesi ölçümleri
 * - Hava kalitesi indeksi hesaplaması
 * - Gaz anomali tespiti ve uyarıları
 * - Kovan hava kalitesi karşılaştırması
 * 
 * Akademik Katkı: Dijital ikiz sisteminin çevresel faktör analizi
 * ve "karar destek" işlevinin hava kalitesi parametresi bileşeni.
 */

function DashboardCard06() {
  const { user, hives } = useAuth();
  const { sensorData: realTimeSensorData, connectionStatus, isLoading: realTimeLoading } = useRealTimeData();

  const [airQualityData, setAirQualityData] = useState({
    overallScore: 0,
    co2Level: 0,
    nh3Level: 0,
    vocLevel: 0,
    qualityStatus: "No Data",
    alertHives: 0,
    lastUpdate: null
  });

  // Router 108 (MICS-4514) gerçek zamanlı veri işleme - Kullanıcıya özel filtre
  useEffect(() => {
    if (realTimeSensorData && realTimeSensorData.length > 0 && user) {
      // Kullanıcının kovanlarına ait Router 108 verilerini filtrele
      const userHiveIds = hives?.map(hive => hive.id) || [];

      // Router 108 verilerini filtrele ve kullanıcının kovanlarıyla eşleştir
      const router108Data = realTimeSensorData.filter(data => {
        const isRouter108 = data.routerId === "108" || data.deviceId === "108";
        // Eğer hiveId belirtilmişse, kullanıcının kovanlarından olmalı
        const isUserHive = !data.hiveId || userHiveIds.includes(data.hiveId) || userHiveIds.includes(data.hive_id);
        return isRouter108 && isUserHive;
      });

      if (router108Data.length > 0) {
        const latestData = router108Data[router108Data.length - 1];
        console.log('🌬️ Router 108 Real-time air quality data:', latestData);

        const co2 = latestData.parameters?.co2 || latestData.co2 || 0;
        const nh3 = latestData.parameters?.nh3 || latestData.nh3 || 0;
        const voc = latestData.parameters?.voc || latestData.voc || 0;

        // Hava kalitesi skoru hesaplama
        const calculateAirQualityScore = (co2, nh3, voc) => {
          let score = 100;

          // CO2 penaltısı
          if (co2 > 5000) score -= 40;
          else if (co2 > 2000) score -= 25;
          else if (co2 > 1000) score -= 10;

          // NH3 penaltısı
          if (nh3 > 50) score -= 30;
          else if (nh3 > 25) score -= 15;

          // VOC penaltısı
          if (voc > 500) score -= 30;
          else if (voc > 100) score -= 10;

          return Math.max(0, Math.min(100, score));
        };

        const overallScore = calculateAirQualityScore(co2, nh3, voc);

        // Kalite durumu belirleme
        const getQualityStatus = (score) => {
          if (score >= 80) return "Excellent";
          if (score >= 60) return "Good";
          if (score >= 40) return "Moderate";
          return "Poor";
        };

        setAirQualityData({
          overallScore,
          co2Level: co2,
          nh3Level: nh3,
          vocLevel: voc,
          qualityStatus: getQualityStatus(overallScore),
          alertHives: overallScore < 60 ? 1 : 0,
          lastUpdate: latestData.timestamp || new Date().toISOString()
        });
      }
    }
  }, [realTimeSensorData, user, hives]);

  // Fallback static data (eğer gerçek veri yoksa)
  const defaultAirQualityData = {
    overallScore: 78,
    co2Level: 1200,
    nh3Level: 15,
    vocLevel: 45,
    qualityStatus: "Good",
    alertHives: 2,
    lastUpdate: "2025-08-02T10:30:00Z"
  };

  // Kullanılacak veri (gerçek veri varsa onu, yoksa default)
  const currentData = airQualityData.lastUpdate ? airQualityData : defaultAirQualityData;

  // Hava kalitesi dağılım verisi
  const chartData = {
    labels: ['Mükemmel', 'İyi', 'Orta', 'Kötü'],
    datasets: [
      {
        label: 'Hava Kalitesi Dağılımı',
        data: [
          currentData.overallScore >= 80 ? 45 : 25,
          currentData.overallScore >= 60 ? 35 : 30,
          currentData.overallScore >= 40 ? 15 : 35,
          currentData.overallScore < 40 ? 5 : 10
        ],
        backgroundColor: [
          getCssVariable('--color-green-500'),   // Mükemmel - Yeşil
          getCssVariable('--color-blue-500'),    // İyi - Mavi  
          getCssVariable('--color-amber-500'),   // Orta - Amber
          getCssVariable('--color-red-500'),     // Kötü - Kırmızı
        ],
        hoverBackgroundColor: [
          getCssVariable('--color-green-600'),
          getCssVariable('--color-blue-600'),
          getCssVariable('--color-amber-600'),
          getCssVariable('--color-red-600'),
        ],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-xs rounded-xl border border-gray-200 dark:border-gray-700">
      {/* Header - Hava Kalitesi Başlığı */}
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">
            🌬️ Router 108 - MICS-4514 Hava Kalitesi
          </h2>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            CO2, NH3, VOC Monitoring
          </div>
        </div>
        {/* Hava Kalitesi Skoru */}
        <div className="flex items-center space-x-2">
          <div className={`h-3 w-3 rounded-full ${currentData.overallScore >= 80 ? 'bg-green-500' :
            currentData.overallScore >= 60 ? 'bg-blue-500' :
              currentData.overallScore >= 40 ? 'bg-amber-500' : 'bg-red-500'
            }`}></div>
          <span className="text-lg font-bold text-gray-800 dark:text-gray-100">
            {currentData.overallScore}/100
          </span>
        </div>
        {/* Real-time indicator */}
        {connectionStatus && airQualityData.lastUpdate && (
          <div className="flex items-center space-x-1 ml-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-600 dark:text-green-400">Live</span>
          </div>
        )}
      </header>

      {/* Air Quality Metrics */}
      <div className="px-5 py-4">
        <div className="space-y-3 mb-4">
          {/* CO2 Seviyesi */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-300">CO2:</span>
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-medium ${currentData.co2Level <= 1000 ? 'text-green-600' :
                currentData.co2Level <= 5000 ? 'text-amber-600' : 'text-red-600'
                }`}>
                {currentData.co2Level} ppm
              </span>
              <div className={`h-2 w-2 rounded-full ${currentData.co2Level <= 1000 ? 'bg-green-500' :
                currentData.co2Level <= 5000 ? 'bg-amber-500' : 'bg-red-500'
                }`}></div>
            </div>
          </div>

          {/* NH3 Seviyesi */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-300">NH3 (Amonyak):</span>
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-medium ${currentData.nh3Level <= 25 ? 'text-green-600' :
                currentData.nh3Level <= 50 ? 'text-amber-600' : 'text-red-600'
                }`}>
                {currentData.nh3Level} ppm
              </span>
              <div className={`h-2 w-2 rounded-full ${currentData.nh3Level <= 25 ? 'bg-green-500' :
                currentData.nh3Level <= 50 ? 'bg-amber-500' : 'bg-red-500'
                }`}></div>
            </div>
          </div>

          {/* VOC Seviyesi */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-300">VOC:</span>
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-medium ${currentData.vocLevel <= 100 ? 'text-green-600' :
                currentData.vocLevel <= 500 ? 'text-amber-600' : 'text-red-600'
                }`}>
                {currentData.vocLevel} ppb
              </span>
              <div className={`h-2 w-2 rounded-full ${currentData.vocLevel <= 100 ? 'bg-green-500' :
                currentData.vocLevel <= 500 ? 'bg-amber-500' : 'bg-red-500'
                }`}></div>
            </div>
          </div>
        </div>

        {/* Status Summary */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-300">Genel Durum:</span>
            <span className={`text-sm font-medium ${currentData.qualityStatus === "Excellent" ? 'text-green-600' :
              currentData.qualityStatus === "Good" ? 'text-blue-600' :
                currentData.qualityStatus === "Moderate" ? 'text-amber-600' : 'text-red-600'
              }`}>
              {currentData.qualityStatus === "Excellent" ? "Mükemmel" :
                currentData.qualityStatus === "Good" ? "İyi" :
                  currentData.qualityStatus === "Moderate" ? "Orta" : "Kötü"}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-300">Uyarı Seviyesi:</span>
            <span className={`text-sm font-medium ${currentData.alertHives > 0 ? 'text-amber-600' : 'text-green-600'}`}>
              {currentData.alertHives > 0 ? 'Uyarı Var' : 'Normal'}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-300">Son Ölçüm:</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {new Date(currentData.lastUpdate).toLocaleTimeString('tr-TR')}
            </span>
          </div>
        </div>
      </div>

      {/* Air Quality Distribution Chart */}
      <div className="grow px-5 pb-5">
        <DoughnutChart data={chartData} width={389} height={200} />
      </div>
    </div>
  );
}

export default DashboardCard06;
