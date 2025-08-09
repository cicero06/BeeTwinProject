import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

/**
 * AdminRoute - Sadece admin'lerin erişebileceği sayfalar için
 */
const AdminRoute = ({ children }) => {
    const { isAdmin, isAuthenticated, loading, user } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-blue-800 dark:text-blue-200">Admin yetki kontrolü...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    if (!isAdmin) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
                    <div className="text-center">
                        <div className="text-6xl mb-4">⚙️</div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                            Admin Yetkisi Gerekli
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Bu sayfaya erişim için admin yetkisine sahip olmanız gerekiyor.
                        </p>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            Mevcut yetki: {user?.userType || 'Bilinmiyor'}
                        </div>
                        <button
                            onClick={() => window.location.href = '/'}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
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

export default AdminRoute;
