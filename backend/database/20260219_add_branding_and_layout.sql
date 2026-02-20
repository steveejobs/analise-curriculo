-- Migration: Add company branding settings
-- Date: 2026-02-19

CREATE TABLE IF NOT EXISTS public.company_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID UNIQUE, -- Can be NULL for now if single tenant
    company_name TEXT DEFAULT 'Minha Empresa',
    logo_url TEXT,
    primary_color TEXT DEFAULT '#6366f1', -- Indigo 500
    layout_theme TEXT DEFAULT 'modern',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add layout options to jobs table
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS show_about_career BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_about_skills BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_phone_field BOOLEAN DEFAULT true;

-- Insert initial settings if empty
INSERT INTO public.company_settings (company_name)
SELECT 'ATS Core'
WHERE NOT EXISTS (SELECT 1 FROM public.company_settings);
