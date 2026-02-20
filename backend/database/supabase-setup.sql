-- ================================================
-- Script de Configuração do Supabase para ATS
-- ================================================
-- Execute estas queries no SQL Editor do Supabase

-- ================================================
-- 1. CRIAR TABELA DE VAGAS (jobs)
-- ================================================

CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  required_skills JSONB DEFAULT '[]'::jsonb,
  company_id UUID,
  status TEXT DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_required_skills ON jobs USING GIN(required_skills);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- 2. ATUALIZAR TABELA CANDIDATES
-- ================================================

-- Adicionar campo status se não existir
ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'NEW';

-- Índice para status
CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);

-- Comentários para documentação
COMMENT ON COLUMN candidates.status IS 'Status do candidato: NEW, QUALIFIED, UNDER_REVIEW, REJECTED, HIRED';

-- ================================================
-- 3. VERIFICAR/CRIAR TABELA SCREENING_MATRIX
-- ================================================

-- Criar tabela se não existir
CREATE TABLE IF NOT EXISTS screening_matrix (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  company_id UUID,
  semantic_match_score INTEGER NOT NULL CHECK (semantic_match_score >= 0 AND semantic_match_score <= 100),
  skills_gap JSONB DEFAULT '[]'::jsonb,
  matched_skills JSONB DEFAULT '[]'::jsonb,
  ai_reasoning TEXT,
  strengths JSONB DEFAULT '[]'::jsonb,
  weaknesses JSONB DEFAULT '[]'::jsonb,
  recommendation TEXT CHECK (recommendation IN ('APPROVED', 'INTERVIEW', 'REJECTED')),
  auditable_decision_log JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(candidate_id, job_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_screening_candidate_id ON screening_matrix(candidate_id);
CREATE INDEX IF NOT EXISTS idx_screening_job_id ON screening_matrix(job_id);
CREATE INDEX IF NOT EXISTS idx_screening_company_id ON screening_matrix(company_id);
CREATE INDEX IF NOT EXISTS idx_screening_score ON screening_matrix(semantic_match_score);
CREATE INDEX IF NOT EXISTS idx_screening_recommendation ON screening_matrix(recommendation);

-- Index job_applications for performance
CREATE INDEX IF NOT EXISTS idx_job_apps_created_at ON job_applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_apps_ai_status ON job_applications(ai_status);
CREATE INDEX IF NOT EXISTS idx_job_apps_job_id ON job_applications(job_id);

-- Trigger para updated_at
CREATE TRIGGER update_screening_matrix_updated_at
  BEFORE UPDATE ON screening_matrix
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- 4. DADOS DE EXEMPLO
-- ================================================

-- Inserir vaga de exemplo
INSERT INTO jobs (title, description, required_skills, company_id) VALUES 
(
  'Desenvolvedor Full Stack Sênior',
  'Buscamos desenvolvedor full stack com sólida experiência em React, Node.js e PostgreSQL. Você trabalhará em projetos inovadores de grande escala, colaborando com equipe multidisciplinar. Requisitos: 5+ anos de experiência, conhecimento em arquitetura de software, testes automatizados e CI/CD.',
  '["React", "Node.js", "PostgreSQL", "TypeScript", "Git", "Docker", "REST APIs", "Jest", "AWS"]'::jsonb,
  '00000000-0000-0000-0000-000000000000'
)
ON CONFLICT DO NOTHING;

-- Mais exemplos de vagas
INSERT INTO jobs (title, description, required_skills, company_id) VALUES 
(
  'Engenheiro de Dados',
  'Profissional para construir e manter pipelines de dados escaláveis. Experiência com Python, Spark e bancos de dados distribuídos é essencial.',
  '["Python", "Apache Spark", "SQL", "Airflow", "Kafka", "Data Warehousing", "ETL"]'::jsonb,
  '00000000-0000-0000-0000-000000000000'
),
(
  'DevOps Engineer',
  'Responsável por automação de infraestrutura e implementação de CI/CD. Kubernetes e Terraform são fundamentais.',
  '["Kubernetes", "Docker", "Terraform", "AWS", "CI/CD", "GitOps", "Monitoring", "Linux"]'::jsonb,
  '00000000-0000-0000-0000-000000000000'
)
ON CONFLICT DO NOTHING;

-- ================================================
-- 5. VIEWS ÚTEIS PARA ANÁLISE
-- ================================================

-- View: Candidatos com análise
CREATE OR REPLACE VIEW candidates_with_analysis AS
SELECT 
  c.id as candidate_id,
  c.name,
  c.email,
  c.status as candidate_status,
  c.created_at as applied_at,
  j.id as job_id,
  j.title as job_title,
  sm.semantic_match_score,
  sm.recommendation,
  sm.matched_skills,
  sm.skills_gap,
  sm.created_at as analyzed_at
FROM candidates c
LEFT JOIN screening_matrix sm ON c.id = sm.candidate_id
LEFT JOIN jobs j ON sm.job_id = j.id;

-- View: Estatísticas por vaga
CREATE OR REPLACE VIEW job_statistics AS
SELECT 
  j.id as job_id,
  j.title as job_title,
  COUNT(DISTINCT c.id) as total_candidates,
  COUNT(DISTINCT CASE WHEN c.status = 'QUALIFIED' THEN c.id END) as qualified_candidates,
  AVG(sm.semantic_match_score)::INTEGER as avg_score,
  MAX(sm.semantic_match_score) as max_score,
  MIN(sm.semantic_match_score) as min_score
FROM jobs j
LEFT JOIN candidates c ON j.id = c.job_id
LEFT JOIN screening_matrix sm ON c.id = sm.candidate_id
GROUP BY j.id, j.title;

-- ================================================
-- 6. POLÍTICAS RLS (Row Level Security) - OPCIONAL
-- ================================================

-- Habilitar RLS nas tabelas
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE screening_matrix ENABLE ROW LEVEL SECURITY;

-- Política: Permitir leitura para usuários autenticados
CREATE POLICY "Allow authenticated read access" ON jobs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated read access" ON candidates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated read access" ON screening_matrix
  FOR SELECT
  TO authenticated
  USING (true);

-- Política: n8n pode inserir/atualizar (use service_role key no n8n)
-- Estas políticas permitem ao service_role fazer qualquer operação
CREATE POLICY "Allow service role all access" ON jobs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role all access" ON candidates
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role all access" ON screening_matrix
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ================================================
-- 7. VERIFICAÇÃO FINAL
-- ================================================

-- Verificar se todas as tabelas existem
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('jobs', 'candidates', 'screening_matrix')
ORDER BY table_name;

-- Verificar se há vagas de exemplo
SELECT COUNT(*) as total_jobs, 
       COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active_jobs
FROM jobs;

-- ================================================
-- NOTAS IMPORTANTES
-- ================================================

/*
1. CREDENCIAIS DO SUPABASE NO N8N:
   - Use a SERVICE_ROLE key (não a anon key)
   - Encontre em: Project Settings → API → service_role (secret)
   
2. ESTRUTURA MÍNIMA:
   - jobs: title, description, required_skills (JSONB array)
   - candidates: deve ter campo 'status'
   - screening_matrix: todos os campos conforme acima
   
3. RLS (Row Level Security):
   - Habilitado para segurança
   - service_role bypassa RLS automaticamente
   - Se tiver problemas de permissão, use service_role key
   
4. JSONB vs JSON:
   - required_skills usa JSONB (mais eficiente)
   - Pode ser consultado com operadores especiais
   - Exemplo: WHERE required_skills @> '["React"]'
   
5. BACKUPS:
   - Supabase faz backup automático (plano pago)
   - Exporte dados importantes regularmente
*/
