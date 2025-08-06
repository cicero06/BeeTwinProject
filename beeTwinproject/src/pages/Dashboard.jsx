import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import EmptyStateCard from '../components/EmptyStateCard';
import { LoadingSpinner } from '../components/LoadingAndError';

import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';
import Banner from '../partials/Banner';

// 🔧 OPTİMİZASYON: Lazy loading for dashboard cards
const DashboardCard01 = lazy(() => import('../partials/dashboard/DashboardCard01'));
const DashboardCard02 = lazy(() => import('../partials/dashboard/DashboardCard02'));
const DashboardCard03 = lazy(() => import('../partials/dashboard/DashboardCard03'));
const DashboardCard04 = lazy(() => import('../partials/dashboard/DashboardCard04'));
const DashboardCard05 = lazy(() => import('../partials/dashboard/DashboardCard05'));
const DashboardCard06 = lazy(() => import('../partials/dashboard/DashboardCard06'));
const DashboardCard07 = lazy(() => import('../partials/dashboard/DashboardCard07'));
const DashboardCard08 = lazy(() => import('../partials/dashboard/DashboardCard08'));
const DashboardCard09 = lazy(() => import('../partials/dashboard/DashboardCard09'));
const DashboardCard10 = lazy(() => import('../partials/dashboard/DashboardCard10'));
const DashboardCard12 = lazy(() => import('../partials/dashboard/DashboardCard12'));
const DashboardCard14 = lazy(() => import('../partials/dashboard/DashboardCard14'));
const DashboardCard15 = lazy(() => import('../partials/dashboard/DashboardCard15'));
const DashboardCard16 = lazy(() => import('../partials/dashboard/DashboardCard16'));
function Dashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, userProfile, apiaries, hives, getStats, isAuthenticated, loading, isBeekeeper, isAdmin } = useAuth();

  // Authentication kontrolü
  useEffect(() => {
    console.log('Dashboard useEffect - isAuthenticated:', isAuthenticated, 'loading:', loading, 'user:', user);
    if (!loading && !isAuthenticated) {
      console.log('Redirecting to login page...');
      navigate('/');
    }
  }, [isAuthenticated, loading, navigate]);

  // Loading durumunda göster
  if (loading) {
    console.log('Dashboard loading...');
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-amber-800 dark:text-amber-200">Dashboard yükleniyor...</p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Kullanıcı: {user?.email || 'Bilinmiyor'}</p>
        </div>
      </div>
    );
  }

  // Authenticated değilse yönlendirme yapılacak, bu noktaya gelirse authenticated
  if (!isAuthenticated) {
    console.log('Not authenticated, rendering null...');
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <p className="text-amber-800 dark:text-amber-200">Giriş yapılıyor...</p>
        </div>
      </div>
    );
  }

  // Kullanıcı tipini belirle  
  const isSystemAdmin = user && user.userType === 'admin';

  // İstatistikleri al
  const stats = getStats ? getStats() : { totalApiaries: 0, totalHives: 0, connectedHives: 0 };

  console.log('Dashboard rendering for user:', user?.email);
  console.log('📊 Dashboard Data State:', {
    user: user?.email,
    apiaries: apiaries?.length || 0,
    hives: hives?.length || 0,
    stats,
    isAuthenticated,
    loading,
    isBeekeeper,
    isSystemAdmin
  });

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">

      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Content area */}
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">

        {/*  Site header */}
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">

            {/* Dashboard actions */}
            <div className="sm:flex sm:justify-between sm:items-center mb-8">

              {/* Left: Title */}
              <div className="mb-4 sm:mb-0">
                <h1 className="text-2xl md:text-3xl text-blue-700 dark:text-blue-300 font-bold">
                  {isBeekeeper && `${user.firstName} ${user.lastName}'in Arıcılık Paneli`}
                  {isSystemAdmin && "Admin Yönetim Paneli"}
                  {!user && "BeeTwin Dashboard"}
                </h1>
                <p className="text-amber-600 dark:text-amber-400 text-sm">
                  {isBeekeeper && "Dijital İkiz Arıcılık Yönetim Sistemi"}
                  {isSystemAdmin && "Sistem Yönetimi & Analitik"}
                  {!user && "Arıcılık için Dijital İkiz Platformu"}
                </p>
                {isBeekeeper && (
                  <div className="mt-2 flex gap-4 text-xs text-gray-600 dark:text-gray-400">
                    <span>🏡 {stats.totalApiaries} Arılık</span>
                    <span>🏠 {stats.totalHives} Kovan</span>
                    <span>📡 {stats.connectedHives} Bağlı Sensör</span>
                    {stats.totalApiaries === 0 && (
                      <button
                        onClick={() => {
                          if (createDemoData) {
                            createDemoData();
                          } else {
                            console.error('createDemoData fonksiyonu bulunamadı');
                            alert('Demo veri oluşturma şu anda kullanılamıyor. Lütfen sayfayı yenileyin.');
                          }
                        }}
                        className="ml-4 px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                      >
                        🎭 Demo Veri Oluştur
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Right: Actions */}
              <div className="grid grid-flow-col sm:auto-cols-max justify-start sm:justify-end gap-2">
                {/* Filter button */}
                <div className="relative inline-flex">
                  <button className="btn bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300">
                    <span className="sr-only">Filter</span>
                    <svg className="fill-current" width="16" height="16" viewBox="0 0 16 16">
                      <path d="M9 15H7a1 1 0 010-2h2a1 1 0 010 2zM11 11H5a1 1 0 010-2h6a1 1 0 010 2zM13 7H3a1 1 0 010-2h10a1 1 0 010 2zM15 3H1a1 1 0 010-2h14a1 1 0 010 2z" />
                    </svg>
                  </button>
                </div>
                {/* Datepicker built with flatpickr */}
                <div className="relative">
                  <input
                    className="form-input pl-9 dark:bg-gray-800 text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 font-medium"
                    placeholder="Son 7 gün"
                    readOnly
                  />
                  <div className="absolute inset-0 right-auto flex items-center pointer-events-none">
                    <svg className="fill-current text-gray-500 dark:text-gray-400 ml-3 mr-2" width="16" height="16" viewBox="0 0 16 16">
                      <path d="M15 2h-2V0h-2v2H9V0H7v2H5V0H3v2H1a1 1 0 00-1 1v12a1 1 0 001 1h14a1 1 0 001-1V3a1 1 0 00-1-1zM1 4h14v10H1V4z" />
                    </svg>
                  </div>
                </div>
                {/* Add view button */}
                <button className="btn bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white">
                  <svg className="fill-current shrink-0 xs:hidden" width="16" height="16" viewBox="0 0 16 16">
                    <path d="M15 7H9V1c0-.6-.4-1-1-1S7 .4 7 1v6H1c-.6 0-1 .4-1 1s.4 1 1 1h6v6c0 .6.4 1 1 1s1-.4 1-1V9h6c.6 0 1-.4 1-1s-.4-1-1-1z" />
                  </svg>
                  <span className="max-xs:sr-only">Add View</span>
                </button>
              </div>

            </div>

            {/* Cards */}
            <div className="grid grid-cols-12 gap-6">

              {/* Beekeeper Dashboard */}
              {isBeekeeper && (
                <>
                  {/* Veri yükleme durumu göster */}
                  {loading && (
                    <div className="col-span-full text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600 dark:text-gray-400">Verileriniz yükleniyor...</p>
                    </div>
                  )}

                  {!loading && (
                    <>
                      {/* Data Status Banner */}
                      <div className="col-span-full mb-4">
                        {(!apiaries || apiaries.length === 0) ? (
                          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                            <div className="flex items-center">
                              <div className="text-amber-600 dark:text-amber-400 mr-3">📭</div>
                              <div>
                                <h3 className="text-amber-800 dark:text-amber-200 font-medium">
                                  Veri Yok - Boş Dashboard
                                </h3>
                                <p className="text-amber-700 dark:text-amber-300 text-sm">
                                  Henüz arılık kaydınız yok. Kartlar boş şablonlar olarak gösteriliyor.
                                  <button
                                    onClick={() => {
                                      if (createDemoData) {
                                        createDemoData();
                                      } else {
                                        console.error('createDemoData fonksiyonu bulunamadı');
                                        alert('Demo veri oluşturma şu anda kullanılamıyor. Lütfen sayfayı yenileyin.');
                                      }
                                    }}
                                    className="ml-2 px-3 py-1 bg-amber-600 text-white text-xs rounded-md hover:bg-amber-700 transition-colors"
                                  >
                                    📝 Gerçek Veri Oluştur
                                  </button>
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (apiaries && apiaries.length > 0 && (!hives || hives.length === 0)) ? (
                          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                            <div className="flex items-center">
                              <div className="text-blue-600 dark:text-blue-400 mr-3">🏡</div>
                              <div>
                                <h3 className="text-blue-800 dark:text-blue-200 font-medium">
                                  Arılık Var, Kovan Bekleniyor
                                </h3>
                                <p className="text-blue-700 dark:text-blue-300 text-sm">
                                  {stats.totalApiaries} arılığınız mevcut. Kovan ekleyerek gerçek veri akışını başlatın.
                                  <button
                                    onClick={() => window.location.href = '/admin-panel'}
                                    className="ml-2 px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                                  >
                                    ➕ Kovan Ekle
                                  </button>
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                            <div className="flex items-center">
                              <div className="text-green-600 dark:text-green-400 mr-3">✅</div>
                              <div>
                                <h3 className="text-green-800 dark:text-green-200 font-medium">
                                  Gerçek Verilerle Çalışıyor
                                </h3>
                                <p className="text-green-700 dark:text-green-300 text-sm">
                                  {stats.totalApiaries} arılık, {stats.totalHives} kovan aktif.
                                  Kartlar gerçek verilerinizi gösteriyor.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Dashboard Kartları - Gerçek Veri Durumuna Göre */}
                      <DashboardCard01 />
                      <DashboardCard02 />
                      <DashboardCard03 />
                      <DashboardCard04 />
                      <DashboardCard05 />
                      <DashboardCard06 />
                      <DashboardCard07 />
                      <DashboardCard08 />
                      <DashboardCard09 />
                      <DashboardCard10 />
                      <DashboardCard12 />
                      <DashboardCard14 />
                      <DashboardCard15 />
                      <DashboardCard16 />
                    </>
                  )}

                  {/* Backend bağlantısı yoksa hata göster */}
                  {!loading && !user && (
                    <div className="col-span-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 text-center">
                      <div className="text-6xl mb-4">❌</div>
                      <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                        Backend Bağlantısı Yok
                      </h3>
                      <p className="text-red-700 dark:text-red-300 mb-4">
                        Sunucu bağlantısında sorun var. Backend'in çalıştığından emin olun.
                      </p>
                      <button
                        onClick={() => window.location.reload()}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                      >
                        🔄 Sayfayı Yenile
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Admin Dashboard */}
              {isSystemAdmin && (
                <>
                  <DashboardCard01 />
                  <DashboardCard02 />
                  <DashboardCard03 />
                  <DashboardCard04 />
                  <DashboardCard05 />
                  <DashboardCard06 />
                  <DashboardCard07 />
                  <DashboardCard08 />
                  <DashboardCard09 />
                  <DashboardCard10 />
                  <DashboardCard12 />
                  <DashboardCard14 />
                  <DashboardCard15 />
                </>
              )}

              {/* Default Dashboard - Guest */}
              {!user && (
                <>
                  <div className="col-span-full xl:col-span-8 bg-white dark:bg-gray-800 shadow-xs rounded-xl">
                    <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
                      <h2 className="font-semibold text-gray-800 dark:text-gray-100">🐝 BeeTwin'e Hoş Geldiniz</h2>
                    </header>
                    <div className="p-5">
                      <div className="text-center">
                        <div className="text-6xl mb-4">🍯</div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                          Dijital İkiz Arıcılık Platformu
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                          Arıcılığınızı teknoloji ile birleştirin. IoT sensörleri, gerçek zamanlı izleme ve akıllı analitik ile arılarınızı koruyun.
                        </p>
                        <div className="space-y-4">
                          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 mr-4">
                            Giriş Yap
                          </button>
                          <button className="border border-blue-600 text-blue-600 px-6 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20">
                            Kayıt Ol
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-full xl:col-span-4 bg-white dark:bg-gray-800 shadow-xs rounded-xl">
                    <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
                      <h2 className="font-semibold text-gray-800 dark:text-gray-100">🚀 Özellikler</h2>
                    </header>
                    <div className="p-5">
                      <div className="space-y-4">
                        <div className="flex items-start">
                          <span className="text-2xl mr-3">📡</span>
                          <div>
                            <h4 className="font-semibold text-gray-800 dark:text-gray-100">IoT Sensörler</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Gerçek zamanlı sıcaklık, nem ve gaz monitoring</p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <span className="text-2xl mr-3">📊</span>
                          <div>
                            <h4 className="font-semibold text-gray-800 dark:text-gray-100">Akıllı Analitik</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Veri analizi ve tahmin algoritmaları</p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <span className="text-2xl mr-3">🏠</span>
                          <div>
                            <h4 className="font-semibold text-gray-800 dark:text-gray-100">Kovan Yönetimi</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Dijital kovan takibi ve yönetimi</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

            </div>

          </div>
        </main>

        <Banner />

      </div>
    </div>
  );
}

export default Dashboard;