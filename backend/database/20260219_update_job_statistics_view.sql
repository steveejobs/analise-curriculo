-- Migration: Update job_statistics view to use job_applications
-- Date: 2026-02-19
-- Description: Syncs the Vagas menu stats with the new Pup Line data.

CREATE OR REPLACE VIEW public.job_statistics AS
SELECT 
  j.id as job_id,
  j.title as job_title,
  COUNT(DISTINCT ja.id) as total_candidates,
  COUNT(DISTINCT CASE WHEN ja.ai_score >= 70 THEN ja.id END) as qualified_candidates,
  COALESCE(AVG(ja.ai_score), 0)::INTEGER as avg_score,
  COALESCE(MAX(ja.ai_score), 0) as max_score,
  COALESCE(MIN(ja.ai_score), 0) as min_score
FROM jobs j
LEFT JOIN job_applications ja ON j.id = ja.job_id
GROUP BY j.id, j.title;

-- Ensure read access is still allowed for authenticated users
ALTER VIEW public.job_statistics OWNER TO postgres;
GRANT SELECT ON public.job_statistics TO authenticated;
GRANT SELECT ON public.job_statistics TO service_role;
GRANT SELECT ON public.job_statistics TO anon;
