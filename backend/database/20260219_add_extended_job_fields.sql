-- Migration: Add extended job fields for better screening
-- Date: 2026-02-19

-- 1. Add new columns to jobs table
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS seniority TEXT,
ADD COLUMN IF NOT EXISTS salary_range TEXT DEFAULT 'A combinar',
ADD COLUMN IF NOT EXISTS location_city TEXT,
ADD COLUMN IF NOT EXISTS location_state TEXT,
ADD COLUMN IF NOT EXISTS essential_requirements JSONB DEFAULT '[]'::jsonb;

-- 2. Add comments for documentation
COMMENT ON COLUMN public.jobs.department IS 'Department or area of the job (e.g., Marketing, Sales)';
COMMENT ON COLUMN public.jobs.seniority IS 'Seniority level (e.g., Junior, Pleno, Senior)';
COMMENT ON COLUMN public.jobs.salary_range IS 'Salary range or "A combinar"';
COMMENT ON COLUMN public.jobs.essential_requirements IS 'List of mandatory requirements for better AI screening';

-- 3. Update existing jobs to have reasonable defaults for new fields if needed
-- (Optional: based on existing description or title, but better to leave null for manual update)
