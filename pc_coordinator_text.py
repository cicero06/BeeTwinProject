"""
BeeTwin PC Coordinator - Text Format Parser
Router'lardan LoRa E32 ile TEXT veri alır ve backend'e gönderir
"""

import serial
import serial.tools.list_ports
import requests
from datetime import datetime
import time
import re

# Configuration
BACKEND_URL = 'http://localhost:5000/api/lora/data'

# Router data collection for complete device updates - Dinamik yapı
router_data_cache = { 
    '107': {'temperature': None, 'pressure': None, 'humidity': None, 'altitude': None, 'last_update': None},
    '108': {'co': None, 'no': None, 'last_update': None},
    '109': {'weight': None, 'temperature': None, 'humidity': None, 'last_update': None},
    '110': {'vibration': None, 'sound': None, 'temperature': None, 'last_update': None},
    '111': {'light': None, 'uv': None, 'temperature': None, 'last_update': None},
    '112': {'ph': None, 'moisture': None, 'temperature': None, 'last_update': None}
}

def find_serial_port():
    """Mevcut COM portlarını tara ve LoRa modülünü bul"""
    ports = serial.tools.list_ports.comports()
    
    print("🔍 COM Port Taraması:")
    for i, port in enumerate(ports, 1):
        print(f"  {i}. {port.device} - {port.description}")
        
    if not ports:
        print("❌ Hiç COM port bulunamadı!")
        print("💡 LoRa E32 modülünüzün bilgisayara bağlı olduğundan emin olun")
        return None
        
    # Otomatik olarak ilk portu seç
    selected_port = ports[0].device
    print(f"📡 Otomatik seçilen: {selected_port}")
    return selected_port

def parse_text_data(line):
    """Text formatındaki veriyi parse et: RID:107; SID:1013; WT: 25.83"""
    try:
        # RID:107; SID:1013; WT: 25.83 formatını parse et
        if 'RID:' in line and 'SID:' in line:
            parts = line.strip().split(';')
            
            # RID kısmını parse et
            rid_part = parts[0].strip()  # "RID:107"
            router_id = rid_part.split(':')[1].strip()  # "107"
            
            # SID kısmını parse et
            sid_part = parts[1].strip()  # " SID:1013"
            sensor_id = sid_part.split(':')[1].strip()  # "1013"
            
            # Data kısmını parse et
            data_part = parts[2].strip()  # " WT: 25.83"
            data_split = data_part.split(':')
            data_key = data_split[0].strip()  # "WT"
            data_value = float(data_split[1].strip())  # 25.83
            
            return {
                'router': router_id,
                'sensor': sensor_id,
                'data_key': data_key,
                'data_value': data_value
            }
    except Exception as e:
        print(f"❌ Text parse hatası: {e}")
        print(f"   Line: {line}")
    return None

def update_router_cache(payload):
    """Router verisini cache'e ekle ve güncel durumu göster - Dinamik yapı"""
    router_id = payload['router']
    data_key = payload['data_key']
    value = payload['data_value']
    
    # Cache'i güncelle - router yoksa oluştur
    if router_id not in router_data_cache:
        router_data_cache[router_id] = {'last_update': None}
    
    # Data key mapping - hangi data_key hangi cache key'e karşılık gelir
    cache_mapping = {
        # Router 107 (BME280)
        'WT': 'temperature',
        'PR': 'pressure', 
        'AL': 'altitude',
        'WH': 'humidity',
        # Router 108 (MICS-4514)
        'CO': 'co',
        'NO': 'no',
        # Router 109+ (Genişletilebilir)
        'WG': 'weight',
        'VB': 'vibration',
        'SD': 'sound',
        'LT': 'light',
        'UV': 'uv',
        'PH': 'ph',
        'MS': 'moisture'
    }
    
    cache_key = cache_mapping.get(data_key, data_key.lower())
    router_data_cache[router_id][cache_key] = value
    router_data_cache[router_id]['last_update'] = datetime.now()
    
    # Güncel durumu göster
    print(f"📥 Router {router_id}: {data_key} = {value:.2f} → {cache_key}")

