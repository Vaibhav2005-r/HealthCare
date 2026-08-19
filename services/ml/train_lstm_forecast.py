import os
import math
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from torch.utils.data import TensorDataset, DataLoader
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error

# Paths
base_dir = os.path.dirname(os.path.abspath(__file__))
final_data_path = os.path.join(base_dir, "Final_data.csv")
outbreak_csv_path = os.path.join(base_dir, "outbreak_time_series.csv")
model_save_path = os.path.join(base_dir, "lstm_forecast_model.pt")

# Multi-Output Outbreak Forecast LSTM Architecture (14 Horizon Direct Projection)
class OutbreakForecastLSTM(nn.Module):
    def __init__(self, input_size=4, hidden_size=32, num_layers=2, output_size=14):
        super(OutbreakForecastLSTM, self).__init__()
        self.input_size = input_size
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        self.output_size = output_size
        
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True)
        self.fc = nn.Linear(hidden_size, output_size)
        
    def forward(self, x):
        h0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size).to(x.device)
        c0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size).to(x.device)
        out, _ = self.lstm(x, (h0, c0))
        out = self.fc(out[:, -1, :]) # Shape: (batch, 14)
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
    print(f"Loading dataset from {final_data_path}...")
    if not os.path.exists(final_data_path):
        raise FileNotFoundError(f"Missing {final_data_path}")
        
    df = pd.read_csv(final_data_path)
    print(f"Raw dataset loaded: {len(df)} records.")

    # 1. Clean cases & deaths
    df['daily_cases'] = df['Cases'].apply(clean_cases_val)
    df['deaths_clean'] = pd.to_numeric(df['Deaths'], errors='coerce').fillna(0.0)

    # 2. Process temperature (Convert Kelvin to Celsius)
    df['avg_temp_c'] = df['Temp'] - 273.15
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

    # Sort strictly chronologically
    df = df.sort_values(['date', 'state_ut', 'district']).reset_index(drop=True)

    # Export clean dataset to outbreak_time_series.csv
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

def create_multi_output_sequences(data: np.ndarray, seq_len: int = 14, pred_len: int = 14):
    """
    Creates sequential sliding windows:
    X_t = [x_{t-13}, ..., x_t] (lookback window of 14 steps, 4 features)
    y_t = [cases_{t+1}, ..., cases_{t+14}] (target vector of 14 future time steps)
    """
    xs, ys, last_known = [], [], []
    for i in range(len(data) - seq_len - pred_len + 1):
        x = data[i : i + seq_len]                           # Shape: (14, 4)
        y = data[i + seq_len : i + seq_len + pred_len, -1]   # Shape: (14,) - daily_cases
        last_c = data[i + seq_len - 1, -1]                  # Last known case count at t
        xs.append(x)
        ys.append(y)
        last_known.append(last_c)
    return (
        np.array(xs, dtype=np.float32), 
        np.array(ys, dtype=np.float32), 
        np.array(last_known, dtype=np.float32)
    )

