const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    console.log('--- FINAL JOBS INSPECTION ---');
    const { data: cols, error } = await supabase.rpc('inspect_columns', { table_name: 'jobs' }).catch(() => ({ data: null }));

    // If RPC fails (likely), use the select trick but with better output
    const { data, error: selectError } = await supabase.from('jobs').select('*').limit(1);

    if (selectError) {
        console.log('Error selecting from jobs:', selectError.message);
    }

    if (data && data.length > 0) {
        console.log('EXISTING_COLUMNS:', JSON.stringify(Object.keys(data[0])));
    } else {
        console.log('Table is empty. Testing specific columns existence...');
        const testCols = ['id', 'title', 'description', 'requirements', 'location', 'type', 'status', 'company_id', 'department'];
        const results = {};
        for (const c of testCols) {
            const { error: e } = await supabase.from('jobs').select(c).limit(1);
            results[c] = !e || !e.message.includes('column "' + c + '" does not exist');
        }
        console.log('COLUMN_TEST_RESULTS:', JSON.stringify(results));
    }
}
check();
