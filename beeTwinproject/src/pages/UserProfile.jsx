import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';
import UserAvatar from '../images/image.png';
import ApiService from '../services/api';

function UserProfile() {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editedProfile, setEditedProfile] = useState({});

    // Fotoğraf yükleme için state'ler
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    const { user, userProfile, apiaries, loading, isAuthenticated, updateUserProfile } = useAuth();

    // Authentication kontrolü
    useEffect(() => {
        if (!loading && !isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, loading, navigate]);

    // Edit mode için profil bilgilerini kopyala
    useEffect(() => {
        if (userProfile) {
            setEditedProfile({
                firstName: userProfile.firstName || '',
                lastName: userProfile.lastName || '',
                phone: userProfile.phone || '',
                location: userProfile.location || '',
                bio: userProfile.bio || '',
                beekeepingInfo: {
                    experience: userProfile.beekeepingInfo?.experience || '',
                    goals: userProfile.beekeepingInfo?.goals || ''
                }
            });
        }
    }, [userProfile]);

    const handleSaveProfile = async () => {
        try {
            if (updateUserProfile) {
                await updateUserProfile(editedProfile);
                setEditMode(false);
                alert('✅ Profil başarıyla güncellendi!');
            }
        } catch (error) {
            alert('❌ Profil güncellenirken hata oluştu: ' + error.message);
        }
    };

    // Fotoğraf yükleme fonksiyonları
    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        processFile(file);
    };

    const handleDrop = (event) => {
        event.preventDefault();
        setIsDragging(false);
        const file = event.dataTransfer.files[0];
        processFile(file);
    };

    const handleDragOver = (event) => {
        event.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (event) => {
        event.preventDefault();
        setIsDragging(false);
    };

    const processFile = (file) => {
        if (!file) return;

        // Dosya tipi kontrolü
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            alert('❌ Sadece JPG, PNG veya WebP formatları destekleniyor!');
            return;
        }

        // Dosya boyutu kontrolü (5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            alert('❌ Dosya boyutu en fazla 5MB olabilir!');
            return;
        }

        setSelectedFile(file);

        // Önizleme URL'si oluştur
        const reader = new FileReader();
        reader.onload = (e) => {
            setPreviewUrl(e.target.result);
        };
        reader.readAsDataURL(file);
    };

    const uploadPhoto = async () => {
        if (!selectedFile) return;

        try {
            setUploadProgress(20);

            // Gerçek API çağrısı
            const response = await ApiService.uploadProfilePhoto(selectedFile);

            setUploadProgress(80);

            if (response.success) {
                // AuthContext'teki kullanıcı bilgilerini güncelle
                const updatedUser = response.data.user;
                if (updateUserProfile) {
                    // Sadece profilePicture'ı güncelle
                    await updateUserProfile({ profilePicture: response.data.profilePicture });
                }

                setUploadProgress(100);
                setTimeout(() => {
                    setShowPhotoModal(false);
                    setSelectedFile(null);
                    setPreviewUrl(null);
                    setUploadProgress(0);
                    alert('✅ Profil fotoğrafı başarıyla güncellendi!');
                }, 500);
            }
        } catch (error) {
            console.error('Foto yükleme hatası:', error);
            alert('❌ Foto yüklenirken bir hata oluştu: ' + error.message);
            setUploadProgress(0);
        }
    };

    const closePhotoModal = () => {
        setShowPhotoModal(false);
        setSelectedFile(null);
        setPreviewUrl(null);
        setUploadProgress(0);
    };

    // Loading durumu
    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber-600 mx-auto"></div>
                    <p className="mt-4 text-amber-800">Profil yükleniyor...</p>
                </div>
            </div>
        );
    }

    // Dinamik kullanıcı verileri
    const userData = {
        name: userProfile ? `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim() || user?.email : user?.email || 'Kullanıcı',
        email: user?.email || '',
        phone: userProfile?.phone || 'Telefon belirtilmemiş',
        location: userProfile?.location || 'Konum belirtilmemiş',
        registrationDate: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('tr-TR') : 'Bilinmiyor',
        apiaryCount: apiaries?.length || 0,
        hiveCount: apiaries?.reduce((total, apiary) => total + (apiary.hives?.length || 0), 0) || 0,
        role: user?.userType === 'admin' ? 'Yönetici' : user?.userType === 'beekeeper' ? 'Arıcı' : 'Kullanıcı',
        bio: userProfile?.bio || 'Henüz biyografi eklenmemiş',
        experience: userProfile?.beekeepingInfo?.experience || 'Belirtilmemiş',
        goals: userProfile?.beekeepingInfo?.goals || 'Henüz hedef belirtilmemiş',
        profilePicture: userProfile?.profilePicture || null
    };

    // Profil fotoğrafının tam URL'ini oluştur
    const getProfilePictureUrl = () => {
        if (userData.profilePicture) {
            // Eğer tam URL ise direkt döndür
            if (userData.profilePicture.startsWith('http')) {
                return userData.profilePicture;
            }
            // Backend'den gelen relative path ise base URL ekle + cache buster
            const fullUrl = `http://localhost:5000${userData.profilePicture}?t=${Date.now()}`;
            return fullUrl;
        }
        return UserAvatar;
    };

    const recentActivities = [
        { date: new Date().toLocaleDateString('tr-TR'), activity: 'Profil görüntülendi', type: 'view' },
        { date: new Date(Date.now() - 86400000).toLocaleDateString('tr-TR'), activity: 'Dashboard kontrol edildi', type: 'data' }
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
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Profil Bilgileri</h3>
                                <button
                                    onClick={() => setEditMode(!editMode)}
                                    className="btn bg-amber-500 hover:bg-amber-600 text-white"
                                >
                                    {editMode ? '❌ İptal' : '✏️ Düzenle'}
                                </button>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                                <div className="relative group">
                                    <img
                                        className="w-24 h-24 rounded-full border-4 border-amber-200 dark:border-amber-600 object-cover"
                                        src={getProfilePictureUrl()}
                                        alt="Profile"
                                        onError={(e) => { e.target.src = UserAvatar; }}
                                    />
                                    <button
                                        onClick={() => setShowPhotoModal(true)}
                                        className="absolute bottom-0 right-0 bg-amber-500 hover:bg-amber-600 text-white p-2 rounded-full transition-colors shadow-lg"
                                        title="Fotoğraf değiştir"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </button>
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-full transition-all duration-200 flex items-center justify-center">
                                        <span className="text-white opacity-0 group-hover:opacity-100 text-xs font-medium">
                                            Değiştir
                                        </span>
                                    </div>
                                </div>

                                <div className="flex-1 text-center sm:text-left space-y-4">
                                    {editMode ? (
                                        /* Edit Mode */
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                        Ad
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={editedProfile.firstName || ''}
                                                        onChange={(e) => setEditedProfile({ ...editedProfile, firstName: e.target.value })}
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
                                                        placeholder="Adınızı girin"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                        Soyad
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={editedProfile.lastName || ''}
                                                        onChange={(e) => setEditedProfile({ ...editedProfile, lastName: e.target.value })}
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
                                                        placeholder="Soyadınızı girin"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    Telefon
                                                </label>
                                                <input
                                                    type="tel"
                                                    value={editedProfile.phone || ''}
                                                    onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
                                                    placeholder="Telefon numaranızı girin"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    Konum
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editedProfile.location || ''}
                                                    onChange={(e) => setEditedProfile({ ...editedProfile, location: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
                                                    placeholder="Konumunuzu girin"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    Biyografi
                                                </label>
                                                <textarea
                                                    value={editedProfile.bio || ''}
                                                    onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                                                    rows={3}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
                                                    placeholder="Kendiniz hakkında kısa bilgi..."
                                                />
                                            </div>

                                            {/* Arıcılık bilgileri */}
                                            <div className="grid grid-cols-1 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                        Arıcılık Deneyimi
                                                    </label>
                                                    <select
                                                        value={editedProfile.beekeepingInfo?.experience || ''}
                                                        onChange={(e) => setEditedProfile({
                                                            ...editedProfile,
                                                            beekeepingInfo: {
                                                                ...editedProfile.beekeepingInfo,
                                                                experience: e.target.value
                                                            }
                                                        })}
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
                                                    >
                                                        <option value="">Seçiniz</option>
                                                        <option value="beginner">Başlangıç</option>
                                                        <option value="intermediate">Orta</option>
                                                        <option value="advanced">İleri</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                        Hedefleriniz
                                                    </label>
                                                    <textarea
                                                        value={editedProfile.beekeepingInfo?.goals || ''}
                                                        onChange={(e) => setEditedProfile({
                                                            ...editedProfile,
                                                            beekeepingInfo: {
                                                                ...editedProfile.beekeepingInfo,
                                                                goals: e.target.value
                                                            }
                                                        })}
                                                        rows={2}
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
                                                        placeholder="Arıcılık hedefleriniz..."
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex space-x-3">
                                                <button
                                                    onClick={handleSaveProfile}
                                                    className="btn bg-green-600 hover:bg-green-700 text-white"
                                                >
                                                    ✅ Kaydet
                                                </button>
                                                <button
                                                    onClick={() => setEditMode(false)}
                                                    className="btn bg-gray-500 hover:bg-gray-600 text-white"
                                                >
                                                    ❌ İptal
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        /* View Mode */
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                                                {userData.name}
                                            </h2>
                                            <p className="text-amber-600 dark:text-amber-400 font-semibold">
                                                {userData.role}
                                            </p>
                                            <p className="text-gray-600 dark:text-gray-400 mt-2">
                                                📧 {userData.email}
                                            </p>
                                            <p className="text-gray-600 dark:text-gray-400">
                                                📞 {userData.phone}
                                            </p>
                                            <p className="text-gray-600 dark:text-gray-400">
                                                📍 {userData.location}
                                            </p>
                                            <p className="text-gray-600 dark:text-gray-400 mt-4">
                                                💭 {userData.bio}
                                            </p>
                                            <div className="mt-4 space-y-2">
                                                <p className="text-gray-600 dark:text-gray-400">
                                                    🎯 <strong>Deneyim:</strong> {userData.experience === 'beginner' ? 'Başlangıç' :
                                                        userData.experience === 'intermediate' ? 'Orta' :
                                                            userData.experience === 'advanced' ? 'İleri' : 'Belirtilmemiş'}
                                                </p>
                                                <p className="text-gray-600 dark:text-gray-400">
                                                    🎯 <strong>Hedefler:</strong> {userData.goals}
                                                </p>
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                                                📅 Kayıt Tarihi: {userData.registrationDate}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
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
                            <div className="bg-gradient-to-r from-purple-400 to-purple-500 p-6 rounded-xl text-white">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-purple-100">Aktif Sensörler</p>
                                        <p className="text-3xl font-bold">
                                            {apiaries?.reduce((total, apiary) =>
                                                total + (apiary.hives?.reduce((hiveTotal, hive) =>
                                                    hiveTotal + (hive.sensors?.length || 0), 0) || 0), 0) || 0}
                                        </p>
                                    </div>
                                    <div className="text-4xl">📡</div>
                                </div>
                            </div>
                        </div>

                        {/* Arılık Listesi */}
                        {apiaries && apiaries.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-6 mb-6">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                                    Arılıklarım
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {apiaries.map((apiary) => (
                                        <div key={apiary._id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                                            <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
                                                {apiary.name}
                                            </h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                                📍 {apiary.location?.address || 'Adres belirtilmemiş'}
                                            </p>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600 dark:text-gray-400">Kovan:</span>
                                                <span className="font-medium">{apiary.hives?.length || 0}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600 dark:text-gray-400">Durum:</span>
                                                <span className={`font-medium ${apiary.isActive ? 'text-green-600' : 'text-red-600'}`}>
                                                    {apiary.isActive ? 'Aktif' : 'Pasif'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Son Aktiviteler */}
                        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                                Son Aktiviteler
                            </h3>
                            <div className="space-y-3">
                                {recentActivities.map((activity, index) => (
                                    <div key={index} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 last:border-b-0">
                                        <div className="flex items-center space-x-3">
                                            <div className={`w-2 h-2 rounded-full ${activity.type === 'view' ? 'bg-blue-500' :
                                                activity.type === 'data' ? 'bg-green-500' :
                                                    activity.type === 'inspection' ? 'bg-amber-500' :
                                                        'bg-purple-500'
                                                }`}></div>
                                            <span className="text-gray-800 dark:text-gray-200">{activity.activity}</span>
                                        </div>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">{activity.date}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Fotoğraf Yükleme Modal */}
            {showPhotoModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                                📸 Profil Fotoğrafı Değiştir
                            </h3>
                            <button
                                onClick={closePhotoModal}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                ✕
                            </button>
                        </div>

                        {!selectedFile ? (
                            /* Dosya Seçme Alanı */
                            <div className="space-y-4">
                                <div
                                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging
                                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                                        : 'border-gray-300 dark:border-gray-600 hover:border-amber-400'
                                        }`}
                                    onDrop={handleDrop}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                >
                                    <div className="text-4xl mb-4">📷</div>
                                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                                        Fotoğrafınızı buraya sürükleyip bırakın
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                                        veya
                                    </p>
                                    <label className="btn bg-amber-500 hover:bg-amber-600 text-white cursor-pointer">
                                        Dosya Seç
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileSelect}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                    <p>• Desteklenen formatlar: JPG, PNG, WebP</p>
                                    <p>• Maksimum dosya boyutu: 5MB</p>
                                    <p>• Önerilen boyut: 400x400 piksel</p>
                                </div>
                            </div>
                        ) : (
                            /* Önizleme ve Yükleme */
                            <div className="space-y-4">
                                <div className="text-center">
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-amber-200"
                                    />
                                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                        {selectedFile.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>

                                {uploadProgress > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600 dark:text-gray-400">Yükleniyor...</span>
                                            <span className="text-amber-600">{uploadProgress}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                            <div
                                                className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${uploadProgress}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex space-x-3">
                                    <button
                                        onClick={uploadPhoto}
                                        disabled={uploadProgress > 0}
                                        className="flex-1 btn bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white"
                                    >
                                        {uploadProgress > 0 ? 'Yükleniyor...' : '✅ Kaydet'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectedFile(null);
                                            setPreviewUrl(null);
                                        }}
                                        disabled={uploadProgress > 0}
                                        className="flex-1 btn bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white"
                                    >
                                        🔄 Yeni Seç
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default UserProfile;
