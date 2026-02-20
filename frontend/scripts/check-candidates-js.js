
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function main() {
    try {
        const envPath = path.resolve(__dirname, '../.env.local');
        if (!fs.existsSync(envPath)) {
            console.error('.env.local not found at', envPath);
            return;
        }

        const envContent = fs.readFileSync(envPath, 'utf8');
        const env = {};
        envContent.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                const value = parts.slice(1).join('=').trim().replace(/"/g, '');
                env[key] = value;
            }
        });

        const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
        const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY']; // Use service role for admin access

        if (!supabaseUrl || !supabaseKey) {
            console.error('Missing Supabase credentials in .env.local');
            console.log('Keys found:', Object.keys(env));
            return;
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        console.log('Checking candidates...');

        // 1. Check for clones
        const { data: clones, error } = await supabase
            .from('job_applications')
            .select('id, candidate_name, job_id, pipeline_status, execution_stage, created_at')
            .eq('execution_stage', 'CLONED_FROM_BANK')
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) {
            console.error('Error fetching clones:', error);
        } else {
            console.log('Recent Clones (CLONED_FROM_BANK):');
            console.table(clones);
        }

        // 2. Check for recent 'triagem' candidates with NULL job_id
        const { data: looseTriagem, error: error2 } = await supabase
            .from('job_applications')
            .select('id, candidate_name, job_id, pipeline_status, execution_stage, created_at')
            .is('job_id', null)
            .eq('pipeline_status', 'triagem')
            .order('created_at', { ascending: false })
            .limit(5);

        if (error2) {
            console.error('Error fetching loose triagem:', error2);
        } else {
            console.log('Recent Triagem Candidates (job_id IS NULL):');
            console.table(looseTriagem);
        }

    } catch (err) {
        console.error('Script error:', err);
    }
}

main();
