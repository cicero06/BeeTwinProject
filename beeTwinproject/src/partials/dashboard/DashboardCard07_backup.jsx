import React from 'react';

/**
 * DashboardCard07 - LoRa Ağ Durumu
 * 
 * Bu bileşen, dijital ikiz temelli akıllı arı kovanı izleme sisteminin 
 * LoRa ağ altyapısını izleyen katmanını oluşturmaktadır.
 * 
 * Özellikler:
 * - LoRa gateway bağlantı durumu
 * - Sinyal gücü ve kalite analizi
 * - Veri iletim başarı oranları
 * - Ağ topolojisi görselleştirmesi
 * 
 * Akademik Katkı: Dijital ikiz sisteminin iletişim altyapısı 
 * ve "bağlantı yönetimi" işlevinin LoRa ağ parametresi bileşeni.
 */

function DashboardCard07() {

  // Dijital ikiz sistemi için LoRa ağ durumu verileri
  // Gerçek uygulamada bu veriler LoRa gateway'lerinden ve ChirpStack'den gelecek
  const loraNetworkData = [
    {
      id: 1,
      gatewayId: "GW-001",
      gatewayName: "Ana Gateway",
      location: "Merkez Lokasyon",
      status: "online",
      signalStrength: -67, // dBm
      connectedDevices: 8,
      dataRate: "SF7BW125",
      lastSeen: "2 dk önce",
      uptime: "99.2%"
    },
    {
      id: 2,
      gatewayId: "GW-002",
      gatewayName: "Kuzey Gateway",
      location: "Kuzey Sektör",
      status: "online",
      signalStrength: -72,
      connectedDevices: 6,
      dataRate: "SF8BW125",
      lastSeen: "1 dk önce",
      uptime: "98.7%"
    },
    {
      id: 3,
      gatewayId: "GW-003",
      gatewayName: "Güney Gateway",
      location: "Güney Sektör",
      status: "warning",
      signalStrength: -89,
      connectedDevices: 4,
      dataRate: "SF9BW125",
      lastSeen: "15 dk önce",
      uptime: "95.1%"
    },
    {
      id: 4,
      gatewayId: "GW-004",
      gatewayName: "Doğu Gateway",
      location: "Doğu Sektör",
      status: "offline",
      signalStrength: null,
      connectedDevices: 0,
      dataRate: null,
      lastSeen: "2 saat önce",
      uptime: "87.3%"
    }
  ];

  // Sinyal gücü renk kodlaması
  const getSignalColor = (rssi) => {
    if (!rssi) return 'text-gray-400';
    if (rssi >= -70) return 'text-green-600';
    if (rssi >= -80) return 'text-amber-600';
    return 'text-red-600';
  };

  // Status renk kodlaması
  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'warning': return 'bg-amber-500';
      case 'offline': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'online': return 'Çevrimiçi';
      case 'warning': return 'Uyarı';
      case 'offline': return 'Çevrimdışı';
      default: return 'Bilinmiyor';
    }
  };

  return (
    <div className="col-span-full xl:col-span-8 bg-white dark:bg-gray-800 shadow-xs rounded-xl border border-amber-200 dark:border-gray-700">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              LoRa Ağ Durumu
            </h2>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Gateway Bağlantı Analizi
            </div>
          </div>
          {/* Genel Ağ Durumu */}
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Aktif Gateway: <span className="font-medium text-green-600">2/4</span>
            </div>
            <div className="h-3 w-3 bg-amber-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </header>
      <div className="p-3">
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="table-auto w-full dark:text-gray-300">
            {/* Table header */}
            <thead className="text-xs uppercase text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700/50 rounded-xs">
              <tr>
                <th className="p-2">
                  <div className="font-semibold text-left">Gateway</div>
                </th>
                <th className="p-2">
                  <div className="font-semibold text-center">Durum</div>
                </th>
                <th className="p-2">
                  <div className="font-semibold text-center">Sinyal (dBm)</div>
                </th>
                <th className="p-2">
                  <div className="font-semibold text-center">Bağlı Cihaz</div>
                </th>
                <th className="p-2">
                  <div className="font-semibold text-center">Veri Hızı</div>
                </th>
                <th className="p-2">
                  <div className="font-semibold text-center">Çalışma Süresi</div>
                </th>
              </tr>
            </thead>
            {/* Table body */}
            <tbody className="text-sm font-medium divide-y divide-gray-100 dark:divide-gray-700/60">
              {loraNetworkData.map((gateway) => (
                <tr key={gateway.id}>
                  <td className="p-2">
                    <div className="flex items-center">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 mr-3">
                        <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0A9.972 9.972 0 0119 12a9.972 9.972 0 01-1.929 5.657 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 12c0-1.594-.471-3.078-1.343-4.243a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-gray-800 dark:text-gray-100 font-medium">{gateway.gatewayName}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{gateway.gatewayId}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{gateway.location}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-2">
                    <div className="flex items-center justify-center">
                      <div className="flex items-center space-x-2">
                        <div className={`h-2 w-2 rounded-full ${getStatusColor(gateway.status)}`}></div>
                        <span className="text-xs">{getStatusText(gateway.status)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-2">
                    <div className={`text-center font-medium ${getSignalColor(gateway.signalStrength)}`}>
                      {gateway.signalStrength ? `${gateway.signalStrength} dBm` : 'N/A'}
                    </div>
                  </td>
                  <td className="p-2">
                    <div className="text-center">
                      <span className={`${gateway.connectedDevices > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                        {gateway.connectedDevices}
                      </span>
                    </div>
                  </td>
                  <td className="p-2">
                    <div className="text-center text-xs">
                      {gateway.dataRate || 'N/A'}
                    </div>
                  </td>
                  <td className="p-2">
                    <div className="text-center">
                      <span className={`text-xs ${parseFloat(gateway.uptime) >= 98 ? 'text-green-600' :
                          parseFloat(gateway.uptime) >= 95 ? 'text-amber-600' : 'text-red-600'
                        }`}>
                        {gateway.uptime}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer İstatistikleri */}
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/60">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-gray-800 dark:text-gray-100">18</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Toplam Cihaz</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">97.2%</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Ortalama Uptime</div>
            </div>
            <div>
              <div className="text-lg font-bold text-amber-600">-74 dBm</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Ortalama RSSI</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">SF8</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Optimal SF</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardCard07;
