const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data: apps, error } = await supabase
        .from('job_applications')
        .select('id, candidate_name')
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) {
        console.log('ERROR: ' + error.message);
    } else if (apps.length > 0) {
        console.log('ID:' + apps[0].id);
        console.log('NAME:' + apps[0].candidate_name);
    }
}

run();
