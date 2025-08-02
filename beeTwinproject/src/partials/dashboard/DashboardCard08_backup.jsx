import React from 'react';
import { chartAreaGradient } from '../../charts/ChartjsConfig';
import LineChart from '../../charts/LineChart02';

// Import utilities
import { adjustColorOpacity, getCssVariable } from '../../utils/Utils';

/**
 * DashboardCard08 - Günlük Aktivite Özeti
 * 
 * Bu bileşen, dijital ikiz temelli akıllı arı kovanı izleme sisteminin 
 * günlük aktivite analizini sunan katmanını oluşturmaktadır.
 * 
 * Özellikler:
 * - Arı trafiği ve giriş-çıkış analizleri
 * - Günlük aktivite trendleri
 * - Petek yapım ve bal üretim aktiviteleri
 * - Sezonsal davranış kalıpları
 * 
 * Akademik Katkı: Dijital ikiz sisteminin davranışsal analiz
 * ve "aktivite izleme" işlevinin günlük faaliyet parametresi bileşeni.
 */

function DashboardCard08() {

  // Dijital ikiz sistemi için günlük aktivite verileri
  // Gerçek uygulamada bu veriler PIR sensörleri ve optik sayaçlardan gelecek
  const activityData = {
    labels: [
      '06:00', '08:00', '10:00', '12:00', '14:00',
      '16:00', '18:00', '20:00', '22:00', '00:00',
      '02:00', '04:00'
    ],
    datasets: [
      // Arı Trafiği (Giriş-Çıkış)
      {
        label: 'Arı Trafiği (Adet/Saat)',
        data: [45, 128, 267, 334, 298, 256, 189, 67, 23, 8, 3, 12],
        borderColor: getCssVariable('--color-amber-500'),
        backgroundColor: function (context) {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) {
            return null;
          }
          return chartAreaGradient(ctx, chartArea, [
            { stop: 0, color: adjustColorOpacity(getCssVariable('--color-amber-500'), 0) },
            { stop: 1, color: adjustColorOpacity(getCssVariable('--color-amber-500'), 0.2) }
          ]);
        },
        fill: true,
        borderWidth: 2,
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointBackgroundColor: getCssVariable('--color-amber-500'),
        pointHoverBackgroundColor: getCssVariable('--color-amber-500'),
        pointBorderWidth: 0,
        pointHoverBorderWidth: 0,
      },
      // Petek Aktivitesi
      {
        label: 'Petek Aktivitesi (%)',
        data: [15, 35, 78, 89, 92, 87, 65, 34, 18, 8, 5, 8],
        backgroundColor: function (context) {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) {
            return null;
          }
          return chartAreaGradient(ctx, chartArea, [
            { stop: 0, color: adjustColorOpacity(getCssVariable('--color-blue-500'), 0) },
            { stop: 1, color: adjustColorOpacity(getCssVariable('--color-blue-500'), 0.1) }
          ]);
        },
        fill: true,
        borderWidth: 2,
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointBackgroundColor: getCssVariable('--color-blue-500'),
        pointHoverBackgroundColor: getCssVariable('--color-blue-500'),
        pointBorderWidth: 0,
        pointHoverBorderWidth: 0,
      },
      // Bal Üretim Aktivitesi
      {
        label: 'Bal Üretim Aktivitesi (%)',
        data: [8, 12, 45, 67, 78, 82, 76, 45, 23, 12, 8, 6],
        borderColor: getCssVariable('--color-green-500'),
        fill: false,
        borderWidth: 2,
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointBackgroundColor: getCssVariable('--color-green-500'),
        pointHoverBackgroundColor: getCssVariable('--color-green-500'),
        pointBorderWidth: 0,
        pointHoverBorderWidth: 0,
      },
    ],
  };

  // Günlük aktivite özet verileri
  const dailySummary = {
    totalBeeTraffic: 1630, // Toplam arı trafiği
    peakActivity: "14:00", // En yoğun saat
    activeHives: 8, // Aktif kovan sayısı
    averageActivity: 78, // Ortalama aktivite %
    lastUpdate: "2025-07-14T15:30:00Z"
  };

  return (
    <div className="flex flex-col col-span-full bg-white dark:bg-gray-800 shadow-xs rounded-xl border border-blue-200 dark:border-gray-700">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Günlük Aktivite Özeti
          </h2>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Saatlik Arı Trafiği ve Aktivite Analizi
          </div>
        </div>
        {/* Günlük Özet Bilgileri */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-amber-600">{dailySummary.totalBeeTraffic}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Toplam Trafik</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-600">{dailySummary.averageActivity}%</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Ortalama Aktivite</div>
          </div>
        </div>
      </header>

      {/* Aktivite Metrik Kartları */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-600">{dailySummary.totalBeeTraffic}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Günlük Arı Trafiği</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Giriş-Çıkış Toplamı</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{dailySummary.peakActivity}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">En Yoğun Saat</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Maksimum Aktivite</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{dailySummary.activeHives}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Aktif Kovan</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Canlı Aktivite</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{dailySummary.averageActivity}%</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Ortalama Aktivite</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Günlük Performans</div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <LineChart data={activityData} width={800} height={300} />
    </div>
  );
}

export default DashboardCard08;
