/**
 * WebSocket Service for Real-time Data Communication
 * Uses Socket.IO client to connect to backend Socket.IO server
 */

import { io } from 'socket.io-client';

class WebSocketService {
    constructor() {
        this.socket = null;
        this.listeners = {
            sensorData: [],
            mlInsights: [],
            anomaly: [],
            trend: [],
            error: [],
            connectionStatus: []
        };
        this.isConnected = false;
        this.isConnecting = false;
        this.connectionId = Math.random().toString(36).substr(2, 9);

        console.log(`🆔 WebSocket Service initialized with ID: ${this.connectionId}`);
    }

    /**
     * Connect to Socket.IO server
     */
    connect(url = 'http://localhost:5000') {
        if (this.isConnected || this.isConnecting) {
            console.log('♻️ Already connected or connecting');
            return Promise.resolve();
        }

        console.log(`🚀 Connecting to Socket.IO server: ${url}`);
        this.isConnecting = true;

        return new Promise((resolve, reject) => {
            try {
                // Get JWT token for authentication
                const token = localStorage.getItem('token');

                if (!token) {
                    console.warn('⚠️ No JWT token found for WebSocket authentication');
                    // Still try to connect without auth for now
                }

                this.socket = io(url, {
                    auth: {
                        token: token
                    },
                    transports: ['websocket', 'polling'],
                    autoConnect: true
                });

                this.socket.on('connect', () => {
                    console.log('✅ Socket.IO connected successfully');
                    this.isConnected = true;
                    this.isConnecting = false;
                    this.notifyListeners('connectionStatus', { connected: true });
                    resolve();
                });

                // Listen for real-time sensor data
                this.socket.on('sensor-data', (data) => {
                    console.log('📡 Real-time sensor data received:', data);
                    this.notifyListeners('sensorData', data);
                });

                // Listen for ML insights
                this.socket.on('ml-insights', (data) => {
                    console.log('🧠 ML insights received:', data);
                    this.notifyListeners('mlInsights', data);
                });

                // Listen for anomaly alerts
                this.socket.on('anomaly-alert', (data) => {
                    console.log('🚨 Anomaly alert received:', data);
                    this.notifyListeners('anomaly', data);
                });

                // Listen for raw sensor data (broadcasted from backend)
                this.socket.on('raw-sensor-data', (data) => {
                    console.log('📊 Raw sensor data received:', data);
                    // Convert to our format and notify
                    this.notifyListeners('sensorData', data);
                });

                this.socket.on('disconnect', () => {
                    console.log('❌ Socket.IO disconnected');
                    this.isConnected = false;
                    this.notifyListeners('connectionStatus', { connected: false });

                    // 🔧 OPTİMİZASYON: Otomatik reconnection
                    setTimeout(() => {
                        console.log('🔄 Attempting automatic reconnection...');
                        this.connect();
                    }, 5000);
                });

                this.socket.on('connect_error', (error) => {
                    console.error('❌ Socket.IO connection error:', error);
                    this.isConnected = false;
                    this.isConnecting = false;
                    this.notifyListeners('error', error.message);
                    reject(error);
                });

            } catch (error) {
                console.error('❌ Socket.IO setup error:', error);
                this.isConnected = false;
                this.isConnecting = false;
                reject(error);
            }
        });
    }

    /**
     * Add event listener
     */
    addEventListener(eventType, callback) {
        if (this.listeners[eventType]) {
            this.listeners[eventType].push(callback);
            console.log(`🎧 Added listener for ${eventType}. Total: ${this.listeners[eventType].length}`);
        } else {
            console.warn(`⚠️ Unknown event type: ${eventType}`);
        }
    }

    /**
     * Register hook for useRealTimeData compatibility
     */
    registerHook(hookId, callback) {
        console.log(`🔗 Registering hook ${hookId}`);

        // Register for all sensor data events
        this.addEventListener('sensorData', callback);
        this.addEventListener('mlInsights', callback);
        this.addEventListener('connectionStatus', callback);

        return () => {
            console.log(`🔓 Unregistering hook ${hookId}`);
            this.removeEventListener('sensorData', callback);
            this.removeEventListener('mlInsights', callback);
            this.removeEventListener('connectionStatus', callback);
        };
    }

    /**
     * Unregister hook - for backward compatibility
     */
    unregisterHook(hookId) {
        console.log(`🔓 Unregistering hook ${hookId} (legacy method)`);
        // Note: This is a legacy method, registerHook should return cleanup function
    }

    /**
     * Remove event listener
     */
    removeEventListener(eventType, callback) {
        if (this.listeners[eventType]) {
            const index = this.listeners[eventType].indexOf(callback);
            if (index > -1) {
                this.listeners[eventType].splice(index, 1);
                console.log(`🗑️ Removed listener for ${eventType}. Remaining: ${this.listeners[eventType].length}`);
            }
        }
    }

    /**
     * Notify all listeners of an event
     */
    notifyListeners(eventType, data) {
        if (this.listeners[eventType]) {
            console.log(`📢 Notifying ${this.listeners[eventType].length} listeners for ${eventType}`);
            this.listeners[eventType].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`❌ Error in ${eventType} listener:`, error);
                }
            });
        }
    }

    /**
     * Disconnect from server
     */
    disconnect() {
        if (this.socket) {
            console.log('👋 Disconnecting Socket.IO...');
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
            this.isConnecting = false;
        }
    }

    /**
     * Get connection status
     */
    getConnectionStatus() {
        return {
            connected: this.isConnected,
            connecting: this.isConnecting
        };
    }
}

// Export singleton instance
const websocketService = new WebSocketService();
export default websocketService;
