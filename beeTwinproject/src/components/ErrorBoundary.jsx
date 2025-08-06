import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('🚨 Error Boundary caught an error:', error, errorInfo);
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-lg w-full">
                        <div className="text-center">
                            <div className="text-6xl mb-4">🐝💥</div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                BeeTwin Hatası!
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                Bir şeyler ters gitti. Uygulama beklenmedik bir hatayla karşılaştı.
                            </p>

                            {/* Geliştirme modunda hata detayları */}
                            {process.env.NODE_ENV === 'development' && (
                                <details className="mb-4 text-left">
                                    <summary className="cursor-pointer text-red-600 dark:text-red-400 font-medium">
                                        🔍 Hata Detayları (Dev Mode)
                                    </summary>
                                    <div className="mt-2 bg-red-50 dark:bg-red-900/20 p-3 rounded text-sm">
                                        <strong>Error:</strong>
                                        <pre className="text-red-700 dark:text-red-300 whitespace-pre-wrap">
                                            {this.state.error && this.state.error.toString()}
                                        </pre>

                                        <strong className="block mt-2">Stack Trace:</strong>
                                        <pre className="text-red-600 dark:text-red-400 whitespace-pre-wrap text-xs">
                                            {this.state.errorInfo.componentStack}
                                        </pre>
                                    </div>
                                </details>
                            )}

                            <div className="space-y-2">
                                <button
                                    onClick={() => window.location.reload()}
                                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 px-4 rounded transition-colors"
                                >
                                    🔄 Sayfayı Yenile
                                </button>
                                <button
                                    onClick={() => window.location.href = '/'}
                                    className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded transition-colors"
                                >
                                    🏠 Ana Sayfaya Dön
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
