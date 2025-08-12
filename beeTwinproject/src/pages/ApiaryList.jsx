import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';

function ApiaryList() {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user, userProfile, apiaries, loading, isAuthenticated, isBeekeeper } = useAuth();

    // Authentication kontrolü
    useEffect(() => {
        if (!loading && !isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, loading, navigate]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber-600 mx-auto"></div>
                    <p className="mt-4 text-amber-800">Arılık listesi yükleniyor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-[100dvh] overflow-hidden">
            {/* Sidebar */}
            <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            {/* Content area */}
            <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
                {/* Site header */}
                <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

                <main className="grow">
                    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">

                        {/* Page header */}
                        <div className="sm:flex sm:justify-between sm:items-center mb-8">
                            <div className="mb-4 sm:mb-0">
                                <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">
                                    🏡 Arılık Yönetimi
                                </h1>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Arılıklarınızı görüntüleyin ve yönetin
                                </p>
                            </div>

                            {/* Add new apiary button */}
                            <div className="grid grid-flow-col sm:auto-cols-max justify-start sm:justify-end gap-2">
                                <button className="btn bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white">
                                    <svg className="fill-current shrink-0 xs:hidden" width="16" height="16" viewBox="0 0 16 16">
                                        <path d="M15 7H9V1c0-.6-.4-1-1-1S7 .4 7 1v6H1c-.6 0-1 .4-1 1s.4 1 1 1h6v6c0 .6.4 1 1 1s1-.4 1-1V9h6c.6 0 1-.4 1-1s-.4-1-1-1z" />
                                    </svg>
                                    <span className="max-xs:sr-only">Yeni Arılık Ekle</span>
                                </button>
                            </div>
                        </div>

                        {/* Apiaries Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {apiaries && apiaries.length > 0 ? (
                                apiaries.map((apiary) => (
                                    <div key={apiary._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-shadow duration-300">

                                        {/* Apiary Header */}
                                        <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-4">
                                            <h3 className="text-white font-semibold text-lg">{apiary.name}</h3>
                                            <p className="text-amber-100 text-sm">{apiary.location?.address || 'Adres bilgisi yok'}</p>
                                        </div>

                                        {/* Apiary Content */}
                                        <div className="p-4">
                                            {/* Stats */}
                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                                        {apiary.hives?.length || 0}
                                                    </div>
                                                    <div className="text-xs text-gray-600 dark:text-gray-400">Kovan Sayısı</div>
                                                </div>
                                                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                                        {apiary.isActive ? '✓' : '✗'}
                                                    </div>
                                                    <div className="text-xs text-gray-600 dark:text-gray-400">Aktif Durum</div>
                                                </div>
                                            </div>

                                            {/* Location Info */}
                                            {apiary.location?.coordinates && (
                                                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                                        <strong>Koordinatlar:</strong>
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-500">
                                                        Lat: {apiary.location.coordinates.latitude?.toFixed(6)}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-500">
                                                        Lng: {apiary.location.coordinates.longitude?.toFixed(6)}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Description */}
                                            {apiary.description && (
                                                <div className="mb-4">
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                                                        {apiary.description}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Actions */}
                                            <div className="flex space-x-2">
                                                <button
                                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-3 rounded-lg transition-colors"
                                                    onClick={() => navigate(`/apiaries/${apiary._id}`)}
                                                >
                                                    Detaylar
                                                </button>
                                                <button
                                                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-sm py-2 px-3 rounded-lg transition-colors"
                                                    onClick={() => navigate(`/apiaries/${apiary._id}/edit`)}
                                                >
                                                    Düzenle
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                /* Empty state */
                                <div className="col-span-full">
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
                                            İlk arılığınızı ekleyerek başlayın
                                        </p>
                                        <button className="btn bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white">
                                            İlk Arılığı Ekle
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default ApiaryList;
