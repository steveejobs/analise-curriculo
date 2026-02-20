const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data: apps, error } = await supabase
        .from('job_applications')
        .select('id, candidate_name, ai_status, execution_stage, resume_url, ai_explanation')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.log('ERROR: ' + error.message);
        return;
    }

    for (const app of apps) {
        console.log('CANDIDATE_START');
        console.log('ID: ' + app.id);
        console.log('NAME: ' + app.candidate_name);
        console.log('STATUS: ' + app.ai_status);
        console.log('STAGE: ' + app.execution_stage);
        console.log('URL: ' + app.resume_url);
        console.log('EXPL: ' + app.ai_explanation);
        console.log('CANDIDATE_END');
    }
}

run();
