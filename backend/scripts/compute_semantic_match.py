import os
import json
from dotenv import load_dotenv
from supabase import create_client, Client

# Layer 2: Orchestration - Semantic Match Logic
# This script represents the deterministic decision-making logic of the system.

load_dotenv(dotenv_path='../intelligent-ats/.env')

supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

def compute_match(candidate_id: str, job_id: str):
    print(f"🔍 Cruzando Candidate:{candidate_id} com Job:{job_id}...")
    
    # 1. Fetch Data [Layer 3]
    candidate = supabase.table("candidates").select("*").eq("id", candidate_id).single().execute()
    job = supabase.table("jobs").select("*").eq("id", job_id).single().execute()
    
    # 2. Mock Semantic Analysis Logic [Orchestration]
    # In a real scenario, this would call an LLM with a specific directive.
    c_skills = candidate.data.get('analysis', {}).get('skills', [])
    j_reqs = job.data.get('requirements', {}).get('mandatory', [])
    
    found = [s for s in c_skills if s in j_reqs]
    missing = [r for r in j_reqs if r not in c_skills]
    
    score = int((len(found) / len(j_reqs)) * 100) if j_reqs else 50
    
    # 3. Persist Result [Layer 3]
    result = {
        "company_id": job.data['company_id'],
        "candidate_id": candidate_id,
        "job_id": job_id,
        "semantic_match_score": score,
        "skills_gap": {"found": found, "missing": missing},
        "ai_reasoning": f"O candidato possui forte fit técnico em {', '.join(found)}. "
                        f"Entretanto, foram identificados gaps em {', '.join(missing)}."
    }
    
    supabase.table("screening_matrix").upsert(result).execute()
    print(f"✅ Matriz de Triagem Atualizada. Score: {score}%")

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 2:
        compute_match(sys.argv[1], sys.argv[2])
    else:
        print("Usage: python compute_semantic_match.py <candidate_id> <job_id>")
