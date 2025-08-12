import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';

function HiveManagement() {
    const navigate = useNavigate();
    const { apiaryId } = useParams();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [selectedApiary, setSelectedApiary] = useState(null);
    const [hives, setHives] = useState([]);
    const [loadingHives, setLoadingHives] = useState(false);

    const { user, userProfile, apiaries, loading, isAuthenticated, isBeekeeper } = useAuth();

    // Authentication kontrolü
    useEffect(() => {
        if (!loading && !isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, loading, navigate]);

    // Arılık seçimi ve kovan listesini getirme
    useEffect(() => {
        if (apiaries && apiaries.length > 0) {
            if (apiaryId) {
                const apiary = apiaries.find(a => a._id === apiaryId);
                if (apiary) {
                    setSelectedApiary(apiary);
                    fetchHives(apiaryId);
                }
            } else if (!selectedApiary) {
                setSelectedApiary(apiaries[0]);
                fetchHives(apiaries[0]._id);
            }
        }
    }, [apiaries, apiaryId, selectedApiary]);

    const fetchHives = async (apId) => {
        setLoadingHives(true);
        try {
            const response = await fetch(`/api/apiaries/${apId}/hives`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setHives(data);
            }
        } catch (error) {
            console.error('Kovan listesi alınırken hata:', error);
        }
        setLoadingHives(false);
    };

    const handleApiaryChange = (apiary) => {
        setSelectedApiary(apiary);
        fetchHives(apiary._id);
        navigate(`/hive-management/${apiary._id}`);
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber-600 mx-auto"></div>
                    <p className="mt-4 text-amber-800">Kovan yönetimi yükleniyor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-[100dvh] overflow-hidden">
            <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
                <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

                <main className="grow">
                    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">

                        <div className="sm:flex sm:justify-between sm:items-center mb-8">
                            <div className="mb-4 sm:mb-0">
                                <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">
                                    🐝 Kovan Yönetimi
                                </h1>
                                <p className="text-gray-600 dark:text-gray-400">
                                    {selectedApiary ? `${selectedApiary.name} arılığındaki kovanlarınızı yönetin` : 'Kovanlarınızı görüntüleyin ve yönetin'}
                                </p>
                            </div>

                            <div className="grid grid-flow-col sm:auto-cols-max justify-start sm:justify-end gap-2">
                                <button className="btn bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white">
                                    <svg className="fill-current shrink-0 xs:hidden" width="16" height="16" viewBox="0 0 16 16">
                                        <path d="M15 7H9V1c0-.6-.4-1-1-1S7 .4 7 1v6H1c-.6 0-1 .4-1 1s.4 1 1 1h6v6c0 .6.4 1 1 1s1-.4 1-1V9h6c.6 0 1-.4 1-1s-.4-1-1-1z" />
                                    </svg>
                                    <span className="max-xs:sr-only">Yeni Kovan Ekle</span>
                                </button>
                            </div>
                        </div>

                        {apiaries && apiaries.length > 1 && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                                    Arılık Seçin
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                    {apiaries.map((apiary) => (
                                        <button
                                            key={apiary._id}
                                            onClick={() => handleApiaryChange(apiary)}
                                            className={`p-3 rounded-lg border-2 transition-all ${selectedApiary?._id === apiary._id
                                                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
                                                    : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/10'
                                                }`}
                                        >
                                            <div className="font-medium">{apiary.name}</div>
                                            <div className="text-sm opacity-75">
                                                {apiary.hives?.length || 0} kovan
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedApiary && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                                        {selectedApiary.name} - Kovanlar
                                    </h3>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        Toplam: {hives.length} kovan
                                    </div>
                                </div>

                                {loadingHives ? (
                                    <div className="text-center py-8">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
                                        <p className="mt-2 text-gray-600 dark:text-gray-400">Kovanlar yükleniyor...</p>
                                    </div>
                                ) : hives.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {hives.map((hive) => (
                                            <div key={hive._id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow">

                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <h4 className="font-semibold text-gray-800 dark:text-gray-100">
                                                            Kovan {hive.hiveNumber || hive._id.slice(-4)}
                                                        </h4>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                                            {hive.type || 'Standart'}
                                                        </p>
                                                    </div>
                                                    <div className={`w-3 h-3 rounded-full ${hive.isActive ? 'bg-green-500' : 'bg-red-500'
                                                        }`}></div>
                                                </div>

                                                <div className="space-y-2 mb-4">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-600 dark:text-gray-400">Durum:</span>
                                                        <span className={`font-medium ${hive.isActive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                                            }`}>
                                                            {hive.isActive ? 'Aktif' : 'Pasif'}
                                                        </span>
                                                    </div>

                                                    {hive.lastInspection && (
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-gray-600 dark:text-gray-400">Son Muayene:</span>
                                                            <span className="text-gray-800 dark:text-gray-200">
                                                                {new Date(hive.lastInspection).toLocaleDateString('tr-TR')}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {hive.sensors && hive.sensors.length > 0 && (
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-gray-600 dark:text-gray-400">Sensörler:</span>
                                                            <span className="text-blue-600 dark:text-blue-400">
                                                                {hive.sensors.length} adet
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                {hive.health && (
                                                    <div className="mb-4">
                                                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Sağlık Durumu</div>
                                                        <div className={`text-sm font-medium ${hive.health === 'excellent' ? 'text-green-600 dark:text-green-400' :
                                                                hive.health === 'good' ? 'text-blue-600 dark:text-blue-400' :
                                                                    hive.health === 'fair' ? 'text-yellow-600 dark:text-yellow-400' :
                                                                        'text-red-600 dark:text-red-400'
                                                            }`}>
                                                            {hive.health === 'excellent' ? '🟢 Mükemmel' :
                                                                hive.health === 'good' ? '🔵 İyi' :
                                                                    hive.health === 'fair' ? '🟡 Orta' : '🔴 Kötü'}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex space-x-2">
                                                    <button
                                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-1.5 px-2 rounded transition-colors"
                                                        onClick={() => navigate(`/hives/${hive._id}`)}
                                                    >
                                                        Detay
                                                    </button>
                                                    <button
                                                        className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-xs py-1.5 px-2 rounded transition-colors"
                                                        onClick={() => navigate(`/hives/${hive._id}/edit`)}
                                                    >
                                                        Düzenle
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                                            <svg className="w-8 h-8 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                                            Bu arılıkta henüz kovan bulunmuyor
                                        </h3>
                                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                                            İlk kovanınızı ekleyerek başlayın
                                        </p>
                                        <button className="btn bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white">
                                            İlk Kovanı Ekle
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {(!apiaries || apiaries.length === 0) && (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                                    <svg className="w-8 h-8 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                                    Henüz arılığınız bulunmuyor
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400 mb-6">
                                    Kovan yönetimi için önce bir arılık oluşturmanız gerekiyor
                                </p>
                                <button
                                    className="btn bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
                                    onClick={() => navigate('/apiaries')}
                                >
                                    Arılık Listesine Git
                                </button>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}

export default HiveManagement;
