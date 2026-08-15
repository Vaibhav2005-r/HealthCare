import pandas as pd
import numpy as np
import torch
import torch.nn as nn
from sklearn.preprocessing import MinMaxScaler
import os

base_dir = os.path.dirname(os.path.abspath(__file__))
data_path = os.path.join(base_dir, "outbreak_time_series.csv")
model_save_path = os.path.join(base_dir, "lstm_forecast_model.pt")

# LSTM Model Architecture
class OutbreakForecastLSTM(nn.Module):
    def __init__(self, input_size, hidden_size, num_layers, output_size):
        super(OutbreakForecastLSTM, self).__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True)
        self.fc = nn.Linear(hidden_size, output_size)
        
    def forward(self, x):
        h0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size).requires_grad_()
        c0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size).requires_grad_()
        
        out, (hn, cn) = self.lstm(x, (h0.detach(), c0.detach()))
        out = self.fc(out[:, -1, :]) 
        return out

def create_sequences(data, seq_length):
    xs, ys = [], []
    for i in range(len(data)-seq_length):
        x = data[i:(i+seq_length)]
        y = data[i+seq_length, -1] # Predicting 'daily_cases' (assumed to be the last column)
        xs.append(x)
        ys.append(y)
    return np.array(xs), np.array(ys)

def train_lstm():
    if not os.path.exists(data_path):
        print(f"Error: Data file not found at {data_path}. Please run synthetic_data_generator.py first.")
        return
        
    df = pd.read_csv(data_path)
    print("Time-series data loaded.")
    
    # 1. Preprocess
    # Features: rainfall_mm, avg_temp_c, humidity_pct, daily_cases
    # Target: daily_cases (we put it as the last column)
    features = ['rainfall_mm', 'avg_temp_c', 'humidity_pct', 'daily_cases']
    
    scaler = MinMaxScaler(feature_range=(-1, 1))
    scaled_data = scaler.fit_transform(df[features].values)
    
    # Sequence length: e.g. look back 14 days to predict next day
    seq_length = 14
    X, y = create_sequences(scaled_data, seq_length)
    
    # Train/Test Split (80/20)
    train_size = int(len(X) * 0.8)
    X_train, y_train = X[:train_size], y[:train_size]
    X_test, y_test = X[train_size:], y[train_size:]
    
    # Convert to PyTorch Tensors
    X_train_t = torch.from_numpy(X_train).float()
    y_train_t = torch.from_numpy(y_train).float().unsqueeze(1)
    X_test_t = torch.from_numpy(X_test).float()
    y_test_t = torch.from_numpy(y_test).float().unsqueeze(1)
    
    # 2. Build Model
    input_size = 4 # Number of features
    hidden_size = 32
    num_layers = 2
    output_size = 1
    
    model = OutbreakForecastLSTM(input_size, hidden_size, num_layers, output_size)
    criterion = torch.nn.MSELoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=0.01)
    
    # 3. Train
    print("Training LSTM...")
    num_epochs = 50
    for epoch in range(num_epochs):
        outputs = model(X_train_t)
        optimizer.zero_grad()
        loss = criterion(outputs, y_train_t)
        loss.backward()
        optimizer.step()
        
        if epoch % 10 == 0:
            print(f"Epoch: {epoch}, Loss: {loss.item():.5f}")
            
    # 4. Evaluate
    model.eval()
    with torch.no_grad():
        test_preds = model(X_test_t)
        test_loss = criterion(test_preds, y_test_t)
        print(f"Test MSE Loss: {test_loss.item():.5f}")
        
    # 5. Export
    torch.save(model.state_dict(), model_save_path)
    print(f"Model saved to {model_save_path}")

if __name__ == "__main__":
    train_lstm()
