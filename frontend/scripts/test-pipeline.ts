
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing environment variables.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const TEST_CANDIDATES = [
    {
        candidate_name: 'Marcos Teste Concorrência 1',
        candidate_email: 'marcos1@teste.com',
        resume_url: 'https://eifzdkdsbhwkajxvmgjb.supabase.co/storage/v1/object/public/resumes/c66b1c29-9aca-4792-8a6a-c40da5bbced8/resume.pdf',
        ai_status: 'PENDING',
        job_id: null
    },
    {
        candidate_name: 'Ana Teste Concorrência 2',
        candidate_email: 'ana2@teste.com',
        resume_url: 'https://eifzdkdsbhwkajxvmgjb.supabase.co/storage/v1/object/public/resumes/c66b1c29-9aca-4792-8a6a-c40da5bbced8/resume.pdf',
        ai_status: 'PENDING',
        job_id: null
    },
    {
        candidate_name: 'Roberto Teste Concorrência 3',
        candidate_email: 'roberto3@teste.com',
        resume_url: 'https://eifzdkdsbhwkajxvmgjb.supabase.co/storage/v1/object/public/resumes/c66b1c29-9aca-4792-8a6a-c40da5bbced8/resume.pdf',
        ai_status: 'PENDING',
        job_id: null
    }
];

async function seedTest() {
    console.log('🚀 Inserindo candidatos de teste...');
    const { data, error } = await supabase
        .from('job_applications')
        .insert(TEST_CANDIDATES)
        .select();

    if (error) {
        console.error('❌ Erro ao inserir:', error.message);
    } else {
        console.log(`✅ ${data?.length} candidatos inseridos com sucesso.`);
        console.log('💡 Agora execute: npm run agent');
    }
}

seedTest();
