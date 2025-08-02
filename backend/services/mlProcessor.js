const { spawn } = require('child_process');
const path = require('path');

/**
 * Machine Learning Processor Service
 */
class MLProcessor {
    constructor() {
        this.pythonPaths = [
            'python',
            'C:\\Users\\' + process.env.USERNAME + '\\AppData\\Local\\Programs\\Python\\Python313\\python.exe'
        ];
        this.pythonPath = 'python';
        this.isInitialized = false;
        this.modelsPath = path.join(__dirname, '..', 'ml', 'models');

        this.detectPythonPath();
    }

    async detectPythonPath() {
        for (const pythonPath of this.pythonPaths) {
            try {
                await this.testPythonPath(pythonPath);
                this.pythonPath = pythonPath;
                this.isInitialized = true;
                console.log(`🧠 ML Processor initialized successfully with Python: ${pythonPath}`);
                return;
            } catch (error) {
                continue;
            }
        }

        console.log('⚠️ Python not found, using fallback methods');
        this.isInitialized = false;
    }

    async testPythonPath(pythonPath) {
        return new Promise((resolve, reject) => {
            const process = spawn(pythonPath, ['-c', 'import sys; print(sys.version)']);

            process.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`Python test failed with code ${code}`));
                }
            });

            process.on('error', (error) => {
                reject(error);
            });
        });
    }

    /**
     * Geçmiş verileri al (ML analizi için)
     */
    async getHistoricalData(deviceId, days = 30) {
        try {
            const SensorReading = require('../models/SensorReading');
            const Sensor = require('../models/Sensor');

            // Device ID'ye göre sensor'ü bul
            const sensor = await Sensor.findOne({ deviceId });
            if (!sensor) {
                console.log('📊 Historical data: Sensor not found for', deviceId);
                return [];
            }

            // Son N günün verilerini al
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const historicalData = await SensorReading.find({
                sensorId: sensor._id,
                timestamp: { $gte: startDate }
            }).sort({ timestamp: 1 }).limit(1000); // Max 1000 record

            console.log(`📊 Historical data: ${historicalData.length} records for ${deviceId} (${days} days)`);
            return historicalData;

        } catch (error) {
            console.error('❌ Historical data fetch error:', error.message);
            return [];
        }
    }

    async analyzeData(data) {
        try {
            const results = {
                timestamp: new Date().toISOString(),
                mlEnabled: this.isInitialized,
                anomalyDetection: null,
                trendPrediction: null,
                statistics: null,
                insights: []
            };

            results.anomalyDetection = await this.detectAnomalies(data);
            results.trendPrediction = await this.predictTrends(data);
            results.statistics = await this.calculateStatistics(data);
            results.insights = this.generateInsights(results);

            return results;

        } catch (error) {
            console.error('❌ ML Analysis error:', error.message);
            return this.fallbackAnalysis(data);
        }
    }

    async detectAnomalies(data) {
        const sensorReading = Array.isArray(data) ? data[0] : data;
        return this.fallbackAnomalyDetection(sensorReading.sensorData);
    }

    async predictTrends(data) {
        return this.fallbackTrendAnalysis(data);
    }

    async calculateStatistics(data) {
        if (!Array.isArray(data) || data.length === 0) {
            return { error: 'Invalid data for statistics calculation' };
        }

        try {
            const sensorReadings = data.map(reading => reading.sensorData).filter(Boolean);

            if (sensorReadings.length === 0) {
                return { error: 'No valid sensor data found' };
            }

            const stats = {
                count: sensorReadings.length,
                temperature: this.calculateFieldStats(sensorReadings, 'temperature'),
                humidity: this.calculateFieldStats(sensorReadings, 'humidity'),
                weight: this.calculateFieldStats(sensorReadings, 'weight'),
                gasLevel: this.calculateFieldStats(sensorReadings, 'gasLevel')
            };

            return stats;
        } catch (error) {
            console.error('❌ Statistics calculation error:', error);
            return { error: 'Statistics calculation failed' };
        }
    }

    calculateFieldStats(data, field) {
        const values = data.map(item => item[field]).filter(val => val !== undefined && val !== null);

        if (values.length === 0) {
            return { error: `No valid ${field} data` };
        }

        const sum = values.reduce((a, b) => a + b, 0);
        const mean = sum / values.length;

        return {
            min: Math.min(...values),
            max: Math.max(...values),
            mean: parseFloat(mean.toFixed(2)),
            count: values.length
        };
    }

    generateInsights(results) {
        const insights = [];

        if (results.anomalyDetection && results.anomalyDetection.anomalies && results.anomalyDetection.anomalies.length > 0) {
            insights.push({
                type: 'anomaly_alert',
                severity: 'high',
                message: `${results.anomalyDetection.anomalies.length} anomali tespit edildi`,
                details: results.anomalyDetection.anomalies
            });
        }

        if (results.statistics) {
            insights.push({
                type: 'health_summary',
                severity: 'info',
                message: `${results.statistics.count} veri noktası analiz edildi`,
                details: results.statistics
            });
        }

        return insights;
    }

    fallbackAnalysis(data) {
        const sensorReading = Array.isArray(data) ? data[0] : data;

        return {
            timestamp: new Date().toISOString(),
            deviceId: sensorReading.deviceId || 'unknown',
            mlEnabled: false,
            anomalyDetection: this.fallbackAnomalyDetection(sensorReading.sensorData),
            trendPrediction: this.fallbackTrendAnalysis(data),
            statistics: this.calculateStatistics(data),
            insights: [{
                type: 'system_info',
                severity: 'info',
                message: 'ML modelleri kullanılamıyor, fallback analiz kullanılıyor',
                details: { reason: 'Python ML models not available' }
            }]
        };
    }

    fallbackAnomalyDetection(sensorData) {
        if (!sensorData) {
            return {
                anomalies: [],
                anomalyScore: 0,
                isAnomalous: false,
                message: 'No sensor data provided'
            };
        }

        const anomalies = [];
        let anomalyScore = 0;

        const temp = sensorData.temperature;
        if (temp !== undefined) {
            if (temp > 40 || temp < 5) {
                anomalies.push({
                    parameter: 'temperature',
                    value: temp,
                    threshold: temp > 40 ? 40 : 5,
                    severity: 'high'
                });
                anomalyScore += 0.4;
            }
        }

        const humidity = sensorData.humidity;
        if (humidity !== undefined) {
            if (humidity > 90 || humidity < 20) {
                anomalies.push({
                    parameter: 'humidity',
                    value: humidity,
                    threshold: humidity > 90 ? 90 : 20,
                    severity: 'medium'
                });
                anomalyScore += 0.3;
            }
        }

        return {
            anomalies,
            anomalyScore: Math.min(anomalyScore, 1.0),
            isAnomalous: anomalies.length > 0,
            message: anomalies.length > 0 ? `${anomalies.length} anomaly detected` : 'No anomalies detected'
        };
    }

    fallbackTrendAnalysis(data) {
        if (!Array.isArray(data) || data.length < 2) {
            return {
                trends: {},
                message: 'Insufficient data for trend analysis',
                predictions: {}
            };
        }

        const trends = {};
        const sensorReadings = data.map(reading => reading.sensorData).filter(Boolean);

        if (sensorReadings.length < 2) {
            return {
                trends: {},
                message: 'No valid sensor data for trend analysis',
                predictions: {}
            };
        }

        ['temperature', 'humidity', 'weight', 'gasLevel'].forEach(param => {
            const values = sensorReadings.map(reading => reading[param]).filter(val => val !== undefined);

            if (values.length >= 2) {
                const first = values[0];
                const last = values[values.length - 1];
                const change = last - first;
                const changePercent = (change / first) * 100;

                trends[param] = {
                    direction: Math.abs(changePercent) < 5 ? 'stable' :
                        changePercent > 0 ? 'increasing' : 'decreasing',
                    change: parseFloat(change.toFixed(2)),
                    changePercent: parseFloat(changePercent.toFixed(2)),
                    current: last,
                    previous: first
                };
            }
        });

        return {
            trends,
            message: `Trend analysis completed for ${Object.keys(trends).length} parameters`,
            predictions: {}
        };
    }
}

module.exports = MLProcessor;
