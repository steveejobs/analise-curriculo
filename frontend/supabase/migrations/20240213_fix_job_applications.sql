
-- Tabela de Candidaturas (job_applications)
-- Necessária para o funcionamento do sistema de ingestão e agente IA.

CREATE TABLE IF NOT EXISTS public.job_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID, -- Referência à vaga (pode ser null se for upload avulso)
    candidate_name TEXT,
    candidate_email TEXT,
    resume_url TEXT,
    
    -- Campos de Controle do Processo IA
    ai_status TEXT DEFAULT 'PENDING', -- PENDING, UPLOADING, EXTRACTED, QUEUED_N8N, ANALYZING, DONE, ERROR
    ai_score INT, -- 0 a 100
    ai_explanation TEXT, -- Resumo ou motivo do erro
    
    -- Dados da Análise
    criteria_evaluation JSONB, -- Critérios detalhados (skills, risk, etc)
    match_score INT, -- Pontuação de match específico com a vaga
    
    -- Logs e Auditoria
    audit_log JSONB[], -- Array de logs de eventos
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS (Segurança) se necessário, ou deixar aberto para testes (cuidado em produção!)
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Política para permitir tudo por enquanto (DEV MODE)
CREATE POLICY "Enable all for devs" ON public.job_applications USING (true) WITH CHECK (true);
