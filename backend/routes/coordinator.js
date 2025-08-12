const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const CoordinatorMatching = require('../services/coordinatorMatching');

// Coordinator matching service instance
const coordinatorMatching = new CoordinatorMatching();

/**
 * @route   GET /api/coordinator/status
 * @desc    Get coordinator matching status
 * @access  Private
 */
router.get('/status', auth, async (req, res) => {
    try {
        console.log('🔍 Coordinator status check for user:', req.user.email);

        // Mock coordinator status for now
        const status = {
            success: true,
            data: {
                isAvailable: true,
                matchingEnabled: true,
                totalRouters: 4,
                activeRouters: 2,
                lastSync: new Date().toISOString(),
                networkStatus: 'stable',
                routerStatus: {
                    BT107: {
                        status: 'active',
                        lastSeen: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
                        signalStrength: -65,
                        batteryLevel: 85
                    },
                    BT108: {
                        status: 'active',
                        lastSeen: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
                        signalStrength: -72,
                        batteryLevel: 92
                    },
                    BT109: {
                        status: 'offline',
                        lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                        signalStrength: null,
                        batteryLevel: null
                    },
                    BT110: {
                        status: 'offline',
                        lastSeen: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
                        signalStrength: null,
                        batteryLevel: null
                    }
                }
            },
            message: 'Coordinator status retrieved successfully'
        };

        console.log('✅ Coordinator status response:', status);
        res.json(status);

    } catch (error) {
        console.error('❌ Coordinator status error:', error);
        res.status(500).json({
            success: false,
            message: 'Coordinator status alınamadı',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/coordinator/hive-matching/:hiveId
 * @desc    Get hive matching status for specific hive
 * @access  Private
 */
router.get('/hive-matching/:hiveId', auth, async (req, res) => {
    try {
        const { hiveId } = req.params;
        console.log('🔍 Hive matching check for hive:', hiveId);

        // Mock hive matching data
        const matchingData = {
            success: true,
            data: {
                hiveId: hiveId,
                isMatched: true,
                routerId: 'BT107',
                matchedSensors: [
                    {
                        sensorType: 'BMP280',
                        deviceId: 'BMP280_001',
                        status: 'active',
                        lastReading: new Date(Date.now() - 5 * 60 * 1000).toISOString()
                    },
                    {
                        sensorType: 'DHT22',
                        deviceId: 'DHT22_001',
                        status: 'active',
                        lastReading: new Date(Date.now() - 3 * 60 * 1000).toISOString()
                    }
                ],
                matchingConfidence: 95,
                lastSync: new Date().toISOString()
            },
            message: 'Hive matching data retrieved successfully'
        };

        res.json(matchingData);

    } catch (error) {
        console.error('❌ Hive matching error:', error);
        res.status(500).json({
            success: false,
            message: 'Hive matching data alınamadı',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/coordinator/sync
 * @desc    Force coordinator sync
 * @access  Private
 */
router.post('/sync', auth, async (req, res) => {
    try {
        console.log('🔄 Forcing coordinator sync for user:', req.user.email);

        // Mock sync operation
        const syncResult = {
            success: true,
            data: {
                syncStarted: new Date().toISOString(),
                routersFound: 4,
                hivesMatched: 2,
                sensorsUpdated: 8,
                estimatedCompletion: new Date(Date.now() + 30 * 1000).toISOString()
            },
            message: 'Coordinator sync başlatıldı'
        };

        res.json(syncResult);

    } catch (error) {
        console.error('❌ Coordinator sync error:', error);
        res.status(500).json({
            success: false,
            message: 'Coordinator sync başlatılamadı',
            error: error.message
        });
    }
});

module.exports = router;
