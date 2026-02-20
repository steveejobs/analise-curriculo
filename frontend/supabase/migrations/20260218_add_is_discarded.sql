ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS is_discarded BOOLEAN DEFAULT FALSE;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS is_discarded BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_job_apps_is_discarded ON job_applications(is_discarded);
CREATE INDEX IF NOT EXISTS idx_candidates_is_discarded ON candidates(is_discarded);
