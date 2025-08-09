const express = require('express');
const router = express.Router();
const MLProcessor = require('../services/mlProcessor');
const SensorReading = require('../models/SensorReading');
const Sensor = require('../models/Sensor');
const { auth, requireBeekeeperOrAdmin } = require('../middleware/auth');

// ML Processor instance
const mlProcessor = new MLProcessor();

/**
 * @route   GET /api/ml/health
 * @desc    ML API health check
 * @access  Public
 */
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'ML API çalışıyor',
        timestamp: new Date().toISOString(),
        pythonStatus: 'Available'
    });
});

/**
 * @route   POST /api/ml/analyze
 * @desc    Belirli bir sensor için ML analizi yap
 * @access  Private
 */
router.post('/analyze', auth, async (req, res) => {
    try {
        const { deviceId, days = 30 } = req.body;

        if (!deviceId) {
            return res.status(400).json({
                success: false,
                message: 'Device ID gerekli'
            });
        }

        // Sensör kontrolü
        const sensor = await Sensor.findOne({
            deviceId: deviceId,
            ownerId: req.user.id
        });

        if (!sensor) {
            return res.status(404).json({
                success: false,
                message: 'Sensör bulunamadı'
            });
        }

        // Son sensor reading
        const latestReading = await SensorReading.findOne({
            sensorId: sensor._id
        }).sort({ timestamp: -1 });

        if (!latestReading) {
            return res.status(404).json({
                success: false,
                message: 'Sensor verisi bulunamadı'
            });
        }

        // Historical data
        const historicalData = await mlProcessor.getHistoricalData(deviceId, days);

        // ML Analysis
        const mlResults = await mlProcessor.analyzeData({
            deviceId: deviceId,
            sensorData: latestReading.data,
            historicalData: historicalData
        });

        res.json({
            success: true,
            data: {
                sensor: {
                    deviceId: sensor.deviceId,
                    name: sensor.name,
                    status: sensor.status
                },
                latestReading: {
                    timestamp: latestReading.timestamp,
                    data: latestReading.data,
                    batteryLevel: latestReading.batteryLevel
                },
                mlAnalysis: mlResults,
                dataPoints: historicalData.length
            }
        });

    } catch (error) {
        console.error('❌ ML analyze error:', error);
        res.status(500).json({
            success: false,
            message: 'ML analizi sırasında hata oluştu',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/ml/trends/:deviceId
 * @desc    Belirli bir sensor için trend predictions
 * @access  Private
 */
router.get('/trends/:deviceId', auth, async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { days = 30, forecastDays = 7 } = req.query;

        // Sensör kontrolü
        const sensor = await Sensor.findOne({
            deviceId: deviceId,
            ownerId: req.user.id
        });

        if (!sensor) {
            return res.status(404).json({
                success: false,
                message: 'Sensör bulunamadı'
            });
        }

        // Historical data
        const historicalData = await mlProcessor.getHistoricalData(deviceId, parseInt(days));

        if (historicalData.length < 5) {
            return res.status(400).json({
                success: false,
                message: 'Trend analizi için yeterli veri yok (en az 5 veri noktası gerekli)',
                dataPoints: historicalData.length
            });
        }

        // Trend Prediction
        const trendResults = await mlProcessor.predictTrends({
            historicalData: historicalData,
            forecastDays: parseInt(forecastDays)
        });

        res.json({
            success: true,
            data: {
                sensor: {
                    deviceId: sensor.deviceId,
                    name: sensor.name
                },
                trendPrediction: trendResults,
                parameters: {
                    historicalDays: parseInt(days),
                    forecastDays: parseInt(forecastDays),
                    dataPoints: historicalData.length
                }
            }
        });

    } catch (error) {
        console.error('❌ ML trends error:', error);
        res.status(500).json({
            success: false,
            message: 'Trend analizi sırasında hata oluştu',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/ml/anomalies/:deviceId
 * @desc    Belirli bir sensor için anomaly history
 * @access  Private
 */
router.get('/anomalies/:deviceId', auth, async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { days = 7 } = req.query;

        // Sensör kontrolü
        const sensor = await Sensor.findOne({
            deviceId: deviceId,
            ownerId: req.user.id
        });

        if (!sensor) {
            return res.status(404).json({
                success: false,
                message: 'Sensör bulunamadı'
            });
        }

        // Anomaly readings bul
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

        const anomalyReadings = await SensorReading.find({
            sensorId: sensor._id,
            timestamp: { $gte: cutoffDate },
            $or: [
                { 'metadata.mlAnalysis.anomalyDetection.is_anomaly': true },
                { 'metadata.basicAnomalies.0': { $exists: true } }
            ]
        })
            .sort({ timestamp: -1 })
            .limit(100);

        // Anomaly statistics
        const totalReadings = await SensorReading.countDocuments({
            sensorId: sensor._id,
            timestamp: { $gte: cutoffDate }
        });

        const anomalyRate = totalReadings > 0 ? (anomalyReadings.length / totalReadings) * 100 : 0;

        // Anomaly types analysis
        const anomalyTypes = {};
        anomalyReadings.forEach(reading => {
            // ML anomalies
            if (reading.metadata?.mlAnalysis?.anomalyDetection?.is_anomaly) {
                const mlAnomalies = reading.metadata.mlAnalysis.anomalyDetection.anomalies || [];
                mlAnomalies.forEach(anomaly => {
                    const type = `ml_${anomaly.parameter || 'unknown'}`;
                    anomalyTypes[type] = (anomalyTypes[type] || 0) + 1;
                });
            }

            // Basic anomalies
            if (reading.metadata?.basicAnomalies) {
                reading.metadata.basicAnomalies.forEach(anomaly => {
                    const type = `basic_${anomaly.parameter}`;
                    anomalyTypes[type] = (anomalyTypes[type] || 0) + 1;
                });
            }
        });

        res.json({
            success: true,
            data: {
                sensor: {
                    deviceId: sensor.deviceId,
                    name: sensor.name
                },
                statistics: {
                    totalAnomalies: anomalyReadings.length,
                    totalReadings: totalReadings,
                    anomalyRate: parseFloat(anomalyRate.toFixed(2)),
                    period: `${days} days`
                },
                anomalyTypes: anomalyTypes,
                recentAnomalies: anomalyReadings.slice(0, 10).map(reading => ({
                    timestamp: reading.timestamp,
                    data: reading.data,
                    batteryLevel: reading.batteryLevel,
                    mlAnomaly: reading.metadata?.mlAnalysis?.anomalyDetection?.is_anomaly || false,
                    basicAnomalies: reading.metadata?.basicAnomalies || [],
                    mlInsights: reading.metadata?.mlAnalysis?.insights || []
                }))
            }
        });

    } catch (error) {
        console.error('❌ ML anomalies error:', error);
        res.status(500).json({
            success: false,
            message: 'Anomaly analizi sırasında hata oluştu',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/ml/statistics/:deviceId
 * @desc    Belirli bir sensor için detaylı istatistikler
 * @access  Private
 */
router.get('/statistics/:deviceId', auth, async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { days = 30 } = req.query;

        // Sensör kontrolü
        const sensor = await Sensor.findOne({
            deviceId: deviceId,
            ownerId: req.user.id
        });

        if (!sensor) {
            return res.status(404).json({
                success: false,
                message: 'Sensör bulunamadı'
            });
        }

        // Historical data
        const historicalData = await mlProcessor.getHistoricalData(deviceId, parseInt(days));

        if (historicalData.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'İstatistik için veri bulunamadı'
            });
        }

        // Statistics calculation
        const statistics = await mlProcessor.calculateStatistics({
            sensorData: historicalData[historicalData.length - 1] || {},
            historicalData: historicalData
        });

        // Additional business statistics
        const businessStats = await calculateBusinessStatistics(historicalData, sensor);

        res.json({
            success: true,
            data: {
                sensor: {
                    deviceId: sensor.deviceId,
                    name: sensor.name
                },
                period: `${days} days`,
                dataPoints: historicalData.length,
                statistics: statistics,
                businessMetrics: businessStats,
                generatedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('❌ ML statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'İstatistik analizi sırasında hata oluştu',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/ml/health
 * @desc    ML system health check
 * @access  Private
 */
router.get('/health', auth, async (req, res) => {
    try {
        // Python environment check
        const pythonCheck = await mlProcessor.checkPythonEnvironment();

        // Model files check
        const fs = require('fs');
        const path = require('path');

        const modelFiles = {
            anomaly_detector: fs.existsSync(path.join(__dirname, '../ml/models/anomaly_detector.py')),
            trend_predictor: fs.existsSync(path.join(__dirname, '../ml/models/trend_predictor.py'))
        };

        // Recent ML analysis count
        const recentAnalysisCount = await SensorReading.countDocuments({
            'metadata.mlAnalysis': { $exists: true },
            timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
        });

        res.json({
            success: true,
            data: {
                mlSystem: {
                    initialized: mlProcessor.isInitialized,
                    pythonEnvironment: pythonCheck,
                    modelFiles: modelFiles,
                    recentAnalyses: recentAnalysisCount
                },
                status: mlProcessor.isInitialized ? 'operational' : 'degraded',
                message: mlProcessor.isInitialized ?
                    'ML system fully operational' :
                    'ML system running in fallback mode'
            }
        });

    } catch (error) {
        console.error('❌ ML health check error:', error);
        res.status(500).json({
            success: false,
            message: 'ML sistem kontrolü sırasında hata oluştu',
            error: error.message
        });
    }
});

/**
 * Business statistics calculation helper
 */
async function calculateBusinessStatistics(historicalData, sensor) {
    try {
        const stats = {
            productivity: {},
            efficiency: {},
            health: {}
        };

        // Weight-based productivity metrics
        const weightData = historicalData
            .map(d => ({ timestamp: d.timestamp, weight: d.weight }))
            .filter(d => d.weight !== undefined && d.weight !== null);

        if (weightData.length > 0) {
            const weights = weightData.map(d => d.weight);
            const avgWeight = weights.reduce((a, b) => a + b, 0) / weights.length;
            const maxWeight = Math.max(...weights);
            const minWeight = Math.min(...weights);

            stats.productivity = {
                averageWeight: parseFloat(avgWeight.toFixed(2)),
                weightRange: parseFloat((maxWeight - minWeight).toFixed(2)),
                weightTrend: weightData.length > 1 ?
                    (weights[weights.length - 1] > weights[0] ? 'increasing' : 'decreasing') : 'stable'
            };
        }

        // Temperature-based efficiency metrics
        const tempData = historicalData
            .map(d => d.temperature)
            .filter(t => t !== undefined && t !== null);

        if (tempData.length > 0) {
            const optimalTempRange = { min: 20, max: 35 };
            const optimalReadings = tempData.filter(t => t >= optimalTempRange.min && t <= optimalTempRange.max);
            const efficiency = (optimalReadings.length / tempData.length) * 100;

            stats.efficiency = {
                temperatureEfficiency: parseFloat(efficiency.toFixed(2)),
                optimalReadings: optimalReadings.length,
                totalReadings: tempData.length
            };
        }

        // Overall health score
        const batteryData = historicalData
            .map(d => d.batteryLevel)
            .filter(b => b !== undefined && b !== null);

        if (batteryData.length > 0) {
            const avgBattery = batteryData.reduce((a, b) => a + b, 0) / batteryData.length;
            const batteryHealth = avgBattery > 50 ? 'good' : avgBattery > 20 ? 'warning' : 'critical';

            stats.health = {
                batteryScore: parseFloat(avgBattery.toFixed(2)),
                batteryHealth: batteryHealth,
                dataConsistency: (historicalData.length / (30 * 24 * 6)) * 100 // Expected 6 readings per day for 30 days
            };
        }

        return stats;

    } catch (error) {
        console.error('❌ Business statistics calculation error:', error);
        return { error: 'Business statistics calculation failed' };
    }
}

module.exports = router;
