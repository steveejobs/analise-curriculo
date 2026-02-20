-- ================================================
-- Configuração do Supabase Storage para Currículos
-- ================================================

-- ================================================
-- 1. CRIAR BUCKET DE CURRÍCULOS
-- ================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resumes',
  'resumes',
  true,  -- público para leitura
  10485760,  -- 10MB por arquivo
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']::text[]  -- PDFs e Word
)
ON CONFLICT (id) DO NOTHING;

-- ================================================
-- 2. POLÍTICAS RLS PARA O BUCKET
-- ================================================

-- Permitir upload (INSERT) para authenticated users e service_role
CREATE POLICY "Allow upload for authenticated users"
ON storage.objects FOR INSERT
TO authenticated, service_role
WITH CHECK (
  bucket_id = 'resumes' AND
  (auth.role() = 'authenticated' OR auth.role() = 'service_role')
);

-- Permitir leitura pública (SELECT)
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'resumes');

-- Permitir atualização apenas para service_role
CREATE POLICY "Allow update for service role"
ON storage.objects FOR UPDATE
TO service_role
USING (bucket_id = 'resumes');

-- Permitir delete apenas para service_role
CREATE POLICY "Allow delete for service role"
ON storage.objects FOR DELETE
TO service_role
USING (bucket_id = 'resumes');

-- ================================================
-- 3. CRIAR TABELA DE LOG DE UPLOADS (OPCIONAL)
-- ================================================

CREATE TABLE IF NOT EXISTS resume_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_email TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  source TEXT DEFAULT 'email',  -- email, webhook, manual
  processed BOOLEAN DEFAULT false,
  candidate_id UUID REFERENCES candidates(id) ON DELETE SET NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_resume_uploads_email ON resume_uploads(candidate_email);
CREATE INDEX IF NOT EXISTS idx_resume_uploads_processed ON resume_uploads(processed);
CREATE INDEX IF NOT EXISTS idx_resume_uploads_uploaded_at ON resume_uploads(uploaded_at);

-- ================================================
-- 4. FUNÇÃO PARA OBTER URL PÚBLICA DO CURRÍCULO
-- ================================================

CREATE OR REPLACE FUNCTION get_resume_public_url(file_path TEXT)
RETURNS TEXT AS $$
DECLARE
  base_url TEXT;
BEGIN
  -- Obter URL base do projeto
  SELECT concat(
    current_setting('app.settings.supabase_url', true),
    '/storage/v1/object/public/resumes/',
    file_path
  ) INTO base_url;
  
  RETURN base_url;
END;
$$ LANGUAGE plpgsql;

-- Exemplo de uso:
-- SELECT get_resume_public_url('2026-02-12/candidate@email.com_resume.pdf');

-- ================================================
-- 5. CRIAR JOB_ID GENÉRICO PARA FALLBACK
-- ================================================

-- Inserir vaga genérica para candidatos sem vaga específica
INSERT INTO jobs (
  id,
  title,
  description,
  required_skills,
  company_id,
  status
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Vaga Geral',
  'Vaga genérica para candidatos que não especificaram posição. Requer análise manual.',
  '[]'::jsonb,
  '00000000-0000-0000-0000-000000000000',
  'ACTIVE'
)
ON CONFLICT (id) DO NOTHING;

-- ================================================
-- 6. VIEW PARA CURRÍCULOS CARREGADOS
-- ================================================

CREATE OR REPLACE VIEW resume_files_summary AS
SELECT 
  o.name as file_name,
  o.bucket_id,
  concat(
    current_setting('app.settings.supabase_url', true),
    '/storage/v1/object/public/resumes/',
    o.name
  ) as public_url,
  o.created_at as uploaded_at,
  pg_size_pretty(o.metadata->>'size')::text as file_size,
  o.metadata->>'mimetype' as mime_type
FROM storage.objects o
WHERE o.bucket_id = 'resumes'
ORDER BY o.created_at DESC;

-- ================================================
-- 7. VERIFICAÇÃO E LIMPEZA
-- ================================================

-- Verificar se bucket foi criado
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'resumes';

-- Listar arquivos no bucket (teste)
SELECT name, created_at, 
       pg_size_pretty((metadata->>'size')::bigint) as size
FROM storage.objects
WHERE bucket_id = 'resumes'
ORDER BY created_at DESC
LIMIT 10;

-- Limpar arquivos antigos (> 90 dias) - CUIDADO!
-- DELETE FROM storage.objects
-- WHERE bucket_id = 'resumes' 
--   AND created_at < NOW() - INTERVAL '90 days';

-- ================================================
-- NOTAS IMPORTANTES
-- ================================================

/*
1. BUCKET 'resumes':
   - Público para leitura (anyone can view PDFs)
   - Apenas authenticated/service_role pode fazer upload
   - Limite de 10MB por arquivo
   - Apenas PDFs permitidos

2. ESTRUTURA DE PASTAS:
   Recomendado: YYYY-MM-DD/email@domain.com_filename.pdf
   Exemplo: 2026-02-12/joao@email.com_curriculo.pdf
   
3. URL PÚBLICA:
   https://[seu-projeto].supabase.co/storage/v1/object/public/resumes/[caminho]
   
4. CREDENCIAIS NO N8N:
   - Use SERVICE_ROLE key (não anon key)
   - Encontre em: Project Settings → API → service_role
   
5. LIMPEZA AUTOMÁTICA:
   - Considere criar um workflow n8n para limpar arquivos antigos
   - Ou use Supabase Edge Functions com cron job
   
6. SEGURANÇA:
   - PDFs são públicos! Não coloque dados sensíveis em nomes de arquivo
   - Use UUIDs ou hashes se precisar de privacidade
   
7. MONITORAMENTO:
   - Use a view resume_files_summary para ver uploads
   - Monitore tamanho do bucket em Project Settings → Storage
*/
