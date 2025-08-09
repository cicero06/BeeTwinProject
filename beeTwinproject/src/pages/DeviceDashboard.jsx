import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';
import DashboardCard01 from '../partials/dashboard/DashboardCard01';
import DashboardCard02 from '../partials/dashboard/DashboardCard02';
import DashboardCard03 from '../partials/dashboard/DashboardCard03';
import DashboardCard04 from '../partials/dashboard/DashboardCard04';

function DeviceDashboard() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user, userProfile, isAuthenticated, loading, isBeekeeper, isAdmin } = useAuth();

    // Loading durumunda göster
    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber-600 mx-auto"></div>
                    <p className="mt-4 text-amber-800 dark:text-amber-200">Device Dashboard yükleniyor...</p>
                </div>
            </div>
        );
    }

    // Authentication kontrolü
    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Sidebar */}
            <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            {/* Content area */}
            <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
                {/* Site header */}
                <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

                <main className="grow">
                    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">

                        {/* Dashboard header */}
                        <div className="sm:flex sm:justify-between sm:items-center mb-8">
                            <div className="mb-4 sm:mb-0">
                                <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">
                                    � Dashboard
                                </h1>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Sensör verileri ve kovan durumu
                                </p>
                            </div>
                        </div>

                        {/* Welcome & Status Cards */}
                        <div className="grid grid-cols-12 gap-6">
                            {/* Dashboard Card 01 - Ana bilgiler */}
                            <DashboardCard01 />
                            
                            {/* Dashboard Card 02 - Sensör durumu */}
                            <DashboardCard02 />
                            
                            {/* Dashboard Card 03 - BT107 Sıcaklık & Basınç */}
                            <DashboardCard03 />
                            
                            {/* Dashboard Card 04 - BT107 Nem */}
                            <DashboardCard04 />
                        </div>

                    </div>
                </main>
            </div>
        </div>
    );
}

export default DeviceDashboard;