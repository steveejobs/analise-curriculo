import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const COMPANY_ID = '00000000-0000-0000-0000-000000000000';

async function seed() {
    console.log('🌱 Seeding data for Ranking Agent test...');

    // 1. Insert Job
    const { data: job, error: jobError } = await supabase.from('jobs').insert({
        company_id: COMPANY_ID,
        title: 'Desenvolvedor Backend (Ranking Test)',
        description: 'Buscamos um desenvolvedor com experiência em Node.js e Supabase.',
        requirements: { mandatory: ['Node.js', 'PostgreSQL'], nice_to_have: ['OpenAI'] },
        status: 'ACTIVE'
    }).select().single();

    if (jobError) {
        console.error('❌ Error creating job:', jobError.message);
        return;
    }
    console.log('✅ Job created:', job.id);

    // 2. Insert Application with dummy extraction
    const { data: app, error: appError } = await supabase.from('job_applications').insert({
        job_id: job.id,
        candidate_name: 'Teste de Ranking',
        candidate_email: 'ranking.test@email.com',
        ai_status: 'DONE',
        criteria_evaluation: {
            resumo_profissional: 'Desenvolvedor backend com 5 anos de experiência em Node.js e bancos relacionais.',
            top_skills: ['Node.js', 'PostgreSQL', 'Express', 'JavaScript'],
            senioridade_estimada: 'Pleno',
            maturidade_profissional: 'Avançado'
        }
    }).select().single();

    if (appError) {
        console.error('❌ Error creating application:', appError.message);
        return;
    }
    console.log('✅ Application created:', app.id);
    console.log(`\n🚀 RUN THIS COMMAND: npx tsx scripts/ranking-agent.ts --job-id=${job.id}`);
}

seed();
