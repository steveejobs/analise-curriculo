const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    try {
        console.log('--- Inspecting jobs table ---');
        const { data, error } = await supabase.from('jobs').select('*').limit(1);

        if (error) {
            console.log('Select * Error:', error.message);
            // Try specific columns
            const cols = ['description', 'requirements', 'summary', 'job_description', 'requirements_text'];
            for (const c of cols) {
                const { error: e } = await supabase.from('jobs').select(c).limit(1);
                console.log(`Column '${c}': ${e ? '❌ MISSING (' + e.message + ')' : '✅ EXISTS'}`);
            }
        } else if (data) {
            console.log('Success! Columns in DB:', data.length > 0 ? Object.keys(data[0]) : 'Table is empty');
            if (data.length === 0) {
                // If empty, try to get column names from an error
                const { error: e2 } = await supabase.from('jobs').select('non_existent_column_for_debug').limit(1);
                console.log('Metadata error hint:', e2 ? e2.message : 'No hint');
            }
        }
    } catch (e) {
        console.error('Fatal:', e);
    }
}
check();