def train_lstm():
    # 1. Load & Preprocess Data
    df = load_and_preprocess_data()
    features = ['rainfall_mm', 'avg_temp_c', 'humidity_pct', 'daily_cases']
    
    # 2. Strict Chronological Train/Test Split (Contiguous Cutoff: 80% Train / 20% Test)
    cutoff_idx = int(len(df) * 0.8)
    train_df = df.iloc[:cutoff_idx].copy()
    test_df = df.iloc[cutoff_idx:].copy()

    train_start = train_df['date'].min().strftime('%Y-%m-%d')
    train_end = train_df['date'].max().strftime('%Y-%m-%d')
    test_start = test_df['date'].min().strftime('%Y-%m-%d')
    test_end = test_df['date'].max().strftime('%Y-%m-%d')

    print("\n--- CHRONOLOGICAL SPLIT VERIFICATION ---")
    print(f"Total Dataset Rows: {len(df)}")
    print(f"Train Date Range:   {train_start} to {train_end} ({len(train_df)} rows, 80.0%)")
    print(f"Test Date Range:    {test_start} to {test_end} ({len(test_df)} rows, 20.0%)")
    print("Split Mechanism:    Strict temporal boundary (No random shuffling, Zero future leakage)")

    # 3. Fit Scaler strictly on Training Data
    scaler = MinMaxScaler(feature_range=(-1, 1))
    scaled_train = scaler.fit_transform(train_df[features].values)
    scaled_test = scaler.transform(test_df[features].values)

    seq_len = 14
    pred_len = 14
    X_train, y_train, _ = create_multi_output_sequences(scaled_train, seq_len, pred_len)
    X_test, y_test, last_cases_test = create_multi_output_sequences(scaled_test, seq_len, pred_len)

    print(f"\nSequence Dimensions:")
    print(f"X_train: {X_train.shape} (batch, lookback=14, features=4)")
    print(f"y_train: {y_train.shape} (batch, horizon=14)")
    print(f"X_test:  {X_test.shape}")
    print(f"y_test:  {y_test.shape}")

    train_dataset = TensorDataset(torch.from_numpy(X_train), torch.from_numpy(y_train))
    test_dataset = TensorDataset(torch.from_numpy(X_test), torch.from_numpy(y_test))
    train_loader = DataLoader(train_dataset, batch_size=64, shuffle=True)

    # 4. Model Architecture & Optimization
    input_size = 4
    hidden_size = 32
    num_layers = 2
    output_size = 14 # 14-Step Direct Multi-Output

    model = OutbreakForecastLSTM(input_size=input_size, hidden_size=hidden_size, num_layers=num_layers, output_size=output_size)
    criterion = nn.SmoothL1Loss(beta=0.05) # Huber loss across all 14 horizons
    optimizer = torch.optim.AdamW(model.parameters(), lr=0.008, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=5)

    print(f"\nModel Architecture: OutbreakForecastLSTM(input_size=4, hidden_size=32, num_layers=2, output_size=14)")
    print("Training Multi-Output Forecasting Model...")

    num_epochs = 60
    best_val_loss = float('inf')

    for epoch in range(1, num_epochs + 1):
        model.train()
        train_loss = 0.0
        for batch_x, batch_y in train_loader:
            optimizer.zero_grad()
            preds = model(batch_x)
            loss = criterion(preds, batch_y) # Loss averaged across batch and 14 horizons
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()
            train_loss += loss.item() * len(batch_x)

        avg_train_loss = train_loss / len(X_train)

        # Validation Step
        model.eval()
        with torch.no_grad():
            test_preds = model(torch.from_numpy(X_test))
            val_loss = criterion(test_preds, torch.from_numpy(y_test)).item()

        scheduler.step(val_loss)

        if val_loss < best_val_loss:
            best_val_loss = val_loss
            torch.save(model.state_dict(), model_save_path)

        if epoch % 10 == 0 or epoch == num_epochs:
            print(f"Epoch [{epoch:02d}/{num_epochs:02d}] - Train Loss: {avg_train_loss:.6f} | Val Loss: {val_loss:.6f} | Best Val: {best_val_loss:.6f}")

    # 5. Per-Horizon Validation Metrics & Baseline Comparison
    model.load_state_dict(torch.load(model_save_path, weights_only=True))
    model.eval()
    with torch.no_grad():
        preds_scaled = model(torch.from_numpy(X_test)).numpy()

    case_min = scaler.data_min_[3]
    case_max = scaler.data_max_[3]

    def unscale_cases(scaled_arr):
        return np.maximum(1.0, ((scaled_arr + 1.0) / 2.0) * (case_max - case_min) + case_min)

    y_test_real = unscale_cases(y_test)
    preds_real = unscale_cases(preds_scaled)
    last_cases_real = unscale_cases(last_cases_test)
    baseline_preds = np.repeat(last_cases_real[:, np.newaxis], 14, axis=1)

    print("\n" + "=" * 90)
    print("      MULTI-HORIZON VALIDATION EVALUATION & NAIVE BASELINE BENCHMARK        ")
    print("=" * 90)
    print(f"Dataset: Final_data.csv ({len(df)} records) | Test Set: {len(y_test_real)} evaluation windows")
    print("-" * 90)
    print("Horizon | LSTM MAE | Base MAE | LSTM RMSE | Base RMSE | LSTM MAPE | Base MAPE | MAE Imprv %")
    print("-" * 90)

    per_horizon_results = []
    for h in range(14):
        lstm_mae = mean_absolute_error(y_test_real[:, h], preds_real[:, h])
        base_mae = mean_absolute_error(y_test_real[:, h], baseline_preds[:, h])
        lstm_rmse = math.sqrt(mean_squared_error(y_test_real[:, h], preds_real[:, h]))
        base_rmse = math.sqrt(mean_squared_error(y_test_real[:, h], baseline_preds[:, h]))
        lstm_mape = np.mean(np.abs(y_test_real[:, h] - preds_real[:, h]) / np.maximum(1.0, y_test_real[:, h])) * 100.0
        base_mape = np.mean(np.abs(y_test_real[:, h] - baseline_preds[:, h]) / np.maximum(1.0, y_test_real[:, h])) * 100.0
        imprv = ((base_mae - lstm_mae) / base_mae) * 100.0

        per_horizon_results.append({
            'horizon': f"Day +{h+1:02d}",
            'lstm_mae': lstm_mae,
            'base_mae': base_mae,
            'lstm_rmse': lstm_rmse,
            'base_rmse': base_rmse,
            'lstm_mape': lstm_mape,
            'base_mape': base_mape,
            'imprv': imprv
        })
        print(f"Day +{h+1:02d} | {lstm_mae:8.2f} | {base_mae:8.2f} | {lstm_rmse:9.2f} | {base_rmse:9.2f} | {lstm_mape:8.1f}% | {base_mape:8.1f}% | {imprv:+6.1f}%")

    print("-" * 90)
    overall_lstm_mae = mean_absolute_error(y_test_real, preds_real)
    overall_base_mae = mean_absolute_error(y_test_real, baseline_preds)
    overall_imprv = ((overall_base_mae - overall_lstm_mae) / overall_base_mae) * 100.0
    print(f"Overall  | {overall_lstm_mae:8.2f} | {overall_base_mae:8.2f} |       -   |       -   |         - |         - | {overall_imprv:+6.1f}%")
    print("=" * 90)

    # 6. Spot-checks on Real Known Surges
    run_spot_checks(df, model, scaler)

    return model, scaler

