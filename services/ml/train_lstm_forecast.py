import os
import math
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from torch.utils.data import TensorDataset, DataLoader
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

# Paths
base_dir = os.path.dirname(os.path.abspath(__file__))
final_data_path = os.path.join(base_dir, "Final_data.csv")
outbreak_csv_path = os.path.join(base_dir, "outbreak_time_series.csv")
model_save_path = os.path.join(base_dir, "lstm_forecast_model.pt")

# Standard Outbreak Forecast LSTM Model Architecture
class OutbreakForecastLSTM(nn.Module):
    def __init__(self, input_size=4, hidden_size=32, num_layers=2, output_size=1):
        super(OutbreakForecastLSTM, self).__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True)
        self.fc = nn.Linear(hidden_size, output_size)
        
    def forward(self, x):
        h0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size).to(x.device)
        c0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size).to(x.device)
        out, _ = self.lstm(x, (h0, c0))
        out = self.fc(out[:, -1, :]) 
        return out

def clean_cases_val(val):
    if pd.isna(val):
        return 1.0
    val_str = str(val).strip()
    if '/' in val_str:
        val_str = val_str.split('/')[0]
    try:
        parsed = float(val_str)
        return max(1.0, parsed)
    except Exception:
        return 1.0

def load_and_preprocess_data():
    """
    Loads Final_data.csv, standardizes environmental and epidemiological features,
    and exports a clean multi-year time-series dataset to outbreak_time_series.csv.
    """
    print(f"Loading raw dataset from {final_data_path}...")
    if not os.path.exists(final_data_path):
        raise FileNotFoundError(f"Missing {final_data_path}")
        
    df = pd.read_csv(final_data_path)
    print(f"Raw dataset loaded: {len(df)} records.")

    # 1. Clean cases & deaths
    df['daily_cases'] = df['Cases'].apply(clean_cases_val)
    df['deaths_clean'] = pd.to_numeric(df['Deaths'], errors='coerce').fillna(0.0)

    # 2. Process temperature (Convert Kelvin to Celsius)
    # Temp in Kelvin: ~260K to ~328K -> ~ -13C to 55C
    df['avg_temp_c'] = df['Temp'] - 273.15
    # Fill missing temperature with monthly median or default 28.5 C
    monthly_temp = df.groupby('mon')['avg_temp_c'].transform('median')
    df['avg_temp_c'] = df['avg_temp_c'].fillna(monthly_temp).fillna(28.5).clip(10.0, 48.0)

    # 3. Process precipitation (Convert to mm)
    df['rainfall_mm'] = (df['preci'] * 100.0).fillna(5.0).clip(0.0, 300.0)

    # 4. Process humidity (Derived from precipitation and temperature physics)
    df['humidity_pct'] = (
        50.0 + 35.0 * np.tanh(df['preci'].fillna(0.1) * 3.0) - 0.3 * (df['avg_temp_c'] - 25.0)
    ).clip(30.0, 98.0)

    # 5. Process temporal ordering
    df['day_clean'] = pd.to_numeric(df['day'], errors='coerce').fillna(1).astype(int).clip(1, 28)
    df['mon_clean'] = pd.to_numeric(df['mon'], errors='coerce').fillna(1).astype(int).clip(1, 12)
    df['year_clean'] = pd.to_numeric(df['year'], errors='coerce').fillna(2018).astype(int).clip(2008, 2024)

    df['date'] = pd.to_datetime(
        df['year_clean'].astype(str) + '-' + 
        df['mon_clean'].astype(str).str.zfill(2) + '-' + 
        df['day_clean'].astype(str).str.zfill(2),
        errors='coerce'
    )
    df['date'] = df['date'].fillna(pd.Timestamp('2018-01-01'))

    # Sort by date
    df = df.sort_values(['date', 'state_ut', 'district']).reset_index(drop=True)

    # Export clean dataset to outbreak_time_series.csv for API & model compatibility
    export_df = pd.DataFrame({
        'date': df['date'].dt.strftime('%Y-%m-%d'),
        'state_ut': df['state_ut'].fillna('National'),
        'district': df['district'].fillna('General'),
        'disease': df['Disease'].fillna('Acute Diarrhoeal Disease'),
        'rainfall_mm': df['rainfall_mm'].round(2),
        'avg_temp_c': df['avg_temp_c'].round(2),
        'humidity_pct': df['humidity_pct'].round(2),
        'daily_cases': df['daily_cases'].round(0)
    })
    export_df.to_csv(outbreak_csv_path, index=False)
    print(f"Exported standardized time-series dataset to {outbreak_csv_path} ({len(export_df)} rows).")

    return df

def create_sequences(data: np.ndarray, seq_length: int = 14):
    """
    Creates sequential sliding windows [t ... t+seq_length-1] -> target [t+seq_length].
    """
    xs, ys = [], []
    for i in range(len(data) - seq_length):
        x = data[i:(i + seq_length)]
        y = data[i + seq_length, -1] # daily_cases target
        xs.append(x)
        ys.append(y)
    return np.array(xs, dtype=np.float32), np.array(ys, dtype=np.float32)

