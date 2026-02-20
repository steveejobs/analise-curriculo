import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testInsert() {
    const candidate = {
        candidate_name: 'Teste de Persistencia',
        candidate_email: 'teste@persistencia.com',
        resume_url: 'http://example.com/resume.pdf',
        ai_status: 'PENDING'
    };

    console.log('Inserting...');
    const { data, error } = await supabase.from('job_applications').insert(candidate).select();

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Inserted:', data);

    console.log('Verifying immediately...');
    const { data: verify } = await supabase.from('job_applications').select('*').eq('id', data[0].id);
    console.log('Verified:', verify);

    console.log('Waiting 5 seconds...');
    await new Promise(r => setTimeout(r, 5000));

    const { data: verifyAgain } = await supabase.from('job_applications').select('*').eq('id', data[0].id);
    console.log('Verified after 5s:', verifyAgain);
}

testInsert();