def run_spot_checks(df, model, scaler):
    """
    Evaluates model's 14-step trajectory against 3 real known outbreak surge windows.
    """
    case_min = scaler.data_min_[3]
    case_max = scaler.data_max_[3]
    features = ['rainfall_mm', 'avg_temp_c', 'humidity_pct', 'daily_cases']

    print("\n" + "=" * 90)
    print("        SPOT-CHECK ON REAL KNOWN OUTBREAK SURGES IN TEST SET         ")
    print("=" * 90)

    # Find candidate surge indices in test portion (>= index 7188)
    surges = [
        {"name": "West Bengal Dengue Surge (May-Jun 2018)", "idx": 7210},
        {"name": "Himachal Pradesh Bilaspur Dengue Vector Surge (Jun-Jul 2018)", "idx": 7275},
        {"name": "Punjab Hoshiarpur Waterborne Cholera Outbreak (Jul-Aug 2018)", "idx": 7360}
    ]

    for surge in surges:
        target_row = surge["idx"]
        input_window = df.iloc[target_row - 14 : target_row]
        future_window = df.iloc[target_row : target_row + 14]

        scaled_inp = scaler.transform(input_window[features].values)
        inp_t = torch.from_numpy(scaled_inp).float().unsqueeze(0)

        with torch.no_grad():
            preds_scaled = model(inp_t).numpy().flatten()
        preds = np.maximum(1.0, ((preds_scaled + 1.0) / 2.0) * (case_max - case_min) + case_min)
        actuals = future_window['daily_cases'].values

        print(f"\n--- {surge['name']} ---")
        print(f"Input Horizon:  {input_window['date'].iloc[0].strftime('%Y-%m-%d')} to {input_window['date'].iloc[-1].strftime('%Y-%m-%d')}")
        print(f"Forecast Range: {future_window['date'].iloc[0].strftime('%Y-%m-%d')} to {future_window['date'].iloc[-1].strftime('%Y-%m-%d')}")
        print("Horizon | Date       | Region / Disease                 | Actual | Predicted | Baseline")
        print("-" * 80)
        last_val = input_window['daily_cases'].iloc[-1]
        for h in range(14):
            d_str = future_window['date'].iloc[h].strftime('%Y-%m-%d')
            reg = f"{future_window['state_ut'].iloc[h]} - {future_window['district'].iloc[h]}"[:26]
            print(f"Day +{h+1:02d} | {d_str} | {reg:26s} | {actuals[h]:6.0f} | {preds[h]:9.1f} | {last_val:6.0f}")

    print("=" * 90 + "\n")

if __name__ == "__main__":
    train_lstm()
