import React, { useState, useEffect } from 'react';
import ApiService from '../../services/api';

/**
 * DashboardCard10 - Bakım Planlaması
 * 
 * Bu bileşen, dijital ikiz temelli akıllı arı kovanı izleme sisteminin 
 * bakım ve müdahale planlamalarını yöneten katmanını oluşturmaktadır.
 * 
 * Özellikler:
 * - Periyodik bakım takvimleri
 * - Acil müdahale planları
 * - Ekipman kontrol listesi
 * - Bakım geçmişi ve performans analizi
 * 
 * Akademik Katkı: Dijital ikiz sisteminin maintenance management
 * ve "bakım optimizasyonu" işlevinin planlama parametresi bileşeni.
 */

function DashboardCard10() {

  // State for maintenance data from API
  const [maintenanceTasks, setMaintenanceTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch maintenance tasks from API
  useEffect(() => {
    const fetchMaintenanceTasks = async () => {
      try {
        setLoading(true);
        // TODO: Implement real API endpoint
        // const data = await ApiService.getMaintenanceTasks();

        // For now, use empty array until real API is implemented
        setMaintenanceTasks([]);

      } catch (err) {
        console.error('Error fetching maintenance tasks:', err);
        setError('Bakım görevleri yüklenirken hata oluştu');
        setMaintenanceTasks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMaintenanceTasks();
  }, []);

  // Priorité renk kodları
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-amber-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  // Status renk kodları
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'in_progress': return 'text-blue-600';
      case 'pending': return 'text-amber-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Tamamlandı';
      case 'in_progress': return 'Devam Ediyor';
      case 'pending': return 'Bekliyor';
      default: return 'Bilinmiyor';
    }
  };

  // Calculate summary statistics
  const pendingTasks = maintenanceTasks.filter(task => task.status === 'pending').length;
  const urgentTasks = maintenanceTasks.filter(task => task.priority === 'high').length;

  if (loading) {
    return (
      <div className="col-span-full xl:col-span-6 bg-white dark:bg-gray-800 shadow-xs rounded-xl border border-green-200 dark:border-gray-700">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500 dark:text-gray-400">Bakım görevleri yükleniyor...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="col-span-full xl:col-span-6 bg-white dark:bg-gray-800 shadow-xs rounded-xl border border-red-200 dark:border-gray-700">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500 dark:text-red-400">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="col-span-full xl:col-span-6 bg-white dark:bg-gray-800 shadow-xs rounded-xl border border-green-200 dark:border-gray-700">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Bakım Planlaması
            </h2>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Kovan Bakım ve Müdahale Takibi
            </div>
          </div>
          {/* Bakım Özet Bilgileri */}
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Bekleyen: <span className="font-medium text-amber-600">{pendingTasks}</span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Acil: <span className="font-medium text-red-600">{urgentTasks}</span>
            </div>
          </div>
        </div>
      </header>
      <div className="p-3">

        {maintenanceTasks.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500 dark:text-gray-400">
              Henüz bakım görevi bulunmuyor.
            </div>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="table-auto w-full">
                {/* Table header */}
                <thead className="text-xs font-semibold uppercase text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="p-2 whitespace-nowrap">
                      <div className="font-semibold text-left">Görev</div>
                    </th>
                    <th className="p-2 whitespace-nowrap">
                      <div className="font-semibold text-left">Kovan</div>
                    </th>
                    <th className="p-2 whitespace-nowrap">
                      <div className="font-semibold text-center">Öncelik</div>
                    </th>
                    <th className="p-2 whitespace-nowrap">
                      <div className="font-semibold text-center">Tarih</div>
                    </th>
                    <th className="p-2 whitespace-nowrap">
                      <div className="font-semibold text-center">Durum</div>
                    </th>
                  </tr>
                </thead>
                {/* Table body */}
                <tbody className="text-sm divide-y divide-gray-100 dark:divide-gray-700/60">
                  {
                    maintenanceTasks.map(task => {
                      return (
                        <tr key={task.id}>
                          <td className="p-2 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 mr-3">
                                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div>
                                <div className="font-medium text-gray-800 dark:text-gray-100">{task.taskType}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{task.assignedTo} • {task.estimatedTime}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-2 whitespace-nowrap">
                            <div className="text-gray-800 dark:text-gray-100 font-medium">{task.hiveId}</div>
                          </td>
                          <td className="p-2 whitespace-nowrap">
                            <div className="flex justify-center">
                              <div className={`h-2 w-2 rounded-full ${getPriorityColor(task.priority)}`}></div>
                            </div>
                          </td>
                          <td className="p-2 whitespace-nowrap">
                            <div className="text-center text-xs">
                              {new Date(task.dueDate).toLocaleDateString('tr-TR')}
                            </div>
                          </td>
                          <td className="p-2 whitespace-nowrap">
                            <div className={`text-center text-xs font-medium ${getStatusColor(task.status)}`}>
                              {getStatusText(task.status)}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  }
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default DashboardCard10;
