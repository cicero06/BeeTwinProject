# 🐝 BeeTwin - Dijital İkiz Arıcılık Yönetim Sistemi

## 📋 Proje Hakkında

BeeTwin, modern arıcılık işletmeleri için geliştirilmiş kapsamlı bir dijital ikiz yönetim sistemidir. IoT sensörleri, coğrafi haritalar ve gerçek zamanlı veri analizi ile arıcılık faaliyetlerini optimize eder.

## ✨ Özellikler

### 🗺️ Kovan Dijital İkiz ve Lokasyon Haritası
- **Coğrafi Harita Entegrasyonu**: Leaflet ile interaktif harita
- **Arılık Yönetimi**: Beykoz, Şile, Polonezköy konumları
- **3D Dijital İkiz**: Blender tarzı kovan görselleştirmesi
- **Gerçek Zamanlı Sensörler**: Sıcaklık, nem, ağırlık, hava kalitesi

### 📊 Dashboard Özellikleri
- **Kontrol Paneli**: Ana dashboard ve kovan izleme
- **Arılık Yönetimi**: Kovan, koloni ve ana arı takibi
- **Üretim & Satış**: Bal üretimi, hasat kayıtları, sipariş yönetimi
- **IoT & Sensörler**: Sensör listesi, veri analizi, alarm sistemi
- **Araştırma & Analiz**: Veri analizi ve raporlama

### 🎨 Teknik Özellikler
- **React 19**: Modern React hooks ve state yönetimi
- **Tailwind CSS**: Responsive ve modern UI tasarımı
- **React-Leaflet**: Coğrafi harita entegrasyonu
- **Chart.js**: Veri görselleştirme
- **Vite**: Hızlı development ve build
- **Dark Mode**: Gece modu desteği

## 🚀 Kurulum

### Gereksinimler
- Node.js (v18+)
- npm veya pnpm

### Kurulum Adımları

1. **Projeyi klonlayın**
   ```bash
   git clone https://github.com/yourusername/beetwin-digital-twin-beekeeping.git
   cd beetwin-digital-twin-beekeeping
   ```

2. **Bağımlılıkları yükleyin**
   ```bash
   npm install
   # veya
   pnpm install
   ```

3. **Development server'ı başlatın**
   ```bash
   npm run dev
   # veya
   pnpm dev
   ```

4. **Tarayıcıda açın**
   ```
   http://localhost:5173
   ```

## 📁 Proje Yapısı

```
src/
├── components/          # Yeniden kullanılabilir componentler
├── pages/              # Ana sayfalar
├── partials/           # Bölüm componentleri
│   ├── dashboard/      # Dashboard kartları
│   ├── Header.jsx      # Ana başlık
│   └── Sidebar.jsx     # Yan menü
├── charts/             # Grafik componentleri
├── utils/              # Yardımcı fonksiyonlar
├── css/                # Stil dosyaları
└── images/             # Resim dosyaları
```

## 🔧 Komutlar

- `npm run dev` - Development server başlatır
- `npm run build` - Production build oluşturur
- `npm run preview` - Build'i önizler

## 🌟 Öne Çıkan Özellikler

### Kovan Dijital İkiz Sistemi
- **3D Görselleştirme**: Gerçek zamanlı kovan durumu
- **Sensör Entegrasyonu**: IoT sensör verilerinin canlı izlenmesi
- **Anomali Tespiti**: Otomatik uyarı ve alarm sistemi
- **Harita Senkronizasyonu**: Coğrafi konum ile dijital ikiz eşleştirmesi

### Arılık Yönetimi
- **Çoklu Arılık Desteği**: Farklı lokasyonlardaki arılıkların yönetimi
- **Kovan Takibi**: Her kovanın ayrı ayrı izlenmesi
- **Koloni Sağlığı**: Ana arı takibi ve koloni durumu
- **Bakım Planları**: Zamanlanmış bakım ve muayene kayıtları

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 👥 Geliştirici

- **Proje Adı**: BeeTwin - Dijital İkiz Arıcılık Sistemi
- **Geliştirici**: [Your Name]
- **E-posta**: [your-email@example.com]
- **GitHub**: [https://github.com/yourusername]

## 🔗 Bağlantılar

- [Proje Demosu](https://beetwin-demo.vercel.app)
- [Dokümantasyon](https://docs.beetwin.com)
- [API Referansı](https://api.beetwin.com/docs)

---

**BeeTwin** - Arıcılığın dijital geleceği! 🍯✨