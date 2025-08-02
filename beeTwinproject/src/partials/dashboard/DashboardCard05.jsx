import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import LineChart from '../../charts/LineChart01';
import { chartAreaGradient } from '../../charts/ChartjsConfig';
import EditMenu from '../../components/DropdownEditMenu';
import useRealTimeData from '../../hooks/useRealTimeData';
import { useAuth } from '../../contexts/AuthContext';
import { adjustColorOpacity, getCssVariable } from '../../utils/Utils';

/**
 * DashboardCard05 - Ağırlık Sensörü (Temizlenmiş Versiyon)
 */
function DashboardCard05() {
  const { user, hives } = useAuth();
  const { sensorData: realTimeSensorData, connectionStatus } = useRealTimeData();

  const [loading, setLoading] = useState(true);
  const [weightStats, setWeightStats] = useState({
    currentWeight: 0,
    trend: 0,
    lastUpdate: null
  });

  // Ağırlık verilerini işle
  useEffect(() => {
    if (!user || !realTimeSensorData || realTimeSensorData.length === 0) {
      setLoading(false);
      return;
    }

    console.log('🏋️ Processing weight data for user:', user.email);

    // Kullanıcının Router ID'lerini bul
    const userRouterIds = hives?.map(hive => hive.sensor?.routerId).filter(Boolean) || [];
    console.log('📍 User Router IDs:', userRouterIds);

    // Ağırlık verilerini filtrele
    let weightData = [];

    if (userRouterIds.length > 0) {
      // Kullanıcının Router ID'leriyle eşleşen verileri bul
      weightData = realTimeSensorData.filter(data => {
        const dataRouterId = data.routerId || data.router_id || data.deviceId || data.device_id;
        return userRouterIds.includes(dataRouterId);
      });
    } else {
      // Geçici: Router 109 ağırlık verilerini kullan
      weightData = realTimeSensorData.filter(data => {
        const dataRouterId = data.routerId || data.router_id || data.deviceId || data.device_id;
        return dataRouterId === "109" || dataRouterId === 109;
      });
    }

    console.log('⚖️ Found weight data:', weightData.length, 'records');

    if (weightData.length > 0) {
      // En son ağırlık değeri
      const latestData = weightData[weightData.length - 1];
      const currentWeight = latestData.weight || latestData.parameters?.weight || 0;

      // Basit trend hesaplaması (son 2 veri)
      let trend = 0;
      if (weightData.length >= 2) {
        const previousData = weightData[weightData.length - 2];
        const previousWeight = previousData.weight || previousData.parameters?.weight || 0;
        trend = currentWeight - previousWeight;
      }

      setWeightStats({
        currentWeight: Number(currentWeight).toFixed(1),
        trend: Number(trend).toFixed(2),
        lastUpdate: latestData.timestamp || new Date().toISOString()
      });

      console.log('✅ Weight stats updated:', { currentWeight, trend });
    } else {
      console.log('❌ No weight data found');
      setWeightStats({
        currentWeight: 0,
        trend: 0,
        lastUpdate: null
      });
    }

    setLoading(false);
  }, [user, hives, realTimeSensorData]);

  // Chart data for weight trend
  const chartData = {
    labels: ['6 saat önce', '4 saat önce', '2 saat önce', 'Şimdi'],
    datasets: [
      {
        label: 'Ağırlık Trendi',
        data: [45.2, 45.8, 46.1, parseFloat(weightStats.currentWeight) || 0],
        borderColor: getCssVariable('--color-blue-500') || '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      x: {
        display: false
      },
      y: {
        display: false
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
        <div className="px-5 pt-5">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
      <div className="px-5 pt-5">
        <header className="flex justify-between items-start mb-2">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
            Ağırlık Sensörü
          </h2>
          <EditMenu align="right" className="relative inline-flex">
            <li>
              <Link className="font-medium text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200 flex py-1 px-3" to="#0">
                Detaylı Görünüm
              </Link>
            </li>
          </EditMenu>
        </header>

        <div className="flex items-start">
          <div className="text-3xl font-bold text-gray-800 dark:text-gray-100 mr-2">
            {weightStats.currentWeight}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">kg</div>
        </div>

        <div className="flex items-center mt-2">
          <div className={`text-sm font-medium ${parseFloat(weightStats.trend) >= 0
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
            }`}>
            {parseFloat(weightStats.trend) >= 0 ? '+' : ''}{weightStats.trend} kg
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 ml-1">
            son ölçümden beri
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-grow max-h-[128px] px-5 pb-5">
        <LineChart data={chartData} options={chartOptions} width={389} height={128} />
      </div>

      {/* Connection Status */}
      <div className="px-5 pb-3">
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
          <div className={`w-2 h-2 rounded-full mr-2 ${connectionStatus ? 'bg-green-500' : 'bg-red-500'}`}></div>
          {connectionStatus ? 'Bağlı' : 'Bağlantı Yok'}
          {weightStats.lastUpdate && (
            <span className="ml-2">
              • Son güncelleme: {new Date(weightStats.lastUpdate).toLocaleTimeString('tr-TR')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardCard05;
