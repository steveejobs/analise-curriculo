import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function check() {
    console.log('--- Checking Integration Settings Table ---');
    const { data, error, count } = await supabase.from('integration_settings').select('*', { count: 'exact', head: true });
    if (error) {
        console.log(`integration_settings: ERROR ${error.code} - ${error.message}`);
        if (error.code === '42P01') { // undefined_table
            console.log('❌ Tabela NÃO existe. Precisa ser criada.');
        }
    } else {
        console.log(`integration_settings: FOUND, ${count} rows`);
    }
}
check();
