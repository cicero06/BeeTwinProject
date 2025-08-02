import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import LineChart from '../../charts/LineChart01';
import { chartAreaGradient } from '../../charts/ChartjsConfig';
import EditMenu from '../../components/DropdownEditMenu';
import { useAuth } from '../../contexts/AuthContext';

// Import utilities
import { adjustColorOpacity, getCssVariable } from '../../utils/Utils';

/**
 * DashboardCard02 - Kritik Uyarılar
 * 
 * Bu bileşen, dijital ikiz temelli akıllı arı kovanı izleme sisteminin 
 * kritik alarm ve uyarı yönetim katmanını oluşturmaktadır.
 * 
 * Özellikler:
 * - Acil müdahale gerektiren durumlar
 * - Kritik alarm sayısı ve türleri
 * - Son 24 saat uyarı geçmişi
 * - Öncelik bazlı alarm kategorileri
 * 
 * Akademik Katkı: Dijital ikiz sisteminin "karar destek" 
 * işlevini destekleyen kritik durum analiz bileşeni.
 */

function DashboardCard02() {
  const { user, hives, apiaries } = useAuth();
  const [alertData, setAlertData] = useState({
    criticalAlerts: 0,
    warningAlerts: 0,
    infoAlerts: 0,
    totalAlerts: 0,
    recentAlerts: [],
    networkStatus: "Normal"
  });

  // Generate dynamic alerts based on user's hives
  useEffect(() => {
    if (hives && hives.length > 0) {
      const alerts = [];
      let criticalCount = 0;
      let warningCount = 0;
      let infoCount = 0;

      hives.forEach((hive, index) => {
        // Simulated alerts based on hive data
        if (hive.sensor && !hive.sensor.isConnected) {
          alerts.push({
            id: alerts.length + 1,
            type: "critical",
            message: `${hive.name}: Sensör bağlantısı kesildi`,
            time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
            hiveId: hive._id
          });
          criticalCount++;
        }

        // Random temperature warning for demonstration
        if (Math.random() > 0.7) {
          alerts.push({
            id: alerts.length + 1,
            type: "warning",
            message: `${hive.name}: Sıcaklık kontrolü gerekli`,
            time: new Date(Date.now() - Math.random() * 3600000).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
            hiveId: hive._id
          });
          warningCount++;
        }

        // Info alerts for recent activity
        if (index < 3) {
          alerts.push({
            id: alerts.length + 1,
            type: "info",
            message: `${hive.name}: Son veri alımı başarılı`,
            time: new Date(Date.now() - Math.random() * 1800000).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
            hiveId: hive._id
          });
          infoCount++;
        }
      });

      setAlertData({
        criticalAlerts: criticalCount,
        warningAlerts: warningCount,
        infoAlerts: infoCount,
        totalAlerts: alerts.length,
        recentAlerts: alerts.slice(0, 5), // Show only latest 5
        networkStatus: criticalCount > 0 ? "Uyarı" : "Normal"
      });
    }
  }, [hives]);

  // Default alert data when no user data is available
  const defaultAlertData = {
    criticalAlerts: 3,
    warningAlerts: 7,
    infoAlerts: 12,
    totalAlerts: 22,
    recentAlerts: [
      { id: 1, type: "critical", message: "Kovan-DT-003: Yüksek sıcaklık (38.1°C)", time: "10:28", hiveId: "DT-003" },
      { id: 2, type: "warning", message: "Kovan-DT-007: Düşük ağırlık tespit edildi", time: "09:45", hiveId: "DT-007" },
      { id: 3, type: "critical", message: "Kovan-DT-012: Sensör bağlantısı kesildi", time: "08:33", hiveId: "DT-012" },
    ],
    networkStatus: "Normal"
  };

  // Use user-specific data if available, otherwise use default
  const currentAlertData = user && hives && hives.length > 0 ? alertData : defaultAlertData;

  const chartData = {
    labels: [
      '12-01-2022', '01-01-2023', '02-01-2023',
      '03-01-2023', '04-01-2023', '05-01-2023',
      '06-01-2023', '07-01-2023', '08-01-2023',
      '09-01-2023', '10-01-2023', '11-01-2023',
      '12-01-2023', '01-01-2024', '02-01-2024',
      '03-01-2024', '04-01-2024', '05-01-2024',
      '06-01-2024', '07-01-2024', '08-01-2024',
      '09-01-2024', '10-01-2024', '11-01-2024',
      '12-01-2024', '01-01-2025',
    ],
    datasets: [
      // Indigo line
      {
        data: [
          622, 622, 426, 471, 365, 365, 238,
          324, 288, 206, 324, 324, 500, 409,
          409, 273, 232, 273, 500, 570, 767,
          808, 685, 767, 685, 685,
        ],
        fill: true,
        backgroundColor: function (context) {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          return chartAreaGradient(ctx, chartArea, [
            { stop: 0, color: adjustColorOpacity(getCssVariable('--color-violet-500'), 0) },
            { stop: 1, color: adjustColorOpacity(getCssVariable('--color-violet-500'), 0.2) }
          ]);
        },
        borderColor: getCssVariable('--color-violet-500'),
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 3,
        pointBackgroundColor: getCssVariable('--color-violet-500'),
        pointHoverBackgroundColor: getCssVariable('--color-violet-500'),
        pointBorderWidth: 0,
        pointHoverBorderWidth: 0,
        clip: 20,
        tension: 0.2,
      },
      // Gray line
      {
        data: [
          732, 610, 610, 504, 504, 504, 349,
          349, 504, 342, 504, 610, 391, 192,
          154, 273, 191, 191, 126, 263, 349,
          252, 423, 622, 470, 532,
        ],
        borderColor: adjustColorOpacity(getCssVariable('--color-gray-500'), 0.25),
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 3,
        pointBackgroundColor: adjustColorOpacity(getCssVariable('--color-gray-500'), 0.25),
        pointHoverBackgroundColor: adjustColorOpacity(getCssVariable('--color-gray-500'), 0.25),
        pointBorderWidth: 0,
        pointHoverBorderWidth: 0,
        clip: 20,
        tension: 0.2,
      },
    ],
  };

  return (
    <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-xs rounded-xl border border-red-200 dark:border-gray-700">
      {/* Header - Kritik Uyarılar Başlığı */}
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Kritik Uyarılar
          </h2>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Acil Müdahale Gerekli
          </div>
        </div>
        {/* Durum Göstergesi */}
        <div className="flex items-center space-x-2">
          <div className={`h-3 w-3 rounded-full ${alertData.criticalAlerts > 0 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
            {currentAlertData.criticalAlerts > 0 ? 'Kritik' : 'Normal'}
          </span>
        </div>
      </header>

      {/* Alert Statistics */}
      <div className="px-5 py-4">
        <div className="grid grid-cols-3 gap-4 mb-4">
          {/* Kritik Uyarılar */}
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {currentAlertData.criticalAlerts}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Kritik
            </div>
          </div>

          {/* Uyarı Seviyesi */}
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {currentAlertData.warningAlerts}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Uyarı
            </div>
          </div>

          {/* Bilgi Seviyesi */}
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {currentAlertData.infoAlerts}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Bilgi
            </div>
          </div>
        </div>

        {/* Son Uyarılar */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Son Uyarılar:
          </h4>
          {currentAlertData.recentAlerts.map(alert => (
            <div key={alert.id} className="flex items-start justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex-1">
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mb-1 ${alert.type === 'critical' ? 'bg-red-100 text-red-800' :
                  alert.type === 'warning' ? 'bg-amber-100 text-amber-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                  {alert.type === 'critical' ? 'KRİTİK' : alert.type === 'warning' ? 'UYARI' : 'BİLGİ'}
                </div>
                <div className="text-sm text-gray-800 dark:text-gray-200">
                  {alert.message}
                </div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                {alert.time}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DashboardCard02;
