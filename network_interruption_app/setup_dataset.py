import pandas as pd
import requests
import os

# URL for NSL-KDD Train dataset (Raw text)
DATA_URL = "https://raw.githubusercontent.com/defcom17/NSL_KDD/master/KDDTrain+.txt"
OUTPUT_FILE = "traffic_data.csv"

# Column names from KDD documentation
COLUMNS = [
    "duration", "protocol_type", "service", "flag", "src_bytes", "dst_bytes", 
    "land", "wrong_fragment", "urgent", "hot", "num_failed_logins", "logged_in", 
    "num_compromised", "root_shell", "su_attempted", "num_root", "num_file_creations", 
    "num_shells", "num_access_files", "num_outbound_cmds", "is_host_login", 
    "is_guest_login", "count", "srv_count", "serror_rate", "srv_serror_rate", 
    "rerror_rate", "srv_rerror_rate", "same_srv_rate", "diff_srv_rate", 
    "srv_diff_host_rate", "dst_host_count", "dst_host_srv_count", 
    "dst_host_same_srv_rate", "dst_host_diff_srv_rate", "dst_host_same_src_port_rate", 
    "dst_host_srv_diff_host_rate", "dst_host_serror_rate", "dst_host_srv_serror_rate", 
    "dst_host_rerror_rate", "dst_host_srv_rerror_rate", "class", "difficulty"
]

def download_and_process():
    print(f"Downloading dataset from {DATA_URL}...")
    try:
        response = requests.get(DATA_URL)
        response.raise_for_status()
        
        # Save raw content temporarily
        with open("raw_kdd.txt", "wb") as f:
            f.write(response.content)
            
        print("Download complete. Processing CSV...")
        
        # Read into Pandas
        df = pd.read_csv("raw_kdd.txt", header=None, names=COLUMNS)
        
        # Keep only the features we are using in the web app
        # (To keep the input form simple)
        selected_features = [
            'duration', 'protocol_type', 'service', 'flag', 
            'src_bytes', 'dst_bytes', 'class'
        ]
        
        df_subset = df[selected_features].copy()
        
        # Map class to 0 (Normal) and 1 (Attack)
        # In NSL-KDD, 'normal' is normal, everything else is an attack
        df_subset['class'] = df_subset['class'].apply(lambda x: 0 if x == 'normal' else 1)
        
        # Save to CSV
        df_subset.to_csv(OUTPUT_FILE, index=False)
        print(f"Successfully created {OUTPUT_FILE} with {len(df_subset)} records.")
        
        # Clean up raw file
        if os.path.exists("raw_kdd.txt"):
            os.remove("raw_kdd.txt")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    download_and_process()
