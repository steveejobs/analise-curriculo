
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createJobAndApp() {
    console.log('🧪 Creating dummy job...');
    const { data: job, error: jobError } = await supabase.from('jobs').insert({
        title: 'Desenvolvedor Full Stack (Teste)',
        description: 'Vaga para testar transição de carreira e novos critérios de análise.',
        requirements: 'React, Node.js, TypeScript e boa base lógica.',
        company_name: 'Tech Test Corp',
        location: 'Remoto',
        status: 'open'
    }).select().single();

    if (jobError) {
        console.error('❌ Error creating job:', jobError.message);
        return;
    }

    console.log(`✅ Created job ID: ${job.id}`);

    const resumeText = `
    NOME: Ricardo Silva
    EMAIL: ricardo.transicao@email.com
    TELEFONE: (11) 99999-8888
    LOCAL: São Paulo, SP

    OBJETIVO: Transição de carreira para Desenvolvedor Full Stack.

    RESUMO:
    Profissional com 10 anos de experiência na área Contábil e Financeira, agora migrando para Tecnologia. 
    Recently completei um bootcamp intensivo de 600 horas em Desenvolvimento Web. 
    Possuo sólidos conhecimentos em lógica de programação, mas busco minha primeira oportunidade profissional na área técnica.

    FORMAÇÃO:
    - Graduação em Ciências Contábeis (PUC-SP)
    - Bootcamp Full Stack - Web Dev Academy (2025)

    EXPERIÊNCIA PROFISSIONAL:
    - Senior Financial Analyst | TechCorp (2018 - 2024)
      * Responsável por relatórios financeiros e automação de planilhas usando VBA e Python básico.
      * Liderança de equipe de 3 pessoas.
    
    PROJETOS DE TI:
    - E-commerce Mock: Desenvolvido com React, Node.js e MongoDB.
    - Task Manager: App de gerenciamento de tarefas com autenticação JWT.

    HABILIDADES:
    JavaScript, TypeScript, React, Next.js, Node.js, PostgreSQL, Git, Metodologias Ágeis.
    Habilidades comportamentais: Resiliência, Comunicação, Gestão de Tempo, Pensamento Analítico.
    `;

    console.log('🧪 Creating career transition test application...');
    const { data: app, error: appError } = await supabase.from('job_applications').insert({
        job_id: job.id,
        candidate_name: 'Ricardo Silva (Teste)',
        candidate_email: 'ricardo.transicao@email.com',
        ai_status: 'PENDING',
        resume_url: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf', // A valid PDF for extraction testing if needed, but we'll bypass download in agent if we want.
    }).select().single();

    if (appError) {
        console.error('❌ Error creating app:', appError.message);
        return;
    }

    console.log(`✅ Created app ID: ${app.id}`);
}

createJobAndApp();
