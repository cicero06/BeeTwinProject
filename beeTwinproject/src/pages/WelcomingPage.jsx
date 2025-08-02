import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../services/api';
import GoogleSignIn from '../components/GoogleSignIn';
import HiveHardwareMappingForm from '../components/HiveHardwareMappingForm';
import LocationPicker from '../components/LocationPicker';

function WelcomingPage() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [showTypewriter, setShowTypewriter] = useState(false);
    const [userType, setUserType] = useState('');
    const [registrationStep, setRegistrationStep] = useState(1);
    const [apiaries, setApiaries] = useState([{
        name: '',
        location: '',
        latitude: null,
        longitude: null,
        hiveCount: '',
        hives: []
    }]);
    const [showLocationPicker, setShowLocationPicker] = useState(false);
    const [selectedApiaryIndex, setSelectedApiaryIndex] = useState(null);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
    const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);

    // Login form state'leri
    const [loginData, setLoginData] = useState({
        email: '',
        password: ''
    });

    // Register form state'leri
    const [registerData, setRegisterData] = useState({
        // Step 1: Kullanıcı tipi
        userType: '', // 'beekeeper' veya 'admin'

        // Step 2: Kişisel bilgiler
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        location: '',
        phone: '',

        // Step 3: Arıcı bilgileri (sadece beekeeper için)
        beekeepingInfo: {
            experience: 'beginner',
            totalApiaries: 0,
            totalHives: 0,
            goals: ''
        },
        apiaries: [{
            name: '',
            location: '',
            hiveCount: '',
            hives: [] // Kovan-donanım eşleştirme için
        }]
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();
    const audioRef = useRef(null);

    const addApiary = () => {
        setApiaries([...apiaries, {
            name: '',
            location: '',
            latitude: null,
            longitude: null,
            hiveCount: '',
            hives: []
        }]);
    };

    const removeApiary = (index) => {
        if (apiaries.length > 1) {
            setApiaries(apiaries.filter((_, i) => i !== index));
        }
    };

    const handleApiaryChange = (index, field, value) => {
        const newApiaries = [...apiaries];
        newApiaries[index][field] = value;
        setApiaries(newApiaries);
    };

    // LocationPicker handlers
    const openLocationPicker = (index) => {
        setSelectedApiaryIndex(index);
        setShowLocationPicker(true);
    };

    const handleLocationChange = (latitude, longitude) => {
        if (selectedApiaryIndex !== null) {
            const newApiaries = [...apiaries];
            newApiaries[selectedApiaryIndex].latitude = latitude;
            newApiaries[selectedApiaryIndex].longitude = longitude;
            setApiaries(newApiaries);
        }
    };

    const handleLocationNameChange = (locationName) => {
        if (selectedApiaryIndex !== null) {
            const newApiaries = [...apiaries];
            newApiaries[selectedApiaryIndex].location = locationName;
            setApiaries(newApiaries);
        }
    };

    const closeLocationPicker = () => {
        setShowLocationPicker(false);
        setSelectedApiaryIndex(null);
    };

    const handleNextStep = () => {
        if (registrationStep < 3) {
            setRegistrationStep(registrationStep + 1);
        }
    };

    const handlePreviousStep = () => {
        if (registrationStep > 1) {
            setRegistrationStep(registrationStep - 1);
        }
    };

    const resetRegistration = () => {
        setRegistrationStep(1);
        setUserType('');
        setApiaries([{
            name: '',
            location: '',
            latitude: null,
            longitude: null,
            hiveCount: '',
            hives: []
        }]);
    };

    useEffect(() => {
        // Sayfa yüklendiğinde animasyonları başlat
        const timer = setTimeout(() => {
            setIsLoaded(true);
        }, 100);

        // Typewriter efekti için gecikmeli başlatma
        const typewriterTimer = setTimeout(() => {
            setShowTypewriter(true);
        }, 1500);

        // Müzik çalma (sayfa girişinde sadece bir kez)
        const musicTimer = setTimeout(() => {
            if (audioRef.current) {
                // Ses seviyesini ayarla
                audioRef.current.volume = 0.2;
                // Loop'u kapat - sadece bir kez çalsın
                audioRef.current.loop = false;
                audioRef.current.play().then(() => {

                    // Müzik bittiğinde durdur
                    audioRef.current.addEventListener('ended', () => {

                    });
                }).catch((error) => {

                    // Tarayıcı otomatik oynatmaya izin vermiyorsa, ilk tıklamada başlat
                    document.addEventListener('click', () => {
                        if (audioRef.current) {
                            audioRef.current.loop = false;
                            audioRef.current.play().then(() => {
                                audioRef.current.addEventListener('ended', () => {

                                });
                            }).catch((err) => {

                            });
                        }
                    }, { once: true });
                });
            }
        }, 1500);

        return () => {
            clearTimeout(timer);
            clearTimeout(typewriterTimer);
            clearTimeout(musicTimer);
        };
    }, []);

    const handleSignIn = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const result = await ApiService.login(loginData.email, loginData.password);

            if (result.success) {
                // Kullanıcı tipine göre yönlendirme
                const userType = result.data.user.userType;
                if (userType === 'admin') {
                    navigate('/admin-panel');
                } else {
                    navigate('/dashboard');
                }
            } else {
                setError(result.error);
            }

        } catch (error) {
            console.error('❌ Login exception:', error);
            setError('Giriş sırasında bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    // Google OAuth Handler
    const handleGoogleSuccess = async (userData) => {
        try {
            setLoading(true);


            const response = await fetch('http://localhost:5000/api/auth/google-auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    credential: userData.credential // Google'dan gelen JWT token
                })
            });

            const result = await response.json();

            if (result.success) {


                // Token'ı localStorage'a kaydet
                localStorage.setItem('token', result.data.token);
                localStorage.setItem('user', JSON.stringify(result.data.user));

                // Kullanıcı tipine göre yönlendirme
                const userType = result.data.user.userType;
                if (userType === 'admin') {
                    navigate('/admin-panel');
                } else {
                    navigate('/dashboard');
                }
            } else {
                console.error('❌ Google OAuth failed:', result.message);
                setError(result.message);
            }

        } catch (error) {
            console.error('❌ Google OAuth exception:', error);
            setError('Google ile giriş sırasında bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleError = (error) => {
        console.error('Google Sign-In Error:', error);
        setError(error);
    };

    const handleSignUp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {


            // Şifre kontrolü
            if (registerData.password !== registerData.confirmPassword) {
                setError('Şifreler eşleşmiyor');
                setLoading(false);
                return;
            }

            // Şifre uzunluk kontrolü
            if (registerData.password.length < 6) {
                setError('Şifre en az 6 karakter olmalıdır');
                setLoading(false);
                return;
            }

            // Şifre karmaşıklık kontrolü
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
            if (!passwordRegex.test(registerData.password)) {
                setError('Şifre en az 1 küçük harf, 1 büyük harf ve 1 rakam içermelidir');
                setLoading(false);
                return;
            }

            // API için veri hazırla
            const requestData = {
                firstName: registerData.firstName,
                lastName: registerData.lastName,
                email: registerData.email,
                password: registerData.password,
                location: registerData.location,
                userType: userType,
            };

            // Arıcı ise beekeeping bilgilerini ekle
            if (userType === 'beekeeper') {
                requestData.beekeepingInfo = {
                    experience: registerData.beekeepingInfo?.experience || 'beginner',
                    totalApiaries: registerData.beekeepingInfo?.totalApiaries || 0,
                    totalHives: registerData.beekeepingInfo?.totalHives || 0,
                    goals: registerData.beekeepingInfo?.goals || ''
                };

                // Arılık ve kovan bilgilerini ekle
                requestData.apiaries = apiaries.map(apiary => ({
                    name: apiary.name,
                    location: apiary.location,
                    hiveCount: apiary.hiveCount,
                    hives: apiary.hives || []
                }));
            }



            const result = await ApiService.register(requestData);

            if (result.success) {


                // Kullanıcı tipine göre yönlendirme
                if (userType === 'admin') {
                    navigate('/admin-panel');
                } else {
                    navigate('/dashboard');
                }
            } else {
                console.error('❌ Register failed:', result.error);
                setError(result.error);
            }

        } catch (error) {
            console.error('❌ Register exception:', error);
            setError('Kayıt sırasında bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    // Şifremi unuttum fonksiyonu
    const handleForgotPassword = async (e) => {
        e.preventDefault();

        if (!forgotPasswordEmail.trim()) {
            setError('E-posta adresi gereklidir');
            return;
        }

        try {
            setForgotPasswordLoading(true);
            setError('');

            const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: forgotPasswordEmail })
            });

            const data = await response.json();

            if (data.success) {
                alert(`Şifre sıfırlama bağlantısı gönderildi! \n\nDEV: ${data.resetLink}`);
                setShowForgotPassword(false);
                setForgotPasswordEmail('');
            } else {
                setError(data.message || 'Bir hata oluştu');
            }

        } catch (error) {
            console.error('Forgot password error:', error);
            setError('Bir hata oluştu, lütfen tekrar deneyin');
        } finally {
            setForgotPasswordLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative overflow-hidden">


            {/* Background Layers */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"></div>

            {/* Honeycomb Pattern Background */}
            <div className="absolute inset-0 opacity-10 dark:opacity-20">
                <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23F59E0B' fill-opacity='0.8'%3E%3Cpath d='M50 15L65 25L65 45L50 55L35 45L35 25z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    backgroundSize: '100px 100px',
                }}></div>
            </div>

            {/* Floating Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                {/* Large Floating Hexagons */}
                <div className="absolute top-20 left-10 w-40 h-40 opacity-20 animate-float-slow">
                    <svg viewBox="0 0 100 100" className="w-full h-full fill-amber-400 dark:fill-amber-600">
                        <path d="M50 15L65 25L65 45L50 55L35 45L35 25z" />
                    </svg>
                </div>
                <div className="absolute top-40 right-20 w-32 h-32 opacity-25 animate-float-slow" style={{ animationDelay: '2s' }}>
                    <svg viewBox="0 0 100 100" className="w-full h-full fill-orange-400 dark:fill-orange-600">
                        <path d="M50 15L65 25L65 45L50 55L35 45L35 25z" />
                    </svg>
                </div>
                <div className="absolute bottom-32 left-20 w-36 h-36 opacity-18 animate-float-slow" style={{ animationDelay: '4s' }}>
                    <svg viewBox="0 0 100 100" className="w-full h-full fill-yellow-400 dark:fill-yellow-600">
                        <path d="M50 15L65 25L65 45L50 55L35 45L35 25z" />
                    </svg>
                </div>
                <div className="absolute bottom-20 right-32 w-28 h-28 opacity-22 animate-float-slow" style={{ animationDelay: '1s' }}>
                    <svg viewBox="0 0 100 100" className="w-full h-full fill-amber-300 dark:fill-amber-700">
                        <path d="M50 15L65 25L65 45L50 55L35 45L35 25z" />
                    </svg>
                </div>
                <div className="absolute top-64 left-1/4 w-24 h-24 opacity-20 animate-float-slow" style={{ animationDelay: '3s' }}>
                    <svg viewBox="0 0 100 100" className="w-full h-full fill-orange-300 dark:fill-orange-700">
                        <path d="M50 15L65 25L65 45L50 55L35 45L35 25z" />
                    </svg>
                </div>
                <div className="absolute bottom-64 right-1/4 w-20 h-20 opacity-25 animate-float-slow" style={{ animationDelay: '5s' }}>
                    <svg viewBox="0 0 100 100" className="w-full h-full fill-yellow-300 dark:fill-yellow-700">
                        <path d="M50 15L65 25L65 45L50 55L35 45L35 25z" />
                    </svg>
                </div>

                {/* Medium Floating Bees */}
                <div className="absolute top-32 right-40 w-12 h-12 opacity-40 animate-float-fast">
                    <svg viewBox="0 0 24 24" className="w-full h-full fill-amber-600 dark:fill-amber-400">
                        <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm8 9c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2zm-12 0c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2zm4-2c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2v-6c0-1.1-.9-2-2-2h-4z" />
                    </svg>
                </div>
                <div className="absolute bottom-40 left-32 w-10 h-10 opacity-45 animate-float-fast" style={{ animationDelay: '3s' }}>
                    <svg viewBox="0 0 24 24" className="w-full h-full fill-orange-600 dark:fill-orange-400">
                        <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm8 9c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2zm-12 0c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2zm4-2c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2v-6c0-1.1-.9-2-2-2h-4z" />
                    </svg>
                </div>
                <div className="absolute top-80 left-60 w-8 h-8 opacity-35 animate-float-fast" style={{ animationDelay: '1s' }}>
                    <svg viewBox="0 0 24 24" className="w-full h-full fill-yellow-600 dark:fill-yellow-400">
                        <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm8 9c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2zm-12 0c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2zm4-2c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2v-6c0-1.1-.9-2-2-2h-4z" />
                    </svg>
                </div>
                <div className="absolute bottom-80 right-60 w-14 h-14 opacity-30 animate-float-fast" style={{ animationDelay: '4s' }}>
                    <svg viewBox="0 0 24 24" className="w-full h-full fill-amber-500 dark:fill-amber-300">
                        <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm8 9c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2zm-12 0c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2zm4-2c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2v-6c0-1.1-.9-2-2-2h-4z" />
                    </svg>
                </div>

                {/* Decorative Circles */}
                <div className="absolute top-16 left-1/3 w-6 h-6 bg-amber-400 dark:bg-amber-600 rounded-full opacity-40 animate-pulse"></div>
                <div className="absolute top-64 right-1/4 w-8 h-8 bg-orange-400 dark:bg-orange-600 rounded-full opacity-35 animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute bottom-48 left-1/4 w-10 h-10 bg-yellow-400 dark:bg-yellow-600 rounded-full opacity-45 animate-pulse" style={{ animationDelay: '2s' }}></div>
                <div className="absolute bottom-24 right-1/3 w-4 h-4 bg-amber-500 dark:bg-amber-500 rounded-full opacity-50 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                <div className="absolute top-96 left-1/5 w-5 h-5 bg-blue-400 dark:bg-blue-600 rounded-full opacity-30 animate-pulse" style={{ animationDelay: '1.5s' }}></div>
                <div className="absolute bottom-96 right-1/5 w-7 h-7 bg-green-400 dark:bg-green-600 rounded-full opacity-35 animate-pulse" style={{ animationDelay: '2.5s' }}></div>
                <div className="absolute top-40 left-1/6 w-3 h-3 bg-orange-300 dark:bg-orange-700 rounded-full opacity-25 animate-pulse" style={{ animationDelay: '3s' }}></div>
                <div className="absolute bottom-40 right-1/6 w-9 h-9 bg-yellow-300 dark:bg-yellow-700 rounded-full opacity-30 animate-pulse" style={{ animationDelay: '3.5s' }}></div>

                {/* Gradient Overlay for Depth */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent dark:via-black/5"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/10 dark:to-black/10"></div>

                {/* Flying Bees Animation */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {/* Left Side Flying Bees */}
                    <div className="absolute top-1/4 left-0 w-12 h-12 animate-bee-fly-left" style={{ animationDelay: '0s' }}>
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                            <g className="animate-bee-flutter">
                                {/* Bee Body */}
                                <ellipse cx="50" cy="50" rx="20" ry="35" fill="#FFD700" stroke="#FFA500" strokeWidth="2" />
                                {/* Bee Stripes */}
                                <rect x="35" y="35" width="30" height="4" fill="#8B4513" rx="2" />
                                <rect x="35" y="45" width="30" height="4" fill="#8B4513" rx="2" />
                                <rect x="35" y="55" width="30" height="4" fill="#8B4513" rx="2" />
                                <rect x="35" y="65" width="30" height="4" fill="#8B4513" rx="2" />
                                {/* Bee Head */}
                                <circle cx="50" cy="25" r="12" fill="#FFD700" stroke="#FFA500" strokeWidth="2" />
                                {/* Bee Eyes */}
                                <circle cx="45" cy="20" r="3" fill="#000" />
                                <circle cx="55" cy="20" r="3" fill="#000" />
                                {/* Bee Antennae */}
                                <line x1="45" y1="15" x2="42" y2="8" stroke="#8B4513" strokeWidth="2" />
                                <line x1="55" y1="15" x2="58" y2="8" stroke="#8B4513" strokeWidth="2" />
                                <circle cx="42" cy="8" r="2" fill="#8B4513" />
                                <circle cx="58" cy="8" r="2" fill="#8B4513" />
                                {/* Bee Wings */}
                                <ellipse cx="35" cy="40" rx="8" ry="15" fill="#E6E6FA" opacity="0.7" className="animate-wing-flap" />
                                <ellipse cx="65" cy="40" rx="8" ry="15" fill="#E6E6FA" opacity="0.7" className="animate-wing-flap" style={{ animationDelay: '0.1s' }} />
                                <ellipse cx="35" cy="60" rx="6" ry="12" fill="#E6E6FA" opacity="0.6" className="animate-wing-flap" style={{ animationDelay: '0.05s' }} />
                                <ellipse cx="65" cy="60" rx="6" ry="12" fill="#E6E6FA" opacity="0.6" className="animate-wing-flap" style={{ animationDelay: '0.15s' }} />
                            </g>
                        </svg>
                    </div>

                    <div className="absolute top-2/3 left-0 w-10 h-10 animate-bee-fly-left" style={{ animationDelay: '3s' }}>
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                            <g className="animate-bee-flutter">
                                {/* Smaller Bee */}
                                <ellipse cx="50" cy="50" rx="16" ry="28" fill="#FFD700" stroke="#FFA500" strokeWidth="1.5" />
                                <rect x="38" y="38" width="24" height="3" fill="#8B4513" rx="1.5" />
                                <rect x="38" y="48" width="24" height="3" fill="#8B4513" rx="1.5" />
                                <rect x="38" y="58" width="24" height="3" fill="#8B4513" rx="1.5" />
                                <circle cx="50" cy="28" r="10" fill="#FFD700" stroke="#FFA500" strokeWidth="1.5" />
                                <circle cx="46" cy="24" r="2" fill="#000" />
                                <circle cx="54" cy="24" r="2" fill="#000" />
                                <ellipse cx="38" cy="42" rx="6" ry="12" fill="#E6E6FA" opacity="0.7" className="animate-wing-flap" />
                                <ellipse cx="62" cy="42" rx="6" ry="12" fill="#E6E6FA" opacity="0.7" className="animate-wing-flap" style={{ animationDelay: '0.1s' }} />
                            </g>
                        </svg>
                    </div>

                    <div className="absolute top-1/2 left-0 w-8 h-8 animate-bee-fly-wave" style={{ animationDelay: '6s' }}>
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                            <g className="animate-bee-flutter">
                                <ellipse cx="50" cy="50" rx="12" ry="20" fill="#FFD700" stroke="#FFA500" strokeWidth="1" />
                                <rect x="42" y="42" width="16" height="2" fill="#8B4513" rx="1" />
                                <rect x="42" y="52" width="16" height="2" fill="#8B4513" rx="1" />
                                <circle cx="50" cy="32" r="8" fill="#FFD700" stroke="#FFA500" strokeWidth="1" />
                                <circle cx="47" cy="29" r="1.5" fill="#000" />
                                <circle cx="53" cy="29" r="1.5" fill="#000" />
                                <ellipse cx="42" cy="45" rx="4" ry="8" fill="#E6E6FA" opacity="0.7" className="animate-wing-flap" />
                                <ellipse cx="58" cy="45" rx="4" ry="8" fill="#E6E6FA" opacity="0.7" className="animate-wing-flap" />
                            </g>
                        </svg>
                    </div>

                    {/* Right Side Flying Bees */}
                    <div className="absolute top-1/3 right-0 w-12 h-12 animate-bee-fly-right" style={{ animationDelay: '1.5s' }}>
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                            <g className="animate-bee-flutter">
                                {/* Bee Body */}
                                <ellipse cx="50" cy="50" rx="20" ry="35" fill="#FFD700" stroke="#FFA500" strokeWidth="2" />
                                <rect x="35" y="35" width="30" height="4" fill="#8B4513" rx="2" />
                                <rect x="35" y="45" width="30" height="4" fill="#8B4513" rx="2" />
                                <rect x="35" y="55" width="30" height="4" fill="#8B4513" rx="2" />
                                <rect x="35" y="65" width="30" height="4" fill="#8B4513" rx="2" />
                                {/* Bee Head */}
                                <circle cx="50" cy="25" r="12" fill="#FFD700" stroke="#FFA500" strokeWidth="2" />
                                {/* Bee Eyes */}
                                <circle cx="45" cy="20" r="3" fill="#000" />
                                <circle cx="55" cy="20" r="3" fill="#000" />
                                {/* Bee Antennae */}
                                <line x1="45" y1="15" x2="42" y2="8" stroke="#8B4513" strokeWidth="2" />
                                <line x1="55" y1="15" x2="58" y2="8" stroke="#8B4513" strokeWidth="2" />
                                <circle cx="42" cy="8" r="2" fill="#8B4513" />
                                <circle cx="58" cy="8" r="2" fill="#8B4513" />
                                {/* Bee Wings */}
                                <ellipse cx="35" cy="40" rx="8" ry="15" fill="#E6E6FA" opacity="0.7" className="animate-wing-flap" />
                                <ellipse cx="65" cy="40" rx="8" ry="15" fill="#E6E6FA" opacity="0.7" className="animate-wing-flap" style={{ animationDelay: '0.1s' }} />
                                <ellipse cx="35" cy="60" rx="6" ry="12" fill="#E6E6FA" opacity="0.6" className="animate-wing-flap" style={{ animationDelay: '0.05s' }} />
                                <ellipse cx="65" cy="60" rx="6" ry="12" fill="#E6E6FA" opacity="0.6" className="animate-wing-flap" style={{ animationDelay: '0.15s' }} />
                            </g>
                        </svg>
                    </div>

                    <div className="absolute top-3/4 right-0 w-10 h-10 animate-bee-fly-right" style={{ animationDelay: '4.5s' }}>
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                            <g className="animate-bee-flutter">
                                <ellipse cx="50" cy="50" rx="16" ry="28" fill="#FFD700" stroke="#FFA500" strokeWidth="1.5" />
                                <rect x="38" y="38" width="24" height="3" fill="#8B4513" rx="1.5" />
                                <rect x="38" y="48" width="24" height="3" fill="#8B4513" rx="1.5" />
                                <rect x="38" y="58" width="24" height="3" fill="#8B4513" rx="1.5" />
                                <circle cx="50" cy="28" r="10" fill="#FFD700" stroke="#FFA500" strokeWidth="1.5" />
                                <circle cx="46" cy="24" r="2" fill="#000" />
                                <circle cx="54" cy="24" r="2" fill="#000" />
                                <ellipse cx="38" cy="42" rx="6" ry="12" fill="#E6E6FA" opacity="0.7" className="animate-wing-flap" />
                                <ellipse cx="62" cy="42" rx="6" ry="12" fill="#E6E6FA" opacity="0.7" className="animate-wing-flap" style={{ animationDelay: '0.1s' }} />
                            </g>
                        </svg>
                    </div>

                    <div className="absolute top-1/6 right-0 w-8 h-8 animate-bee-fly-right" style={{ animationDelay: '7.5s' }}>
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                            <g className="animate-bee-flutter">
                                <ellipse cx="50" cy="50" rx="12" ry="20" fill="#FFD700" stroke="#FFA500" strokeWidth="1" />
                                <rect x="42" y="42" width="16" height="2" fill="#8B4513" rx="1" />
                                <rect x="42" y="52" width="16" height="2" fill="#8B4513" rx="1" />
                                <circle cx="50" cy="32" r="8" fill="#FFD700" stroke="#FFA500" strokeWidth="1" />
                                <circle cx="47" cy="29" r="1.5" fill="#000" />
                                <circle cx="53" cy="29" r="1.5" fill="#000" />
                                <ellipse cx="42" cy="45" rx="4" ry="8" fill="#E6E6FA" opacity="0.7" className="animate-wing-flap" />
                                <ellipse cx="58" cy="45" rx="4" ry="8" fill="#E6E6FA" opacity="0.7" className="animate-wing-flap" />
                            </g>
                        </svg>
                    </div>

                    {/* Sağ taraf için yeni doğal arı animasyonları */}
                    <div className="absolute top-1/8 right-0 w-7 h-7 animate-bee-fly-spiral" style={{ animationDelay: '13s' }}>
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                            <g className="animate-bee-flutter">
                                <ellipse cx="50" cy="50" rx="11" ry="18" fill="#FFD700" stroke="#FFA500" strokeWidth="1" />
                                <rect x="43" y="43" width="14" height="2" fill="#8B4513" rx="1" />
                                <rect x="43" y="53" width="14" height="2" fill="#8B4513" rx="1" />
                                <circle cx="50" cy="33" r="7" fill="#FFD700" stroke="#FFA500" strokeWidth="1" />
                                <circle cx="47" cy="30" r="1.2" fill="#000" />
                                <circle cx="53" cy="30" r="1.2" fill="#000" />
                                <ellipse cx="43" cy="46" rx="3.5" ry="7" fill="#E6E6FA" opacity="0.7" className="animate-wing-flap" />
                                <ellipse cx="57" cy="46" rx="3.5" ry="7" fill="#E6E6FA" opacity="0.7" className="animate-wing-flap" />
                            </g>
                        </svg>
                    </div>

                    <div className="absolute top-5/8 right-0 w-9 h-9 animate-bee-fly-zigzag" style={{ animationDelay: '16s' }}>
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                            <g className="animate-bee-flutter">
                                <ellipse cx="50" cy="50" rx="14" ry="24" fill="#FFD700" stroke="#FFA500" strokeWidth="1" />
                                <rect x="40" y="40" width="20" height="3" fill="#8B4513" rx="1" />
                                <rect x="40" y="50" width="20" height="3" fill="#8B4513" rx="1" />
                                <rect x="40" y="60" width="20" height="3" fill="#8B4513" rx="1" />
                                <circle cx="50" cy="30" r="9" fill="#FFD700" stroke="#FFA500" strokeWidth="1" />
                                <circle cx="46" cy="27" r="1.5" fill="#000" />
                                <circle cx="54" cy="27" r="1.5" fill="#000" />
                                <ellipse cx="40" cy="45" rx="5" ry="10" fill="#E6E6FA" opacity="0.7" className="animate-wing-flap" />
                                <ellipse cx="60" cy="45" rx="5" ry="10" fill="#E6E6FA" opacity="0.7" className="animate-wing-flap" />
                            </g>
                        </svg>
                    </div>

                    <div className="absolute top-3/8 right-0 w-8 h-8 animate-bee-fly-wave" style={{ animationDelay: '19s' }}>
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                            <g className="animate-bee-flutter">
                                <ellipse cx="50" cy="50" rx="12" ry="20" fill="#FFD700" stroke="#FFA500" strokeWidth="1" />
                                <rect x="42" y="42" width="16" height="2" fill="#8B4513" rx="1" />
                                <rect x="42" y="52" width="16" height="2" fill="#8B4513" rx="1" />
                                <circle cx="50" cy="32" r="8" fill="#FFD700" stroke="#FFA500" strokeWidth="1" />
                                <circle cx="47" cy="29" r="1.5" fill="#000" />
                                <circle cx="53" cy="29" r="1.5" fill="#000" />
                                <ellipse cx="42" cy="45" rx="4" ry="8" fill="#E6E6FA" opacity="0.7" className="animate-wing-flap" />
                                <ellipse cx="58" cy="45" rx="4" ry="8" fill="#E6E6FA" opacity="0.7" className="animate-wing-flap" />
                            </g>
                        </svg>
                    </div>

                    <div className="absolute top-7/8 right-0 w-6 h-6 animate-bee-fly-lazy" style={{ animationDelay: '23s' }}>
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                            <g className="animate-bee-flutter">
                                <ellipse cx="50" cy="50" rx="10" ry="16" fill="#FFD700" stroke="#FFA500" strokeWidth="1" />
                                <rect x="44" y="44" width="12" height="2" fill="#8B4513" rx="1" />
                                <rect x="44" y="54" width="12" height="2" fill="#8B4513" rx="1" />
                                <circle cx="50" cy="36" r="6" fill="#FFD700" stroke="#FFA500" strokeWidth="1" />
                                <circle cx="48" cy="33" r="1" fill="#000" />
                                <circle cx="52" cy="33" r="1" fill="#000" />
                                <ellipse cx="44" cy="47" rx="3" ry="6" fill="#E6E6FA" opacity="0.7" className="animate-wing-flap" />
                                <ellipse cx="56" cy="47" rx="3" ry="6" fill="#E6E6FA" opacity="0.7" className="animate-wing-flap" />
                            </g>
                        </svg>
                    </div>

                    <div className="absolute top-1/12 right-0 w-10 h-10 animate-bee-fly-organic" style={{ animationDelay: '27s' }}>
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                            <g className="animate-bee-flutter">
                                <ellipse cx="50" cy="50" rx="15" ry="25" fill="#FFD700" stroke="#FFA500" strokeWidth="1" />
                                <rect x="38" y="38" width="24" height="3" fill="#8B4513" rx="1" />
                                <rect x="38" y="48" width="24" height="3" fill="#8B4513" rx="1" />
                                <rect x="38" y="58" width="24" height="3" fill="#8B4513" rx="1" />
                                <circle cx="50" cy="28" r="10" fill="#FFD700" stroke="#FFA500" strokeWidth="1" />
                                <circle cx="46" cy="25" r="2" fill="#000" />
                                <circle cx="54" cy="25" r="2" fill="#000" />
                                <ellipse cx="38" cy="45" rx="6" ry="12" fill="#E6E6FA" opacity="0.7" className="animate-wing-flap" />
                                <ellipse cx="62" cy="45" rx="6" ry="12" fill="#E6E6FA" opacity="0.7" className="animate-wing-flap" />
                            </g>
                        </svg>
                    </div>

                    {/* Diagonal Flying Bees */}
                    <div className="absolute top-1/5 left-1/4 w-8 h-8 animate-bee-fly-diagonal" style={{ animationDelay: '2s' }}>
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                            <g className="animate-bee-flutter">
                                <ellipse cx="50" cy="50" rx="12" ry="20" fill="#FFD700" stroke="#FFA500" strokeWidth="1" />
                                <rect x="42" y="42" width="16" height="2" fill="#8B4513" rx="1" />
                                <rect x="42" y="52" width="16" height="2" fill="#8B4513" rx="1" />
                                <circle cx="50" cy="32" r="8" fill="#FFD700" stroke="#FFA500" strokeWidth="1" />
                                <circle cx="47" cy="29" r="1.5" fill="#000" />
                                <circle cx="53" cy="29" r="1.5" fill="#000" />
                                <ellipse cx="42" cy="45" rx="4" ry="8" fill="#E6E6FA" opacity="0.7" className="animate-wing-flap" />
                                <ellipse cx="58" cy="45" rx="4" ry="8" fill="#E6E6FA" opacity="0.7" className="animate-wing-flap" />
                            </g>
                        </svg>
                    </div>

                    <div className="absolute bottom-1/5 right-1/4 w-8 h-8 animate-bee-fly-diagonal-reverse" style={{ animationDelay: '6s' }}>
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                            <g className="animate-bee-flutter">
                                <ellipse cx="50" cy="50" rx="12" ry="20" fill="#FFD700" stroke="#FFA500" strokeWidth="1" />
                                <rect x="42" y="42" width="16" height="2" fill="#8B4513" rx="1" />
                                <rect x="42" y="52" width="16" height="2" fill="#8B4513" rx="1" />
                                <circle cx="50" cy="32" r="8" fill="#FFD700" stroke="#FFA500" strokeWidth="1" />
                                <circle cx="47" cy="29" r="1.5" fill="#000" />
                                <circle cx="53" cy="29" r="1.5" fill="#000" />
                                <ellipse cx="42" cy="45" rx="4" ry="8" fill="#E6E6FA" opacity="0.7" className="animate-wing-flap" />
                                <ellipse cx="58" cy="45" rx="4" ry="8" fill="#E6E6FA" opacity="0.7" className="animate-wing-flap" style={{ animationDelay: '0.1s' }} />
                            </g>
                        </svg>
                    </div>

                    <div className="absolute top-2/5 left-1/3 w-6 h-6 animate-bee-fly-diagonal" style={{ animationDelay: '8s' }}>
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                            <g className="animate-bee-flutter">
                                <ellipse cx="50" cy="50" rx="10" ry="16" fill="#FFD700" stroke="#FFA500" strokeWidth="1" />
                                <rect x="44" y="44" width="12" height="2" fill="#8B4513" rx="1" />
                                <rect x="44" y="54" width="12" height="2" fill="#8B4513" rx="1" />
                                <circle cx="50" cy="36" r="6" fill="#FFD700" stroke="#FFA500" strokeWidth="1" />
                                <circle cx="48" cy="33" r="1" fill="#000" />
                                <circle cx="52" cy="33" r="1" fill="#000" />
                                <ellipse cx="44" cy="47" rx="3" ry="6" fill="#E6E6FA" opacity="0.7" className="animate-wing-flap" />
                                <ellipse cx="56" cy="47" rx="3" ry="6" fill="#E6E6FA" opacity="0.7" className="animate-wing-flap" />
                            </g>
                        </svg>
                    </div>

                    <div className="absolute bottom-2/5 right-1/3 w-6 h-6 animate-bee-fly-diagonal-reverse" style={{ animationDelay: '10s' }}>
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                            <g className="animate-bee-flutter">
                                <ellipse cx="50" cy="50" rx="10" ry="16" fill="#FFD700" stroke="#FFA500" strokeWidth="1" />
                                <rect x="44" y="44" width="12" height="2" fill="#8B4513" rx="1" />
                                <rect x="44" y="54" width="12" height="2" fill="#8B4513" rx="1" />
                                <circle cx="50" cy="36" r="6" fill="#FFD700" stroke="#FFA500" strokeWidth="1" />
                                <circle cx="48" cy="33" r="1" fill="#000" />
                                <circle cx="52" cy="33" r="1" fill="#000" />
                                <ellipse cx="44" cy="47" rx="3" ry="6" fill="#E6E6FA" opacity="0.7" className="animate-wing-flap" />
                                <ellipse cx="56" cy="47" rx="3" ry="6" fill="#E6E6FA" opacity="0.7" className="animate-wing-flap" />
                            </g>
                        </svg>
                    </div>

                    {/* Yeni Doğal Arı Uçuş Desenleri */}
                    <div className="absolute top-1/8 left-0 w-7 h-7 animate-bee-fly-organic" style={{ animationDelay: '12s' }}>
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                            <g className="animate-bee-flutter">
                                <ellipse cx="50" cy="50" rx="11" ry="18" fill="#FFD700" stroke="#FFA500" strokeWidth="1" />
                                <rect x="43" y="43" width="14" height="2" fill="#8B4513" rx="1" />
                                <rect x="43" y="53" width="14" height="2" fill="#8B4513" rx="1" />
                                <circle cx="50" cy="33" r="7" fill="#FFD700" stroke="#FFA500" strokeWidth="1" />
                                <circle cx="47" cy="30" r="1.2" fill="#000" />
                                <circle cx="53" cy="30" r="1.2" fill="#000" />
                                <ellipse cx="43" cy="46" rx="3.5" ry="7" fill="#E6E6FA" opacity="0.7" className="animate-wing-flap" />
                                <ellipse cx="57" cy="46" rx="3.5" ry="7" fill="#E6E6FA" opacity="0.7" className="animate-wing-flap" />
                            </g>
                        </svg>
                    </div>

                    <div className="absolute top-3/8 left-0 w-9 h-9 animate-bee-fly-curve" style={{ animationDelay: '15s' }}>
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                            <g className="animate-bee-flutter">
                                <ellipse cx="50" cy="50" rx="14" ry="24" fill="#FFD700" stroke="#FFA500" strokeWidth="1" />
                                <rect x="40" y="40" width="20" height="3" fill="#8B4513" rx="1" />
                                <rect x="40" y="50" width="20" height="3" fill="#8B4513" rx="1" />
                                <rect x="40" y="60" width="20" height="3" fill="#8B4513" rx="1" />
                                <circle cx="50" cy="30" r="9" fill="#FFD700" stroke="#FFA500" strokeWidth="1" />
                                <circle cx="46" cy="27" r="1.5" fill="#000" />
                                <circle cx="54" cy="27" r="1.5" fill="#000" />
                                <ellipse cx="40" cy="45" rx="5" ry="10" fill="#E6E6FA" opacity="0.7" className="animate-wing-flap" />
                                <ellipse cx="60" cy="45" rx="5" ry="10" fill="#E6E6FA" opacity="0.7" className="animate-wing-flap" />
                            </g>
                        </svg>
                    </div>

                    <div className="absolute top-5/8 left-0 w-8 h-8 animate-bee-fly-figure8" style={{ animationDelay: '18s' }}>
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                            <g className="animate-bee-flutter">
                                <ellipse cx="50" cy="50" rx="12" ry="20" fill="#FFD700" stroke="#FFA500" strokeWidth="1" />
                                <rect x="42" y="42" width="16" height="2" fill="#8B4513" rx="1" />
                                <rect x="42" y="52" width="16" height="2" fill="#8B4513" rx="1" />
                                <circle cx="50" cy="32" r="8" fill="#FFD700" stroke="#FFA500" strokeWidth="1" />
                                <circle cx="47" cy="29" r="1.5" fill="#000" />
                                <circle cx="53" cy="29" r="1.5" fill="#000" />
                                <ellipse cx="42" cy="45" rx="4" ry="8" fill="#E6E6FA" opacity="0.7" className="animate-wing-flap" />
                                <ellipse cx="58" cy="45" rx="4" ry="8" fill="#E6E6FA" opacity="0.7" className="animate-wing-flap" />
                            </g>
                        </svg>
                    </div>

                    <div className="absolute top-7/8 left-0 w-6 h-6 animate-bee-fly-lazy" style={{ animationDelay: '22s' }}>
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                            <g className="animate-bee-flutter">
                                <ellipse cx="50" cy="50" rx="10" ry="16" fill="#FFD700" stroke="#FFA500" strokeWidth="1" />
                                <rect x="44" y="44" width="12" height="2" fill="#8B4513" rx="1" />
                                <rect x="44" y="54" width="12" height="2" fill="#8B4513" rx="1" />
                                <circle cx="50" cy="36" r="6" fill="#FFD700" stroke="#FFA500" strokeWidth="1" />
                                <circle cx="48" cy="33" r="1" fill="#000" />
                                <circle cx="52" cy="33" r="1" fill="#000" />
                                <ellipse cx="44" cy="47" rx="3" ry="6" fill="#E6E6FA" opacity="0.7" className="animate-wing-flap" />
                                <ellipse cx="56" cy="47" rx="3" ry="6" fill="#E6E6FA" opacity="0.7" className="animate-wing-flap" />
                            </g>
                        </svg>
                    </div>

                    <div className="absolute top-1/12 left-0 w-10 h-10 animate-bee-fly-random" style={{ animationDelay: '25s' }}>
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                            <g className="animate-bee-flutter">
                                <ellipse cx="50" cy="50" rx="15" ry="25" fill="#FFD700" stroke="#FFA500" strokeWidth="1" />
                                <rect x="38" y="38" width="24" height="3" fill="#8B4513" rx="1" />
                                <rect x="38" y="48" width="24" height="3" fill="#8B4513" rx="1" />
                                <rect x="38" y="58" width="24" height="3" fill="#8B4513" rx="1" />
                                <circle cx="50" cy="28" r="10" fill="#FFD700" stroke="#FFA500" strokeWidth="1" />
                                <circle cx="46" cy="25" r="2" fill="#000" />
                                <circle cx="54" cy="25" r="2" fill="#000" />
                                <ellipse cx="38" cy="45" rx="6" ry="12" fill="#E6E6FA" opacity="0.7" className="animate-wing-flap" />
                                <ellipse cx="62" cy="45" rx="6" ry="12" fill="#E6E6FA" opacity="0.7" className="animate-wing-flap" />
                            </g>
                        </svg>
                    </div>
                </div>
            </div>

            <div className="relative z-20 flex flex-col min-h-screen">
                {/* Welcome Section - Moved up */}
                <div className="flex items-start justify-center py-16 px-8 lg:py-20 lg:px-12 pt-8 lg:pt-12">
                    <div className="max-w-6xl w-full text-center">
                        {/* Logo */}
                        <div className={`flex items-center justify-center mb-8 lg:mb-10 transform transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                            }`}>
                            <div className="flex items-center space-x-6">
                                <div className={`transform transition-all duration-1000 delay-300 float-animation ${isLoaded ? 'scale-100 rotate-0' : 'scale-0 rotate-180'
                                    }`}>
                                    <svg className="fill-amber-500" xmlns="http://www.w3.org/2000/svg" width={80} height={80} viewBox="0 0 40 40">
                                        {/* Digital Twin Grid Background */}
                                        <defs>
                                            <pattern id="grid" width="4" height="4" patternUnits="userSpaceOnUse">
                                                <path d="M 4 0 L 0 0 0 4" fill="none" stroke="#F59E0B" strokeWidth="0.2" opacity="0.3" />
                                            </pattern>
                                        </defs>
                                        <rect width="40" height="40" fill="url(#grid)" opacity="0.4" />

                                        {/* Outer Digital Ring */}
                                        <circle cx="20" cy="20" r="18" fill="none" stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="3,2" opacity="0.8" />

                                        {/* Data Flow Rings */}
                                        <circle cx="20" cy="20" r="14" fill="none" stroke="#10B981" strokeWidth="1" strokeDasharray="2,1" opacity="0.6" />
                                        <circle cx="20" cy="20" r="10" fill="none" stroke="#F59E0B" strokeWidth="0.8" strokeDasharray="1.5,1" opacity="0.5" />

                                        {/* Digital Twin Bees - Physical & Virtual */}
                                        <g id="physicalBee">
                                            {/* Physical Bee (Left) */}
                                            <ellipse cx="15" cy="20" rx="3" ry="4" fill="#FDE047" stroke="#F59E0B" strokeWidth="0.5" />
                                            <line x1="13" y1="18" x2="17" y2="18" stroke="#B45309" strokeWidth="0.8" />
                                            <line x1="13" y1="20" x2="17" y2="20" stroke="#B45309" strokeWidth="0.8" />
                                            <line x1="13" y1="22" x2="17" y2="22" stroke="#B45309" strokeWidth="0.8" />

                                            {/* Physical Wings */}
                                            <ellipse cx="12" cy="17" rx="2" ry="1.5" fill="#60A5FA" opacity="0.7" />
                                            <ellipse cx="18" cy="17" rx="2" ry="1.5" fill="#60A5FA" opacity="0.7" />

                                            {/* Physical Head */}
                                            <circle cx="15" cy="16" r="1.5" fill="#F59E0B" />
                                            <circle cx="15" cy="16" r="0.8" fill="#DC2626" />
                                        </g>

                                        <g id="virtualBee">
                                            {/* Virtual Bee (Right) - Wireframe Style */}
                                            <ellipse cx="25" cy="20" rx="3" ry="4" fill="none" stroke="#3B82F6" strokeWidth="1.2" strokeDasharray="0.8,0.8" />
                                            <line x1="23" y1="18" x2="27" y2="18" stroke="#3B82F6" strokeWidth="0.8" strokeDasharray="0.5,0.5" />
                                            <line x1="23" y1="20" x2="27" y2="20" stroke="#3B82F6" strokeWidth="0.8" strokeDasharray="0.5,0.5" />
                                            <line x1="23" y1="22" x2="27" y2="22" stroke="#3B82F6" strokeWidth="0.8" strokeDasharray="0.5,0.5" />

                                            {/* Virtual Wings */}
                                            <ellipse cx="22" cy="17" rx="2" ry="1.5" fill="none" stroke="#3B82F6" strokeWidth="0.8" strokeDasharray="0.5,0.5" />
                                            <ellipse cx="28" cy="17" rx="2" ry="1.5" fill="none" stroke="#3B82F6" strokeWidth="0.8" strokeDasharray="0.5,0.5" />

                                            {/* Virtual Head */}
                                            <circle cx="25" cy="16" r="1.5" fill="none" stroke="#3B82F6" strokeWidth="1" />
                                            <circle cx="25" cy="16" r="0.8" fill="#3B82F6" opacity="0.6" />
                                        </g>

                                        {/* Digital Twin Connection */}
                                        <path d="M18 20 L22 20" stroke="#10B981" strokeWidth="2" strokeDasharray="2,1" opacity="0.8" />
                                        <path d="M18 20 L22 20" stroke="#10B981" strokeWidth="0.5" strokeDasharray="1,1" opacity="1">
                                            <animate attributeName="stroke-dashoffset" values="0;4" dur="2s" repeatCount="indefinite" />
                                        </path>

                                        {/* Data Nodes */}
                                        <circle cx="8" cy="8" r="1.5" fill="#10B981" />
                                        <circle cx="32" cy="8" r="1.5" fill="#3B82F6" />
                                        <circle cx="8" cy="32" r="1.5" fill="#10B981" />
                                        <circle cx="32" cy="32" r="1.5" fill="#3B82F6" />

                                        {/* IoT Sensors */}
                                        <circle cx="6" cy="20" r="1" fill="#EF4444" />
                                        <circle cx="34" cy="20" r="1" fill="#EF4444" />
                                        <circle cx="20" cy="6" r="1" fill="#EF4444" />
                                        <circle cx="20" cy="34" r="1" fill="#EF4444" />
                                    </svg>
                                </div>
                                <div className={`transform transition-all duration-1000 delay-500 ${isLoaded ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'
                                    }`}>
                                    <h1 className={`text-5xl lg:text-7xl font-bold text-blue-700 dark:text-blue-300 ${showTypewriter ? 'typewriter-no-cursor' : ''
                                        }`}>
                                        BeeTwin
                                    </h1>
                                    <p className={`text-lg lg:text-xl text-amber-600 dark:text-amber-400 font-medium transform transition-all duration-1000 delay-2000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
                                        }`}>
                                        Dijital İkiz Arıcılık Sistemi
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Digital Twin Beehive Visualization */}
                        <div className={`flex justify-center mb-6 lg:mb-8 transform transition-all duration-1000 delay-800 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                            }`}>
                            <div className="w-[400px] h-[300px] lg:w-[500px] lg:h-[350px] opacity-60 dark:opacity-70 pointer-events-none">
                                <svg viewBox="0 0 400 300" className="w-full h-full">
                                    {/* Physical Beehive (Left Side) */}
                                    <g id="physicalHive">
                                        {/* Hive Body */}
                                        <rect x="50" y="100" width="80" height="120" fill="#F59E0B" stroke="#D97706" strokeWidth="2" rx="8" opacity="0.8" />
                                        <rect x="55" y="110" width="70" height="15" fill="#FDE047" opacity="0.6" />
                                        <rect x="55" y="135" width="70" height="15" fill="#FDE047" opacity="0.6" />
                                        <rect x="55" y="160" width="70" height="15" fill="#FDE047" opacity="0.6" />
                                        <rect x="55" y="185" width="70" height="15" fill="#FDE047" opacity="0.6" />

                                        {/* Hive Entrance */}
                                        <circle cx="90" cy="210" r="8" fill="#92400E" />

                                        {/* Physical Sensors */}
                                        <circle cx="70" cy="90" r="3" fill="#EF4444" className="animate-pulse" />
                                        <circle cx="110" cy="90" r="3" fill="#EF4444" className="animate-pulse" style={{ animationDelay: '0.5s' }} />
                                        <circle cx="90" cy="80" r="3" fill="#10B981" className="animate-pulse" style={{ animationDelay: '1s' }} />

                                        {/* Temperature Indicator */}
                                        <text x="50" y="75" fontSize="10" fill="#DC2626" className="animate-pulse">25°C</text>

                                        {/* Humidity Indicator */}
                                        <text x="100" y="75" fontSize="10" fill="#2563EB" className="animate-pulse" style={{ animationDelay: '0.5s' }}>65%</text>

                                        {/* Flying Bees */}
                                        <circle cx="45" cy="150" r="2" fill="#F59E0B" className="animate-bee-flight" />
                                        <circle cx="135" cy="130" r="2" fill="#F59E0B" className="animate-bee-flight" style={{ animationDelay: '1s' }} />
                                        <circle cx="40" cy="190" r="2" fill="#F59E0B" className="animate-bee-flight" style={{ animationDelay: '2s' }} />
                                    </g>

                                    {/* Digital Twin Connection */}
                                    <g id="connection">
                                        {/* Data Flow Lines */}
                                        <path d="M130 150 Q200 130 270 150" stroke="#10B981" strokeWidth="2" fill="none" strokeDasharray="5,5" opacity="0.8">
                                            <animate attributeName="stroke-dashoffset" values="0;20" dur="2s" repeatCount="indefinite" />
                                        </path>
                                        <path d="M130 170 Q200 150 270 170" stroke="#3B82F6" strokeWidth="2" fill="none" strokeDasharray="5,5" opacity="0.8">
                                            <animate attributeName="stroke-dashoffset" values="0;20" dur="2.5s" repeatCount="indefinite" />
                                        </path>
                                        <path d="M130 190 Q200 210 270 190" stroke="#F59E0B" strokeWidth="2" fill="none" strokeDasharray="5,5" opacity="0.8">
                                            <animate attributeName="stroke-dashoffset" values="0;20" dur="1.8s" repeatCount="indefinite" />
                                        </path>

                                        {/* Data Packets */}
                                        <circle cx="150" cy="150" r="3" fill="#10B981" className="animate-data-flow" />
                                        <circle cx="180" cy="170" r="3" fill="#3B82F6" className="animate-data-flow" style={{ animationDelay: '0.5s' }} />
                                        <circle cx="210" cy="190" r="3" fill="#F59E0B" className="animate-data-flow" style={{ animationDelay: '1s' }} />
                                    </g>

                                    {/* Digital Twin Hive (Right Side) */}
                                    <g id="digitalHive">
                                        {/* Digital Hive Wireframe */}
                                        <rect x="270" y="100" width="80" height="120" fill="none" stroke="#3B82F6" strokeWidth="2" strokeDasharray="4,4" rx="8" opacity="0.9" />
                                        <rect x="275" y="110" width="70" height="15" fill="none" stroke="#60A5FA" strokeWidth="1" strokeDasharray="2,2" opacity="0.7" />
                                        <rect x="275" y="135" width="70" height="15" fill="none" stroke="#60A5FA" strokeWidth="1" strokeDasharray="2,2" opacity="0.7" />
                                        <rect x="275" y="160" width="70" height="15" fill="none" stroke="#60A5FA" strokeWidth="1" strokeDasharray="2,2" opacity="0.7" />
                                        <rect x="275" y="185" width="70" height="15" fill="none" stroke="#60A5FA" strokeWidth="1" strokeDasharray="2,2" opacity="0.7" />

                                        {/* Digital Entrance */}
                                        <circle cx="310" cy="210" r="8" fill="none" stroke="#3B82F6" strokeWidth="2" strokeDasharray="2,2" />

                                        {/* Digital Sensors */}
                                        <circle cx="290" cy="90" r="3" fill="#3B82F6" className="animate-pulse" />
                                        <circle cx="330" cy="90" r="3" fill="#3B82F6" className="animate-pulse" style={{ animationDelay: '0.5s' }} />
                                        <circle cx="310" cy="80" r="3" fill="#10B981" className="animate-pulse" style={{ animationDelay: '1s' }} />

                                        {/* Digital Data */}
                                        <text x="270" y="75" fontSize="10" fill="#3B82F6" className="animate-pulse">AI</text>
                                        <text x="320" y="75" fontSize="10" fill="#3B82F6" className="animate-pulse" style={{ animationDelay: '0.5s' }}>ML</text>

                                        {/* Virtual Bees */}
                                        <circle cx="265" cy="150" r="2" fill="none" stroke="#3B82F6" strokeWidth="1" className="animate-bee-flight" />
                                        <circle cx="355" cy="130" r="2" fill="none" stroke="#3B82F6" strokeWidth="1" className="animate-bee-flight" style={{ animationDelay: '1s' }} />
                                        <circle cx="260" cy="190" r="2" fill="none" stroke="#3B82F6" strokeWidth="1" className="animate-bee-flight" style={{ animationDelay: '2s' }} />

                                        {/* Digital Analytics */}
                                        <g id="analytics">
                                            <rect x="280" y="230" width="60" height="30" fill="#1E40AF" opacity="0.3" rx="4" />
                                            <text x="285" y="245" fontSize="8" fill="#3B82F6">Analytics</text>
                                            <rect x="285" y="250" width="10" height="5" fill="#10B981" className="animate-pulse" />
                                            <rect x="300" y="248" width="10" height="7" fill="#F59E0B" className="animate-pulse" style={{ animationDelay: '0.3s' }} />
                                            <rect x="315" y="249" width="10" height="6" fill="#EF4444" className="animate-pulse" style={{ animationDelay: '0.6s' }} />
                                            <rect x="330" y="247" width="10" height="8" fill="#8B5CF6" className="animate-pulse" style={{ animationDelay: '0.9s' }} />
                                        </g>
                                    </g>

                                    {/* IoT Network */}
                                    <g id="iot-network">
                                        {/* Network Nodes */}
                                        <circle cx="200" cy="50" r="4" fill="#10B981" className="animate-pulse" />
                                        <circle cx="150" cy="30" r="3" fill="#3B82F6" className="animate-pulse" style={{ animationDelay: '0.5s' }} />
                                        <circle cx="250" cy="30" r="3" fill="#F59E0B" className="animate-pulse" style={{ animationDelay: '1s' }} />
                                        <circle cx="200" cy="280" r="4" fill="#EF4444" className="animate-pulse" style={{ animationDelay: '1.5s' }} />

                                        {/* Network Connections */}
                                        <path d="M200 50 L150 30" stroke="#10B981" strokeWidth="1" strokeDasharray="2,2" opacity="0.6" />
                                        <path d="M200 50 L250 30" stroke="#3B82F6" strokeWidth="1" strokeDasharray="2,2" opacity="0.6" />
                                        <path d="M200 50 L90 100" stroke="#F59E0B" strokeWidth="1" strokeDasharray="2,2" opacity="0.6" />
                                        <path d="M200 50 L310 100" stroke="#EF4444" strokeWidth="1" strokeDasharray="2,2" opacity="0.6" />

                                        {/* Cloud Connection */}
                                        <ellipse cx="200" cy="10" rx="25" ry="15" fill="none" stroke="#60A5FA" strokeWidth="2" strokeDasharray="3,3" opacity="0.8" />
                                        <text x="190" y="15" fontSize="8" fill="#3B82F6">Cloud</text>
                                        <path d="M200 50 L200 25" stroke="#3B82F6" strokeWidth="2" strokeDasharray="3,3" opacity="0.8" />
                                    </g>
                                </svg>
                            </div>
                        </div>

                        {/* Welcome Message */}
                        <div className={`mb-8 lg:mb-10 transform transition-all duration-1000 delay-700 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                            }`}>
                            <h2 className="text-2xl lg:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-3 lg:mb-4">
                                Arıcılığın Geleceğine Hoş Geldiniz
                            </h2>
                            <p className="text-xl lg:text-2xl text-gray-600 dark:text-gray-300 mb-6 lg:mb-8 max-w-4xl mx-auto leading-relaxed">
                                Dijital ikiz teknolojisi ile kovanlarınızı izleyin, analiz edin ve optimize edin.
                                Yapay zeka destekli sistemimiz ile arıcılık deneyiminizi bir sonraki seviyeye taşıyın.
                            </p>

                            {/* Features */}
                            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 transform transition-all duration-1000 delay-900 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                                }`}>
                                <div className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm rounded-2xl p-4 border border-amber-200/30 dark:border-amber-700/30 hover:scale-105 transition-transform duration-300">
                                    <div className="flex items-center justify-center space-x-3 mb-4">
                                        <div className="w-4 h-4 bg-amber-500 rounded-full animate-pulse"></div>
                                        <svg className="w-8 h-8 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                                        Gerçek Zamanlı Monitör
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Kovanlarınızı 7/24 izleyin ve anında bildirim alın
                                    </p>
                                </div>
                                <div className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm rounded-2xl p-4 border border-blue-200/30 dark:border-blue-700/30 hover:scale-105 transition-transform duration-300" style={{ animationDelay: '0.2s' }}>
                                    <div className="flex items-center justify-center space-x-3 mb-4">
                                        <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                                        <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.1 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                                        AI Hastalık Tespiti
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Yapay zeka ile hastalıkları erken teşhis edin
                                    </p>
                                </div>
                                <div className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm rounded-2xl p-4 border border-green-200/30 dark:border-green-700/30 hover:scale-105 transition-transform duration-300" style={{ animationDelay: '0.4s' }}>
                                    <div className="flex items-center justify-center space-x-3 mb-4">
                                        <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                                        <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6h-6z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                                        Bal Üretim Analizi
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Verimlilik analizi ve optimizasyon önerileri
                                    </p>
                                </div>
                                <div className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm rounded-2xl p-4 border border-orange-200/30 dark:border-orange-700/30 hover:scale-105 transition-transform duration-300" style={{ animationDelay: '0.6s' }}>
                                    <div className="flex items-center justify-center space-x-3 mb-4">
                                        <div className="w-4 h-4 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></div>
                                        <svg className="w-8 h-8 text-orange-600 dark:text-orange-400" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                                        IoT Entegrasyonu
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Akıllı sensörler ve otomatik kontrol sistemi
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Auth Section - Hidden by default, accessible via scroll */}
                <div id="auth-section" className="min-h-screen flex items-center justify-center py-12 px-8 lg:py-16 lg:px-12 bg-gradient-to-b from-white/5 to-amber-50/10 dark:from-gray-900/20 dark:to-gray-800/30 backdrop-blur-sm">
                    <div className={`w-full max-w-2xl transform transition-all duration-1000 delay-500 ${isLoaded ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95'
                        }`}>
                        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 lg:p-12 border border-white/20 dark:border-gray-700/20">
                            {/* Auth Toggle */}
                            <div className="flex mb-8 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                                <button
                                    onClick={() => {
                                        setIsSignUp(false);
                                        resetRegistration();
                                    }}
                                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${!isSignUp
                                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                                        }`}
                                >
                                    Giriş Yap
                                </button>
                                <button
                                    onClick={() => {
                                        setIsSignUp(true);
                                        resetRegistration();
                                    }}
                                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${isSignUp
                                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                                        }`}
                                >
                                    Kayıt Ol
                                </button>
                            </div>

                            {/* Sign In Form */}
                            {!isSignUp && (
                                <div className="space-y-6">
                                    <div className="text-center mb-6">
                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                                            Tekrar Hoş Geldiniz!
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            Arıcılık yolculuğunuza devam edin
                                        </p>
                                    </div>

                                    <form className="space-y-6" onSubmit={handleSignIn}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    E-posta Adresi
                                                </label>
                                                <input
                                                    type="email"
                                                    value={loginData.email}
                                                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                                                    className="w-full px-5 py-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 text-lg"
                                                    placeholder="arici@example.com"
                                                    required
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Şifre
                                                </label>
                                                <input
                                                    type="password"
                                                    value={loginData.password}
                                                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                                                    className="w-full px-5 py-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 text-lg"
                                                    placeholder="••••••••"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <label className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    className="w-5 h-5 text-amber-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-amber-500 dark:focus:ring-amber-600 focus:ring-2"
                                                />
                                                <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">Beni hatırla</span>
                                            </label>
                                            <a href="#" className="text-sm text-amber-600 dark:text-amber-400 hover:text-amber-500">
                                                Şifremi unuttum
                                            </a>
                                        </div>

                                        {/* Error Message */}
                                        {error && (
                                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                                                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 shadow-lg text-lg"
                                        >
                                            {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                                        </button>

                                        {/* Veya Ayracı */}
                                        <div className="relative">
                                            <div className="absolute inset-0 flex items-center">
                                                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                                            </div>
                                            <div className="relative flex justify-center text-sm">
                                                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">veya</span>
                                            </div>
                                        </div>

                                        {/* Google Sign-In */}
                                        <GoogleSignIn
                                            onSuccess={handleGoogleSuccess}
                                            onError={handleGoogleError}
                                        />

                                        {/* Şifremi Unuttum Bağlantısı */}
                                        <div className="text-center">
                                            <button
                                                type="button"
                                                onClick={() => setShowForgotPassword(true)}
                                                className="text-sm text-amber-600 dark:text-amber-400 hover:text-amber-500 hover:underline"
                                            >
                                                Şifremi unuttum
                                            </button>
                                        </div>
                                    </form>

                                    <div className="text-center">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Hesabınız yok mu?{' '}
                                            <button
                                                onClick={() => setIsSignUp(true)}
                                                className="text-amber-600 dark:text-amber-400 hover:text-amber-500 font-medium"
                                            >
                                                Kayıt olun
                                            </button>
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Sign Up Form */}
                            {isSignUp && (
                                <div className="space-y-6">
                                    <div className="text-center mb-6">
                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                                            Arıcılık Ailesine Katılın
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            Adım {registrationStep}/{userType === 'beekeeper' ? '3' : '2'}: {
                                                registrationStep === 1 ? 'Kullanıcı Tipi' :
                                                    registrationStep === 2 ? 'Kayıt Bilgileri' :
                                                        'Kovan-Donanım Eşleştirme'
                                            }
                                        </p>
                                    </div>

                                    {/* Step 1: User Type Selection */}
                                    {registrationStep === 1 && (
                                        <div className="space-y-6">
                                            <div className="text-center mb-6">
                                                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                                    Kullanıcı Tipi Seçin
                                                </h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    Hangi tür kullanıcı olarak kayıt olmak istiyorsunuz?
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-1 gap-4">
                                                {/* Arıcı Seçeneği */}
                                                <div
                                                    onClick={() => setUserType('beekeeper')}
                                                    className={`p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 ${userType === 'beekeeper'
                                                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                                                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-600'
                                                        }`}
                                                >
                                                    <div className="flex items-center space-x-4">
                                                        <div className="flex-shrink-0">
                                                            <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <h5 className="font-semibold text-gray-900 dark:text-white">🐝 Arıcı</h5>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">Kovan ve sensör yönetimi</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Admin Seçeneği */}
                                                <div
                                                    onClick={() => setUserType('admin')}
                                                    className={`p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 ${userType === 'admin'
                                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-600'
                                                        }`}
                                                >
                                                    <div className="flex items-center space-x-4">
                                                        <div className="flex-shrink-0">
                                                            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.1 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z" />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <h5 className="font-semibold text-gray-900 dark:text-white">👨‍💼 Admin</h5>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">Sistem yöneticisi</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={handleNextStep}
                                                disabled={!userType}
                                                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg text-lg disabled:cursor-not-allowed disabled:hover:scale-100"
                                            >
                                                Devam Et
                                            </button>
                                        </div>
                                    )}

                                    {/* Step 2: Register */}
                                    {registrationStep === 2 && (
                                        <div className="space-y-6">
                                            <div className="text-center mb-6">
                                                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                                    {userType === 'admin' ? 'Admin Kaydı' : 'Arıcı Kaydı'}
                                                </h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    Lütfen bilgilerinizi girin
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Ad */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Adınız *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={registerData.firstName}
                                                        onChange={(e) => setRegisterData({ ...registerData, firstName: e.target.value })}
                                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                                                        placeholder="Adınız"
                                                        required
                                                    />
                                                </div>

                                                {/* Soyad */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Soyadınız *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={registerData.lastName}
                                                        onChange={(e) => setRegisterData({ ...registerData, lastName: e.target.value })}
                                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                                                        placeholder="Soyadınız"
                                                        required
                                                    />
                                                </div>

                                                {/* E-posta */}
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        E-posta Adresi *
                                                    </label>
                                                    <input
                                                        type="email"
                                                        value={registerData.email}
                                                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                                                        placeholder="ornek@email.com"
                                                        required
                                                    />
                                                </div>

                                                {/* Şifre */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Şifre *
                                                    </label>
                                                    <input
                                                        type="password"
                                                        value={registerData.password}
                                                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                                                        placeholder="En az 6 karakter, 1 büyük harf, 1 küçük harf, 1 rakam"
                                                        minLength="6"
                                                        required
                                                    />
                                                </div>

                                                {/* Şifre Tekrar */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Şifre Tekrar *
                                                    </label>
                                                    <input
                                                        type="password"
                                                        value={registerData.confirmPassword}
                                                        onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                                                        placeholder="Şifreyi tekrar girin"
                                                        required
                                                    />
                                                </div>

                                                {/* Konum */}
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Konum *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={registerData.location}
                                                        onChange={(e) => setRegisterData({ ...registerData, location: e.target.value })}
                                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                                                        placeholder="Ankara, Türkiye"
                                                        required
                                                    />
                                                </div>

                                                {/* Arıcı için ek alanlar */}
                                                {userType === 'beekeeper' && (
                                                    <>
                                                        <div className="md:col-span-2">
                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                                Arıcılık Deneyimi *
                                                            </label>
                                                            <select
                                                                value={registerData.beekeepingInfo?.experience || ''}
                                                                onChange={(e) => setRegisterData({
                                                                    ...registerData,
                                                                    beekeepingInfo: {
                                                                        ...registerData.beekeepingInfo,
                                                                        experience: e.target.value
                                                                    }
                                                                })}
                                                                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                                                                required
                                                            >
                                                                <option value="">Deneyim seviyenizi seçin</option>
                                                                <option value="beginner">Başlangıç (0-2 yıl)</option>
                                                                <option value="intermediate">Orta (2-5 yıl)</option>
                                                                <option value="advanced">İleri (5+ yıl)</option>
                                                            </select>
                                                        </div>

                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                                Toplam Arılık Sayısı *
                                                            </label>
                                                            <input
                                                                type="number"
                                                                value={registerData.beekeepingInfo?.totalApiaries || ''}
                                                                onChange={(e) => setRegisterData({
                                                                    ...registerData,
                                                                    beekeepingInfo: {
                                                                        ...registerData.beekeepingInfo,
                                                                        totalApiaries: parseInt(e.target.value) || 0
                                                                    }
                                                                })}
                                                                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                                                                placeholder="1"
                                                                min="1"
                                                                required
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                                Toplam Kovan Sayısı *
                                                            </label>
                                                            <input
                                                                type="number"
                                                                value={registerData.beekeepingInfo?.totalHives || ''}
                                                                onChange={(e) => setRegisterData({
                                                                    ...registerData,
                                                                    beekeepingInfo: {
                                                                        ...registerData.beekeepingInfo,
                                                                        totalHives: parseInt(e.target.value) || 0
                                                                    }
                                                                })}
                                                                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                                                                placeholder="5"
                                                                min="1"
                                                                required
                                                            />
                                                        </div>

                                                        <div className="md:col-span-2">
                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                                Arıcılık Amaçları
                                                            </label>
                                                            <textarea
                                                                value={registerData.beekeepingInfo?.goals || ''}
                                                                onChange={(e) => setRegisterData({
                                                                    ...registerData,
                                                                    beekeepingInfo: {
                                                                        ...registerData.beekeepingInfo,
                                                                        goals: e.target.value
                                                                    }
                                                                })}
                                                                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                                                                placeholder="Bal üretimi, polen toplama, arı ürünleri satışı..."
                                                                rows="3"
                                                            />
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            {/* Arılık Yönetimi - Sadece Arıcılar İçin */}
                                            {userType === 'beekeeper' && (
                                                <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h5 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                            🏡 Arılık Bilgileri
                                                        </h5>
                                                        <button
                                                            type="button"
                                                            onClick={addApiary}
                                                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                                                        >
                                                            ➕ Arılık Ekle
                                                        </button>
                                                    </div>

                                                    <div className="space-y-4">
                                                        {apiaries.map((apiary, index) => (
                                                            <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                                                                <div className="flex items-center justify-between mb-3">
                                                                    <h6 className="font-medium text-gray-900 dark:text-white">
                                                                        Arılık {index + 1}
                                                                    </h6>
                                                                    {apiaries.length > 1 && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => removeApiary(index)}
                                                                            className="text-red-500 hover:text-red-700 text-sm"
                                                                        >
                                                                            🗑️ Sil
                                                                        </button>
                                                                    )}
                                                                </div>

                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    <div>
                                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                                            Arılık Adı
                                                                        </label>
                                                                        <input
                                                                            type="text"
                                                                            value={apiary.name}
                                                                            onChange={(e) => handleApiaryChange(index, 'name', e.target.value)}
                                                                            placeholder={`Arılık ${index + 1}`}
                                                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-gray-600 dark:text-white"
                                                                        />
                                                                    </div>

                                                                    <div>
                                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                                            Kovan Sayısı
                                                                        </label>
                                                                        <input
                                                                            type="number"
                                                                            value={apiary.hiveCount}
                                                                            onChange={(e) => handleApiaryChange(index, 'hiveCount', parseInt(e.target.value) || 0)}
                                                                            placeholder="10"
                                                                            min="0"
                                                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-gray-600 dark:text-white"
                                                                        />
                                                                    </div>
                                                                </div>

                                                                {/* Konum alanı ayrı satırda */}
                                                                <div className="mt-4">
                                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                                        📍 Arılık Konumu
                                                                    </label>
                                                                    <div className="flex gap-3">
                                                                        <input
                                                                            type="text"
                                                                            value={apiary.location}
                                                                            onChange={(e) => handleApiaryChange(index, 'location', e.target.value)}
                                                                            placeholder="Şehir, İlçe"
                                                                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-gray-600 dark:text-white"
                                                                        />
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => openLocationPicker(index)}
                                                                            className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg transition-all duration-200 transform hover:scale-105 shadow-md font-medium whitespace-nowrap"
                                                                            title="Haritadan konum seç"
                                                                        >
                                                                            🗺️ Haritadan Seç
                                                                        </button>
                                                                    </div>
                                                                    {apiary.latitude && apiary.longitude && (
                                                                        <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-600">
                                                                            <p className="text-sm text-green-700 dark:text-green-300">
                                                                                ✅ Konum seçildi: {apiary.latitude.toFixed(6)}, {apiary.longitude.toFixed(6)}
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Kovan Sayısı Bilgisi */}
                                                                {apiary.hiveCount > 0 && (
                                                                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-600">
                                                                        <p className="text-sm text-blue-700 dark:text-blue-300">
                                                                            📋 Bu arılıkta {apiary.hiveCount} kovan tanımlanacak.
                                                                            Bir sonraki adımda bu kovanları donanımlarla eşleştirebileceksiniz.
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-600">
                                                        <p className="text-sm text-amber-700 dark:text-amber-300">
                                                            💡 <strong>İpucu:</strong> Her arılık için kovan sayısını belirtin.
                                                            Sonraki adımda bu kovanları fiziksel donanımlarınızla (Router ID, Sensor ID) eşleştirebileceksiniz.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex space-x-4">
                                                <button
                                                    type="button"
                                                    onClick={handlePreviousStep}
                                                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-3 px-6 rounded-xl transition-all duration-200"
                                                >
                                                    Geri Dön
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (userType === 'beekeeper') {
                                                            setRegistrationStep(3);
                                                        } else {
                                                            handleSignUp();
                                                        }
                                                    }}
                                                    disabled={loading}
                                                    className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg disabled:cursor-not-allowed disabled:hover:scale-100"
                                                >
                                                    {loading ? 'İşleniyor...' : (userType === 'beekeeper' ? 'Devam Et' : 'Kayıt Ol')}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Step 3: Hive-Hardware Mapping (only for beekeepers) */}
                                    {registrationStep === 3 && userType === 'beekeeper' && (
                                        <div className="space-y-6">
                                            <div className="text-center mb-6">
                                                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                                    Kovan-Donanım Eşleştirme
                                                </h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    Kovanlarınızı fiziksel donanımlarla eşleştirin
                                                </p>
                                            </div>

                                            {/* Hardware Mapping Form */}
                                            <HiveHardwareMappingForm
                                                apiaries={apiaries}
                                                setApiaries={setApiaries}
                                            />

                                            {/* Navigation Buttons */}
                                            <div className="flex space-x-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setRegistrationStep(2)}
                                                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-3 px-6 rounded-xl transition-all duration-200"
                                                >
                                                    Geri Dön
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={handleSignUp}
                                                    disabled={loading}
                                                    className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg disabled:cursor-not-allowed disabled:hover:scale-100"
                                                >
                                                    {loading ? 'Kayıt Oluşturuluyor...' : 'Kayıt Ol'}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Error Message */}
                                    {error && (
                                        <div className="p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-600 rounded-xl">
                                            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
                                        </div>
                                    )}

                                    {/* Back to Login */}
                                    <div className="text-center">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Zaten hesabınız var mı?{' '}
                                            <button
                                                onClick={() => setIsSignUp(false)}
                                                className="text-amber-600 dark:text-amber-400 hover:text-amber-500 font-medium"
                                            >
                                                Giriş yapın
                                            </button>
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Additional Info */}
                        <div className="mt-8 text-center">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                BeeTwin platformu, arıcılık sektöründe dijital dönüşümü sağlayan
                                yenilikçi bir teknolojidir. Tüm hakları saklıdır.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Fixed Login Button - Bottom Right */}
                <div className="fixed bottom-6 right-6 z-50">
                    <button
                        onClick={() => {
                            document.getElementById('auth-section').scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium py-3 px-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 backdrop-blur-sm border border-white/20"
                    >
                        <div className="flex items-center space-x-2">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7 3a1 1 0 00-1 1v8a1 1 0 002 0V7a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v8a1 1 0 002 0V7a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <span>Giriş</span>
                        </div>
                    </button>
                </div>

                {/* Location Picker Modal */}
                <LocationPicker
                    latitude={selectedApiaryIndex !== null ? apiaries[selectedApiaryIndex]?.latitude : null}
                    longitude={selectedApiaryIndex !== null ? apiaries[selectedApiaryIndex]?.longitude : null}
                    onLocationChange={handleLocationChange}
                    locationName={selectedApiaryIndex !== null ? apiaries[selectedApiaryIndex]?.location : ''}
                    onLocationNameChange={handleLocationNameChange}
                    isOpen={showLocationPicker}
                    onClose={closeLocationPicker}
                />

                {/* Şifremi Unuttum Modal */}
                {showForgotPassword && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                        Şifremi Unuttum
                                    </h3>
                                    <button
                                        onClick={() => {
                                            setShowForgotPassword(false);
                                            setForgotPasswordEmail('');
                                            setError('');
                                        }}
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <p className="text-gray-600 dark:text-gray-400 mb-6">
                                    E-posta adresinizi girin, şifre sıfırlama bağlantısı gönderelim.
                                </p>

                                <form onSubmit={handleForgotPassword} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            E-posta Adresi
                                        </label>
                                        <input
                                            type="email"
                                            value={forgotPasswordEmail}
                                            onChange={(e) => setForgotPasswordEmail(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                            placeholder="ornek@email.com"
                                            required
                                        />
                                    </div>

                                    {error && (
                                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                                            {error}
                                        </div>
                                    )}

                                    <div className="flex space-x-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowForgotPassword(false);
                                                setForgotPasswordEmail('');
                                                setError('');
                                            }}
                                            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            İptal
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={forgotPasswordLoading}
                                            className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-xl transition-all duration-200"
                                        >
                                            {forgotPasswordLoading ? 'Gönderiliyor...' : 'Gönder'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WelcomingPage;
