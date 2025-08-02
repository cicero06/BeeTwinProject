import React from 'react';

/**
 * DashboardCard13 - Sistem Durumu ve Raporlama
 * 
 * Bu bileşen, dijital ikiz temelli akıllı arı kovanı izleme sisteminin 
 * genel durumunu özetleyen ve raporlama işlevini sunan katmanını oluşturmaktadır.
 * 
 * Özellikler:
 * - Sistem geneli sağlık durumu
 * - Akademik araştırma metrikleri
 * - Veri kalitesi ve güvenilirlik indeksleri
 * - Performans benchmarkları
 * 
 * Akademik Katkı: Dijital ikiz sisteminin global overview
 * ve "sistem analizi" işlevinin özet parametresi bileşeni.
 */

function DashboardCard13() {

  // Dijital ikiz sistemi genel durum verileri
  // Gerçek uygulamada bu veriler sistem geneli metriklerden gelecek
  const systemMetrics = [
    {
      category: "Operasyonel",
      metrics: [
        { name: "Sistem Çalışma Süresi", value: "99.7%", status: "excellent", trend: "+0.2%" },
        { name: "Veri Akış Kalitesi", value: "98.4%", status: "excellent", trend: "+1.1%" },
        { name: "Sensör Doğruluğu", value: "97.8%", status: "good", trend: "-0.3%" },
        { name: "Ağ Bağlantı Kalitesi", value: "96.2%", status: "good", trend: "+0.8%" }
      ]
    },
    {
      category: "Akademik",
      metrics: [
        { name: "Veri Toplama Sürekliliği", value: "99.1%", status: "excellent", trend: "+0.5%" },
        { name: "Araştırma Veri Kalitesi", value: "95.7%", status: "good", trend: "+2.1%" },
        { name: "Digital Twin Senkronizasyonu", value: "94.3%", status: "good", trend: "+1.3%" },
        { name: "ML Model Doğruluğu", value: "89.6%", status: "moderate", trend: "+3.2%" }
      ]
    },
    {
      category: "Üretkenlik",
      metrics: [
        { name: "Bal Üretim Verimliliği", value: "112%", status: "excellent", trend: "+8.2%" },
        { name: "Kovan Sağlık İndeksi", value: "91.4%", status: "good", trend: "+2.7%" },
        { name: "Bakım Optimizasyonu", value: "87.9%", status: "moderate", trend: "+4.1%" },
        { name: "Enerji Verimliliği", value: "93.2%", status: "good", trend: "+1.9%" }
      ]
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'moderate': return 'text-amber-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'excellent': return '🟢';
      case 'good': return '🔵';
      case 'moderate': return '🟡';
      case 'poor': return '🔴';
      default: return '⚪';
    }
  };

  const getTrendIcon = (trend) => {
    const isPositive = trend.startsWith('+');
    return isPositive ? '📈' : '📉';
  };

  return (
    <div className="col-span-full bg-white dark:bg-gray-800 shadow-xs rounded-xl border border-gray-200 dark:border-gray-700">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Sistem Durum Raporu
            </h2>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Akademik Araştırma ve Operasyonel Metrikler
            </div>
          </div>
          {/* Genel Durum Göstergesi */}
          <div className="flex items-center space-x-2">
            <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-600">Sistem Aktif</span>
          </div>
        </div>
      </header>

      <div className="p-3">
        {/* Kategori Bazlı Metrikler */}
        {systemMetrics.map((category, categoryIndex) => (
          <div key={categoryIndex} className="mb-4">
            <header className="text-xs uppercase text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700/50 rounded-xs font-semibold p-2 mb-2">
              {category.category} Performans
            </header>

            <div className="space-y-2">
              {category.metrics.map((metric, metricIndex) => (
                <div key={metricIndex} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700/60 last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">
                      {getStatusIcon(metric.status)}
                    </span>
                    <div>
                      <div className="text-sm font-medium text-gray-800 dark:text-gray-100">
                        {metric.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-1">
                        <span>{getTrendIcon(metric.trend)}</span>
                        <span>{metric.trend} son hafta</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${getStatusColor(metric.status)}`}>
                      {metric.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Sistem Özet Bilgileri */}
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/60">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-gray-800 dark:text-gray-100">24/7</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">İzleme Aktif</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">8</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Aktif Kovan</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">156 GB</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Toplam Veri</div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-600">37 Gün</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Aktif Süre</div>
            </div>
          </div>

          {/* Son Güncelleme */}
          <div className="text-center mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/60">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Son güncelleme: {new Date().toLocaleString('tr-TR')} • BeeTwin Dijital İkiz Sistemi
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardCard13;
