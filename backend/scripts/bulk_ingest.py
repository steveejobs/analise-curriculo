import os
import requests
import json
import time
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from the intelligent-ats directory
load_dotenv(dotenv_path='../intelligent-ats/.env')

GATEWAY_URL = os.getenv('INGESTION_GATEWAY_URL', 'http://localhost:3000/api/ingestion/process')
COMPANY_ID = '00000000-0000-0000-0000-000000000001' # Update as needed

def bulk_ingest(directory_path):
    print(f"🚀 Iniciando processamento em massa do diretório: {directory_path}")
    
    path = Path(directory_path)
    if not path.exists():
        print(f"❌ Erro: Diretório {directory_path} não encontrado.")
        return

    files = [f for f in path.glob('*') if f.suffix.lower() in ('.pdf', '.doc', '.docx')]
    print(f"📁 Encontrados {len(files)} arquivos válidos.")

    from concurrent.futures import ThreadPoolExecutor

    def process_file(file_info):
        i, file_path = file_info
        print(f"[{i}/{len(files)}] Enviando: {file_path.name}...", flush=True)
        try:
            with open(file_path, 'rb') as f:
                files_payload = {'file': (file_path.name, f)}
                data_payload = {
                    'company_id': COMPANY_ID,
                    'source_type': 'MANUAL_UPLOAD'
                }
                response = requests.post(GATEWAY_URL, files=files_payload, data=data_payload)
                if response.ok:
                    res_data = response.json()
                    print(f"✅ {file_path.name}: Sucesso (ID: {res_data.get('ingestion_id')})")
                else:
                    print(f"❌ {file_path.name}: Erro ({response.status_code})")
        except Exception as e:
            print(f"💥 {file_path.name}: Falha: {e}")

    print(f"📁 Processando {len(files)} arquivos com concorrência de 10...")
    with ThreadPoolExecutor(max_workers=10) as executor:
        executor.map(process_file, enumerate(files, 1))

    print("\n🏁 Processamento em massa concluído.")

if __name__ == "__main__":
    import sys
    # Allow passing directory as argument
    dir_to_process = sys.argv[1] if len(sys.argv) > 1 else "../.tmp"
    bulk_ingest(dir_to_process)
