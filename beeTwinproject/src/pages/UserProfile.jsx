import React, { useState } from 'react';
import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';
import UserAvatar from '../images/image.png';

function UserProfile() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');

    // Mock user data - bu gerçek uygulamada API'den gelecek
    const userData = {
        name: 'Hüseyin Deniz',
        email: 'huseyin.deniz@example.com',
        phone: '+90 532 123 45 67',
        address: 'Ankara, Türkiye',
        registrationDate: '15 Mart 2024',
        apiaryCount: 3,
        hiveCount: 25,
        totalHoneyProduction: '450 kg',
        role: 'Arıcı',
        bio: 'Arıcılık sektöründe 15 yıllık deneyime sahip profesyonel arıcı. Organik bal üretimi ve modern arıcılık tekniklerinde uzman.',
        specializations: ['Organik Bal Üretimi', 'Kraliçe Arı Yetiştiriciliği', 'Arı Hastalıkları', 'Modern Kovan Tasarımı']
    };

    const recentActivities = [
        { date: '2024-07-15', activity: 'Kovan #12 muayene edildi', type: 'inspection' },
        { date: '2024-07-14', activity: 'Yeni kraliçe arı eklendi', type: 'addition' },
        { date: '2024-07-13', activity: 'Bal hasadı gerçekleştirildi - 25kg', type: 'harvest' },
        { date: '2024-07-12', activity: 'Sensör verileri güncellendi', type: 'data' }
    ];

    const apiaries = [
        { id: 1, name: 'Kızılcahamam Arılığı', location: 'Ankara', hiveCount: 10, status: 'Aktif' },
        { id: 2, name: 'Beypazarı Arılığı', location: 'Ankara', hiveCount: 8, status: 'Aktif' },
        { id: 3, name: 'Çankırı Arılığı', location: 'Çankırı', hiveCount: 7, status: 'Bakımda' }
    ];

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
                        <div className="mb-8">
                            <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">
                                👤 Kullanıcı Profili
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                Kişisel bilgilerinizi yönetin ve arıcılık faaliyetlerinizi takip edin
                            </p>
                        </div>

                        {/* Profile Card */}
                        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-6 mb-6">
                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                                <div className="relative">
                                    <img
                                        className="w-24 h-24 rounded-full border-4 border-amber-200 dark:border-amber-600"
                                        src={UserAvatar}
                                        alt="Profile"
                                    />
                                    <button className="absolute bottom-0 right-0 bg-amber-500 hover:bg-amber-600 text-white p-2 rounded-full transition-colors">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="flex-1 text-center sm:text-left">
                                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                                        {userData.name}
                                    </h2>
                                    <p className="text-amber-600 dark:text-amber-400 font-semibold">
                                        {userData.role}
                                    </p>
                                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                                        {userData.bio}
                                    </p>
                                    <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                                        {userData.specializations.map((spec, index) => (
                                            <span
                                                key={index}
                                                className="px-3 py-1 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 rounded-full text-sm"
                                            >
                                                {spec}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            <div className="bg-gradient-to-r from-amber-400 to-amber-500 p-6 rounded-xl text-white">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-amber-100">Arılık Sayısı</p>
                                        <p className="text-3xl font-bold">{userData.apiaryCount}</p>
                                    </div>
                                    <div className="text-4xl">🏡</div>
                                </div>
                            </div>
                            <div className="bg-gradient-to-r from-blue-400 to-blue-500 p-6 rounded-xl text-white">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-blue-100">Kovan Sayısı</p>
                                        <p className="text-3xl font-bold">{userData.hiveCount}</p>
                                    </div>
                                    <div className="text-4xl">🏠</div>
                                </div>
                            </div>
                            <div className="bg-gradient-to-r from-green-400 to-green-500 p-6 rounded-xl text-white">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-green-100">Toplam Bal Üretimi</p>
                                        <p className="text-2xl font-bold">{userData.totalHoneyProduction}</p>
                                    </div>
                                    <div className="text-4xl">🍯</div>
                                </div>
                            </div>
                            <div className="bg-gradient-to-r from-purple-400 to-purple-500 p-6 rounded-xl text-white">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-purple-100">Kayıt Tarihi</p>
                                        <p className="text-sm font-semibold">{userData.registrationDate}</p>
                                    </div>
                                    <div className="text-4xl">📅</div>
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="mb-6">
                            <nav className="flex space-x-4">
                                <button
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'profile'
                                            ? 'bg-amber-500 text-white'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400'
                                        }`}
                                    onClick={() => setActiveTab('profile')}
                                >
                                    📋 Profil Bilgileri
                                </button>
                                <button
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'apiaries'
                                            ? 'bg-amber-500 text-white'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400'
                                        }`}
                                    onClick={() => setActiveTab('apiaries')}
                                >
                                    🏡 Arılıklarım
                                </button>
                                <button
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'activities'
                                            ? 'bg-amber-500 text-white'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400'
                                        }`}
                                    onClick={() => setActiveTab('activities')}
                                >
                                    📊 Son Aktiviteler
                                </button>
                            </nav>
                        </div>

                        {/* Tab Content */}
                        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-6">
                            {activeTab === 'profile' && (
                                <div className="space-y-6">
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                                        Kişisel Bilgiler
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Ad Soyad
                                            </label>
                                            <input
                                                type="text"
                                                value={userData.name}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                                readOnly
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                E-posta
                                            </label>
                                            <input
                                                type="email"
                                                value={userData.email}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                                readOnly
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Telefon
                                            </label>
                                            <input
                                                type="tel"
                                                value={userData.phone}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                                readOnly
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Adres
                                            </label>
                                            <input
                                                type="text"
                                                value={userData.address}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                                readOnly
                                            />
                                        </div>
                                    </div>
                                    <button className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-lg transition-colors">
                                        Bilgileri Güncelle
                                    </button>
                                </div>
                            )}

                            {activeTab === 'apiaries' && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                                        Arılıklarım
                                    </h3>
                                    {apiaries.map((apiary) => (
                                        <div key={apiary.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-semibold text-gray-800 dark:text-gray-100">
                                                        {apiary.name}
                                                    </h4>
                                                    <p className="text-gray-600 dark:text-gray-400">
                                                        📍 {apiary.location} • 🏠 {apiary.hiveCount} Kovan
                                                    </p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-sm ${apiary.status === 'Aktif'
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                        : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                                                    }`}>
                                                    {apiary.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'activities' && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                                        Son Aktiviteler
                                    </h3>
                                    {recentActivities.map((activity, index) => (
                                        <div key={index} className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.type === 'inspection' ? 'bg-blue-100 text-blue-600' :
                                                    activity.type === 'addition' ? 'bg-green-100 text-green-600' :
                                                        activity.type === 'harvest' ? 'bg-amber-100 text-amber-600' :
                                                            'bg-purple-100 text-purple-600'
                                                }`}>
                                                {activity.type === 'inspection' ? '🔍' :
                                                    activity.type === 'addition' ? '➕' :
                                                        activity.type === 'harvest' ? '🍯' : '📊'}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-gray-800 dark:text-gray-100 font-medium">
                                                    {activity.activity}
                                                </p>
                                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                                    {activity.date}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default UserProfile;
