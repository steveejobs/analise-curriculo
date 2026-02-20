-- Migration: Add form customization and public status to jobs
-- Date: 2026-02-19

ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS form_questions JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS recruitment_criteria JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'Full-time',
ADD COLUMN IF NOT EXISTS location TEXT DEFAULT 'Remoto';

-- Update existing jobs to have reasonable defaults
UPDATE public.jobs SET is_public = true WHERE is_public IS NULL;
UPDATE public.jobs SET form_questions = '[]'::jsonb WHERE form_questions IS NULL;
UPDATE public.jobs SET recruitment_criteria = '[]'::jsonb WHERE recruitment_criteria IS NULL;
UPDATE public.jobs SET type = 'Full-time' WHERE type IS NULL;
UPDATE public.jobs SET location = 'Remoto' WHERE location IS NULL;
