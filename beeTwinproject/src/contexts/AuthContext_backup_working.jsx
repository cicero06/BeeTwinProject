import React, { createContext, useContext, useState, useEffect } from 'react';
import ApiService from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userProfile, setUserProfile] = useState(null); // Detaylı kullanıcı profili
    const [apiaries, setApiaries] = useState([]); // Kullanıcının arılıkları
    const [hives, setHives] = useState([]); // Kullanıcının kovanları

    // Sayfa yüklendiğinde localStorage'dan kullanıcı bilgilerini kontrol et
    useEffect(() => {
        const checkAuthStatus = () => {
            console.log('🔍 Checking auth status...');
            const token = localStorage.getItem('token');
            const userData = localStorage.getItem('user');
            console.log('📄 Token exists:', !!token);
            console.log('👤 User data exists:', !!userData);
            
            if (ApiService.isAuthenticated()) {
                console.log('✅ ApiService says authenticated');
                const userData = ApiService.getCurrentUser();
                if (userData) {
                    console.log('👤 Setting user data:', userData.email);
                    setUser(userData);
                    setIsAuthenticated(true);
                    // Kullanıcı giriş yaptıysa profil bilgilerini yükle
                    loadUserProfile();
                } else {
                    console.log('❌ No user data from ApiService');
                }
            } else {
                console.log('❌ ApiService says NOT authenticated');
            }
        };

        checkAuthStatus();
    }, []);

    // Kullanıcı profili ve arılık bilgilerini yükle
    const loadUserProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.log('⚠️ Token bulunamadı, profil yüklenemiyor');
                return;
            }

            console.log('🔄 Kullanıcı profili yükleniyor...');

            // Kullanıcının arılıklarını direkt yükle
            const apiariesResponse = await fetch('http://localhost:5000/api/apiaries', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (apiariesResponse.ok) {
                const apiariesData = await apiariesResponse.json();
                const userApiaries = apiariesData.data?.apiaries || [];
                setApiaries(userApiaries);
                console.log('🏡 Yüklenen arılıklar:', userApiaries.length, userApiaries);
            } else {
                console.log('❌ Arılık verileri alınamadı:', apiariesResponse.status, await apiariesResponse.text());
                setApiaries([]); // Boş array set et ki loading bitsin
            }

            // Kullanıcının kovanlarını yükle
            const hivesResponse = await fetch('http://localhost:5000/api/users/hives', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (hivesResponse.ok) {
                const hivesData = await hivesResponse.json();
                const userHives = hivesData.data || [];
                setHives(userHives);
                console.log('🐝 Yüklenen kovanlar:', userHives.length, userHives);
                
                // Kovan verilerinin detayını göster
                if (userHives.length > 0) {
                    console.log('📋 İlk kovanın detayları:', userHives[0]);
                    console.log('🔑 Kovan alanları:', Object.keys(userHives[0]));
                    
                    // Her kovan için Router ve Sensor ID'lerini göster
                    userHives.forEach((hive, index) => {
                        console.log(`🐝 Kovan ${index + 1}:`, {
                            id: hive.id,
                            name: hive.name,
                            routerId: hive.routerId || hive.router_id || hive.sensor?.routerId,
                            sensorId: hive.sensorId || hive.sensor_id || hive.sensor?.sensorId,
                            deviceId: hive.deviceId || hive.device_id,
                            sensorObject: hive.sensor // Tüm sensor objesini göster
                        });
                    });
                }
            } else {
                console.log('❌ Kovan verileri alınamadı:', hivesResponse.status, await hivesResponse.text());
                setHives([]); // Boş array set et ki loading bitsin
            }

            console.log('✅ Kullanıcı profil yüklemesi tamamlandı');
        } catch (error) {
            console.error('❌ Kullanıcı profili yüklenemedi:', error);
            // Hata durumunda da boş arrays set et ki dashboard render olsun
            setApiaries([]);
            setHives([]);
        }
    };

    // Demo veri oluşturma fonksiyonu (eğer kullanıcının verisi yoksa)
    const createDemoData = async () => {
        try {
            if (!user) return;

            console.log('🎭 Demo veri oluşturuluyor...', user.email);
            const token = localStorage.getItem('token');

            // Demo arılık oluştur
            const demoApiaryData = {
                name: `${user.firstName}'in Arılığı`,
                location: {
                    address: "Demo Arılık Adresi",
                    coordinates: {
                        latitude: 41.0082 + (Math.random() - 0.5) * 0.1,
                        longitude: 28.9784 + (Math.random() - 0.5) * 0.1
                    }
                },
                capacity: 20,
                establishedDate: new Date()
            };

            const apiaryResponse = await fetch('http://localhost:5000/api/apiaries', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(demoApiaryData)
            });

            if (apiaryResponse.ok) {
                const createdApiary = await apiaryResponse.json();
                console.log('🏡 Demo arılık oluşturuldu:', createdApiary);

                // Demo kovanlar oluştur
                for (let i = 1; i <= 3; i++) {
                    const demoHiveData = {
                        name: `Kovan-${i}`,
                        hiveType: "Langstroth",
                        apiary: createdApiary.data._id,
                        sensor: {
                            routerId: 107 + (i % 4), // Router 107-110 arası
                            isConnected: i <= 2, // İlk 2 kovan bağlı
                            sensorType: "BMP280"
                        },
                        installationDate: new Date(),
                        isActive: true
                    };

                    const hiveResponse = await fetch('http://localhost:5000/api/hives', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(demoHiveData)
                    });

                    if (hiveResponse.ok) {
                        console.log(`🐝 Demo kovan ${i} oluşturuldu`);
                    }
                }

                // Verileri yeniden yükle
                await loadUserProfile();
            }
        } catch (error) {
            console.error('❌ Demo veri oluşturulamadı:', error);
        }
    };

    const login = async (email, password) => {
        try {
            setLoading(true);

            const result = await ApiService.login(email, password);

            if (result.success) {
                setUser(result.data.user);
                setIsAuthenticated(true);

                // Giriş başarılı olduğunda kullanıcı verilerini yükle
                await loadUserProfile();

                return {
                    success: true,
                    message: 'Giriş başarılı',
                    user: result.data.user
                };
            } else {
                return {
                    success: false,
                    message: result.error || 'Giriş başarısız'
                };
            }
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: 'Giriş işlemi sırasında hata oluştu'
            };
        } finally {
            setLoading(false);
        }
    };

    const register = async (userData) => {
        try {
            setLoading(true);

            const result = await ApiService.register(userData);

            if (result.success) {
                return {
                    success: true,
                    message: 'Kayıt başarılı! Giriş yapabilirsiniz.',
                    user: result.data.user
                };
            } else {
                return {
                    success: false,
                    message: result.error || 'Kayıt başarısız'
                };
            }
        } catch (error) {
            console.error('Register error:', error);
            return {
                success: false,
                message: 'Kayıt işlemi sırasında hata oluştu'
            };
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        ApiService.logout();
        setUser(null);
        setIsAuthenticated(false);
        setUserProfile(null);
        setApiaries([]);
        setHives([]);
    };

    const isAdmin = () => {
        return user?.userType === 'admin';
    };

    const isBeekeeper = () => {
        return user?.userType === 'beekeeper';
    };

    // Verileri yenile
    const refreshUserData = async () => {
        await loadUserProfile();
    };

    // İstatistikler
    const getStats = () => {
        return {
            totalApiaries: apiaries.length,
            totalHives: hives.length,
            connectedHives: hives.filter(hive => hive.sensor?.isConnected).length,
            disconnectedHives: hives.filter(hive => !hive.sensor?.isConnected).length
        };
    };

    const value = {
        // Kullanıcı bilgileri
        user,
        userProfile,
        apiaries,
        hives,

        // Fonksiyonlar
        login,
        register,
        logout,
        refreshUserData,
        createDemoData,

        // Durum kontrolleri
        isAdmin,
        isBeekeeper,
        isAuthenticated,
        loading,

        // İstatistikler
        getStats
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
