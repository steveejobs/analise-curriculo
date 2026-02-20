-- Migration: Add dynamic analysis configuration to jobs table
-- Author: Assistant
-- Date: 2026-02-12

-- 1. Add recruitment_criteria column
-- Stores specific text requirements as a JSON array of strings
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS recruitment_criteria JSONB DEFAULT '[]'::jsonb;

-- 2. Add analysis_config column
-- Stores weights and strictness settings as a JSON object
-- Example structure:
-- {
--   "weights": {
--     "job_fit": 40,
--     "experience": 30,
--     "education": 10,
--     "communication": 20
--   }
-- }
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS analysis_config JSONB DEFAULT '{"weights": {"job_fit": 35, "experience": 25, "education": 20, "communication": 20}}'::jsonb;

-- 3. Update existing rows with default values if null (optional, safe defaults provided above)
UPDATE public.jobs 
SET recruitment_criteria = '[]'::jsonb 
WHERE recruitment_criteria IS NULL;

UPDATE public.jobs 
SET analysis_config = '{"weights": {"job_fit": 35, "experience": 25, "education": 20, "communication": 20}}'::jsonb 
WHERE analysis_config IS NULL;