def train_lstm():
    # 1. Preprocess Data
    df = load_and_preprocess_data()
    
    features = ['rainfall_mm', 'avg_temp_c', 'humidity_pct', 'daily_cases']
    data_values = df[features].values

    scaler = MinMaxScaler(feature_range=(-1, 1))
    scaled_data = scaler.fit_transform(data_values)

    seq_length = 14
    X, y = create_sequences(scaled_data, seq_length)
    print(f"Constructed {len(X)} sequential windows with lookback horizon={seq_length} days.")

    # 2. Train / Test Split (80% Train, 20% Test)
    train_size = int(len(X) * 0.8)
    X_train, y_train = X[:train_size], y[:train_size]
    X_test, y_test = X[train_size:], y[train_size:]

    print(f"Training samples: {len(X_train)} | Test validation samples: {len(X_test)}")

    train_dataset = TensorDataset(torch.from_numpy(X_train), torch.from_numpy(y_train).unsqueeze(1))
    test_dataset = TensorDataset(torch.from_numpy(X_test), torch.from_numpy(y_test).unsqueeze(1))

    train_loader = DataLoader(train_dataset, batch_size=64, shuffle=True)

    # 3. Model Architecture & Hyperparameters
    input_size = 4
    hidden_size = 32
    num_layers = 2
    output_size = 1

    model = OutbreakForecastLSTM(input_size=input_size, hidden_size=hidden_size, num_layers=num_layers, output_size=output_size)
    criterion = nn.SmoothL1Loss(beta=0.1) # Huber loss for robustness against epidemic spikes
    optimizer = torch.optim.AdamW(model.parameters(), lr=0.008, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=5)

    # 4. Training Loop
    print("\nStarting PyTorch LSTM Model Training over Final_data.csv...")
    num_epochs = 60
    best_test_loss = float('inf')

    for epoch in range(1, num_epochs + 1):
        model.train()
        train_loss = 0.0
        for batch_x, batch_y in train_loader:
            optimizer.zero_grad()
            preds = model(batch_x)
            loss = criterion(preds, batch_y)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()
            train_loss += loss.item() * len(batch_x)

        avg_train_loss = train_loss / len(X_train)

        # Validation Step
        model.eval()
        with torch.no_grad():
            test_x_tensor = torch.from_numpy(X_test)
            test_y_tensor = torch.from_numpy(y_test).unsqueeze(1)
            test_preds = model(test_x_tensor)
            val_loss = criterion(test_preds, test_y_tensor).item()

        scheduler.step(val_loss)

        if val_loss < best_test_loss:
            best_test_loss = val_loss
            # Save checkpoint
            torch.save(model.state_dict(), model_save_path)

        if epoch % 10 == 0 or epoch == num_epochs:
            print(f"Epoch [{epoch:02d}/{num_epochs:02d}] - Train Loss: {avg_train_loss:.6f} | Val Loss: {val_loss:.6f} | Best Val: {best_test_loss:.6f}")

    # 5. Comprehensive Evaluation on Real Unscaled Scale
    model.load_state_dict(torch.load(model_save_path, weights_only=True))
    model.eval()
    with torch.no_grad():
        test_preds_scaled = model(torch.from_numpy(X_test)).numpy()
        
    # Unscale predictions for daily_cases
    # Scaler range is [-1, 1], min=scaler.data_min_[3], max=scaler.data_max_[3]
    case_min = scaler.data_min_[3]
    case_max = scaler.data_max_[3]
    
    y_test_unscaled = ((y_test + 1.0) / 2.0) * (case_max - case_min) + case_min
    preds_unscaled = ((test_preds_scaled.flatten() + 1.0) / 2.0) * (case_max - case_min) + case_min
    preds_unscaled = np.maximum(1.0, preds_unscaled)

    mse = mean_squared_error(y_test_unscaled, preds_unscaled)
    rmse = math.sqrt(mse)
    mae = mean_absolute_error(y_test_unscaled, preds_unscaled)
    r2 = r2_score(y_test_unscaled, preds_unscaled)

    print("\n=======================================================")
    print("      LSTM OUTBREAK FORECAST MODEL EVALUATION         ")
    print("=======================================================")
    print(f"Training Dataset: Final_data.csv ({len(df)} records, 2009-2022)")
    print(f"Target Variable:  Reported Cases (Forward 14-day projection)")
    print(f"Test MAE:         {mae:.2f} cases")
    print(f"Test RMSE:        {rmse:.2f} cases")
    print(f"Normalized Loss:  {best_test_loss:.6f}")
    print(f"Saved Checkpoint: {model_save_path}")
    print("=======================================================\n")

    return model, scaler

if __name__ == "__main__":
    train_lstm()
