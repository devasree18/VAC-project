from flask import Flask, render_template, request, jsonify, send_file
import pandas as pd
import numpy as np
import joblib
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Load Model
MODEL_PATH = 'model.pkl'
if os.path.exists(MODEL_PATH):
    model = joblib.load(MODEL_PATH)
    encoders = joblib.load('encoders.pkl')
    scaler = joblib.load('scaler.pkl')
else:
    model = None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def analyze_network():
    if not model:
        return jsonify({'error': 'Model not trained. Please run model.py first.'}), 500

    df = None
    
    # Check for uploaded file first
    if 'file' in request.files and request.files['file'].filename != '':
        file = request.files['file']
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], secure_filename(file.filename))
        file.save(filepath)
        try:
            df = pd.read_csv(filepath)
        finally:
            if os.path.exists(filepath):
                os.remove(filepath)
    
    # Fallback to server-side dataset if no upload
    elif os.path.exists('traffic_data.csv'):
        # Limit to first 2000 rows for speed in "demo" mode, or full if user wants
        df = pd.read_csv('traffic_data.csv').head(5000) 
    else:
        return jsonify({'error': 'No file uploaded and no default dataset found on server.'}), 400

    try:
        # Select relevant features
        features = ['duration', 'protocol_type', 'service', 'src_bytes', 'dst_bytes', 'flag']
        
        # Validation
        missing = [col for col in features if col not in df.columns]
        if missing:
             return jsonify({'error': f'Invalid CSV. Missing: {missing}'}), 400

        X = df[features].copy()

        # Preprocess (Encode & Scale)
        for col, encoder in encoders.items():
            X[col] = X[col].astype(str)
            known_classes = set(encoder.classes_)
            X[col] = X[col].map(lambda s: s if s in known_classes else encoder.classes_[0])
            X[col] = encoder.transform(X[col])
        
        X[['duration', 'src_bytes', 'dst_bytes']] = scaler.transform(X[['duration', 'src_bytes', 'dst_bytes']])

        # Predict
        preds = model.predict(X)
        
        # Identify attacks
        attack_indices = np.where(preds == 1)[0]
        # Get first 100 attacks for the log
        attacks_df = df.iloc[attack_indices].head(100).copy() 
        
        # Add a simulated timestamp for display
        attacks_df['id'] = attacks_df.index
        
        # Convert to list of dicts
        detected_incidents = attacks_df[['id', 'protocol_type', 'service', 'src_bytes', 'dst_bytes', 'flag']].to_dict(orient='records')

        return jsonify({
            'total_packets': len(preds),
            'normal_count': int(np.sum(preds == 0)),
            'attack_count': int(np.sum(preds == 1)),
            'detected_incidents': detected_incidents
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/download_sample')
def download_sample():
    path = 'traffic_data.csv' 
    if os.path.exists(path):
        return send_file(path, as_attachment=True)
    return "Sample not found. Run setup_dataset.py first.", 404

if __name__ == '__main__':
    app.run(debug=True)
