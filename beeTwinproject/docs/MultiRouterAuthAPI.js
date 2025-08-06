/**
 * ÇOKLU ROUTER DESTEKLİ BACKEND API GÜNCELLEMELERİ
 * 
 * Kayıt sırasında kovan başına 4 router işlemek için gerekli backend değişiklikleri
 */

// routes/auth.js - Güncellenmiş Registration Endpoint
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Apiary = require('../models/Apiary');
const Hive = require('../models/Hive');
const router = express.Router();

// ÇOKLU ROUTER KAYIT SİSTEMİ
router.post('/register', async (req, res) => {
    try {
        const { userData, apiaryData } = req.body;

        // 1. Kullanıcı oluştur
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        const user = new User({
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            password: hashedPassword,
            phone: userData.phone,
            address: userData.address
        });

        await user.save();

        // 2. Her arılık ve kovan için işlemler
        for (const apiaryInfo of apiaryData.apiaries) {
            // Arılık oluştur
            const apiary = new Apiary({
                name: apiaryInfo.name,
                location: apiaryInfo.location,
                hiveCount: apiaryInfo.hiveCount,
                userId: user._id
            });

            await apiary.save();

            // 3. Kovanları ve çoklu router'ları oluştur
            if (apiaryInfo.hives && apiaryInfo.hives.length > 0) {
                for (const hiveInfo of apiaryInfo.hives) {
                    // Her kovan için Router/Sensor ID benzersizlik kontrolü
                    const validationErrors = await validateMultiRouterIds(hiveInfo.hardware);

                    if (validationErrors.length > 0) {
                        return res.status(400).json({
                            success: false,
                            message: 'Router/Sensor ID çakışmaları tespit edildi',
                            errors: validationErrors
                        });
                    }

                    // Hive oluştur (çoklu router desteği)
                    const hive = new Hive({
                        name: hiveInfo.name,
                        hiveNumber: hiveInfo.hiveNumber,
                        hiveType: hiveInfo.hiveType,
                        description: hiveInfo.description,
                        hardware: {
                            coordinatorAddress: hiveInfo.hardware.coordinatorAddress,
                            channel: hiveInfo.hardware.channel,
                            routers: hiveInfo.hardware.routers.map(router => ({
                                routerType: router.routerType,
                                routerName: router.routerName,
                                routerId: router.routerId,
                                address: router.address,
                                sensors: router.sensors.map(sensor => ({
                                    sensorType: sensor.sensorType,
                                    sensorName: sensor.sensorName,
                                    sensorId: sensor.sensorId,
                                    unit: sensor.unit,
                                    isActive: sensor.isActive
                                })),
                                isActive: router.isActive
                            }))
                        },
                        apiaryId: apiary._id,
                        userId: user._id
                    });

                    await hive.save();

                    // Arılığa kovan ID'sini ekle
                    apiary.hives.push(hive._id);
                }

                await apiary.save();
            }
        }

        // JWT token oluştur
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            success: true,
            message: 'Çoklu router sistemi başarıyla kaydedildi',
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Çoklu router kayıt hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Kayıt sırasında hata oluştu',
            error: error.message
        });
    }
});

/**
 * Çoklu Router ID Benzersizlik Kontrolü
 */
async function validateMultiRouterIds(hardware) {
    const errors = [];

    if (!hardware.routers || hardware.routers.length === 0) {
        return errors;
    }

    for (const router of hardware.routers) {
        // Router ID benzersizlik kontrolü
        if (router.routerId) {
            const isRouterIdUnique = await Hive.checkRouterIdUniqueness(router.routerId);
            if (!isRouterIdUnique) {
                errors.push({
                    type: 'DUPLICATE_ROUTER_ID',
                    routerId: router.routerId,
                    routerName: router.routerName,
                    message: `Router ID "${router.routerId}" zaten kullanımda`
                });
            }
        }

        // Sensor ID benzersizlik kontrolü
        if (router.sensors && router.sensors.length > 0) {
            for (const sensor of router.sensors) {
                if (sensor.sensorId && sensor.isActive) {
                    const isSensorIdUnique = await Hive.checkSensorIdUniqueness(sensor.sensorId);
                    if (!isSensorIdUnique) {
                        errors.push({
                            type: 'DUPLICATE_SENSOR_ID',
                            sensorId: sensor.sensorId,
                            sensorName: sensor.sensorName,
                            routerName: router.routerName,
                            message: `Sensor ID "${sensor.sensorId}" zaten kullanımda (${router.routerName})`
                        });
                    }
                }
            }
        }
    }

    return errors;
}

