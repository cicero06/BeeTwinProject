/**
 * useRealTimeData Hook
 * Manages real-time sensor data and ML insights via WebSocket connection
 * Now includes user-specific data filtering
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import websocketService from '../services/websocket';
import MLApiService from '../services/mlApi';

export const useRealTimeData = () => {
    const { user, hives } = useAuth();
    // Generate unique hook ID for tracking
    const hookId = useRef(`hook_${Math.random().toString(36).substr(2, 9)}`).current;

    const [sensorData, setSensorData] = useState([]);
    const [mlInsights, setMlInsights] = useState(null);
    const [anomalies, setAnomalies] = useState([]);
    const [trends, setTrends] = useState([]);
    const [connectionStatus, setConnectionStatus] = useState(false);
    const [alerts, setAlerts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    console.log(`🎯 useRealTimeData hook initialized with ID: ${hookId}`);

    // Keep track of latest data for state management
    const latestDataRef = useRef({
        sensorData: [],
        mlInsights: null,
        anomalies: [],
        trends: []
    });

    /**
     * Generate user-specific mock sensor data
     */
    const generateUserMockData = useCallback(() => {
        if (!user) return;

        const userHives = hives || [];
        const userHiveIds = userHives.map(hive => hive.id);
        
        // Generate data for each user's hive with different router assignments
        userHiveIds.forEach((hiveId, index) => {
            // Assign different routers to different hives
            const routerIds = ["107", "108", "109", "110"];
            const routerId = routerIds[index % routerIds.length];
            
            let mockData = {};
            
            // Generate router-specific data
            switch (routerId) {
                case "107": // BME280 Environmental
                    mockData = {
                        routerId: "107",
                        deviceId: "107",
                        hiveId: hiveId,
                        userId: user.id,
                        timestamp: new Date().toISOString(),
                        parameters: {
                            temperature: 20 + Math.random() * 15, // 20-35°C
                            humidity: 40 + Math.random() * 40,    // 40-80%
                            pressure: 1000 + Math.random() * 50   // 1000-1050 hPa
                        }
                    };
                    break;
                    
                case "108": // MICS-4514 Gas
                    mockData = {
                        routerId: "108",
                        deviceId: "108", 
                        hiveId: hiveId,
                        userId: user.id,
                        timestamp: new Date().toISOString(),
                        parameters: {
                            co2: 400 + Math.random() * 1000,     // 400-1400 ppm
                            nh3: Math.random() * 30,             // 0-30 ppm
                            voc: Math.random() * 200             // 0-200 ppb
                        }
                    };
                    break;
                    
                case "109": // Weight Sensor
                    mockData = {
                        routerId: "109",
                        deviceId: "109",
                        hiveId: hiveId,
                        userId: user.id,
                        timestamp: new Date().toISOString(),
                        parameters: {
                            weight: 25 + Math.random() * 20      // 25-45 kg
                        }
                    };
                    break;
                    
                case "110": // MQ2 Gas
                    mockData = {
                        routerId: "110",
                        deviceId: "110",
                        hiveId: hiveId,
                        userId: user.id,
                        timestamp: new Date().toISOString(),
                        parameters: {
                            gas_level: Math.random() * 100,      // 0-100 ppm
                            smoke_detected: Math.random() > 0.9  // 10% chance
                        }
                    };
                    break;
            }
            
            // Add mock data to sensor data
            setSensorData(prevData => {
                const newData = [...prevData, mockData].slice(-100);
                latestDataRef.current.sensorData = newData;
                return newData;
            });
        });
        
        console.log(`🎭 Generated user-specific mock data for user: ${user.email}, hives: ${userHiveIds.length}`);
    }, [user, hives]);

    // Kullanıcı Router/Sensor ID'lerine göre gerçek veri kontrolü
    useEffect(() => {
        console.log('🔍 Real data check for user:', { user: user?.email, connectionStatus, hives: hives?.length });
        
        if (!user) {
            console.log('❌ No user - no data processing');
            return;
        }
        
        // Gerçek veri bağlantısı yoksa mock veri üretme - sadece gerçek veriyi bekle
        if (!connectionStatus) {
            console.log('⏳ Waiting for real data connection - no mock data generation');
            return;
        }
        
        console.log('✅ Real data connection established for user:', user.email);
        
    }, [user, connectionStatus, generateUserMockData]);
    /**
     * Handle new sensor data from WebSocket
     */
    const handleSensorData = useCallback((data) => {
        setSensorData(prevData => {
            // Keep only last 100 readings for performance
            const newData = [...prevData, data].slice(-100);
            latestDataRef.current.sensorData = newData;
            return newData;
        });
    }, []);

    /**
     * Handle ML insights from WebSocket
     */
    const handleMLInsights = useCallback((insights) => {
        setMlInsights(insights);
        latestDataRef.current.mlInsights = insights;
    }, []);

    /**
     * Handle anomaly detection alerts
     */
    const handleAnomaly = useCallback((anomaly) => {
        setAnomalies(prevAnomalies => {
            const newAnomalies = [anomaly, ...prevAnomalies].slice(0, 50);
            latestDataRef.current.anomalies = newAnomalies;
            return newAnomalies;
        });

        // Add to alerts if it's a high severity anomaly
        if (anomaly.severity === 'high' || anomaly.severity === 'critical') {
            setAlerts(prevAlerts => [
                {
                    id: `anomaly_${Date.now()}`,
                    type: 'anomaly',
                    severity: anomaly.severity,
                    message: `Anomaly detected in ${anomaly.deviceId}: ${anomaly.parameter}`,
                    timestamp: new Date().toISOString(),
                    data: anomaly
                },
                ...prevAlerts
            ].slice(0, 20));
        }
    }, []);

    /**
     * Handle trend predictions
     */
    const handleTrend = useCallback((trend) => {
        setTrends(prevTrends => {
            const newTrends = [trend, ...prevTrends].slice(0, 20);
            latestDataRef.current.trends = newTrends;
            return newTrends;
        });
    }, []);

    /**
     * Handle connection status changes
     */
    const handleConnectionStatus = useCallback((status) => {
        setConnectionStatus(status.connected);
        if (status.connected) {
            setError(null);
        }
    }, []);

    /**
     * Handle WebSocket errors
     */
    const handleError = useCallback((errorData) => {
        setError(errorData.error);
        console.error('WebSocket error:', errorData.error);
    }, []);

    /**
     * Initialize WebSocket connection and load initial data
     */
    useEffect(() => {
        let mounted = true;

        const initializeData = async () => {
            try {
                setIsLoading(true);
                console.log(`🔌 useRealTimeData initializing (${hookId})...`);

                // Register this hook instance
                websocketService.registerHook(hookId);

                // Load initial ML data from API
                const [anomaliesRes, trendsRes, insightsRes] = await Promise.all([
                    MLApiService.getAnomalies({ limit: 20 }),
                    MLApiService.getTrends({ limit: 10 }),
                    MLApiService.getRealTimeInsights()
                ]);

                if (mounted) {
                    if (anomaliesRes.success) {
                        setAnomalies(anomaliesRes.data);
                        latestDataRef.current.anomalies = anomaliesRes.data;
                    }

                    if (trendsRes.success) {
                        setTrends(trendsRes.data);
                        latestDataRef.current.trends = trendsRes.data;
                    }

                    if (insightsRes.success) {
                        setMlInsights(insightsRes.data);
                        latestDataRef.current.mlInsights = insightsRes.data;
                    }
                }

                // Setup WebSocket listeners BEFORE connecting
                websocketService.on('sensorData', handleSensorData);
                websocketService.on('mlInsights', handleMLInsights);
                websocketService.on('anomaly', handleAnomaly);
                websocketService.on('trend', handleTrend);
                websocketService.on('connectionStatus', handleConnectionStatus);
                websocketService.on('error', handleError);

                // Connect to WebSocket (singleton pattern will reuse existing connection)
                console.log(`🔗 Attempting WebSocket connection from hook ${hookId}...`);
                websocketService.connect();

            } catch (error) {
                if (mounted) {
                    setError('Failed to initialize real-time data');
                    console.error('Failed to initialize real-time data:', error);
                }
            } finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        };

        initializeData();

        // Cleanup function
        return () => {
            console.log(`🧹 useRealTimeData cleanup (${hookId})...`);
            mounted = false;

            // Unregister this hook instance
            websocketService.unregisterHook(hookId);

            websocketService.off('sensorData', handleSensorData);
            websocketService.off('mlInsights', handleMLInsights);
            websocketService.off('anomaly', handleAnomaly);
            websocketService.off('trend', handleTrend);
            websocketService.off('connectionStatus', handleConnectionStatus);
            websocketService.off('error', handleError);
        };
    }, [handleSensorData, handleMLInsights, handleAnomaly, handleTrend, handleConnectionStatus, handleError]);

    /**
     * Manually refresh ML insights
     */
    const refreshMLInsights = useCallback(async () => {
        try {
            const response = await MLApiService.getRealTimeInsights();
            if (response.success) {
                setMlInsights(response.data);
                latestDataRef.current.mlInsights = response.data;
            }
        } catch (error) {
            console.error('Failed to refresh ML insights:', error);
        }
    }, []);

    /**
     * Clear specific alert
     */
    const clearAlert = useCallback((alertId) => {
        setAlerts(prevAlerts => prevAlerts.filter(alert => alert.id !== alertId));
    }, []);

    /**
     * Clear all alerts
     */
    const clearAllAlerts = useCallback(() => {
        setAlerts([]);
    }, []);

    /**
     * Get latest sensor data for specific device
     */
    const getLatestDeviceData = useCallback((deviceId) => {
        return latestDataRef.current.sensorData
            .filter(data => data.deviceId === deviceId)
            .slice(-1)[0] || null;
    }, []);

    /**
     * Get device-specific anomalies
     */
    const getDeviceAnomalies = useCallback((deviceId) => {
        return latestDataRef.current.anomalies.filter(anomaly => anomaly.deviceId === deviceId);
    }, []);

    return {
        // State
        sensorData,
        mlInsights,
        anomalies,
        trends,
        connectionStatus,
        alerts,
        isLoading,
        error,

        // Actions
        refreshMLInsights,
        clearAlert,
        clearAllAlerts,
        getLatestDeviceData,
        getDeviceAnomalies,

        // WebSocket status
        isConnected: connectionStatus
    };
};

export default useRealTimeData;
