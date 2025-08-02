import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
import joblib
import json
import sys
import os
from datetime import datetime, timedelta

class AnomalyDetector:
    def __init__(self, model_path=None):
        self.model = IsolationForest(
            contamination=0.1, 
            random_state=42,
            n_estimators=100
        )
        self.scaler = StandardScaler()
        self.pca = PCA(n_components=4)
        self.is_trained = False
        self.feature_names = ['temperature', 'humidity', 'weight', 'gasLevel']
        self.model_path = model_path or 'anomaly_model.joblib'
        
        # Model varsa yükle
        if os.path.exists(self.model_path):
            self.load_model()
    
    def extract_features(self, data, historical_data=None):
        """Sensör verisinden feature'ları çıkar"""
        base_features = [
            data.get('temperature', 20.0),
            data.get('humidity', 50.0),
            data.get('weight', 10.0),
            data.get('gasLevel', 0.5)
        ]
        
        # Historical data varsa, trend features ekle
        if historical_data and len(historical_data) > 1:
            df = pd.DataFrame(historical_data)
            
            # Son 24 saatlik trend
            temp_trend = self.calculate_trend(df, 'temperature')
            weight_trend = self.calculate_trend(df, 'weight')
            humidity_trend = self.calculate_trend(df, 'humidity')
            
            base_features.extend([temp_trend, weight_trend, humidity_trend])
        
        return base_features
    
    def calculate_trend(self, df, column):
        """Belirli bir column için trend hesapla"""
        if column not in df.columns or len(df) < 2:
            return 0.0
        
        # Son 10 veri noktasını al
        recent_data = df[column].tail(10).values
        
        # Linear trend hesapla
        x = np.arange(len(recent_data))
        trend = np.polyfit(x, recent_data, 1)[0]
        
        return float(trend)
    
    def detect_anomalies(self, data, historical_data=None):
        """Real-time anomaly detection"""
        try:
            features = self.extract_features(data, historical_data)
            
            if not self.is_trained:
                # Model eğitilmemişse basit threshold-based detection
                return self.threshold_based_detection(data)
            
            # ML-based detection
            scaled_features = self.scaler.transform([features])
            
            if hasattr(self, 'pca') and self.pca:
                scaled_features = self.pca.transform(scaled_features)
            
            anomaly_score = self.model.decision_function(scaled_features)[0]
            is_anomaly = self.model.predict(scaled_features)[0] == -1
            
            # Confidence hesapla (0-1 arası)
            confidence = min(abs(anomaly_score), 1.0)
            
            # Feature importance hesapla
            feature_importance = self.get_feature_importance(features)
            
            result = {
                "anomaly_score": float(anomaly_score),
                "is_anomaly": bool(is_anomaly),
                "confidence": float(confidence),
                "method": "ml_isolation_forest",
                "feature_importance": feature_importance,
                "analysis": self.get_anomaly_analysis(data, is_anomaly, confidence)
            }
            
            return result
            
        except Exception as e:
            print(f"Error in anomaly detection: {str(e)}", file=sys.stderr)
            return self.threshold_based_detection(data)
    
    def threshold_based_detection(self, data):
        """Fallback threshold-based anomaly detection"""
        anomalies = []
        
        # Sıcaklık kontrolü
        temp = data.get('temperature', 20)
        if temp > 40 or temp < 5:
            anomalies.append("extreme_temperature")
        
        # Nem kontrolü
        humidity = data.get('humidity', 50)
        if humidity > 90 or humidity < 10:
            anomalies.append("extreme_humidity")
        
        # Ağırlık kontrolü (negatif ağırlık anormal)
        weight = data.get('weight', 10)
        if weight < 0 or weight > 100:
            anomalies.append("extreme_weight")
        
        is_anomaly = len(anomalies) > 0
        confidence = 0.8 if is_anomaly else 0.2
        
        return {
            "anomaly_score": -0.5 if is_anomaly else 0.1,
            "is_anomaly": is_anomaly,
            "confidence": confidence,
            "method": "threshold_based",
            "anomalies": anomalies,
            "analysis": {
                "summary": f"{'Anomaly detected' if is_anomaly else 'Normal values'}",
                "details": anomalies
            }
        }
    
    def get_feature_importance(self, features):
        """Feature importance hesapla"""
        if len(features) < len(self.feature_names):
            # Sadece base features varsa
            importance = {
                self.feature_names[i]: float(abs(features[i] - 20) / 20)  # Normalized importance
                for i in range(min(len(features), len(self.feature_names)))
            }
        else:
            # Tüm features varsa
            importance = {
                'temperature': float(abs(features[0] - 25) / 25),
                'humidity': float(abs(features[1] - 50) / 50),
                'weight': float(abs(features[2] - 15) / 15),
                'gasLevel': float(abs(features[3] - 0.5) / 0.5),
            }
            
            if len(features) > 4:
                importance.update({
                    'temp_trend': float(abs(features[4])),
                    'weight_trend': float(abs(features[5])),
                    'humidity_trend': float(abs(features[6]))
                })
        
        return importance
    
    def get_anomaly_analysis(self, data, is_anomaly, confidence):
        """Anomaly analiz sonuçları"""
        analysis = {
            "summary": "",
            "details": [],
            "recommendations": []
        }
        
        if is_anomaly:
            analysis["summary"] = f"Anomaly detected with {confidence:.1%} confidence"
            
            # Spesifik anomaly türlerini belirle
            temp = data.get('temperature', 20)
            humidity = data.get('humidity', 50)
            weight = data.get('weight', 10)
            
            if temp > 35:
                analysis["details"].append(f"High temperature: {temp}°C")
                analysis["recommendations"].append("Check hive ventilation")
            elif temp < 10:
                analysis["details"].append(f"Low temperature: {temp}°C")
                analysis["recommendations"].append("Check hive insulation")
            
            if humidity > 80:
                analysis["details"].append(f"High humidity: {humidity}%")
                analysis["recommendations"].append("Improve hive ventilation")
            elif humidity < 20:
                analysis["details"].append(f"Low humidity: {humidity}%")
                analysis["recommendations"].append("Check water sources")
            
            if weight < 5:
                analysis["details"].append(f"Low weight: {weight}kg")
                analysis["recommendations"].append("Check bee population and food sources")
        else:
            analysis["summary"] = "Normal sensor readings"
            analysis["details"] = ["All parameters within normal range"]
        
        return analysis
    
    def train_model(self, training_data):
        """Model eğitimi (batch olarak çalıştırılır)"""
        try:
            df = pd.DataFrame(training_data)
            
            # Features hazırla
            features_list = []
            for _, row in df.iterrows():
                features = self.extract_features(row.to_dict())
                features_list.append(features)
            
            features_array = np.array(features_list)
            
            # Scale features
            scaled_features = self.scaler.fit_transform(features_array)
            
            # PCA uygula (optional)
            if scaled_features.shape[1] > 4:
                scaled_features = self.pca.fit_transform(scaled_features)
            
            # Model eğit
            self.model.fit(scaled_features)
            self.is_trained = True
            
            # Model kaydet
            self.save_model()
            
            return {
                "success": True,
                "message": f"Model trained with {len(training_data)} samples",
                "feature_count": features_array.shape[1]
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def save_model(self):
        """Model ve scaler'ı kaydet"""
        model_data = {
            'model': self.model,
            'scaler': self.scaler,
            'pca': self.pca if hasattr(self, 'pca') else None,
            'is_trained': self.is_trained,
            'feature_names': self.feature_names
        }
        joblib.dump(model_data, self.model_path)
    
    def load_model(self):
        """Kaydedilmiş modeli yükle"""
        try:
            model_data = joblib.load(self.model_path)
            self.model = model_data['model']
            self.scaler = model_data['scaler']
            self.pca = model_data.get('pca')
            self.is_trained = model_data['is_trained']
            self.feature_names = model_data.get('feature_names', self.feature_names)
            print(f"Model loaded successfully from {self.model_path}")
        except Exception as e:
            print(f"Error loading model: {str(e)}")
            self.is_trained = False

def main():
    """Command line interface"""
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No input data provided"}))
        return
    
    try:
        input_data = json.loads(sys.argv[1])
        
        detector = AnomalyDetector()
        
        # Ana sensör verisi
        sensor_data = input_data.get('sensorData', {})
        
        # Historical data (opsiyonel)
        historical_data = input_data.get('historicalData', [])
        
        # Anomaly detection yap
        result = detector.detect_anomalies(sensor_data, historical_data)
        
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            "error": str(e),
            "anomaly_score": 0,
            "is_anomaly": False,
            "confidence": 0,
            "method": "error_fallback"
        }
        print(json.dumps(error_result))

if __name__ == "__main__":
    main()
