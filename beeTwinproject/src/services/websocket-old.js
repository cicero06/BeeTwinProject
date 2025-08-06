/**
 * WebSocket Service for Real-time Data Communication
 * Handles connection to backend WebSocket server for live sensor data and ML insights
 */

import { io } from 'socket.io-client';

class WebSocketService {
    constructor() {
        this.ws = null;
        this.listeners = {
            sensorData: [],
            mlInsights: [],
            anomaly: [],
            trend: [],
            error: [],
            connectionStatus: []
        };
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectInterval = 5000;
        this.isConnected = false;
        this.isConnecting = false; // Prevent multiple connections
        this.connectionPromise = null; // Store connection promise
        this.connectionCounter = 0; // Track connection attempts
        this.hookInstances = new Set(); // Track hook instances
        this.connectionId = Math.random().toString(36).substr(2, 9); // Unique connection ID

        console.log(`🆔 WebSocket Service initialized with ID: ${this.connectionId}`);
    }

    /**
     * Connect to WebSocket server
     */
    connect(url = 'ws://localhost:5000') {
        this.connectionCounter++;
        const currentAttempt = this.connectionCounter;

        console.log(`🔌 Connection attempt #${currentAttempt} from WebSocket ID: ${this.connectionId}`);
        console.log(`📊 Total hook instances tracked: ${this.hookInstances.size}`);

        // If already connected or connecting, return existing promise
        if (this.isConnected || this.isConnecting) {
            console.log(`♻️ Reusing existing connection (attempt #${currentAttempt})`);
            return this.connectionPromise;
        }

        console.log(`🚀 Creating new WebSocket connection (attempt #${currentAttempt})...`);
        this.isConnecting = true;

        this.connectionPromise = new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket(url);

                this.ws.onopen = () => {
                    console.log('✅ WebSocket connected (single instance)');
                    this.isConnected = true;
                    this.isConnecting = false;
                    this.reconnectAttempts = 0;
                    this.notifyListeners('connectionStatus', { connected: true });
                    resolve(this.ws);
                };

                this.ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        this.handleMessage(data);
                    } catch (error) {
                        console.error('❌ Error parsing WebSocket message:', error);
                    }
                };

                this.ws.onclose = () => {
                    console.log('🔌 WebSocket disconnected');
                    this.isConnected = false;
                    this.isConnecting = false;
                    this.connectionPromise = null;
                    this.notifyListeners('connectionStatus', { connected: false });
                    this.handleReconnect();
                };

                this.ws.onerror = (error) => {
                    console.error('❌ WebSocket error:', error);
                    this.isConnecting = false;
                    this.notifyListeners('error', { error: 'WebSocket connection error' });
                    // NO MOCK DATA - Let system show real "no data" state
                    console.log('📡 WebSocket failed - System will show "No Data" state');
                    reject(error);
                };

            } catch (error) {
                console.error('❌ Failed to connect WebSocket:', error);
                this.isConnecting = false;
                this.notifyListeners('error', { error: 'Failed to establish WebSocket connection' });
                // NO MOCK DATA - Let system show real "no data" state
                console.log('📡 WebSocket connection failed - System will show "No Data" state');
                reject(error);
            }
        });

        return this.connectionPromise;
    }

    /**
     * Show real system state - no mock data
     * This method intentionally does nothing to let the system show actual data state
     */
    showRealDataState() {
        console.log('📡 Real Data Mode: No fake data, showing actual system state');
        // Notify that we're in "no data" mode
        this.notifyListeners('connectionStatus', { connected: false, reason: 'No real data source' });
    }

    /**
     * Register a hook instance using this service
     */
    registerHook(hookId) {
        this.hookInstances.add(hookId);
        console.log(`📝 Registered hook instance: ${hookId}`);
        console.log(`📊 Total registered hooks: ${this.hookInstances.size}`);
    }

    /**
     * Unregister a hook instance
     */
    unregisterHook(hookId) {
        this.hookInstances.delete(hookId);
        console.log(`🗑️ Unregistered hook instance: ${hookId}`);
        console.log(`📊 Remaining registered hooks: ${this.hookInstances.size}`);

        // If no more hooks are using the service, we could optionally disconnect
        if (this.hookInstances.size === 0) {
            console.log('ℹ️ No more hooks using WebSocket service');
        }
    }

    /**
     * Stop mock data
     */
    stopMockData() {
        if (this.mockDataInterval) {
            clearInterval(this.mockDataInterval);
            this.mockDataInterval = null;
            console.log('📡 Mock data simulation stopped');
        }
    }

    /**
     * Handle incoming WebSocket messages
     */
    handleMessage(data) {
        switch (data.type) {
            case 'sensorData':
                this.notifyListeners('sensorData', data.payload);
                break;

            case 'mlInsights':
                this.notifyListeners('mlInsights', data.payload);
                break;

            case 'anomaly':
                this.notifyListeners('anomaly', data.payload);
                break;

            case 'trend':
                this.notifyListeners('trend', data.payload);
                break;

            default:
                console.log('📥 Unknown WebSocket message type:', data.type);
        }
    }

    /**
     * Add event listener
     */
    on(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
    }

    /**
     * Remove event listener
     */
    off(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
    }

    /**
     * Notify all listeners for an event
     */
    notifyListeners(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }

    /**
     * Handle reconnection logic
     */
    handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`🔄 Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

            setTimeout(() => {
                this.connect();
            }, this.reconnectInterval);
        } else {
            console.error('❌ Max reconnection attempts reached');
            this.notifyListeners('error', { error: 'Maximum reconnection attempts reached' });
        }
    }

    /**
     * Send message to WebSocket server
     */
    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        } else {
            console.warn('⚠️ WebSocket not connected, cannot send message');
        }
    }

    /**
     * Disconnect WebSocket
     */
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
            this.isConnected = false;
        }
    }

    /**
     * Get connection status
     */
    getConnectionStatus() {
        return this.isConnected;
    }
}

// Create singleton instance
const websocketService = new WebSocketService();

export default websocketService;
