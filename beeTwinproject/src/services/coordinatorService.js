/**
 * Koordinatör Eşleştirme Servisi - Frontend
 * 
 * Backend'den koordinatör eşleştirme verilerini alır ve
 * dashboard card'larında kullanılmak üzere işler.
 */

class CoordinatorService {
    static API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

    /**
     * Mevcut kullanıcının kovan eşleştirme durumunu getir
     * @returns {Promise<Object>} Eşleştirme durumu
     */
    static async getHiveMatchingStatus() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Authentication token not found');
            }

            const response = await fetch(`${this.API_BASE}/coordinator/status`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch hive matching status');
            }

            return {
                success: true,
                data: data.data
            };

        } catch (error) {
            console.error('❌ Kovan eşleştirme durumu hatası:', error);
            return {
                success: false,
                error: error.message,
                data: {
                    totalHives: 0,
                    connectedHives: 0,
                    disconnectedHives: 0,
                    errorHives: 0,
                    unknownHives: 0,
                    hiveDetails: []
                }
            };
        }
    }

    /**
     * Belirli bir kullanıcının kovan eşleştirme durumunu getir (admin için)
     * @param {String} userId - Kullanıcı ID'si
     * @returns {Promise<Object>} Eşleştirme durumu
     */
    static async getUserHiveMatchingStatus(userId) {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Authentication token not found');
            }

            const response = await fetch(`${this.API_BASE}/coordinator/status/${userId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch user hive matching status');
            }

            return {
                success: true,
                data: data.data
            };

        } catch (error) {
            console.error('❌ Kullanıcı kovan eşleştirme durumu hatası:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Test amaçlı koordinatör verisi simüle et
     * @param {String} coordinatorAddress - Koordinatör adresi (isteğe bağlı)
     * @returns {Promise<Object>} Simülasyon sonucu
     */
    static async simulateCoordinatorData(coordinatorAddress = '192.168.1.100') {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Authentication token not found');
            }

            const response = await fetch(`${this.API_BASE}/coordinator/simulate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ coordinatorAddress })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to simulate coordinator data');
            }

            return {
                success: true,
                data: data
            };

        } catch (error) {
            console.error('❌ Koordinatör simülasyon hatası:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Dashboard için özetlenmiş koordinatör durumu
     * @returns {Promise<Object>} Dashboard özet verileri
     */
    static async getDashboardSummary() {
        try {
            const statusResult = await this.getHiveMatchingStatus();
            
            if (!statusResult.success) {
                return {
                    success: false,
                    error: statusResult.error,
                    summary: this.getEmptySummary()
                };
            }

            const status = statusResult.data;

            // Dashboard için özetlenmiş veriler
            const summary = {
                // Temel metrikler
                totalHives: status.totalHives,
                connectedHives: status.connectedHives,
                disconnectedHives: status.disconnectedHives,
                errorHives: status.errorHives,
                unknownHives: status.unknownHives,

                // Yüzdeler
                connectionRate: status.totalHives > 0 ? 
                    Math.round((status.connectedHives / status.totalHives) * 100) : 0,
                
                // Durum kategorileri
                healthyHives: status.hiveDetails.filter(h => 
                    h.connectionStatus === 'connected' && h.recentSensors > 0
                ).length,
                
                warningHives: status.hiveDetails.filter(h => 
                    h.connectionStatus === 'connected' && h.recentSensors === 0
                ).length,

                // Son aktivite
                lastActivity: this.getLastActivity(status.hiveDetails),
                
                // Aktif router'lar
                activeRouters: this.getActiveRouters(status.hiveDetails),
                
                // Sensör durumu
                totalSensors: status.hiveDetails.reduce((sum, h) => 
                    sum + (h.totalSensors || 0), 0),
                activeSensors: status.hiveDetails.reduce((sum, h) => 
                    sum + (h.connectedSensors || 0), 0),

                // Dashboard card'ları için detay veriler
                hiveDetails: status.hiveDetails.map(hive => ({
                    id: hive.hiveId,
                    name: hive.hiveName,
                    apiary: hive.apiaryName,
                    status: hive.connectionStatus,
                    lastSeen: hive.lastDataReceived,
                    routerCount: hive.routerIds ? hive.routerIds.length : 0,
                    sensorCount: hive.sensorIds ? hive.sensorIds.length : 0,
                    isOnline: hive.connectionStatus === 'connected',
                    hasRecentData: hive.recentSensors > 0
                }))
            };

            return {
                success: true,
                summary
            };

        } catch (error) {
            console.error('❌ Dashboard özet hatası:', error);
            return {
                success: false,
                error: error.message,
                summary: this.getEmptySummary()
            };
        }
    }

    /**
     * Boş özet verisi
     * @returns {Object} Boş dashboard özeti
     */
    static getEmptySummary() {
        return {
            totalHives: 0,
            connectedHives: 0,
            disconnectedHives: 0,
            errorHives: 0,
            unknownHives: 0,
            connectionRate: 0,
            healthyHives: 0,
            warningHives: 0,
            lastActivity: null,
            activeRouters: [],
            totalSensors: 0,
            activeSensors: 0,
            hiveDetails: []
        };
    }

    /**
     * Son aktivite zamanını bul
     * @param {Array} hiveDetails - Kovan detayları
     * @returns {Date|null} Son aktivite zamanı
     */
    static getLastActivity(hiveDetails) {
        let lastActivity = null;

        for (const hive of hiveDetails) {
            if (hive.lastDataReceived) {
                const hiveTime = new Date(hive.lastDataReceived);
                if (!lastActivity || hiveTime > lastActivity) {
                    lastActivity = hiveTime;
                }
            }
        }

        return lastActivity;
    }

    /**
     * Aktif router'ları listele
     * @param {Array} hiveDetails - Kovan detayları
     * @returns {Array} Aktif router ID'leri
     */
    static getActiveRouters(hiveDetails) {
        const activeRouters = new Set();

        for (const hive of hiveDetails) {
            if (hive.connectionStatus === 'connected' && hive.routerIds) {
                for (const routerId of hive.routerIds) {
                    activeRouters.add(routerId);
                }
            }
        }

        return Array.from(activeRouters);
    }

    /**
     * Real-time WebSocket bağlantısı kur
     * @param {Function} onCoordinatorData - Koordinatör verisi callback'i
     * @param {Function} onError - Hata callback'i
     * @returns {WebSocket|null} WebSocket bağlantısı
     */
    static connectWebSocket(onCoordinatorData, onError) {
        try {
            const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:5000';
            const socket = new WebSocket(wsUrl);

            socket.onopen = () => {
                console.log('🔗 Koordinatör WebSocket bağlandı');
            };

            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'coordinator_match') {
                        onCoordinatorData(data.data);
                    }
                } catch (error) {
                    console.error('❌ WebSocket mesaj işleme hatası:', error);
                }
            };

            socket.onerror = (error) => {
                console.error('❌ Koordinatör WebSocket hatası:', error);
                if (onError) onError(error);
            };

            socket.onclose = () => {
                console.log('🔌 Koordinatör WebSocket bağlantısı kapandı');
            };

            return socket;

        } catch (error) {
            console.error('❌ WebSocket bağlantı hatası:', error);
            if (onError) onError(error);
            return null;
        }
    }
}

export default CoordinatorService;
