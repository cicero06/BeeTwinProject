import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const AdminRoute = ({ children }) => {
    const { isAdmin, isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
                    <div className="text-center">
                        <div className="text-6xl mb-4">🔒</div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                            Giriş Yapmanız Gerekiyor
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Admin paneline erişmek için önce giriş yapmanız gerekiyor.
                        </p>
                        <button
                            onClick={() => window.location.href = '/'}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
                        >
                            Giriş Sayfasına Git
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
                    <div className="text-center">
                        <div className="text-6xl mb-4">⚠️</div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                            Erişim Reddedildi
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Bu sayfaya erişim için admin yetkisine sahip olmanız gerekiyor.
                        </p>
                        <button
                            onClick={() => window.location.href = '/dashboard'}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
                        >
                            Dashboard'a Git
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return children;
};

export default AdminRoute;
