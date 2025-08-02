import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import json
import sys
import os
from datetime import datetime, timedelta

class TrendPredictor:
    def __init__(self, model_path=None):
        self.weight_model = RandomForestRegressor(n_estimators=50, random_state=42)
        self.temp_model = LinearRegression()
        self.humidity_model = LinearRegression()
        self.battery_model = LinearRegression()
        
        self.is_trained = False
        self.model_path = model_path or 'trend_models.joblib'
        
        # Model varsa yükle
        if os.path.exists(self.model_path):
            self.load_models()
    
    def load_models(self):
        """Eğitilmiş modelleri yükle"""
        try:
            models = joblib.load(self.model_path)
            self.weight_model = models.get('weight_model', self.weight_model)
            self.temp_model = models.get('temp_model', self.temp_model)
            self.humidity_model = models.get('humidity_model', self.humidity_model)
            self.battery_model = models.get('battery_model', self.battery_model)
            self.is_trained = True
            print("✅ Models loaded successfully")
        except Exception as e:
            print(f"⚠️ Could not load models: {str(e)}")
            self.is_trained = False
    
    def save_models(self):
        """Modelleri kaydet"""
        try:
            models = {
                'weight_model': self.weight_model,
                'temp_model': self.temp_model,
                'humidity_model': self.humidity_model,
                'battery_model': self.battery_model
            }
            joblib.dump(models, self.model_path)
            print("✅ Models saved successfully")
        except Exception as e:
            print(f"❌ Could not save models: {str(e)}")
    
    def prepare_time_features(self, df):
        """Zaman-based feature'ları hazırla"""
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df = df.sort_values('timestamp')
        
        # Zaman features
        df['hour'] = df['timestamp'].dt.hour
        df['day_of_week'] = df['timestamp'].dt.dayofweek
        df['day_of_year'] = df['timestamp'].dt.dayofyear
        df['month'] = df['timestamp'].dt.month
        
        # Rolling averages
        for col in ['temperature', 'humidity', 'weight']:
            if col in df.columns:
                df[f'{col}_ma3'] = df[col].rolling(window=3, min_periods=1).mean()
                df[f'{col}_ma7'] = df[col].rolling(window=7, min_periods=1).mean()
        
        # Lag features
        for col in ['temperature', 'humidity', 'weight']:
            if col in df.columns:
                df[f'{col}_lag1'] = df[col].shift(1)
                df[f'{col}_lag2'] = df[col].shift(2)
        
        return df
    
    def predict_trends(self, historical_data, forecast_days=7):
        """Trend tahminleri yap"""
        try:
            if len(historical_data) < 10:
                return self.simple_trend_analysis(historical_data)
            
            df = pd.DataFrame(historical_data)
            df = self.prepare_time_features(df)
            
            predictions = {
                "forecast_days": forecast_days,
                "timestamp": datetime.now().isoformat(),
                "predictions": {},
                "trends": {},
                "statistics": {},
                "confidence_scores": {}
            }
            
            # Weight predictions
            if 'weight' in df.columns:
                weight_pred = self.predict_weight_trend(df, forecast_days)
                predictions["predictions"]["weight"] = weight_pred
                predictions["trends"]["weight"] = self.analyze_trend(df['weight'])
                predictions["statistics"]["weight"] = self.calculate_statistics(df['weight'])
            
            # Temperature predictions
            if 'temperature' in df.columns:
                temp_pred = self.predict_temperature_trend(df, forecast_days)
                predictions["predictions"]["temperature"] = temp_pred
                predictions["trends"]["temperature"] = self.analyze_trend(df['temperature'])
                predictions["statistics"]["temperature"] = self.calculate_statistics(df['temperature'])
            
            # Humidity predictions
            if 'humidity' in df.columns:
                humidity_pred = self.predict_humidity_trend(df, forecast_days)
                predictions["predictions"]["humidity"] = humidity_pred
                predictions["trends"]["humidity"] = self.analyze_trend(df['humidity'])
                predictions["statistics"]["humidity"] = self.calculate_statistics(df['humidity'])
            
            # Battery level predictions (if available)
            if 'batteryLevel' in df.columns:
                battery_pred = self.predict_battery_trend(df, forecast_days)
                predictions["predictions"]["battery"] = battery_pred
                predictions["trends"]["battery"] = self.analyze_trend(df['batteryLevel'])
            
            # Overall analysis
            predictions["overall_analysis"] = self.generate_overall_analysis(predictions)
            
            return predictions
            
        except Exception as e:
            print(f"Error in trend prediction: {str(e)}", file=sys.stderr)
            return self.simple_trend_analysis(historical_data)
    
    def predict_weight_trend(self, df, days):
        """Kovan ağırlık trendi tahmin et"""
        if 'weight' not in df.columns or len(df) < 5:
            return {"error": "Insufficient weight data"}
        
        # Feature columns
        feature_cols = ['hour', 'day_of_week', 'day_of_year', 'month']
        
        # MA ve lag features ekle
        available_features = []
        for col in feature_cols:
            if col in df.columns:
                available_features.append(col)
        
        for col in ['weight_ma3', 'weight_ma7', 'weight_lag1']:
            if col in df.columns:
                available_features.append(col)
        
        # Clean data
        clean_df = df.dropna(subset=available_features + ['weight'])
        
        if len(clean_df) < 3:
            return {"error": "Insufficient clean data for weight prediction"}
        
        X = clean_df[available_features].values
        y = clean_df['weight'].values
        
        try:
            self.weight_model.fit(X, y)
            
            # Future predictions
            last_row = clean_df.iloc[-1]
            future_predictions = []
            future_dates = []
            
            for day in range(days):
                future_date = pd.to_datetime(last_row['timestamp']) + timedelta(days=day+1)
                
                # Daily predictions (every 6 hours)
                for hour in [6, 12, 18, 24]:
                    future_features = []
                    
                    # Time features
                    for col in ['hour', 'day_of_week', 'day_of_year', 'month']:
                        if col in available_features:
                            if col == 'hour':
                                future_features.append(hour)
                            elif col == 'day_of_week':
                                future_features.append(future_date.dayofweek)
                            elif col == 'day_of_year':
                                future_features.append(future_date.dayofyear)
                            elif col == 'month':
                                future_features.append(future_date.month)
                    
                    # Moving averages (use last known values as approximation)
                    for col in ['weight_ma3', 'weight_ma7', 'weight_lag1']:
                        if col in available_features:
                            future_features.append(last_row[col])
                    
                    pred = self.weight_model.predict([future_features])[0]
                    future_predictions.append(float(pred))
                    future_dates.append(future_date.isoformat())
            
            # Trend analysis
            current_weight = float(y[-1])
            predicted_weight = future_predictions[-1]
            weight_change = predicted_weight - current_weight
            
            trend_direction = "increasing" if weight_change > 0.5 else "decreasing" if weight_change < -0.5 else "stable"
            
            # Confidence based on model performance
            if len(y) > 10:
                y_pred = self.weight_model.predict(X)
                r2 = r2_score(y, y_pred)
                confidence = max(0.3, min(0.95, r2))
            else:
                confidence = 0.6
            
            return {
                "predictions": future_predictions,
                "dates": future_dates,
                "trend_direction": trend_direction,
                "weight_change": float(weight_change),
                "current_weight": current_weight,
                "predicted_final_weight": predicted_weight,
                "confidence": float(confidence),
                "data_points_used": len(clean_df)
            }
            
        except Exception as e:
            return {"error": f"Weight prediction failed: {str(e)}"}
    
    def predict_temperature_trend(self, df, days):
        """Sıcaklık trendi tahmin et"""
        if 'temperature' not in df.columns:
            return {"error": "No temperature data"}
        
        feature_cols = ['hour', 'day_of_year', 'month']
        available_features = [col for col in feature_cols if col in df.columns]
        
        clean_df = df.dropna(subset=available_features + ['temperature'])
        
        if len(clean_df) < 3:
            return {"error": "Insufficient temperature data"}
        
        X = clean_df[available_features].values
        y = clean_df['temperature'].values
        
        self.temp_model.fit(X, y)
        
        # Simple daily predictions
        future_predictions = []
        last_day = clean_df['day_of_year'].iloc[-1]
        
        for day in range(days):
            daily_temps = []
            for hour in [6, 12, 18, 24]:
                features = [hour, last_day + day + 1, clean_df['month'].iloc[-1]]
                features = features[:len(available_features)]
                pred = self.temp_model.predict([features])[0]
                daily_temps.append(float(pred))
            
            future_predictions.append({
                "day": day + 1,
                "min_temp": min(daily_temps),
                "max_temp": max(daily_temps),
                "avg_temp": sum(daily_temps) / len(daily_temps)
            })
        
        return {
            "daily_predictions": future_predictions,
            "trend_direction": self.analyze_trend(clean_df['temperature'])["direction"],
            "confidence": 0.7
        }
    
    def predict_humidity_trend(self, df, days):
        """Nem trendi tahmin et"""
        if 'humidity' not in df.columns:
            return {"error": "No humidity data"}
        
        # Simplified humidity prediction
        recent_humidity = df['humidity'].tail(10).mean()
        seasonal_factor = 0.95 + 0.1 * np.sin(2 * np.pi * days / 365)  # Seasonal variation
        
        predictions = []
        for day in range(days):
            pred_humidity = recent_humidity * seasonal_factor + np.random.normal(0, 2)
            predictions.append(max(0, min(100, pred_humidity)))
        
        return {
            "predictions": predictions,
            "trend_direction": "stable",
            "confidence": 0.6
        }
    
    def predict_battery_trend(self, df, days):
        """Batarya seviyesi trendi tahmin et"""
        if 'batteryLevel' not in df.columns:
            return {"error": "No battery data"}
        
        battery_data = df['batteryLevel'].dropna()
        if len(battery_data) < 2:
            return {"error": "Insufficient battery data"}
        
        # Linear battery discharge model
        x = np.arange(len(battery_data))
        coeffs = np.polyfit(x, battery_data, 1)
        discharge_rate = coeffs[0]  # Battery level change per measurement
        
        current_level = float(battery_data.iloc[-1])
        
        # Future predictions
        future_levels = []
        for day in range(days):
            # Assuming 4 measurements per day (every 6 hours)
            future_level = current_level + discharge_rate * (day * 4)
            future_levels.append(max(0, future_level))
        
        # Estimate days until battery critical (20%)
        if discharge_rate < 0:
            days_until_critical = max(0, (current_level - 20) / abs(discharge_rate * 4))
        else:
            days_until_critical = float('inf')
        
        return {
            "predictions": future_levels,
            "discharge_rate_per_day": float(discharge_rate * 4),
            "current_level": current_level,
            "days_until_critical": float(min(days_until_critical, 365)),
            "trend_direction": "decreasing" if discharge_rate < 0 else "stable"
        }
    
    def analyze_trend(self, series):
        """Series için trend analizi"""
        if len(series) < 3:
            return {"direction": "unknown", "strength": 0}
        
        # Linear trend
        x = np.arange(len(series))
        coeffs = np.polyfit(x, series, 1)
        slope = coeffs[0]
        
        # Trend strength (R-squared)
        y_pred = np.polyval(coeffs, x)
        ss_res = np.sum((series - y_pred) ** 2)
        ss_tot = np.sum((series - np.mean(series)) ** 2)
        r_squared = 1 - (ss_res / ss_tot) if ss_tot != 0 else 0
        
        # Direction
        if abs(slope) < 0.01:
            direction = "stable"
        elif slope > 0:
            direction = "increasing"
        else:
            direction = "decreasing"
        
        return {
            "direction": direction,
            "slope": float(slope),
            "strength": float(r_squared),
            "volatility": float(np.std(series))
        }
    
    def calculate_statistics(self, series):
        """Series için istatistikler"""
        return {
            "mean": float(np.mean(series)),
            "median": float(np.median(series)),
            "std": float(np.std(series)),
            "min": float(np.min(series)),
            "max": float(np.max(series)),
            "range": float(np.max(series) - np.min(series)),
            "count": len(series)
        }
    
    def generate_overall_analysis(self, predictions):
        """Genel analiz ve öneriler"""
        analysis = {
            "summary": "",
            "alerts": [],
            "recommendations": []
        }
        
        # Weight analysis
        if "weight" in predictions["predictions"]:
            weight_pred = predictions["predictions"]["weight"]
            if "weight_change" in weight_pred:
                if weight_pred["weight_change"] < -2:
                    analysis["alerts"].append("Significant weight loss predicted")
                    analysis["recommendations"].append("Monitor bee population and food sources")
                elif weight_pred["weight_change"] > 5:
                    analysis["alerts"].append("Significant weight gain predicted")
                    analysis["recommendations"].append("Check for honey production opportunity")
        
        # Temperature analysis
        if "temperature" in predictions["trends"]:
            temp_trend = predictions["trends"]["temperature"]
            if temp_trend["direction"] == "increasing":
                analysis["recommendations"].append("Monitor hive ventilation")
            elif temp_trend["direction"] == "decreasing":
                analysis["recommendations"].append("Check hive insulation")
        
        # Battery analysis
        if "battery" in predictions["predictions"]:
            battery_pred = predictions["predictions"]["battery"]
            if "days_until_critical" in battery_pred and battery_pred["days_until_critical"] < 30:
                analysis["alerts"].append(f"Battery critical in {battery_pred['days_until_critical']:.0f} days")
                analysis["recommendations"].append("Schedule battery replacement")
        
        # Generate summary
        alert_count = len(analysis["alerts"])
        if alert_count == 0:
            analysis["summary"] = "All parameters within expected ranges"
        else:
            analysis["summary"] = f"{alert_count} alert(s) detected requiring attention"
        
        return analysis
    
    def simple_trend_analysis(self, historical_data):
        """Basit trend analizi (ML model yoksa)"""
        if len(historical_data) < 2:
            return {"error": "Insufficient data for analysis"}
        
        df = pd.DataFrame(historical_data)
        
        result = {
            "method": "simple_analysis",
            "statistics": {},
            "trends": {}
        }
        
        for col in ['temperature', 'humidity', 'weight', 'batteryLevel']:
            if col in df.columns:
                series = df[col].dropna()
                if len(series) > 1:
                    result["statistics"][col] = self.calculate_statistics(series)
                    result["trends"][col] = self.analyze_trend(series)
        
        return result

def main():
    """Command line interface"""
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No input data provided"}))
        return
    
    try:
        input_data = json.loads(sys.argv[1])
        
        predictor = TrendPredictor()
        
        # Historical data
        historical_data = input_data.get('historicalData', [])
        forecast_days = input_data.get('forecastDays', 7)
        
        # Predictions yap
        result = predictor.predict_trends(historical_data, forecast_days)
        
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            "error": str(e),
            "method": "error_fallback"
        }
        print(json.dumps(error_result))

if __name__ == "__main__":
    main()