def send_to_backend(payload):
    """Gelen veriyi anında backend'e uygun formatta gönder"""
    router_id = payload['router']
    sensor_id = payload['sensor']
    data_key = payload['data_key']
    value = payload['data_value']
    device_id = f"BT{router_id}"
    
    # Backend API formatı - Router ve Sensor ID ayrı ayrı gönder
    api_data = {
        "deviceId": device_id,
        "routerId": router_id,      # ⭐ Router ID ayrı
        "sensorId": sensor_id,      # ⭐ Sensor ID ayrı  
        "batteryLevel": 85,
        "signalStrength": -65,
        "timestamp": datetime.now().isoformat(),
        "sensorData": {}
    }
    
    # Router 107 (BME280) - Çevre sensörleri
    if router_id == "107":
        if data_key == "WT":
            api_data["sensorData"]["temperature"] = value
        elif data_key == "PR":
            api_data["sensorData"]["pressure"] = value
        elif data_key == "AL":
            api_data["sensorData"]["altitude"] = value
        elif data_key == "WH":
            api_data["sensorData"]["humidity"] = value
            
    # Router 108 (MICS-4514) - Gaz sensörleri
    elif router_id == "108":
        if data_key == "CO":
            api_data["sensorData"]["co"] = value        # ✅ DÜZELTME: gasLevel → co
        elif data_key == "NO":
            api_data["sensorData"]["no2"] = value       # ✅ DÜZELTME: no2Level → no2
    
    # Router 109+ - Genişletilebilir yapı
    elif router_id == "109":
        if data_key == "WG":  # Weight
            api_data["sensorData"]["weight"] = value
        elif data_key == "WT":
            api_data["sensorData"]["temperature"] = value
        elif data_key == "WH":
            api_data["sensorData"]["humidity"] = value
    
    elif router_id == "110":
        if data_key == "VB":  # Vibration
            api_data["sensorData"]["vibration"] = value
        elif data_key == "SD":  # Sound
            api_data["sensorData"]["sound"] = value
        elif data_key == "WT":
            api_data["sensorData"]["temperature"] = value
    
    else:
        # Bilinmeyen router için genel mapping
        data_mapping = {
            "WT": "temperature",
            "WH": "humidity", 
            "PR": "pressure",
            "AL": "altitude",
            "CO": "gasLevel",
            "NO": "no2Level",
            "WG": "weight",
            "VB": "vibration",
            "SD": "sound",
            "LT": "light",
            "UV": "uv",
            "PH": "ph",
            "MS": "moisture"
        }
        
        backend_key = data_mapping.get(data_key, data_key.lower())
        api_data["sensorData"][backend_key] = value
    
    # Backend'e gönder
    try:
        print(f"📤 Backend'e gönderiliyor: {device_id} (R:{router_id}/S:{sensor_id}) - {data_key}")
        print(f"🔍 API Data: {api_data}")  # Debug için API data'yı göster
        response = requests.post(
            BACKEND_URL, 
            json=api_data, 
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        if response.status_code == 200:
            print(f"✅ {device_id} {data_key} verisi backend'e başarıyla gönderildi!")
        else:
            print(f"⚠️ Backend hata: HTTP {response.status_code}")
            print(f"   Response: {response.text}")
            print(f"   Sent Data: {api_data}")  # Hata durumunda gönderilen veriyi göster
            
    except requests.exceptions.Timeout:
        print(f"⏰ Backend timeout: {device_id} {data_key}")
    except requests.exceptions.ConnectionError:
        print(f"🔌 Backend bağlantı hatası: {device_id} {data_key}")
    except Exception as e:
        print(f"❌ Backend gönderim hatası: {e}")

def check_backend_connection():
    """Backend sunucusunun çalışıp çalışmadığını kontrol et"""
    try:
        response = requests.get('http://localhost:5000/api/health', timeout=5)
        if response.status_code == 200:
            print("✅ Backend sunucusu çalışıyor")
            return True
    except:
        pass
    
    print("❌ Backend sunucusuna erişilemiyor")
    print("💡 Backend'i başlatmak için: cd backend && npm start")
    return False

def main():
    """Ana coordinator fonksiyonu - Text format veri işleme"""
    print("🐝 BeeTwin PC Coordinator - Text Format")
    print("=" * 70)
    print("📡 Router'lardan text format veri alır ve backend'e gönderir")
    print("📝 Format: RID:107; SID:1013; WT: 25.83")
    print("🔧 Improved Hardware Matching - Unique Router/Sensor IDs")
    print("=" * 70)
    
    # Backend bağlantısını kontrol et
    print("\n🔍 Backend sunucu kontrolü...")
    backend_available = check_backend_connection()
    
    if not backend_available:
        choice = input("\nBackend çalışmıyor. Devam etmek istiyor musunuz? (y/n): ")
        if choice.lower() != 'y':
            return
    
    # Serial port bul ve bağlan
    print("\n🔌 Serial bağlantısı kuruluyor...")
    port = find_serial_port()
    if not port:
        return
    
    try:
        ser = serial.Serial(port, 9600, timeout=1)
        time.sleep(2)
        print(f"✅ Serial porta başarıyla bağlanıldı: {port}")
        print("\n👂 Text verilerini dinlemeye başlıyor...")
        print("💡 Çıkmak için Ctrl+C tuşlayın\n")
        
        packet_count = 0
        
        while True:
            try:
                if ser.in_waiting > 0:
                    line = ser.readline().decode('utf-8', errors='ignore').strip()
                    
                    if line:
                        print(f"📝 Text: {line}")
                        
                        # "Coordinator ready..." mesajını atla
                        if "Coordinator ready" in line:
                            continue
                            
                        # Text veriyi parse et
                        payload = parse_text_data(line)
                        if payload:
                            packet_count += 1
                            print(f"📦 Paket #{packet_count} - {datetime.now().strftime('%H:%M:%S')}")
                            
                            # Cache'i güncelle
                            update_router_cache(payload)
                            
                            # Backend'e gönder (Improved hardware matching ile)
                            send_to_backend(payload)
                            
                            print("-" * 60)
                
                time.sleep(0.1)
                
            except KeyboardInterrupt:
                print("\n\n🛑 Coordinator durduruluyor...")
                break
            except Exception as e:
                print(f"❌ Hata: {e}")
                time.sleep(1)
                
    except serial.SerialException as e:
        print(f"❌ Serial port hatası: {e}")
    except Exception as e:
        print(f"❌ Beklenmeyen hata: {e}")
    finally:
        if 'ser' in locals() and ser.is_open:
            ser.close()
        print("👋 Coordinator kapatıldı!")

if __name__ == "__main__":
    main()
