# BeeTwin - Code Structure Backup
📅 **10 Ağustos 2025**

## 🗂️ ÖNEMLİ DOSYA STRUKTÜRü

### 🎯 Dashboard Kartları (Çalışır Durum)

#### src/partials/dashboard/
```javascript
// ✅ ANA ROUTER KARTLARI (BT107/BT108)
DashboardCard01.jsx    // Router sistem durumu + bağlantı
DashboardCard02.jsx    // Router veri akışı detayları  
DashboardCard03.jsx    // BT107: Sıcaklık + Basınç SADECE
DashboardCard04.jsx    // BT107: Nem SADECE
DashboardCard05.jsx    // Load Cell: Bağlantı bekleniyor (BT109)
DashboardCard06.jsx    // BT108: CO + NO2 hava kalitesi
DashboardCard07.jsx    // LineChart trend grafikleri ⭐ YENİ
DashboardCard08.jsx    // PieChart durum özeti ⭐ YENİ

// ✅ EK ÖZELLİK KARTLARI  
DashboardCard09.jsx    // AI Tahminleri
DashboardCard10.jsx    // Bakım Planlaması
DashboardCard12.jsx    // Lokasyon Haritası + 3D Dijital İkiz
DashboardCard14.jsx    // ML Real-Time Insights
DashboardCard15.jsx    // Router 110 MQ2 Gaz Sensörü  
DashboardCard16.jsx    // Router/Sensor Durum Eşleştirme
```

### 🔗 API ve Backend

#### backend/routes/sensors.js
```javascript
// Router API endpoint
router.get('/router/:routerId/latest', async (req, res) => {
  // BT107/BT108 için özel getLatestRouterData fonksiyonu
  // Field mapping: WT→temperature, PR→pressure, WH→humidity, CO→co, NO→no2
});

// Aktif endpoints:
// GET /api/sensors/router/107/latest → BT107 environmental
// GET /api/sensors/router/108/latest → BT108 air quality
```

#### backend/models/
```javascript
Sensor.js          // Router ID ve sensör tanımları
SensorReading.js   // Zaman serisi veri kayıtları  
Hive.js           // Kovan-router eşleştirme
User.js           // User hive router permissions (BT108 eklendi)
```

### 🎨 Chart Components

#### src/charts/
```javascript
LineChart01.jsx      // Card07 trend grafikleri için
DoughnutChart.jsx    // Card08 durum özeti için  
ChartjsConfig.jsx    // Chart.js konfigürasyon
```

### 🎮 Ana Sayfalar

#### src/pages/
```javascript
Dashboard.jsx        // Ana dashboard, 14 kartı render ediyor
                    // Lazy loading: Card01-08 + Card09,10,12,14,15,16
```

### 🔧 Hooks ve Context

#### src/hooks/
```javascript
useRealTimeData.js   // Real-time veri çekme hook'u (ÇALIŞAN)
```

#### src/contexts/ 
```javascript
AuthContext.jsx      // User authentication (ÇALIŞAN)
```

## 🗄️ DATABASE YAPISI

### MongoDB Collections
```javascript
beetwin.sensors          // Router/sensor kayıtları
├── routerId: 107        // BT107 environmental  
├── routerId: 108        // BT108 air quality
└── routerId: 109        // BT109 load cell (bekleniyor)

beetwin.sensorreadings   // Zaman serisi verileri
├── sensörId, timestamp, data
└── Real-time coordinator data

beetwin.hives           // Kovan-router eşleştirme
├── sensors: [
│   { routerId: 107, sensorId: 'BT107', sensorType: 'environmental' }
│   { routerId: 108, sensorId: 'BT108', sensorType: 'air_quality' } ✅
└── ]

beetwin.users           // User router permissions ✅
```

## ⚙️ KONFIGÜRASYON

### Environment Variables (backend/.env)
```bash
MONGODB_URI=mongodb://localhost:27017/beetwin
PORT=5000
NODE_ENV=development
JWT_SECRET=your_jwt_secret
```

### Vite Config (beeTwinproject/vite.config.js)
```javascript
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000'  // Backend proxy
    }
  }
})
```

## 🔄 VERİ AKIŞ YAPISI

### Router Data Flow
```javascript
// 1. Koordinatör Ham Veri (BT107)
coordinatorData = { WT: 26.89, PR: 101798, WH: 72, CO: null, NO: null }

// 2. Backend Field Mapping  
mappedData = {
  temperature: 26.89,    // WT → temperature
  pressure: 101798,      // PR → pressure
  humidity: 72,          // WH → humidity  
  co: null,             // CO → co
  no2: null             // NO → no2
}

// 3. Frontend API Call
const bt107Data = await fetch('/api/sensors/router/107/latest')

// 4. Card Specific Usage
Card03: temperature + pressure  // BT107
Card04: humidity               // BT107  
Card06: co + no2              // BT108
```

