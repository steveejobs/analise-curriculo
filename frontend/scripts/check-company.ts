import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkCompany() {
    const { data, error } = await supabase.from('companies').select('*');
    if (error) {
        console.error('Error:', error);
        return;
    }
    console.log('--- Companies ---');
    console.log(data);
}

checkCompany();
