import requests
import json
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path='../intelligent-ats/.env')

URL = os.getenv('INGESTION_GATEWAY_URL', 'http://localhost:3000/api/ingestion/process')

def test_manual_upload():
    print(f"Testing Manual Upload to {URL}...")
    
    payload = {
        'company_id': '00000000-0000-0000-0000-000000000001',
        'source_type': 'MANUAL_UPLOAD',
        'text': 'Candidate: John Doe. Skills: Python, React.'
    }
    
    try:
        response = requests.post(URL, data=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_manual_upload()
