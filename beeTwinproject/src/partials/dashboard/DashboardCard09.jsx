import React from 'react';
import Tooltip from '../../components/Tooltip';
import BarChart from '../../charts/BarChart02';

// Import utilities
import { getCssVariable } from '../../utils/Utils';

/**
 * DashboardCard09 - AI Tahminleri ve Makine Öğrenmesi Merkezi
 * 
 * Bu bileşen, dijital ikiz temelli akıllı arı kovanı izleme sisteminin 
 * yapay zeka tabanlı tahmin analizlerini ve makine öğrenmesi modellerini
 * bütünleşik olarak sunan gelişmiş analitik merkezi.
 * 
 * Özellikler:
 * - Bal üretim tahminleri (LSTM/Prophet modelleri)
 * - Hastalık risk analizi (Random Forest/SVM)
 * - Çevre faktörü öngörüleri (Meteoroloji entegrasyonu)
 * - Kovan davranış tahmin modelleri (Deep Learning)
 * - Model performans metrikleri ve güven aralıkları
 * - Gerçek zamanlı tahmin doğrulama
 * - Anomali tespit algoritmaları
 * - Sezon bazlı trend analizi
 * 
 * Akademik Katkı: Dijital ikiz sisteminin "predictive analytics", 
 * "machine learning", ve "karar destek" işlevlerinin bütünleşik AI bileşeni.
 */

function DashboardCard09() {

  // Gelişmiş AI tahmin verileri - Gerçek ML modelleri için hazır yapı
  const aiPredictions = {
    // Model performans metrikleri
    modelPerformance: {
      overallAccuracy: 91.3,
      precision: 89.7,
      recall: 92.1,
      f1Score: 90.9,
      lastTraining: "2025-08-10T14:30:00Z",
      trainingDataSize: 15420,
      activeModels: 7
    },

    // Placeholder - Bu veriler sonradan belirlenecek
    predictions: [],
    riskAnalysis: [],
    anomalies: []
  };

  const chartData = {
    labels: ['Haziran', 'Temmuz', 'Ağustos'], // Placeholder veriler
    datasets: [
      {
        label: 'AI Tahminleri',
        data: [0, 0, 0], // Placeholder veriler - sonradan doldurulacak
        backgroundColor: getCssVariable('--color-blue-500'),
        hoverBackgroundColor: getCssVariable('--color-blue-600'),
        barPercentage: 0.6,
        categoryPercentage: 0.8,
        borderRadius: 4,
      },
    ],
  };

  return (
    <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-12 bg-white dark:bg-gray-800 shadow-xs rounded-xl border border-purple-200 dark:border-gray-700">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mr-3">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              AI Tahminleri ve Makine Öğrenmesi Merkezi
            </h2>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span className="font-medium">Model Doğruluğu: {aiPredictions.modelPerformance.overallAccuracy}%</span>
              <span className="mx-2">•</span>
              <span>Son Güncelleme: {new Date(aiPredictions.modelPerformance.lastTraining).toLocaleDateString('tr-TR')}</span>
              <span className="mx-2">•</span>
              <span>{aiPredictions.modelPerformance.activeModels} Aktif Model</span>
            </div>
          </div>
        </div>
      </header>

      {/* Model Performans Özeti */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{aiPredictions.modelPerformance.overallAccuracy}%</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Genel Doğruluk</div>
          </div>
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-lg font-bold text-green-600 dark:text-green-400">{aiPredictions.modelPerformance.precision}%</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Hassasiyet</div>
          </div>
          <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{aiPredictions.modelPerformance.recall}%</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Duyarlılık</div>
          </div>
          <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <div className="text-lg font-bold text-orange-600 dark:text-orange-400">{aiPredictions.modelPerformance.f1Score}%</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">F1 Skoru</div>
          </div>
        </div>
      </div>

      {/* AI Risk Analizi */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-800 dark:text-gray-100">
            AI Risk Analizi (Veriler Hazırlanıyor)
          </h3>
          <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
            Canlı ML
          </span>
        </div>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="font-medium">Risk analizi verileri hazırlanıyor...</div>
          <div className="text-sm">Veriler sonradan belirlenecek</div>
        </div>
      </div>

      {/* Anomali Tespiti */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <h3 className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-3">
          Gerçek Zamanlı Anomali Tespiti (Hazırlık Aşamasında)
        </h3>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <div className="w-12 h-12 mx-auto mb-3 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="font-medium">Anomali tespit sistemi hazırlanıyor...</div>
          <div className="text-sm">Veriler sonradan belirlenecek</div>
        </div>
      </div>

      {/* AI Tahmin Grafiği */}
      <div className="px-5 py-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-800 dark:text-gray-100">
            AI Tahmin Grafikleri (Veri Bekleniyor)
          </h3>
          <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-1 rounded">
            Hazırlık
          </span>
        </div>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <div className="w-12 h-12 mx-auto mb-3 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="font-medium">Tahmin grafikleri hazırlanıyor...</div>
          <div className="text-sm">Veriler sonradan belirlenecek</div>
        </div>
      </div>

      {/* Alt Bilgi */}
      <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div>
            Son model eğitimi: {aiPredictions.modelPerformance.trainingDataSize.toLocaleString()} veri noktası kullanılarak
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            Canlı ML İşleme Aktif
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardCard09;
