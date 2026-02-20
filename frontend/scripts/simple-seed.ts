import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
    console.log('SEED START');

    // 1. Vaga
    const { data: job, error: je } = await supabase.from('jobs').insert({
        company_id: '00000000-0000-0000-0000-000000000000',
        title: 'Backend Node.js',
        description: 'Vaga de teste',
        requirements: { mandatory: ['Node.js'] },
        status: 'ACTIVE'
    }).select().single();

    if (je) {
        console.log('JOB ERROR:', je.message);
        return;
    }
    console.log('JOB OK:', job.id);

    // 2. App
    const { data: app, error: ae } = await supabase.from('job_applications').insert({
        job_id: job.id,
        candidate_name: 'Candidato Teste',
        candidate_email: 'teste@exemplo.com',
        ai_status: 'DONE',
        criteria_evaluation: {
            resumo_profissional: 'Especialista em Node.js',
            top_skills: ['Node.js'],
            senioridade_estimada: 'Sênior',
            maturidade_profissional: 'Especialista'
        }
    }).select().single();

    if (ae) {
        console.log('APP ERROR:', ae.message);
        return;
    }
    console.log('APP OK:', app.id);
    console.log('SEED COMPLETE');
}

run();
