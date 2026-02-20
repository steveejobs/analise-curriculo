-- Robustness Updates for job_applications table
-- Add columns to monitor agent activity and improve recovery

ALTER TABLE job_applications 
ADD COLUMN IF NOT EXISTS heartbeat TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS execution_stage TEXT,
ADD COLUMN IF NOT EXISTS last_error_stage TEXT,
ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS extraction_quality TEXT;

-- Update existing records if needed
COMMENT ON COLUMN job_applications.heartbeat IS 'Last sign of life from the AI agent processing this record.';
COMMENT ON COLUMN job_applications.execution_stage IS 'Current step in the processing pipeline (e.g., Download, Extraction, Analysis).';
COMMENT ON COLUMN job_applications.extraction_quality IS 'Quality of text extraction from PDF: high, medium, low, fail.';

-- Atomic claim function (optional but recommended for strictly avoiding race conditions)
-- However, we can use a simple UPDATE ... WHERE ai_status IN ('PENDING', ...) AND (heartbeat < NOW() - INTERVAL '5 minutes' OR heartbeat IS NULL)
