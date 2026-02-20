import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkTemplatesTable() {
    console.log('--- Checking email_templates table ---');
    const result = await supabase
        .from('email_templates')
        .select('*', { count: 'exact' });

    console.log('RESULT:', JSON.stringify(result, null, 2));
}

checkTemplatesTable();
