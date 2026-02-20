
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyReanalyze() {
    console.log('🔍 Iniciando verificação de Re-análise...');

    // 1. Encontrar um candidato com job_id
    const { data: apps } = await supabase
        .from('job_applications')
        .select('id, job_id, candidate_name')
        .not('job_id', 'is', null)
        .limit(1);

    if (!apps || apps.length === 0) {
        console.error('❌ Nenhum candidato com vaga encontrado para teste.');
        return;
    }

    const app = apps[0];
    console.log(`📌 Candidato selecionado: ${app.candidate_name} (ID: ${app.id}) na Vaga: ${app.job_id}`);

    // 2. Chamar a API de re-análise
    console.log('🚀 Chamando API de re-análise...');
    const response = await fetch('http://localhost:3000/api/candidates/reanalyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: app.job_id })
    });

    const result = await response.json();
    console.log('✅ API Result:', result);

    if (!result.success) {
        console.error('❌ API falhou.');
        return;
    }

    // 3. Monitorar status no DB
    console.log('⏳ Monitorando mudança de status para PENDING / QUEUED_REANALYSIS...');
    for (let i = 0; i < 10; i++) {
        const { data: updated } = await supabase
            .from('job_applications')
            .select('ai_status, execution_stage')
            .eq('id', app.id)
            .single();

        console.log(`   [Tentativa ${i + 1}] Status: ${updated.ai_status} | Stage: ${updated.execution_stage}`);

        if (updated.ai_status === 'ANALYZING' || updated.ai_status === 'DONE') {
            console.log('🎉 SUCESSO: O Agente capturou o pedido de re-análise!');
            return;
        }

        await new Promise(r => setTimeout(r, 2000));
    }

    console.log('⚠️ O Agente não capturou a mudança a tempo, verifique se ele está rodando.');
}

verifyReanalyze();
