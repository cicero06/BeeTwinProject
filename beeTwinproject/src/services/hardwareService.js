/**
 * Hardware Management Service
 * Router/Sensor ID eşleştirme ve transfer işlemleri
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class HardwareService {
    /**
     * Hardware'i kovan ile eşleştir
     */
    static async assignHardware(hiveId, hardwareData) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/hardware/assign`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    hiveId,
                    ...hardwareData
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Hardware eşleştirme hatası');
            }

            return {
                success: true,
                data: data.data,
                message: data.message
            };

        } catch (error) {
            console.error('Hardware assign error:', error);
            return {
                success: false,
                message: error.message || 'Hardware eşleştirme sırasında hata oluştu'
            };
        }
    }

    /**
     * Hardware'i bir kovandan diğerine transfer et
     */
    static async transferHardware(fromHiveId, toHiveId) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/hardware/transfer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    fromHiveId,
                    toHiveId
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Hardware transfer hatası');
            }

            return {
                success: true,
                data: data.data,
                message: data.message
            };

        } catch (error) {
            console.error('Hardware transfer error:', error);
            return {
                success: false,
                message: error.message || 'Hardware transfer sırasında hata oluştu'
            };
        }
    }

    /**
     * Router ID kullanım durumunu kontrol et
     */
    static async checkRouterAvailability(routerId) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/hardware/check/${routerId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Router kontrol hatası');
            }

            return {
                success: true,
                available: data.available,
                usedBy: data.usedBy,
                message: data.message
            };

        } catch (error) {
            console.error('Router check error:', error);
            return {
                success: false,
                message: error.message || 'Router kontrolü sırasında hata oluştu'
            };
        }
    }

    /**
     * Kullanıcının tüm hardware eşleştirmelerini listele
     */
    static async getHardwareList() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/hardware/list`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Hardware listesi alınamadı');
            }

            return {
                success: true,
                data: data.data,
                stats: data.stats
            };

        } catch (error) {
            console.error('Hardware list error:', error);
            return {
                success: false,
                message: error.message || 'Hardware listesi alınırken hata oluştu'
            };
        }
    }

    /**
     * Router ID validasyonu
     */
    static validateRouterId(routerId) {
        if (!routerId || typeof routerId !== 'string') {
            return { valid: false, message: 'Router ID boş olamaz' };
        }

        const trimmedId = routerId.trim();
        if (trimmedId.length === 0) {
            return { valid: false, message: 'Router ID boş olamaz' };
        }

        // Sadece sayı ve harf içermeli (özel karakterler yok)
        const routerIdPattern = /^[a-zA-Z0-9]+$/;
        if (!routerIdPattern.test(trimmedId)) {
            return { valid: false, message: 'Router ID sadece harf ve rakam içerebilir' };
        }

        // Çok uzun olmasın
        if (trimmedId.length > 20) {
            return { valid: false, message: 'Router ID 20 karakterden uzun olamaz' };
        }

        return { valid: true, message: 'Router ID geçerli' };
    }

    /**
     * Sensor ID validasyonu
     */
    static validateSensorId(sensorId) {
        if (!sensorId) {
            return { valid: true, message: 'Sensor ID opsiyonel' }; // Opsiyonel
        }

        if (typeof sensorId !== 'string') {
            return { valid: false, message: 'Sensor ID string olmalı' };
        }

        const trimmedId = sensorId.trim();
        if (trimmedId.length === 0) {
            return { valid: true, message: 'Sensor ID opsiyonel' };
        }

        // Sadece sayı ve harf içermeli
        const sensorIdPattern = /^[a-zA-Z0-9]+$/;
        if (!sensorIdPattern.test(trimmedId)) {
            return { valid: false, message: 'Sensor ID sadece harf ve rakam içerebilir' };
        }

        if (trimmedId.length > 20) {
            return { valid: false, message: 'Sensor ID 20 karakterden uzun olamaz' };
        }

        return { valid: true, message: 'Sensor ID geçerli' };
    }

    /**
     * Hardware verilerini format et
     */
    static formatHardwareData(hardwareData) {
        return {
            routerId: hardwareData.routerId?.trim() || null,
            sensorId: hardwareData.sensorId?.trim() || null,
            coordinatorAddress: hardwareData.coordinatorAddress?.trim() || null,
            channel: hardwareData.channel ? parseInt(hardwareData.channel) : 23
        };
    }

    /**
     * Hardware eşleştirme durumunu kontrol et
     */
    static getConnectionStatus(hardware) {
        if (!hardware) return { status: 'no-hardware', message: 'Hardware tanımlanmamış', color: 'gray' };

        if (!hardware.routerId) return { status: 'no-router', message: 'Router ID eksik', color: 'red' };

        if (hardware.isConnected && hardware.connectionStatus === 'connected') {
            return { status: 'connected', message: 'Bağlı ve aktif', color: 'green' };
        }

        if (hardware.connectionStatus === 'error') {
            return { status: 'error', message: 'Bağlantı hatası', color: 'red' };
        }

        return { status: 'disconnected', message: 'Bağlantı yok', color: 'orange' };
    }
}

export default HardwareService;
