-- ================================================
-- MIGRATION: UNIVERSAL EMAIL SETTINGS
-- ================================================

-- 1. Tabela de Configurações de Integração
CREATE TABLE IF NOT EXISTS integration_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- 'IMAP', 'SMTP', 'S3', etc.
  provider TEXT NOT NULL, -- 'Gmail', 'Outlook', 'Office365', 'Custom'
  name TEXT NOT NULL, -- Nome amigável da configuração
  config JSONB NOT NULL DEFAULT '{}'::jsonb, -- Dados sensíveis (host, user, etc)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Trigger de Update
CREATE TRIGGER update_integration_settings_updated_at
  BEFORE UPDATE ON integration_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 3. RLS Policies
ALTER TABLE integration_settings ENABLE ROW LEVEL SECURITY;

-- Permitir leitura apenas para authenticated e service_role
CREATE POLICY "Allow authenticated read access" ON integration_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Permitir tudo para service_role (n8n usa isso)
CREATE POLICY "Allow service role all access" ON integration_settings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 4. Exemplo de Configuração (Desativada por padrão)
INSERT INTO integration_settings (type, provider, name, config, is_active)
VALUES (
  'IMAP',
  'Gmail',
  'Email Corporativo Principal',
  '{"host": "imap.gmail.com", "port": 993, "secure": true, "user": "exemplo@empresa.com", "password": ""}'::jsonb,
  false
) ON CONFLICT DO NOTHING;
