import pandas as pd
import numpy as np
import tensorflow as tf
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
import os

# Set paths
base_dir = os.path.dirname(os.path.abspath(__file__))
data_path = os.path.join(base_dir, "symptoms_triage_data.csv")
model_save_path = os.path.join(base_dir, "triage_classifier.tflite")

def train_and_export_tflite():
    # 1. Load Data
    if not os.path.exists(data_path):
        print(f"Error: Data file not found at {data_path}. Please run synthetic_data_generator.py first.")
        return
        
    df = pd.read_csv(data_path)
    print("Data loaded successfully.")
    
    # 2. Preprocess Data
    X = df[['fever_temp', 'duration_days', 'severe_dehydration', 'persistent_vomiting']].values
    y = df['risk_level'].values
    
    # Encode target labels (GREEN=0, AMBER=1, RED=2)
    # We enforce a specific mapping so the mobile app knows what 0, 1, 2 mean.
    mapping = {"GREEN": 0, "AMBER": 1, "RED": 2}
    y_encoded = np.array([mapping[val] for val in y])
    
    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X_scaled, y_encoded, test_size=0.2, random_state=42)
    
    # 3. Build Neural Network Model
    model = tf.keras.Sequential([
        tf.keras.layers.Dense(16, activation='relu', input_shape=(4,)),
        tf.keras.layers.Dense(8, activation='relu'),
        tf.keras.layers.Dense(3, activation='softmax') # 3 classes: Green, Amber, Red
    ])
    
    model.compile(optimizer='adam', 
                  loss='sparse_categorical_crossentropy', 
                  metrics=['accuracy'])
                  
    # 4. Train Model
    print("Training model...")
    model.fit(X_train, y_train, epochs=20, batch_size=32, validation_data=(X_test, y_test), verbose=1)
    
    # Evaluate
    loss, accuracy = model.evaluate(X_test, y_test, verbose=0)
    print(f"Model Accuracy on Test Set: {accuracy * 100:.2f}%")
    
    # 5. Export to TFLite
    print("Exporting model to TFLite format...")
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    tflite_model = converter.convert()
    
    with open(model_save_path, 'wb') as f:
        f.write(tflite_model)
        
    print(f"Successfully exported TFLite model to {model_save_path}")
    print("Note: The mobile app must apply the same StandardScaler means/variances before running inference.")
    print(f"Scaler Means: {scaler.mean_}")
    print(f"Scaler Variances: {scaler.var_}")

if __name__ == "__main__":
    train_and_export_tflite()
