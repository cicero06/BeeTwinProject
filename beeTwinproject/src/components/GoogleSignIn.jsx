import React, { useEffect } from 'react';

const GoogleSignIn = ({ onSuccess, onError }) => {
    useEffect(() => {
        // Google Sign-In'i başlat
        if (window.google) {
            window.google.accounts.id.initialize({
                client_id: "YOUR_GOOGLE_CLIENT_ID", // Bunu Google Cloud Console'dan alacağız
                callback: handleCredentialResponse
            });

            window.google.accounts.id.renderButton(
                document.getElementById("google-signin-button"),
                {
                    theme: "outline",
                    size: "large",
                    text: "signup_with",
                    locale: "tr"
                }
            );
        }
    }, []);

    const handleCredentialResponse = (response) => {
        try {
            // JWT token'ı decode et
            const responsePayload = decodeJwtResponse(response.credential);

            const userData = {
                email: responsePayload.email,
                firstName: responsePayload.given_name,
                lastName: responsePayload.family_name,
                picture: responsePayload.picture,
                googleId: responsePayload.sub,
                verified: responsePayload.email_verified
            };

            onSuccess(userData);
        } catch (error) {
            console.error('Google Sign-In Error:', error);
            onError('Google ile giriş yapılırken bir hata oluştu');
        }
    };

    const decodeJwtResponse = (token) => {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    };

    return (
        <div className="w-full">
            <div
                id="google-signin-button"
                className="flex justify-center"
            ></div>
        </div>
    );
};

export default GoogleSignIn;
