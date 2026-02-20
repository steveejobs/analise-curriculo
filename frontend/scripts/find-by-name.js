const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const names = ['Jardete Rabelo', 'de marketing', 'Enzo Rabelo Silva'];
    for (const name of names) {
        const { data: apps, error } = await supabase
            .from('job_applications')
            .select('id, candidate_name, ai_status, execution_stage, ai_explanation')
            .ilike('candidate_name', `%${name}%`)
            .limit(1);

        if (error) {
            console.log('ERROR for ' + name + ': ' + error.message);
        } else if (apps && apps.length > 0) {
            console.log('FOUND:' + name);
            console.log('ID:' + apps[0].id);
            console.log('STATUS:' + apps[0].ai_status);
            console.log('STAGE:' + apps[0].execution_stage);
            console.log('EXPL:' + apps[0].ai_explanation);
        } else {
            console.log('NOT FOUND:' + name);
        }
    }
}

run();
