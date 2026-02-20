import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';
import fs from 'fs';

const logFile = path.resolve(__dirname, 'ranking.log');
const log = (msg: string) => {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
};
if (fs.existsSync(logFile)) fs.unlinkSync(logFile);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || !OPENAI_API_KEY) {
    console.error('❌ Missing environment variables. Check .env file.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Schema for Ranking Output
const RankingSchema = z.object({
    semantic_match_score: z.number().min(0).max(100),
    matched_skills: z.array(z.string()),
    skills_gap: z.array(z.string()),
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    ai_reasoning: z.string(),
    recommendation: z.enum(['APPROVED', 'INTERVIEW', 'REJECTED'])
});

const SYSTEM_PROMPT_RANKING = `Você é o AGENTE 2: Ranking e Match Inteligente.
Sua tarefa é cruzar os dados de um candidato com os requisitos de uma vaga de forma extremamente criteriosa.

OBJETIVO:
- Avaliar o fit técnico, comportamental e contextual do candidato.
- Calcular um score de match semântico (0-100).
- Identificar habilidades presentes (matched_skills) e faltantes (skills_gap).
- Listar pontos fortes (strengths) e pontos de atenção (weaknesses).
- Fornecer uma justificativa detalhada (ai_reasoning).
- Dar uma recomendação final: APPROVED, INTERVIEW ou REJECTED.

DIRETRIZES DE AVALIAÇÃO:
1. REQUISITOS ESSENCIAIS: Se a vaga possui requisitos essenciais (ex: CNH B, Inglês), a ausência destes deve impactar severamente a recomendação.
2. SENIORIDADE: Compare a senioridade exigida com a senioridade estimada do candidato.
3. DEPARTAMENTO: Verifique se a experiência anterior do candidato é relevante para a área da vaga.
4. LOCALIZAÇÃO: Considere se o modelo de trabalho (Remoto/Híbrido/Presencial) e a localização são compatíveis.

PROMPT:
Vaga: {{job_title}}
Departamento: {{job_department}}
Senioridade Exigida: {{job_seniority}}
Localização/Modelo: {{job_location}} ({{job_city}}/{{job_state}})
Faixa Salarial Informada: {{job_salary}}
Descrição da Vaga: {{job_description}}
Requisitos Essenciais: {{job_essential_requirements}}

Candidato: {{candidate_name}}
Resumo Profissional: {{candidate_summary}}
Habilidades Extraídas: {{candidate_skills}}
Análise de Senioridade/Maturidade: {{candidate_seniority}}

Retorne APENAS um JSON seguindo o schema informado.`;

async function getJob(jobId: string) {
    const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .maybeSingle();

    if (error) throw new Error(`Erro ao buscar vaga: ${error.message}`);
    if (!data) throw new Error(`Vaga com ID ${jobId} não encontrada.`);
    return data;
}

async function getCandidatesForJob(jobId: string) {
    // Buscamos em job_applications onde a extração já foi feita
    const { data, error } = await supabase
        .from('job_applications')
        .select('*')
        .eq('job_id', jobId)
        .eq('ai_status', 'DONE');

    if (error) throw new Error(`Erro ao buscar candidatos: ${error.message}`);
    return data;
}

async function runRankingForCandidate(job: any, application: any) {
    console.log(`[Ranking] Analisando Match: ${application.candidate_name} para ${job.title}...`);

    const extraction = application.criteria_evaluation || {};

    let prompt = SYSTEM_PROMPT_RANKING
        .replace('{{job_title}}', job.title)
        .replace('{{job_department}}', job.department || 'Não especificado')
        .replace('{{job_seniority}}', job.seniority || 'Não especificada')
        .replace('{{job_location}}', job.location || 'Não especificado')
        .replace('{{job_city}}', job.location_city || '-')
        .replace('{{job_state}}', job.location_state || '-')
        .replace('{{job_salary}}', job.salary_range || 'A combinar')
        .replace('{{job_description}}', job.description || '')
        .replace('{{job_essential_requirements}}', JSON.stringify(job.essential_requirements || []))
        .replace('{{candidate_name}}', application.candidate_name)
        .replace('{{candidate_summary}}', extraction.resumo_profissional || '')
        .replace('{{candidate_skills}}', JSON.stringify(extraction.top_skills || []))
        .replace('{{candidate_seniority}}', `${extraction.senioridade_estimada} - ${extraction.maturidade_profissional}`);

    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: "Você é um especialista em recrutamento e seleção técnica AI." },
            { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1
    });

    const rawResult = completion.choices[0].message.content;
    if (!rawResult) throw new Error('Resposta vazia da IA');

    const result = RankingSchema.parse(JSON.parse(rawResult));
    log(`   AI Result for ${application.candidate_name}: ${JSON.stringify(result, null, 2)}`);
    return result;
}

