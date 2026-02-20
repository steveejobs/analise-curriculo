-- Migration: Add pipeline_config to jobs table
-- Goal: Support independent pipelines per job

-- 1. Add the column with the default pipeline stages
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS pipeline_config JSONB DEFAULT '[
  {"id": "triagem", "title": "Triagem", "color": "indigo"},
  {"id": "qualificacao", "title": "Qualificação", "color": "amber"},
  {"id": "finalistas", "title": "Finalistas", "color": "emerald"},
  {"id": "reprovado", "title": "Reprovado", "color": "red"}
]'::jsonb;

-- 2. Ensure existing jobs have the default configuration
UPDATE public.jobs 
SET pipeline_config = '[
  {"id": "triagem", "title": "Triagem", "color": "indigo"},
  {"id": "qualificacao", "title": "Qualificação", "color": "amber"},
  {"id": "finalistas", "title": "Finalistas", "color": "emerald"},
  {"id": "reprovado", "title": "Reprovado", "color": "red"}
]'::jsonb
WHERE pipeline_config IS NULL;
