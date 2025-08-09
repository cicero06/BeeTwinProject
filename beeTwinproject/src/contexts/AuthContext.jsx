/**
 * AuthContext - Temizlenmiş Versiyon
 * Kullanıcı kimlik doğrulama ve profil yönetimi
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import ApiService from '../services/api';
import CoordinatorService from '../services/coordinatorService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [apiaries, setApiaries] = useState([]);
    const [hives, setHives] = useState([]);
    const [coordinatorStatus, setCoordinatorStatus] = useState(null);

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

            // Load coordinator status
            await loadCoordinatorStatus();
        } catch (error) {
            console.error('❌ Error loading profile:', error);
        }
    };

    // Load coordinator status
    const loadCoordinatorStatus = async () => {
        try {
            console.log('🔄 Loading coordinator status...');
            const statusResult = await CoordinatorService.getDashboardSummary();

            if (statusResult.success) {
                setCoordinatorStatus(statusResult.summary);
                console.log('📡 Coordinator status loaded:', {
                    totalHives: statusResult.summary.totalHives,
                    connectedHives: statusResult.summary.connectedHives,
                    connectionRate: statusResult.summary.connectionRate
                });
            } else {
                console.log('❌ Coordinator status loading failed:', statusResult.error);
                setCoordinatorStatus(CoordinatorService.getEmptySummary());
            }
        } catch (error) {
            console.error('❌ Error loading coordinator status:', error);
            setCoordinatorStatus(CoordinatorService.getEmptySummary());
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

    // Get user statistics (enhanced with coordinator data)
    const getStats = () => {
        if (!user || !hives || !apiaries) {
            return {
                totalApiaries: 0,
                totalHives: 0,
                connectedHives: 0,
                offlineHives: 0,
                coordinatorData: coordinatorStatus || CoordinatorService.getEmptySummary()
            };
        }

        // Base stats from hives data
        const totalHives = hives.length;

        // Use coordinator data if available, otherwise fallback to sensor status
        let connectedHives = 0;
        if (coordinatorStatus && coordinatorStatus.connectedHives >= 0) {
            connectedHives = coordinatorStatus.connectedHives;
        } else {
            connectedHives = hives.filter(hive => hive.sensor?.isConnected).length;
        }

        const offlineHives = totalHives - connectedHives;

        return {
            totalApiaries: apiaries.length,
            totalHives,
            connectedHives,
            offlineHives,
            // Enhanced coordinator data
            coordinatorData: coordinatorStatus || {
                connectionRate: totalHives > 0 ? Math.round((connectedHives / totalHives) * 100) : 0,
                healthyHives: connectedHives,
                warningHives: 0,
                lastActivity: null,
                activeRouters: [],
                totalSensors: 0,
                activeSensors: 0,
                hiveDetails: []
            }
        };
    };

    // Kullanıcı rol kontrolü - userType kullan
    const isBeekeeper = user?.userType === 'beekeeper' || (user && !user.userType); // Default beekeeper

    // Admin kontrolü - userType kullan
    const isAdmin = user?.userType === 'admin';

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
        coordinatorStatus,
        login,
        register,
        logout,
        checkAuthStatus,
        loadUserProfile,
        loadCoordinatorStatus,
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
