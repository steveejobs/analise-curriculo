-- Migration: Email Templates
-- Applied for: Intelligent ATS

CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID, -- For future multi-tenancy
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL, -- Supports HTML and variables
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS (Segurança)
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Política para permitir tudo por enquanto (DEV MODE)
CREATE POLICY "Enable all for devs" ON public.email_templates USING (true) WITH CHECK (true);
