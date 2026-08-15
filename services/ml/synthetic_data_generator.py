import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta
import os

# Ensure the ML directory exists
os.makedirs(os.path.dirname(os.path.abspath(__file__)), exist_ok=True)

def generate_triage_data(num_samples=2000):
    """
    Generates synthetic symptom data mapped to risk levels (Green, Amber, Red).
    Features: fever_temp, duration_days, severe_dehydration, persistent_vomiting
    Target: risk_level
    """
    data = []
    for _ in range(num_samples):
        # Generate random symptoms
        fever_temp = round(random.uniform(97.0, 105.0), 1)
        duration_days = random.randint(1, 14)
        severe_dehydration = random.choice([0, 1])
        persistent_vomiting = random.choice([0, 1])
        
        # Simple IDSP-like Triage Logic
        if fever_temp > 103.0 or severe_dehydration == 1 or persistent_vomiting == 1:
            risk_level = "RED"
        elif fever_temp >= 101.0 or duration_days > 5:
            risk_level = "AMBER"
        else:
            risk_level = "GREEN"
            
        data.append([fever_temp, duration_days, severe_dehydration, persistent_vomiting, risk_level])
        
    df = pd.DataFrame(data, columns=["fever_temp", "duration_days", "severe_dehydration", "persistent_vomiting", "risk_level"])
    output_path = os.path.join(os.path.dirname(__file__), "symptoms_triage_data.csv")
    df.to_csv(output_path, index=False)
    print(f"Generated {num_samples} triage records at {output_path}")

def generate_outbreak_time_series(days=730):
    """
    Generates 2 years of daily synthetic data for an LSTM to forecast outbreak risk.
    Features: rainfall_mm, avg_temp_c, humidity_pct, daily_cases
    Target: The goal is to predict 'daily_cases' for the next 7-14 days.
    """
    start_date = datetime(2024, 1, 1)
    data = []
    
    current_cases = 5
    for i in range(days):
        current_date = start_date + timedelta(days=i)
        
        # Simulate seasonal weather patterns (Monsoon spikes rainfall and humidity in July-Sept)
        month = current_date.month
        is_monsoon = 6 <= month <= 9
        
        rainfall_mm = random.uniform(20.0, 100.0) if is_monsoon else random.uniform(0.0, 10.0)
        avg_temp_c = random.uniform(25.0, 35.0) if month > 3 and month < 10 else random.uniform(15.0, 25.0)
        humidity_pct = random.uniform(70.0, 95.0) if is_monsoon else random.uniform(40.0, 70.0)
        
        # Cases spike during monsoon and high humidity
        if is_monsoon:
            current_cases += random.randint(-2, 8)
        else:
            current_cases += random.randint(-5, 2)
            
        # Ensure cases don't drop below 0
        current_cases = max(0, current_cases)
        
        data.append([current_date.strftime("%Y-%m-%d"), rainfall_mm, avg_temp_c, humidity_pct, current_cases])
        
    df = pd.DataFrame(data, columns=["date", "rainfall_mm", "avg_temp_c", "humidity_pct", "daily_cases"])
    output_path = os.path.join(os.path.dirname(__file__), "outbreak_time_series.csv")
    df.to_csv(output_path, index=False)
    print(f"Generated {days} days of time-series data at {output_path}")

if __name__ == "__main__":
    generate_triage_data()
    generate_outbreak_time_series()
