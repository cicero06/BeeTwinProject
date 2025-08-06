import React from 'react';

// 🔧 OPTİMİZASYON: Gelişmiş Loading ve Error States

export const LoadingSpinner = ({ size = 'md', message = 'Yükleniyor...' }) => {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
        xl: 'w-16 h-16'
    };

    return (
        <div className="flex flex-col items-center justify-center p-4">
            <div className={`animate-spin rounded-full border-4 border-amber-200 border-t-amber-600 ${sizeClasses[size]}`}></div>
            {message && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 animate-pulse">
                    {message}
                </p>
            )}
        </div>
    );
};

export const LoadingSkeleton = ({ lines = 3, className = '' }) => (
    <div className={`animate-pulse space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
            <div
                key={i}
                className={`h-4 bg-gray-200 dark:bg-gray-700 rounded ${i === lines - 1 ? 'w-3/4' : 'w-full'
                    }`}
            ></div>
        ))}
    </div>
);

export const DataLoadingCard = ({ title, isLoading, error, children }) => {
    if (error) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-red-700 dark:text-red-300">
                    <span>⚠️</span>
                    <span className="font-medium">{title} - Hata</span>
                </div>
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    {error.message || 'Veri yüklenirken hata oluştu'}
                </p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                    <LoadingSpinner size="sm" message="" />
                    <span className="text-gray-600 dark:text-gray-400 text-sm">{title}</span>
                </div>
                <LoadingSkeleton lines={2} />
            </div>
        );
    }

    return children;
};

export const BeeTwinLoader = () => (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 flex items-center justify-center z-50">
        <div className="text-center">
            <div className="text-6xl mb-4 animate-bounce">🐝</div>
            <div className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                BeeTwin Dijital İkiz Sistemi
            </div>
            <LoadingSpinner size="lg" message="Kovanlarınız hazırlanıyor..." />
        </div>
    </div>
);

export default { LoadingSpinner, LoadingSkeleton, DataLoadingCard, BeeTwinLoader };