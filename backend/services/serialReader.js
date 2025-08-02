const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const LoRaDataProcessor = require('./loraProcessor');

/**
 * Serial Port Reader Service
 * 
 * Bu servis Coordinator Arduino'dan USB/Serial port üzerinden 
 * gelen LoRa verilerini okur ve işler.
 * 
 * Coordinator'dan gelen format:
 * "BT001:25.5,65.2,45.8:85:-65"
 */
class SerialReader {
    constructor(io, options = {}) {
        this.io = io; // WebSocket instance
        this.portPath = options.portPath || this.detectPort();
        this.baudRate = options.baudRate || 9600;
        this.port = null;
        this.parser = null;
        this.loraProcessor = new LoRaDataProcessor(io);
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 5000; // 5 saniye
    }

    // Otomatik port tespiti (Windows/Linux uyumlu)
    detectPort() {
        const os = require('os');
        const platform = os.platform();

        if (platform === 'win32') {
            return 'COM3'; // Windows varsayılan (değiştirilebilir)
        } else if (platform === 'linux') {
            return '/dev/ttyUSB0'; // Linux varsayılan
        } else if (platform === 'darwin') {
            return '/dev/tty.usbserial'; // macOS varsayılan
        }

        return 'COM3'; // Fallback
    }

    // Mevcut portları listele
    async listAvailablePorts() {
        try {
            const ports = await SerialPort.list();
            console.log('📋 Available Serial Ports:');
            ports.forEach(port => {
                console.log(`  - ${port.path} (${port.manufacturer || 'Unknown'})`);
            });
            return ports;
        } catch (error) {
            console.error('❌ Error listing ports:', error);
            return [];
        }
    }

    // Serial port bağlantısını başlat
    async start() {
        try {
            console.log(`🔌 Starting Serial Reader on port: ${this.portPath}`);

            // Mevcut portları listele
            await this.listAvailablePorts();

            // Serial port oluştur
            this.port = new SerialPort({
                path: this.portPath,
                baudRate: this.baudRate,
                autoOpen: false
            });

            // Line parser ekle (her satır bir veri paketi)
            this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\n' }));

            // Event handler'ları ayarla
            this.setupEventHandlers();

            // Portu aç
            await this.openPort();

            console.log('✅ Serial Reader started successfully');
            return true;

        } catch (error) {
            console.error('❌ Serial Reader start error:', error);
            this.scheduleReconnect();
            return false;
        }
    }

    // Event handler'ları ayarla
    setupEventHandlers() {
        // Port açıldığında
        this.port.on('open', () => {
            console.log('✅ Serial port opened');
            this.isConnected = true;
            this.reconnectAttempts = 0;

            // WebSocket ile status bildir
            this.io.emit('serial-status', {
                connected: true,
                port: this.portPath,
                timestamp: new Date()
            });
        });

        // Port kapandığında
        this.port.on('close', () => {
            console.log('⚠️ Serial port closed');
            this.isConnected = false;

            // WebSocket ile status bildir
            this.io.emit('serial-status', {
                connected: false,
                port: this.portPath,
                timestamp: new Date()
            });

            this.scheduleReconnect();
        });

        // Hata durumunda
        this.port.on('error', (error) => {
            console.error('❌ Serial port error:', error);
            this.isConnected = false;

            // WebSocket ile hata bildir
            this.io.emit('serial-error', {
                error: error.message,
                port: this.portPath,
                timestamp: new Date()
            });
        });

        // Veri geldiğinde (en önemli kısım!)
        this.parser.on('data', (data) => {
            this.handleIncomingData(data);
        });
    }

    // Portu aç
    openPort() {
        return new Promise((resolve, reject) => {
            this.port.open((error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }

    // Gelen veriyi işle
    handleIncomingData(rawData) {
        try {
            // Raw data'yı temizle
            const cleanData = rawData.toString().trim();

            if (!cleanData) return; // Boş satırları atla

            console.log('📡 Raw data received:', cleanData);

            // Veri formatını kontrol et
            if (this.validateDataFormat(cleanData)) {
                // LoRaProcessor'a gönder
                this.loraProcessor.processWirelessData(cleanData);

                // WebSocket ile raw data'yı da gönder (debug için)
                this.io.emit('raw-sensor-data', {
                    data: cleanData,
                    timestamp: new Date()
                });

            } else {
                console.warn('⚠️ Invalid data format:', cleanData);
            }

        } catch (error) {
            console.error('❌ Data handling error:', error);
        }
    }

    // Veri formatını validate et
    validateDataFormat(data) {
        // Expected formats: 
        // BT format: "BT001:25.5,65.2,45.8:85:-65"
        // COORD format: "COORD_001:26.5,67.2,46.8,0.87:88:-68"
        const btPattern = /^BT[0-9]+:[0-9.,]+:[0-9]+:-?[0-9]+$/;
        const coordPattern = /^COORD_[0-9]+:[0-9.,]+:[0-9]+:-?[0-9]+$/;

        return btPattern.test(data) || coordPattern.test(data);
    }

    // Yeniden bağlanma zamanlayıcısı
    scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('❌ Max reconnection attempts reached');
            return;
        }

        this.reconnectAttempts++;
        console.log(`🔄 Scheduling reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${this.reconnectDelay / 1000}s`);

        setTimeout(() => {
            this.start();
        }, this.reconnectDelay);
    }

    // Serial Reader'ı durdur
    async stop() {
        try {
            if (this.port && this.port.isOpen) {
                await new Promise((resolve) => {
                    this.port.close(resolve);
                });
            }
            console.log('🛑 Serial Reader stopped');
        } catch (error) {
            console.error('❌ Error stopping Serial Reader:', error);
        }
    }

    // Bağlantı durumunu kontrol et
    getStatus() {
        return {
            connected: this.isConnected,
            port: this.portPath,
            baudRate: this.baudRate,
            reconnectAttempts: this.reconnectAttempts
        };
    }
}

module.exports = SerialReader;