### Real-time Update Intervals
```javascript
Card01-02: 15-30 saniye    // Sistem durumu
Card03-04: 15 saniye       // BT107 environmental
Card05: Simulation         // Load cell (bağlantı yok)
Card06: 15 saniye          // BT108 air quality
Card07: 30 saniye          // Trend charts  
Card08: 45 saniye          // Status overview
Card09-16: Varies          // Diğer özellikler
```

## 🧹 TEMİZLENEN DOSYALAR

### Dashboard Klasörü Temizliği
```bash
# BEFORE (25 dosya)
DashboardCard01.jsx ✅
DashboardCard02.jsx ✅  
DashboardCard03.jsx ✅
DashboardCard04.jsx ✅
DashboardCard04_clean.jsx ❌ DELETED
DashboardCard05.jsx ✅
DashboardCard05_clean.jsx ❌ DELETED
DashboardCard05_old.jsx ❌ DELETED
DashboardCard06.jsx ✅
DashboardCard06_clean.jsx ❌ DELETED
DashboardCard06_old.jsx ❌ DELETED
DashboardCard06_fixed.jsx ❌ DELETED
DashboardCard07.jsx ✅
DashboardCard07_old2.jsx ❌ DELETED
DashboardCard07_fixed.jsx ❌ DELETED  
DashboardCard07_updated.jsx ❌ DELETED
DashboardCard08.jsx ✅
DashboardCard08_old2.jsx ❌ DELETED
DashboardCard08_updated.jsx ❌ DELETED
# ... Card09-16 ✅

# AFTER (14 dosya - temiz!)
```

### Context/Hook Temizliği
```bash
# DELETED
src/contexts/AuthContext_clean.jsx ❌
src/contexts/AuthContext_backup_working.jsx ❌  
src/hooks/useRealTimeData_clean.js ❌
src/components/HiveHardwareMappingForm_Updated.jsx ❌

# KEPT ✅
src/contexts/AuthContext.jsx
src/hooks/useRealTimeData.js
```

### Backend Temizliği
```bash
# DELETED  
backend/services/loraProcessor_backup.js ❌

# KEPT ✅
backend/scripts/clean-database.js      # Faydalı DB script
backend/scripts/cleanup-roles.js       # Faydalı role script
```

## 🎯 KEY FUNCTIONS

### Backend - getLatestRouterData()
```javascript
// backend/routes/sensors.js
async function getLatestRouterData(routerId) {
  // 1. Fetch latest sensor reading
  // 2. Apply field mapping (WT→temperature, etc.)
  // 3. Return standardized format
  // 4. Handle BT107/BT108 specific data
}
```

### Frontend - useRealTimeData Hook  
```javascript
// src/hooks/useRealTimeData.js
const { routerData, loading, error } = useRealTimeData();
// Router 107/108 verilerini real-time çeker
// Card'lar bu hook'u kullanarak veri alır
```

### Chart Integration
```javascript
// Card07 - LineChart trends
const chartData = {
  labels: timestamps,
  datasets: [temperature, humidity, pressure, airQuality]
}

// Card08 - DoughnutChart status  
const statusData = {
  labels: ['BT107 Online', 'BT108 Online', 'System Health'],
  data: [statusPercentages]
}
```

## 🚀 BAŞLATMA SİRASI

### Development Startup
```bash
# 1. MongoDB başlat
mongod

# 2. Backend başlat  
cd backend
npm start  # Port 5000

# 3. Frontend başlat
cd beeTwinproject  
npm run dev  # Port 5173

# 4. Test API
curl http://localhost:5000/api/sensors/router/107/latest
curl http://localhost:5000/api/sensors/router/108/latest
```

## 📋 YAPILACAKLAR LİSTESİ

### Gelecek Geliştirmeler
```
🔲 BT109 Load Cell Router entegrasyonu (Card05)
🔲 Card12 Blender 3D model integration  
🔲 Card14 ML model enhancements
🔲 Mobile responsive improvements
🔲 Error handling optimizations
🔲 WebSocket stability improvements
```

### Test Edilenler ✅
```
✅ Router API endpoints (107/108)
✅ Dashboard card rendering  
✅ Real-time data updates
✅ Chart visualizations
✅ Field mapping accuracy
✅ Database connections
✅ Frontend-backend communication
```

---
**💾 Bu backup dosyası projenin tamamen çalışır halindeki code structure'ını içermektedir.**  
**🎯 Sabah bu durumdan devam edebilirsin!**
