import requests
import json

try:
    url = 'http://127.0.0.1:5000/predict'
    # No file needed if default exists
    response = requests.post(url)
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print("Keys:", data.keys())
        if 'trends' in data:
            print("Trends keys:", data['trends'].keys())
            print("Trend data length:", len(data['trends']['labels']))
        else:
            print("ERROR: 'trends' key missing!")
    else:
        print("Error:", response.text)
except Exception as e:
    print(f"Failed to connect: {e}")
