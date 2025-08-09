# 🐝 BeeTwin IoT Sistemi - Dosya Rehberi

## 📁 Ana Dosyalar

### Python Scripts
- **`pc_coordinator_text.py`** ⭐ **AKTİF** 
  - Router'lardan text format veri alır
  - Backend API'ye gönderir
  - Format: "RID:107; SID:1013; WT: 26.08"
  - Desteklenen Sensörler:
    * BMP280: Sıcaklık, Basınç, Nem, Yükseklik
    * MICS-4514: CO, NO2 (hava kalitesi)
    * Load Cell: Ağırlık ölçümü
    * MQ2: Yanıcı gaz, CO, LPG
    * DHT22: Sıcaklık, Nem
  - Router ID ve Sensor ID kullanıcı tarafından manuel girilir

### Arduino
- **`pc_coordinator_arduino_fixed.ino`** ⭐ **AKTİF**
  - Arduino coordinator kodu
  - LoRa E32 ile router'lardan veri alır
  - Text format çıkışı verir

## 📁 Backend (Node.js + MongoDB)
```
backend/
├── app.js              # Ana sunucu
├── routes/lora.js       # LoRa veri API'si (düzeltildi)
├── services/
│   ├── loraProcessor.js # Veri işleme (otomatik sensör oluşturma)
│   └── mlProcessor.js   # ML analiz
└── models/
    ├── Sensor.js        # Sensör modeli
    └── SensorReading.js # Veri okuma modeli
```

## 📁 Frontend (React + Vite)
```
src/
├── App.jsx             # Ana uygulama
├── pages/
│   ├── Dashboard.jsx   # Ana dashboard
│   └── AdminPanel.jsx  # Yönetim paneli
└── components/         # UI bileşenleri
```

## 🔧 Nasıl Çalıştırılır

### 1. Backend
```bash
cd backend
npm start
```

### 2. Frontend  
```bash
npm run dev
```

### 3. PC Coordinator
```bash
python pc_coordinator_text.py
```

## 📊 Veri Akışı
```
Router 107/108 → LoRa E32 → Arduino → PC Coordinator → Backend API → MongoDB → Frontend
```

## ✅ Son Durum
- ✅ Text parsing çalışıyor
- ✅ Backend otomatik sensör oluşturuyor
- ✅ HTTP 400 hatası çözüldü
- ✅ Real-time veri akışı hazır

## 📝 Notlar
- Router 107: BME280 sensörü (Sıcaklık, Basınç, Nem)
- Router 108: MICS-4514 sensörü (CO, NO2)
- Backend MongoDB'da otomatik sensör kaydı yapıyor
- Text format: "RID:107; SID:1013; WT: 26.08"
