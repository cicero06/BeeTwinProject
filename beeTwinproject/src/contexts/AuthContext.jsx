/**
 * AuthContext - Temizlenmiş Versiyon
 * Kullanıcı kimlik doğrulama ve profil yönetimi
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import ApiService from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [apiaries, setApiaries] = useState([]);
    const [hives, setHives] = useState([]);

    // Check authentication status
    const checkAuthStatus = async () => {
        console.log('🔍 Checking auth status...');

        try {
            const token = localStorage.getItem('token');
            const userData = localStorage.getItem('user');

            console.log('📄 Token exists:', !!token);
            console.log('👤 User data exists:', !!userData);

            if (!token) {
                console.log('❌ No token found');
                setIsAuthenticated(false);
                setLoading(false);
                return;
            }

            const isValidToken = ApiService.isAuthenticated();
            console.log('✅ ApiService says authenticated:', isValidToken);

            if (isValidToken && userData) {
                const parsedUser = JSON.parse(userData);
                console.log('👤 Setting user data:', parsedUser.email);

                setUser(parsedUser);
                setIsAuthenticated(true);
                await loadUserProfile(parsedUser);
            } else {
                console.log('❌ Invalid token or no user data');
                setIsAuthenticated(false);
            }
        } catch (error) {
            console.error('❌ Auth check error:', error);
            setIsAuthenticated(false);
        } finally {
            setLoading(false);
        }
    };

    // Load user profile data
    const loadUserProfile = async (userData) => {
        console.log('🔄 Loading user profile...');

        try {
            // Load apiaries
            const apiariesResponse = await ApiService.getUserApiaries();
            console.log('📊 Apiaries API response:', apiariesResponse);
            if (apiariesResponse.success) {
                const userApiaries = apiariesResponse.data || [];
                setApiaries(userApiaries);
                console.log('🏡 Apiaries loaded:', userApiaries.length);
            } else {
                console.log('❌ Apiaries loading failed:', apiariesResponse.error);
                setApiaries([]); // Empty array as fallback
            }

            // Load hives
            const hivesResponse = await ApiService.getUserHives();
            if (hivesResponse.success) {
                const userHives = hivesResponse.data || [];
                setHives(userHives);
                console.log('🐝 Hives loaded:', userHives.length);

                // Debug: Show sensor details for first few hives
                if (userHives.length > 0) {
                    userHives.slice(0, 3).forEach((hive, index) => {
                        console.log(`🐝 Hive ${index + 1}: ${hive.name}`, {
                            routerId: hive.sensor?.routerId,
                            sensorId: hive.sensor?.sensorId,
                            hasSensor: !!hive.sensor
                        });
                    });
                }
            } else {
                console.log('❌ Hives loading failed:', hivesResponse.error);
                setHives([]); // Empty array as fallback
            }

            console.log('✅ User profile loaded successfully');
        } catch (error) {
            console.error('❌ Error loading profile:', error);
        }
    };

    // Login function
    const login = async (email, password) => {
        try {
            setLoading(true);
            const response = await ApiService.login(email, password);

            if (response.success) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));

                setUser(response.data.user);
                setIsAuthenticated(true);
                await loadUserProfile(response.data.user);

                console.log('✅ Login successful:', response.data.user.email);
                return { success: true };
            } else {
                console.log('❌ Login failed:', response.message);
                return { success: false, message: response.message };
            }
        } catch (error) {
            console.error('❌ Login error:', error);
            return { success: false, message: 'Login failed' };
        } finally {
            setLoading(false);
        }
    };

    // Register function
    const register = async (userData) => {
        try {
            setLoading(true);
            console.log('📝 Registering user:', userData.email);

            const response = await ApiService.register(userData);

            if (response.success) {
                // Store token and user data
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));

                // Update state
                setUser(response.data.user);
                setIsAuthenticated(true);

                // Load user profile data
                await loadUserProfile(response.data.user);

                console.log('✅ Registration and auto-login successful:', response.data.user.email);
                return { success: true, user: response.data.user };
            } else {
                console.log('❌ Registration failed:', response.message);
                return { success: false, message: response.message };
            }
        } catch (error) {
            console.error('❌ Registration error:', error);
            return { success: false, message: 'Registration failed' };
        } finally {
            setLoading(false);
        }
    };

    // Logout function
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
        setApiaries([]);
        setHives([]);
        console.log('👋 User logged out');
    };

    // Get user statistics
    const getStats = () => {
        if (!user || !hives || !apiaries) {
            return {
                totalApiaries: 0,
                totalHives: 0,
                connectedHives: 0,
                offlineHives: 0
            };
        }

        const totalHives = hives.length;
        const connectedHives = hives.filter(hive => hive.sensor?.isConnected).length;
        const offlineHives = totalHives - connectedHives;

        return {
            totalApiaries: apiaries.length,
            totalHives,
            connectedHives,
            offlineHives
        };
    };

    // Check if user is beekeeper
    const isBeekeeper = user?.role === 'beekeeper' || user?.role === 'user' || (user && !user.role);

    // Check if user is admin
    const isAdmin = user?.role === 'admin';

    // Check auth on mount
    useEffect(() => {
        checkAuthStatus();
    }, []);

    const value = {
        user,
        isAuthenticated,
        loading,
        apiaries,
        hives,
        login,
        register,
        logout,
        checkAuthStatus,
        loadUserProfile,
        getStats,
        isBeekeeper,
        isAdmin
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// useAuth hook
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export default AuthContext;