/**
 * Router ID Önerisi Endpoint'i
 */
router.get('/suggest-router-ids/:routerType', async (req, res) => {
    try {
        const { routerType } = req.params;
        const { userId, prefix } = req.query;

        // Router tipine göre ID önerileri
        const suggestions = await generateRouterIdSuggestions(routerType, userId, prefix);

        res.json({
            success: true,
            routerType,
            suggestions
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'ID önerisi oluşturulamadı',
            error: error.message
        });
    }
});

/**
 * Sensor ID Önerisi Endpoint'i
 */
router.get('/suggest-sensor-ids/:sensorType', async (req, res) => {
    try {
        const { sensorType } = req.params;
        const { userId, routerId } = req.query;

        const suggestions = await generateSensorIdSuggestions(sensorType, userId, routerId);

        res.json({
            success: true,
            sensorType,
            suggestions
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Sensor ID önerisi oluşturulamadı',
            error: error.message
        });
    }
});

/**
 * Router ID Önerisi Generator
 */
async function generateRouterIdSuggestions(routerType, userId, prefix = '') {
    const suggestions = [];
    const userPrefix = prefix || 'USER';

    // Router tipine göre standart ID formatları
    const routerTypeMap = {
        'bmp280': '107',
        'mics4514': '108',
        'loadcell': '109',
        'mq2': '110'
    };

    const baseId = routerTypeMap[routerType] || '100';

    // Farklı format önerileri
    const formats = [
        `${userPrefix}R${baseId}`,
        `${userPrefix}${baseId.toUpperCase()}`,
        `${userPrefix}_R${baseId}`,
        `R${baseId}_${userPrefix}`,
        `${baseId}${userPrefix.substring(0, 3).toUpperCase()}`
    ];

    for (const format of formats) {
        let counter = 1;
        let suggestion = format;

        // Benzersizlik kontrolü ile 3 öneri oluştur
        while (suggestions.length < 3 && counter <= 10) {
            if (counter > 1) {
                suggestion = `${format}${counter.toString().padStart(2, '0')}`;
            }

            const isUnique = await Hive.checkRouterIdUniqueness(suggestion);
            if (isUnique) {
                suggestions.push({
                    id: suggestion,
                    format: format,
                    description: `${routerType.toUpperCase()} Router ID`
                });
            }
            counter++;
        }

        if (suggestions.length >= 5) break;
    }

    return suggestions;
}

/**
 * Sensor ID Önerisi Generator
 */
async function generateSensorIdSuggestions(sensorType, userId, routerId) {
    const suggestions = [];
    const userPrefix = userId ? userId.substring(0, 4).toUpperCase() : 'USER';

    // Sensor tipine göre standart suffixler
    const sensorTypeMap = {
        'temp': 'T',
        'humidity': 'H',
        'pressure': 'P',
        'co': 'C',
        'no2': 'N',
        'gasLevel': 'G',
        'weight': 'W',
        'deltaWeight': 'DW',
        'smoke': 'S',
        'lpg': 'L'
    };

    const sensorSuffix = sensorTypeMap[sensorType] || 'S';
    const routerPrefix = routerId || 'R000';

    // Farklı format önerileri
    const formats = [
        `${routerPrefix}${sensorSuffix}`,
        `${routerPrefix}_${sensorSuffix}`,
        `${userPrefix}${sensorSuffix}`,
        `S${sensorSuffix}${routerPrefix.substring(1)}`,
        `${sensorSuffix}${routerPrefix}`
    ];

    for (const format of formats) {
        let counter = 1;
        let suggestion = format;

        while (suggestions.length < 3 && counter <= 10) {
            if (counter > 1) {
                suggestion = `${format}${counter.toString().padStart(2, '0')}`;
            }

            const isUnique = await Hive.checkSensorIdUniqueness(suggestion);
            if (isUnique) {
                suggestions.push({
                    id: suggestion,
                    format: format,
                    description: `${sensorType} Sensor ID`,
                    routerId: routerId
                });
            }
            counter++;
        }

        if (suggestions.length >= 5) break;
    }

    return suggestions;
}

module.exports = router;