async function saveRankingResult(jobId: string, applicationId: any, candidateName: string, result: any) {
    // Como screening_matrix usa candidate_id, precisamos garantir que o candidato exista na tabela candidates
    // Ou adaptar o Agente 1 para inserir em candidates também.
    // Por enquanto, vamos tentar localizar o candidate_id via email ou criar se necessário.

    const { data: appData } = await supabase.from('job_applications').select('candidate_email').eq('id', applicationId).single();
    const email = appData?.candidate_email;

    if (!email) {
        console.warn(`   ⚠️ Candidato ${candidateName} (ID: ${applicationId}) não possui email. Pulando screening_matrix.`);
        return;
    }

    // Busca ou cria candidato na tabela public.candidates
    let { data: candidate } = await supabase.from('candidates').select('id').eq('email', email).maybeSingle();

    if (!candidate) {
        console.log(`   🆕 Criando registro em 'candidates' para ${candidateName}...`);
        const { data: newCand, error } = await supabase.from('candidates').insert({
            name: candidateName,
            email: email,
            job_id: jobId,
            company_id: '00000000-0000-0000-0000-000000000000' // Default ou do job
        }).select('id').single();

        if (error) throw error;
        candidate = newCand;
    }

    // Insere ou atualiza na screening_matrix
    console.log(`   💾 Salvando match no screening_matrix...`);
    const { error: smError } = await supabase.from('screening_matrix').upsert({
        candidate_id: candidate!.id,
        job_id: jobId,
        company_id: '00000000-0000-0000-0000-000000000000',
        semantic_match_score: result.semantic_match_score,
        skills_gap: result.skills_gap,
        matched_skills: result.matched_skills,
        ai_reasoning: result.ai_reasoning,
        strengths: result.strengths,
        weaknesses: result.weaknesses,
        recommendation: result.recommendation,
        auditable_decision_log: {
            model: "gpt-4o-mini",
            analyzed_at: new Date().toISOString(),
            application_id: applicationId
        }
    }, { onConflict: 'candidate_id, job_id' });

    if (smError) throw smError;
}

async function main() {
    const args = process.argv.slice(2);
    const jobIdArg = args.find(arg => arg.startsWith('--job-id='))?.split('=')[1];

    if (!jobIdArg) {
        console.error('❌ Favor fornecer --job-id=<UUID>');
        process.exit(1);
    }

    try {
        const job = await getJob(jobIdArg);
        console.log(`🚀 Iniciando Agente de Ranking para vaga: ${job.title}`);

        const applications = await getCandidatesForJob(jobIdArg);
        console.log(`📋 Encontradas ${applications.length} aplicações extraídas.`);

        const rankingPromises = applications.map(async (app) => {
            try {
                const result = await runRankingForCandidate(job, app);
                await saveRankingResult(jobIdArg, app.id, app.candidate_name, result);
                console.log(`✅ Sucesso: ${app.candidate_name} | Score: ${result.semantic_match_score} | Rec: ${result.recommendation}`);
            } catch (err: any) {
                log(`❌ Erro ao processar match para ${app.candidate_name}: ${err.message}`);
                if (err.stack) log(err.stack);
            }
        });

        await Promise.all(rankingPromises);

        console.log('\n🏁 Processamento concluído.');
    } catch (err: any) {
        log(`❌ Erro global: ${err.message}`);
        if (err.stack) log(err.stack);
        process.exit(1);
    }
}

main();
