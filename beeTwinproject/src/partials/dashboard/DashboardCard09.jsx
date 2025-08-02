import React from 'react';
import Tooltip from '../../components/Tooltip';
import BarChart from '../../charts/BarChart02';

// Import utilities
import { getCssVariable } from '../../utils/Utils';

/**
 * DashboardCard09 - AI Tahminleri
 * 
 * Bu bileşen, dijital ikiz temelli akıllı arı kovanı izleme sisteminin 
 * yapay zeka tabanlı tahmin analizlerini sunan katmanını oluşturmaktadır.
 * 
 * Özellikler:
 * - Bal üretim tahminleri
 * - Hastalık risk analizi
 * - Çevre faktörü öngörüleri
 * - Kovan davranış tahmin modelleri
 * 
 * Akademik Katkı: Dijital ikiz sisteminin machine learning
 * ve "tahmin analizi" işlevinin yapay zeka parametresi bileşeni.
 */

function DashboardCard09() {

  // Dijital ikiz sistemi için AI tahmin verileri
  // Gerçek uygulamada bu veriler ML algoritmaları ve TensorFlow.js'ten gelecek
  const aiPredictions = {
    honeyProduction: {
      labels: ['Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz'],
      predicted: [3.2, 5.8, 12.4, 18.7, 25.3, 31.2], // kg
      actual: [3.1, 5.9, 12.1, 18.2, null, null], // kg (son 2 ay henüz gerçekleşmedi)
      confidence: [92, 89, 94, 91, 87, 83] // % güven aralığı
    },
    riskAnalysis: [
      {
        riskType: "Varroa Akarı",
        probability: 23, // %
        severity: "Orta",
        prediction: "15 gün içinde",
        preventiveAction: "Akarya kontrolü önerilir"
      },
      {
        riskType: "Kraliçe Kaybı",
        probability: 8, // %
        severity: "Yüksek",
        prediction: "30 gün içinde",
        preventiveAction: "Kraliçe kontrolü yapılmalı"
      },
      {
        riskType: "Sıcaklık Stresi",
        probability: 67, // %
        severity: "Düşük",
        prediction: "7 gün içinde",
        preventiveAction: "Havalandırma artırılmalı"
      }
    ]
  };

  const chartData = {
    labels: aiPredictions.honeyProduction.labels,
    datasets: [
      // Tahmin Edilen Üretim
      {
        label: 'Tahmin Edilen (kg)',
        data: aiPredictions.honeyProduction.predicted,
        backgroundColor: getCssVariable('--color-blue-500'),
        hoverBackgroundColor: getCssVariable('--color-blue-600'),
        barPercentage: 0.6,
        categoryPercentage: 0.8,
        borderRadius: 4,
      },
      // Gerçekleşen Üretim
      {
        label: 'Gerçekleşen (kg)',
        data: aiPredictions.honeyProduction.actual,
        backgroundColor: getCssVariable('--color-amber-500'),
        hoverBackgroundColor: getCssVariable('--color-amber-600'),
        barPercentage: 0.6,
        categoryPercentage: 0.8,
        borderRadius: 4,
      },
    ],
  };

  return (
    <div className="flex flex-col col-span-full sm:col-span-6 bg-white dark:bg-gray-800 shadow-xs rounded-xl border border-purple-200 dark:border-gray-700">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60 flex items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            AI Tahminleri
          </h2>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Yapay Zeka Tabanlı Öngörüler
          </div>
        </div>
        <Tooltip className="ml-2" size="lg">
          <div className="text-sm">
            Machine Learning algoritmaları ile kovan performansı ve risk analizi tahminleri.
          </div>
        </Tooltip>
      </header>

      {/* AI Risk Analizi */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <h3 className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-3">
          Risk Tahmin Analizi
        </h3>
        <div className="space-y-3">
          {aiPredictions.riskAnalysis.map((risk, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`h-3 w-3 rounded-full ${risk.severity === "Yüksek" ? 'bg-red-500' :
                    risk.severity === "Orta" ? 'bg-amber-500' : 'bg-green-500'
                  }`}></div>
                <div>
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-100">
                    {risk.riskType}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {risk.prediction} • {risk.preventiveAction}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-bold ${risk.probability >= 50 ? 'text-red-600' :
                    risk.probability >= 30 ? 'text-amber-600' : 'text-green-600'
                  }`}>
                  %{risk.probability}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {risk.severity} Risk
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bal Üretim Tahmin Grafiği */}
      <div className="px-5 py-3">
        <h3 className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">
          Bal Üretim Tahminleri (kg)
        </h3>
        <div className="flex items-center space-x-4 mb-3">
          <div className="flex items-center space-x-2">
            <div className="h-3 w-3 bg-blue-500 rounded"></div>
            <span className="text-xs text-gray-600 dark:text-gray-300">Tahmin</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-3 w-3 bg-amber-500 rounded"></div>
            <span className="text-xs text-gray-600 dark:text-gray-300">Gerçekleşen</span>
          </div>
        </div>
      </div>

      {/* Chart built with Chart.js 3 */}
      <div className="grow">
        <BarChart data={chartData} width={595} height={248} />
      </div>
    </div>
  );
}

export default DashboardCard09;
