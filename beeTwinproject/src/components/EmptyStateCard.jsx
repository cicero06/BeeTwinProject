import React from 'react';

const EmptyStateCard = ({
    title,
    description,
    icon,
    actionText,
    onAction,
    colSpan = "col-span-full sm:col-span-6 xl:col-span-4"
}) => {
    console.log('🎭 EmptyStateCard render:', { title, icon, actionText });

    return (
        <div className={`${colSpan} bg-white dark:bg-gray-800 shadow-xs rounded-xl border border-gray-200 dark:border-gray-700`}>
            <div className="p-8 text-center">
                <div className="text-6xl mb-4">{icon || '📋'}</div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
                    {title || 'Veri Yok'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {description || 'Henüz veri bulunmuyor.'}
                </p>
                {actionText && onAction && (
                    <button
                        onClick={onAction}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        {actionText}
                    </button>
                )}
            </div>
        </div>
    );
};

export default EmptyStateCard;
