import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function setup() {
    console.log('🏗️ Attempting to create tables via RPC if available, or logging error...');

    // In many Supabase setups, you can't create tables via the JS client unless you have a specific RPC
    // But we can try to check if we can at least interact with 'candidates'
    const { error } = await supabase.from('candidates').select('*').limit(1);

    if (error && error.code === '42P01') {
        console.log('❌ Tables are missing. Please run the SQL migrations in the Supabase Dashboard.');
        console.log('Recommended SQL:');
        console.log(`
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  required_skills JSONB DEFAULT '[]'::jsonb,
  company_id UUID,
  status TEXT DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(id),
    candidate_name TEXT,
    candidate_email TEXT,
    resume_url TEXT,
    ai_status TEXT DEFAULT 'PENDING',
    criteria_evaluation JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS screening_matrix (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID,
  job_id UUID REFERENCES jobs(id),
  company_id UUID,
  semantic_match_score INTEGER,
  skills_gap JSONB,
  matched_skills JSONB,
  ai_reasoning TEXT,
  recommendation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(candidate_id, job_id)
);
        `);
    } else if (error) {
        console.error('❌ Database error:', error.message);
    } else {
        console.log('✅ Tables exist or error is not relation-missing.');
    }
}

setup();
