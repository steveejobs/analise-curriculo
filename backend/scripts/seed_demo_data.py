import os
import random
import uuid
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

# Configuração Supabase
url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
key: str = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")

if not url or not key:
    print("Erro: NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY não encontradas no .env")
    exit(1)

    
    company_id = "00000000-0000-0000-0000-000000000001"
    
    # 1. Criar uma Vaga Exemplo
    job_id = str(uuid.uuid4())
    job_data = {
        "id": job_id,
        "company_id": company_id,
        "title": "Senior Full Stack Developer",
        "description": "Buscamos alguém com forte experiência em React, Node.js e Supabase.",
        "requirements": {"mandatory": ["React", "Node.js", "SQL"], "nice_to_have": ["Next.js", "AI"]},
        "status": "ACTIVE"
    }
    supabase.table("jobs").upsert(job_data).execute()
    print(f"✅ Vaga criada: {job_data['title']}")

    # 2. Criar Candidatos Exemplo
    candidates = [
        {
            "id": str(uuid.uuid4()),
            "company_id": company_id,
            "job_id": job_id,
            "name": "Alice Silva",
            "email": "alice@exemplo.com",
            "ai_score": 92,
            "status": "OFFERED",
            "priority": "HIGH",
            "analysis": {"skills": ["React", "Node.js", "SQL", "Next.js"]}
        },
        {
            "id": str(uuid.uuid4()),
            "company_id": company_id,
            "job_id": job_id,
            "name": "Bruno Costa",
            "email": "bruno@exemplo.com",
            "ai_score": 75,
            "status": "INTERVIEW",
            "priority": "MEDIUM",
            "analysis": {"skills": ["React", "SQL"]}
        },
        {
            "id": str(uuid.uuid4()),
            "company_id": company_id,
            "job_id": job_id,
            "name": "Carla Souza",
            "email": "carla@exemplo.com",
            "ai_score": 45,
            "status": "NEW",
            "priority": "LOW",
            "analysis": {"skills": ["PHP", "JavaScript"]}
        }
    ]
    
    for c in candidates:
        supabase.table("candidates").upsert(c).execute()
        
        # Criar a Matriz de Triagem (O Raciocínio da IA)
        screening = {
            "company_id": company_id,
            "candidate_id": c["id"],
            "job_id": job_id,
            "semantic_match_score": c["ai_score"],
            "skills_gap": {
                "found": c["analysis"]["skills"], 
                "missing": [r for r in job_data["requirements"]["mandatory"] if r not in c["analysis"]["skills"]]
            },
            "ai_reasoning": f"O perfil de {c['name']} demonstra {c['ai_score']}% de aderência. " + 
                           ("Excelente fit com as tecnologias core." if c['ai_score'] > 80 else "Faltam algumas competências mandatórias.")
        }
        supabase.table("screening_matrix").upsert(screening).execute()
        print(f"👤 Candidato inserido: {c['name']} (Score: {c['ai_score']}%)")

    print("\n🚀 Dados de demonstração prontos! Abra http://localhost:3000 para ver o dashboard.")

if __name__ == "__main__":
    seed_demo()
