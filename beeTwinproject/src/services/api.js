// API base URL
const API_BASE_URL = 'http://localhost:5000/api';

// API service sınıfı
class ApiService {

    // Login API call
    static async login(email, password) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login başarısız');
            }

            // Token'ı localStorage'a kaydet
            if (data.data && data.data.token) {
                localStorage.setItem('token', data.data.token);
                localStorage.setItem('user', JSON.stringify(data.data.user));
            }

            return {
                success: true,
                data: data.data  // Backend'den gelen data.data'yı direkt döndür
            };

        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Register API call
    static async register(userData) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (!response.ok) {
                // Backend'ten detaylı hata mesajı al
                let errorMessage = data.message || 'Kayıt başarısız';

                // Validation hataları varsa onları göster
                if (data.errors && data.errors.length > 0) {
                    errorMessage = data.errors.map(err => err.msg).join(', ');
                }

                throw new Error(errorMessage);
            }

            // Token'ı localStorage'a kaydet
            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
            }

            return {
                success: true,
                data: data
            };

        } catch (error) {
            console.error('Register error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // User profile getir
    static async getUserProfile() {
        try {
            const token = localStorage.getItem('token');

            if (!token) {
                throw new Error('Token bulunamadı');
            }

            const response = await fetch(`${API_BASE_URL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Profil getirilemedi');
            }

            return {
                success: true,
                data: data
            };

        } catch (error) {
            console.error('Get profile error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Logout
    static logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }

    // Token kontrol et
    static isAuthenticated() {
        const token = localStorage.getItem('token');
        return !!token;
    }

    // Stored user data getir
    static getCurrentUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }

    // Admin için tüm arılıkları getir
    static async getAdminApiaries() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/admin/apiaries`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Arılıklar alınamadı');
            }

            return {
                success: true,
                data: data.data
            };

        } catch (error) {
            console.error('Admin apiaries error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Kullanıcının arılıklarını getir
    static async getUserApiaries() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/apiaries`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Arılıklar alınamadı');
            }

            return {
                success: true,
                data: data.data?.apiaries || data.data || [] // Backend'den gelen yapıya göre
            };

        } catch (error) {
            console.error('User apiaries error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Kullanıcının kovanlarını getir
    static async getUserHives() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/users/hives`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Kovanlar alınamadı');
            }

            return {
                success: true,
                data: data.data
            };

        } catch (error) {
            console.error('User hives error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Router API calls
    static async getSensorTypes() {
        try {
            const response = await this.get('/routers/sensor-types');
            return response;
        } catch (error) {
            console.error('Sensor types error:', error);
            throw error;
        }
    }

    static async createRouter(routerData) {
        try {
            const response = await this.post('/routers/create', routerData);
            return response;
        } catch (error) {
            console.error('Create router error:', error);
            throw error;
        }
    }

    static async getUserRouters() {
        try {
            const response = await this.get('/routers/user');
            return response;
        } catch (error) {
            console.error('Get user routers error:', error);
            throw error;
        }
    }

    static async getRouter(routerId) {
        try {
            const response = await this.get(`/routers/${routerId}`);
            return response;
        } catch (error) {
            console.error('Get router error:', error);
            throw error;
        }
    }

    static async updateRouter(routerId, updateData) {
        try {
            const response = await this.put(`/routers/${routerId}`, updateData);
            return response;
        } catch (error) {
            console.error('Update router error:', error);
            throw error;
        }
    }

    static async deleteRouter(routerId) {
        try {
            const response = await this.delete(`/routers/${routerId}`);
            return response;
        } catch (error) {
            console.error('Delete router error:', error);
            throw error;
        }
    }

    static async getSensorTypeKeys(sensorType) {
        try {
            const response = await this.get(`/routers/sensor-types/${sensorType}/keys`);
            return response;
        } catch (error) {
            console.error('Get sensor type keys error:', error);
            throw error;
        }
    }
}

export default ApiService;
