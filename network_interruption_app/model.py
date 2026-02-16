import pandas as pd
import numpy as np
import os
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import accuracy_score, confusion_matrix
import joblib

# Synthetic Dataset Generation (if no file is provided)
def create_synthetic_data(filename='traffic_data.csv', n_samples=1000):
    np.random.seed(42)
    data = {
        'duration': np.random.randint(0, 5000, n_samples),
        'protocol_type': np.random.choice(['tcp', 'udp', 'icmp'], n_samples),
        'service': np.random.choice(['http', 'private', 'remote_job', 'name', 'netbios_ns', 'eco_i', 'mtp', 'telnet', 'finger', 'domain_u', 'supdup', 'uucp_path', 'Z39_50', 'smtp', 'csnet_ns', 'uucp', 'netbios_dgm', 'urp_i', 'auth', 'domain', 'ftp', 'bgp', 'ldap', 'ecr_i', 'gopher', 'vmnet', 'systat', 'http_443', 'efs', 'whois', 'imap4', 'iso_sctp', 'echo', 'klogin', 'link', 'sunrpc', 'login', 'kshell', 'sql_net', 'time', 'hostnames', 'exec', 'ntp_u', 'discard', 'nntp', 'courier', 'ctf', 'ssh', 'daytime', 'shell', 'netstat', 'pop_3', 'nnsp', 'IRC', 'pop_2', 'printer', 'tim_i', 'pm_dump', 'red_i', 'netbios_ssn', 'rje', 'X11', 'urh_i', 'ftp_data', 'tftp_u'], n_samples),
        'flag': np.random.choice(['SF', 'S0', 'REJ', 'RSTR', 'SH', 'RSTO', 'S1', 'RSTOS0', 'S3', 'S2', 'OTH'], n_samples),
        'src_bytes': np.random.randint(0, 10000, n_samples),
        'dst_bytes': np.random.randint(0, 10000, n_samples),
        'class': np.random.choice([0, 1], n_samples, p=[0.7, 0.3]) # 0=Normal, 1=Attack
    }
    df = pd.DataFrame(data)
    # Add some correlation for the model to learn
    df.loc[df['class'] == 1, 'src_bytes'] += 5000
    df.loc[df['class'] == 1, 'duration'] += 1000
    
    df.to_csv(filename, index=False)
    print(f"Sample dataset created: {filename}")
    return df

def train_model():
    # Load dataset
    try:
        if not os.path.exists('traffic_data.csv'):
            print("Dataset not found. Please run setup_dataset.py first.")
            return

        df = pd.read_csv('traffic_data.csv')
    except Exception as e:
        print(f"Error loading data: {e}")
        return

    print("Data Loaded. Shape:", df.shape)

    # Preprocessing
    df = df.dropna()
    
    # Features (Ensure these match the setup_dataset.py columns)
    X = df[['duration', 'protocol_type', 'service', 'src_bytes', 'dst_bytes', 'flag']]
    y = df['class'] # Already 0/1 from setup_dataset.py

    # Encoding Categorical Features
    encoders = {}
    for col in ['protocol_type', 'service', 'flag']:
        le = LabelEncoder()
        X[col] = le.fit_transform(X[col])
        encoders[col] = le
    
    # Scaling Numeric Features
    scaler = StandardScaler()
    X[['duration', 'src_bytes', 'dst_bytes']] = scaler.fit_transform(X[['duration', 'src_bytes', 'dst_bytes']])

    # Split Data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Train Model
    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(X_train, y_train)

    # Evaluation
    y_pred = clf.predict(X_test)
    print("Accuracy:", accuracy_score(y_test, y_pred))
    print("Confusion Matrix:\n", confusion_matrix(y_test, y_pred))

    # Save Artifacts
    joblib.dump(clf, 'model.pkl')
    joblib.dump(encoders, 'encoders.pkl')
    joblib.dump(scaler, 'scaler.pkl')
    print("Model and artifacts saved.")

if __name__ == '__main__':
    train_model()
