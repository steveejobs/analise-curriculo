import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function findData() {
    console.log('--- Checking candidates table ---');
    const { data: candidates, error: cError } = await supabase.from('candidates').select('id, name, analysis').not('analysis', 'is', null).limit(5);
    if (candidates && candidates.length > 0) {
        console.log('Found candidates with analysis:');
        console.log(JSON.stringify(candidates, null, 2));
    } else {
        console.log('No candidates with analysis found.');
    }

    console.log('\n--- Checking job_applications table ---');
    const { data: apps, error: aError } = await supabase.from('job_applications').select('id, candidate_name, criteria_evaluation').not('criteria_evaluation', 'is', null).limit(5);

    // Filter out empty objects if possible, or just log
    const filteredApps = apps?.filter(a => Object.keys(a.criteria_evaluation || {}).length > 0);

    if (filteredApps && filteredApps.length > 0) {
        console.log('Found applications with evaluation:');
        console.log(JSON.stringify(filteredApps, null, 2));
    } else {
        console.log('No applications with evaluation found.');
    }
}

findData();
