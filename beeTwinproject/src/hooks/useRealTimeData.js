/**
 * useRealTimeData Hook - Temizlenmiş Versiyon
 * Gerçek zamanlı sensor verilerini yönetir
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import websocketService from '../services/websocket';
import MLApiService from '../services/mlApi';

export const useRealTimeData = () => {
    const { user, hives } = useAuth();
    const hookId = useRef(`hook_${Math.random().toString(36).substr(2, 9)}`).current;

    const [sensorData, setSensorData] = useState([]);
    const [mlInsights, setMlInsights] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [anomalies, setAnomalies] = useState([]);
    const [trends, setTrends] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [error, setError] = useState(null);

    console.log(`🎯 useRealTimeData hook initialized with ID: ${hookId}`);

    /**
     * Real data connection check
     */
    const checkRealDataConnection = useCallback(() => {
        if (!user) {
            console.log('❌ No user found - cannot check data connection');
            setIsLoading(false);
            return;
        }

        console.log('🔍 Real data check for user:', {
            user: user.email,
            connectionStatus,
            hives: hives?.length || 0
        });

        // Check if we have real-time data connection
        if (!connectionStatus) {
            console.log('⏳ Waiting for real data connection - no mock data generation');
            setIsLoading(false);
            return;
        }

        // If we have connection, process real data
        console.log('✅ Real data connection established');
        setIsLoading(false);
    }, [user, connectionStatus, hives]);

    /**
     * Initialize data loading
     */
    const initializeData = useCallback(async () => {
        if (!user) return;

        console.log(`🔌 useRealTimeData initializing (${hookId})...`);

        try {
            // Register with WebSocket service
            websocketService.registerHook(hookId, (data) => {
                console.log(`📡 Data received for hook ${hookId}:`, data);
                setSensorData(prevData => [...prevData, data]);
            });

            // Try to get ML insights (fallback data)
            try {
                const [anomaliesData, trendsData, insightsData] = await Promise.all([
                    MLApiService.getAnomalies(20),
                    MLApiService.getTrends(10),
                    MLApiService.getRealTimeInsights()
                ]);

                setMlInsights(insightsData);

                // Use ML data as fallback sensor data if no real connection
                if (!connectionStatus && trendsData?.length > 0) {
                    setSensorData(trendsData);
                }
            } catch (mlError) {
                console.log('⚠️ ML API not available, using minimal fallback data');
            }

            // Attempt WebSocket connection
            const connectToWebSocket = () => {
                console.log(`🔗 Attempting WebSocket connection from hook ${hookId}...`);

                // DÜZELTME: Development mode'da da bağlantı denemesi yap
                console.log('� Attempting WebSocket connection in all environments');

                websocketService.connect()
                    .then(() => {
                        setConnectionStatus(true);
                        console.log(`✅ WebSocket connected for hook ${hookId}`);
                    })
                    .catch((error) => {
                        console.log(`❌ WebSocket connection failed for hook ${hookId}:`, error);
                        setConnectionStatus(false);
                    });
            };

            connectToWebSocket();
            setIsLoading(false);

        } catch (error) {
            console.error(`❌ Error initializing data for hook ${hookId}:`, error);
            setIsLoading(false);
        }
    }, [user, hookId, connectionStatus]);

    // Initialize when user changes
    useEffect(() => {
        initializeData();
    }, [initializeData]);

    // Check for real data periodically
    useEffect(() => {
        checkRealDataConnection();

        const interval = setInterval(checkRealDataConnection, 30000); // Check every 30 seconds

        return () => clearInterval(interval);
    }, [checkRealDataConnection]);

    // Cleanup on unmount
    // Clear alert function
    const clearAlert = useCallback((alertId) => {
        setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    }, []);

    // Refresh ML insights function
    const refreshMLInsights = useCallback(async () => {
        try {
            setIsLoading(true);
            const [anomaliesData, trendsData, insightsData] = await Promise.all([
                MLApiService.getAnomalies(20),
                MLApiService.getTrends(10),
                MLApiService.getRealTimeInsights()
            ]);

            setAnomalies(anomaliesData.data || []);
            setTrends(trendsData.data || []);
            setMlInsights(insightsData.data || null);
        } catch (err) {
            console.error('ML data fetch error:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        return () => {
            console.log(`🧹 Cleaning up useRealTimeData hook ${hookId}`);
            websocketService.unregisterHook(hookId);
        };
    }, [hookId]);

    return {
        sensorData,
        mlInsights,
        anomalies,
        trends,
        alerts,
        connectionStatus,
        isLoading,
        error,
        clearAlert,
        refreshMLInsights,
        hookId
    };
};

export default useRealTimeData;
