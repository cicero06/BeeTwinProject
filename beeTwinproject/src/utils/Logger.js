// 🔧 OPTİMİZASYON: Environment-based Logger

class Logger {
    static isDev = process.env.NODE_ENV === 'development';

    static log(...args) {
        if (this.isDev) {
            console.log(...args);
        }
    }

    static warn(...args) {
        if (this.isDev) {
            console.warn(...args);
        }
    }

    static error(...args) {
        // Errors her zaman gösterilsin
        console.error(...args);
    }

    static info(...args) {
        if (this.isDev) {
            console.info(...args);
        }
    }

    static debug(...args) {
        if (this.isDev && process.env.REACT_APP_DEBUG === 'true') {
            console.debug('[DEBUG]', ...args);
        }
    }
}

export default Logger;
