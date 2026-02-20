
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing environment variables.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkSpecificErrors() {
    console.log('--- Empty AI Response Check ---');
    const { data: emptyData } = await supabase
        .from('job_applications')
        .select('id, candidate_name, ai_explanation')
        .ilike('ai_explanation', '%Empty AI response%');

    console.log(`Found ${emptyData?.length || 0} applications with Empty AI response.`);
    emptyData?.forEach(d => console.log(`- ${d.id}: ${d.candidate_name}`));

    console.log('\n--- Schema Mismatch Check ---');
    const { data: schemaData } = await supabase
        .from('job_applications')
        .select('id, candidate_name, ai_explanation')
        .ilike('ai_explanation', '%Schema mismatch%');

    console.log(`Found ${schemaData?.length || 0} applications with Schema mismatch.`);
    // Log one example of schema mismatch if found
    if (schemaData && schemaData.length > 0) {
        console.log(`Example: ${schemaData[0].ai_explanation}`);
    }
}

checkSpecificErrors();
