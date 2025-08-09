import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

/**
 * BeekeeperRoute - Arıcılar ve admin'lerin erişebileceği sayfalar için
 */
const BeekeeperRoute = ({ children }) => {
    const { isBeekeeper, isAdmin, isAuthenticated, loading, user } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber-600 mx-auto"></div>
                    <p className="mt-4 text-amber-800 dark:text-amber-200">Yetki kontrolü yapılıyor...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    if (!isBeekeeper && !isAdmin) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
                    <div className="text-center">
                        <div className="text-6xl mb-4">🐝</div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                            Arıcı Yetkisi Gerekli
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Bu sayfaya erişim için arıcı hesabınızla giriş yapmanız gerekiyor.
                        </p>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            Mevcut yetki: {user?.userType || 'Bilinmiyor'}
                        </div>
                        <button
                            onClick={() => window.location.href = '/'}
                            className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-lg transition-colors"
                        >
                            Ana Sayfaya Dön
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return children;
};

export default BeekeeperRoute;
