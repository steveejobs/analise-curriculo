-- Add AI Analysis columns to job_applications table
ALTER TABLE job_applications 
ADD COLUMN IF NOT EXISTS ai_score INTEGER,
ADD COLUMN IF NOT EXISTS ai_explanation TEXT,
ADD COLUMN IF NOT EXISTS ai_status TEXT DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS criteria_evaluation JSONB DEFAULT '{}'::jsonb;
