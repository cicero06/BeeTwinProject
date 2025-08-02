import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: ''
    });

    const token = searchParams.get('token');

    useEffect(() => {
        if (!token) {
            setError('Geçersiz sıfırlama bağlantısı');
        }
    }, [token]);

    const validatePassword = (password) => {
        const minLength = password.length >= 6;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumber = /\d/.test(password);

        return {
            minLength,
            hasUpperCase,
            hasLowerCase,
            hasNumber,
            isValid: minLength && hasUpperCase && hasLowerCase && hasNumber
        };
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!token) {
            setError('Geçersiz sıfırlama bağlantısı');
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setError('Şifreler eşleşmiyor');
            return;
        }

        const passwordValidation = validatePassword(formData.newPassword);
        if (!passwordValidation.isValid) {
            setError('Şifre en az 6 karakter olmalı ve en az 1 büyük harf, 1 küçük harf ve 1 rakam içermelidir');
            return;
        }

        try {
            setLoading(true);
            setError('');

            const response = await fetch('http://localhost:5000/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token,
                    newPassword: formData.newPassword
                })
            });

            const data = await response.json();

            if (data.success) {
                setSuccess(true);
                setTimeout(() => {
                    navigate('/');
                }, 3000);
            } else {
                setError(data.message || 'Şifre sıfırlama başarısız');
            }

        } catch (error) {
            console.error('Password reset error:', error);
            setError('Bir hata oluştu, lütfen tekrar deneyin');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Şifre Başarıyla Sıfırlandı!
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Şifreniz başarıyla güncellendi. Yeni şifrenizle giriş yapabilirsiniz.
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            3 saniye içinde giriş sayfasına yönlendirileceksiniz...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-white font-bold text-2xl">🐝</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Şifre Sıfırla
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Yeni şifrenizi belirleyin
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Yeni Şifre
                        </label>
                        <input
                            type="password"
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            placeholder="Yeni şifrenizi girin"
                            required
                        />

                        {/* Şifre Gereksinimleri */}
                        {formData.newPassword && (
                            <div className="mt-3 space-y-1">
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Şifre gereksinimleri:</p>
                                {Object.entries({
                                    minLength: 'En az 6 karakter',
                                    hasUpperCase: 'En az 1 büyük harf',
                                    hasLowerCase: 'En az 1 küçük harf',
                                    hasNumber: 'En az 1 rakam'
                                }).map(([key, text]) => {
                                    const validation = validatePassword(formData.newPassword);
                                    const isValid = validation[key];
                                    return (
                                        <div key={key} className={`flex items-center text-xs ${isValid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                            <span className="mr-2">{isValid ? '✓' : '✗'}</span>
                                            <span>{text}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Şifre Tekrarı
                        </label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            placeholder="Şifrenizi tekrar girin"
                            required
                        />

                        {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
                            <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                                Şifreler eşleşmiyor
                            </p>
                        )}
                    </div>

                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !token}
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 shadow-lg"
                    >
                        {loading ? 'Şifre Güncelleniyor...' : 'Şifreyi Güncelle'}
                    </button>

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            className="text-amber-600 dark:text-amber-400 hover:text-amber-500 text-sm hover:underline"
                        >
                            Giriş sayfasına dön
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ResetPasswordPage;
