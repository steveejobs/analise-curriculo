-- 1. Create integration_settings table
CREATE TABLE IF NOT EXISTS integration_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    config JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Add source column to job_applications
ALTER TABLE job_applications 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'upload';

-- 3. Insert specific configuration (Example)
INSERT INTO integration_settings (type, is_active, config)
VALUES (
  'IMAP',
  true,
  '{
    "host": "imap.gmail.com",
    "port": 993,
    "user": "seu_email@gmail.com",
    "password": "sua_senha_de_app_aqui",
    "secure": true
  }'
);
