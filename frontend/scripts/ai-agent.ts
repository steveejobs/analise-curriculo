
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import { extractText } from '../lib/pdf-service';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

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

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Utility for retrying async operations with exponential backoff.
 */
async function withRetry<T>(fn: () => Promise<T>, retries = 3, minDelay = 1000): Promise<T> {
    try {
        return await fn();
    } catch (error: any) {
        if (retries <= 0) throw error;
        const sleepTime = minDelay * (4 - retries); // Growing delay: 1s, 2s, 3s
        console.warn(`   ⚠️ Retrying after error: ${error.message || 'Unknown'}. Attempts left: ${retries}`);
        await delay(sleepTime);
        return withRetry(fn, retries - 1, minDelay);
    }
}

const PROMPT_VERSION = '2.3-FIX-PRECISION'; // structural fixes and structural scoring logic

/**
 * Generates a SHA-256 hash of the input text for duplicate detection.
 * Includes prompt version to force re-analysis when logic changes.
 */
function generateTextHash(text: string): string {
    return crypto.createHash('sha256').update(text.trim() + PROMPT_VERSION).digest('hex');
}

// Interfaces
interface JobApplication {
    id: string;
    candidate_name: string;
    candidate_email: string;
    resume_url: string;
    job_id: string | null;
    ai_status: string;
    heartbeat?: string;
    criteria_evaluation?: any;
    execution_stage?: string;
}

interface AnalysisConfig {
    match_threshold: number;
    hard_skills: any;
    soft_skills: any;
    leadership: any;
    risk_analysis: any;
    blind_screening: boolean;
}


// AGENTE 0 — Filtro de Documentos (Economia de Tokens e Limpeza)
const SYSTEM_PROMPT_AGENT_0 = `Você é o AGENTE 0: Filtro de Documentos.
Sua única tarefa é identificar se o arquivo/texto fornecido pertence a um currículo (resume/CV) de um candidato real.

DENEGUE IMEDIATAMENTE (is_resume: false):
- Contratos (Aluguel, Prestação de Serviço, Trabalho, etc).
- Faturas, Notas Fiscais ou Boletos.
- Manuais de Instrução ou Documentação Técnica de Software.
- Portfólios de Design que contenham apenas imagens ou projetos sem dados do candidato.
- Livros, Artigos Acadêmicos (a menos que o autor seja o candidato e o doc seja o CV dele).
- Qualquer documento que não tenha como objetivo principal apresentar um candidato para uma vaga de emprego.

Retorne APENAS um JSON:
{
  "is_resume": boolean,
  "justification": "Breve explicação clara do porquê aceitou ou rejeitou"
}`;

import { z } from 'zod';

// Schema v1.2 - Relaxed for robustness
const AnalysisSchema = z.object({
    schema_version: z.literal('1.2').default('1.2'),
    candidate_name: z.string().default('Candidato não identificado'),
    candidate_email: z.string().email().optional().or(z.literal('')).or(z.null()).default(''),
    candidate_phone: z.string().optional().or(z.literal('')).or(z.null()).default(''),
    candidate_location: z.string().optional().or(z.literal('')).default(''),
    role_archetype: z.string().default('outros'),
    briefing_category: z.string().default('Operacional'),
    extraction_quality: z.string().default('medium'),
    analysis_confidence: z.string().default('Média'),
    source_detected: z.string().default('Upload'),
    top_skills: z.array(z.string()).default([]),
    missing_sections: z.array(z.string()).default([]),
    professional_summary: z.string().default(''),
    estimated_seniority: z.string().default('Júnior'),
    professional_maturity: z.string().default('Iniciante'),
    base_scores: z.object({
        tecnica: z.number().min(0).max(100).default(50),
        cultura: z.number().min(0).max(100).default(50),
        performance: z.number().min(0).max(100).default(50),
        maturidade: z.number().min(0).max(100).default(50)
    }).default({ tecnica: 50, cultura: 50, performance: 50, maturidade: 50 }),
    confidence_by_dimension: z.object({
        tecnica: z.number().min(0).max(100).default(50),
        cultura: z.number().min(0).max(100).default(50),
        performance: z.number().min(0).max(100).default(50),
        maturidade: z.number().min(0).max(100).default(50)
    }).default({ tecnica: 50, cultura: 50, performance: 50, maturidade: 50 }),
    detailed_rationale: z.object({
        tecnica: z.string().default(''),
        cultura: z.string().default(''),
        performance: z.string().default(''),
        maturidade: z.string().default('')
    }).default({ tecnica: '', cultura: '', performance: '', maturidade: '' }),
    caps_applied: z.array(z.object({
        dimension: z.string(),
        cap_value: z.number(),
        reason: z.string()
    })).default([]),
    technical_capacity: z.object({
        evidencias_comprovadas: z.array(z.string()).default([]),
        evidencias_contextuais: z.array(z.string()).default([]),
        conhecimento_declarado: z.array(z.string()).default([])
    }).default({ evidencias_comprovadas: [], evidencias_contextuais: [], conhecimento_declarado: [] }),
    behavioral_profile: z.object({
        comportamentos_comprovados: z.array(z.string()).default([]),
        sinais_indiretos: z.array(z.string()).default([]),
        autoafirmacoes: z.array(z.string()).default([])
    }).default({ comportamentos_comprovados: [], sinais_indiretos: [], autoafirmacoes: [] }),
    identified_differentials: z.array(z.object({
        item: z.string(),
        por_que_importa: z.string(),
        impacto: z.enum(['alto', 'médio', 'baixo']),
        evidencias: z.array(z.string()).optional()
    })).default([]),
    real_gaps: z.array(z.string()).default([]),
    detailed_experience: z.array(z.object({
        empresa: z.string(),
        cargo: z.string(),
        periodo: z.string(),
        conquistas: z.array(z.string())
    })).default([]),
    identified_risks: z.array(z.object({
        tipo: z.string(),
        detalhe: z.string()
    })).default([]),
    interview_questions: z.array(z.string()).default([]),
    consolidated_rationale: z.string().default('')
});

/**
 * Função centralizada para cálculo de Match Global
 * Respeita limites de 15% a 85% para o peso da cultura
 */
function calculateMatch(tecnica: number, cultura: number, weightCultura: number = 0.5): number {
    const wc = Math.max(0.15, Math.min(0.85, weightCultura));
    const wt = 1 - wc;
    return Math.round((tecnica * wt) + (cultura * wc));
}

/**
 * Atualiza o sinal de vida e o estágio de execução do agente para um candidato.
 * Mantém o sistema responsivo e permite monitorar o progresso.
 */
async function updateHeartbeat(appId: string, stage: string, extraData: any = {}) {
    try {
        const payload: any = {
            heartbeat: new Date().toISOString(),
            execution_stage: stage,
            ...extraData
        };
        const { error } = await supabase.from('job_applications').update(payload).eq('id', appId);

        if (error && error.code === '42703') {
            // Ignora silenciosamente ou loga apenas uma vez se a coluna não existir
        } else if (error) {
            console.error(`   ⚠️ Erro ao atualizar heartbeat (${stage}):`, error.message);
        }
    } catch (e) {
        // console.error(`   ⚠️ Erro crítico no heartbeat (${stage})`);
    }
}

/**
 * Tenta extrair informações básicas usando Regex em casos de PDF ruim.
 */
function extractBasicWithRegex(text: string) {
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
    const emailMatch = text.match(emailRegex);
    const email = emailMatch ? emailMatch[0].toLowerCase() : null;

    // Heurística simples para nome: primeira linha não vazia que não seja email/tel/url
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2);
    let name = null;
    for (const line of lines.slice(0, 5)) {
        if (!line.includes('@') && !/^\d+$/.test(line.replace(/[\s-()]/g, '')) && line.split(' ').length > 1) {
            name = line;
            break;
        }
    }

    return { name, email };
}

/**
 * Recupera aplicações que ficaram em "ANALYZING" por muito tempo.
 */
async function recoverStuckApplications() {
    const STUCK_THRESHOLD_MINUTES = 5;
    const stuckTime = new Date(Date.now() - STUCK_THRESHOLD_MINUTES * 60 * 1000).toISOString();

    // Busca candidatos travados (ANALYZING sem heartbeat recente)
    const { data: stuckApps, error } = await supabase
        .from('job_applications')
        .select('id, candidate_name')
        .eq('ai_status', 'ANALYZING')
        .lt('heartbeat', stuckTime);

    if (error) {
        console.error('❌ Erro ao buscar processos travados:', error.message);
        return;
    }

    if (stuckApps && stuckApps.length > 0) {
        console.log(`\n🔄 [RECOVERY] Detectadas ${stuckApps.length} aplicações travadas...`);
        for (const app of stuckApps) {
            console.log(`   - Resetando: ${app.id} (${app.candidate_name || 'Desconhecido'})`);
            try {
                await supabase.from('job_applications').update({
                    ai_status: 'PENDING',
                    execution_stage: 'RECOVERED_STUCK',
                    heartbeat: null
                }).eq('id', app.id);
            } catch (e) { }
        }
    }
}


const SYSTEM_PROMPT_AGENT_1 = (context: string, config: AnalysisConfig) => `Você é um Analista de Recrutamento Executivo (Headhunter) Senior. Sua função é auditar o currículo e fornecer um arquivo JSON estruturado com o Match Score.

### MISSÃO CRÍTICA:
1. **NOME DO CANDIDATO**: Extraia o nome PRÓPRIO completo (ex: "João Silva"). 
   - NUNCA use o nome da vaga, cargo (ex: "Desenvolvedor"), área (ex: "Marketing") ou "Candidato não identificado" se houver um nome no texto.
   - Se o texto começar com algo como "Análise de Marketing" ou "Vaga X", ignore essas tags e busque o nome real da pessoa.
   - O nome costuma estar no topo do documento.
2. **TOP SKILLS (TAGS)**: Preencha obrigatoriamente o campo 'top_skills' com 5 a 10 palavras-chave (skills técnicas ou comportamentais). Isso é o que gera as tags visuais no sistema.
3. **SCORE VARIÁVEL**: Não dê a mesma nota para todos. Seja criterioso:
   - Valorize premiações e honrarias como evidência de elite (85+).
   - Diferencie o potencial de um Jovem Aprendiz da entrega de um Sênior.
   - Aplique as deduções se os dados forem genéricos.

========================
TABELA DE PONTUAÇÃO (v2.3)
========================
Inicie em 0 e some pontos por:
- [+40] Evidências concretas de resultados (números, projetos reais).
- [+30] Premiações, promoções ou reconhecimentos de destaque (Crucial!).
- [+20] Formação acadêmica sólida ou técnica compatível.
- [+10] Apresentação profissional e clareza.

Deduza (-15 a -25) se houver apenas "Buzzwords" sem contexto ou falta de clareza nas responsabilidades.

========================
FORMATO DE RESPOSTA OBRIGATÓRIO (JSON V1.2)
========================
Você deve retornar APENAS o JSON seguindo exatamente esta estrutura:
{
  "schema_version": "1.2",
  "candidate_name": "Nome Real do Candidato",
  "candidate_email": "email@exemplo.com",
  "candidate_phone": "telefone",
  "candidate_location": "Cidade/UF",
  "role_archetype": "vendas|engenharia|marketing|operacional|gestao|outros",
  "top_skills": ["Skill 1", "Skill 2", "Skill 3", "Tag X", "Tag Y"],
  "professional_summary": "Breve resumo crítico",
  "estimated_seniority": "Estagiário|Júnior|Pleno|Sênior|Especialista",
  "base_scores": {
    "tecnica": 0-100,
    "cultura": 0-100,
    "performance": 0-100,
    "maturidade": 0-100
  },
  "technical_capacity": {
    "evidencias_comprovadas": ["o que ele realmente provou"],
    "evidencias_contextuais": ["indícios de competência"],
    "conhecimento_declarado": ["o que ele apenas diz saber"]
  },
  "consolidated_rationale": "Sua análise final crítica em Português. Comece pelos diferenciais ou premiações."
}

NUNCA retorne texto fora do JSON. Nunca deixe campos vazios se puder extraí-los.
`;








/**
 * Process a single job application.
 */
async function processApplication(app: JobApplication) {
    const currentAppId = app.id;
    try {
        console.log(`\n[CLAIM] 📄 Processando: ${app.id} (${app.candidate_name || 'Desconhecido'})`);

        // 3. Fetch Job Details
        await updateHeartbeat(app.id, 'FETCHING_JOB');
        let jobTitle = 'Análise Geral';
        let jobDescription = 'Avaliação de perfil geral.';
        let jobRequirements = 'Boa comunicação e experiência relevante.';
        // @ts-ignore
        let analysisConfig: AnalysisConfig = {};
        let isTalentPool = false;
        const analysisMode = app.criteria_evaluation?.analysis_mode || 'normal';

        if (app.job_id) {
            const { data: job }: any = await withRetry(async () => await supabase
                .from('jobs')
                .select('title, description, requirements, analysis_config')
                .eq('id', app.job_id!)
                .single());

            if (job) {
                jobTitle = job.title;
                jobDescription = job.description || jobDescription;
                jobRequirements = job.requirements || jobRequirements;
                if (job.analysis_config) analysisConfig = job.analysis_config as AnalysisConfig;
            }
        } else {
            isTalentPool = true;
            console.log(`   ℹ️ Talent Pool Analysis active.`);
        }

        // 4. Download & Extract
        await updateHeartbeat(app.id, 'EXTRACTING');
        let resumeText = '';
        if (app.resume_url) {
            try {
                let buffer: Buffer | null = null;
                const url = app.resume_url;
                let bucketName = 'resumes';
                let filePath = '';

                if (url.includes('/resumes/')) {
                    bucketName = 'resumes';
                    filePath = url.split('/resumes/')[1];
                } else if (url.includes('/raw_resumes/')) {
                    bucketName = 'raw_resumes';
                    filePath = url.split('/raw_resumes/')[1];
                } else {
                    filePath = url.split('/').pop() || '';
                }
                filePath = filePath.split('?')[0];

                const { data: downloadedData } = await withRetry(() => supabase.storage.from(bucketName).download(filePath));

                if (downloadedData) {
                    buffer = Buffer.from(await downloadedData.arrayBuffer());
                } else {
                    const response = await withRetry(() => fetch(url));
                    if (response.ok) buffer = Buffer.from(await response.arrayBuffer());
                }

                if (buffer) {
                    const filename = url.split('/').pop() || 'resume.pdf';
                    console.log(`   [PDF] Iniciando extração de texto...`);
                    resumeText = await extractText(buffer, filename);
                    console.log(`   [PDF] ✅ Extração concluída. Tamanho: ${resumeText.length} caracteres.`);
                }
            } catch (e: any) {
                console.error('   [PDF] ❌ Erro de Download/Extração:', e.message);
            }
        }

        // 5. Robust Extraction Heuristics & Early Saving
        let extractionQuality = 'high';
        if (resumeText.length < 150) {
            console.log(`   ⚠️ Document too short or unreadable. Attempting heuristics...`);
            extractionQuality = 'low';
            const basic = extractBasicWithRegex(resumeText);

            if (basic.name || basic.email) {
                console.log(`   💡 Found basic info via Regex: ${basic.name} | ${basic.email}`);
                await withRetry(async () => await supabase.from('job_applications').update({
                    candidate_name: basic.name || app.candidate_name,
                    candidate_email: basic.email || app.candidate_email,
                    extraction_quality: 'low'
                }).eq('id', app.id));
            }

            if (resumeText.length < 50) {
                console.log(`   🚫 Document is completely unreadable. Deleting...`);
                await withRetry(async () => await supabase.from('job_applications').delete().eq('id', app.id));
                return;
            }
        }

        // --- DUPLICATE & CACHE DETECTION ---
        const textHash = generateTextHash(resumeText);
        const shouldBypassCache = ['QUEUED_REANALYSIS', 'STARTING_JOB_ANALYSIS'].includes(app.execution_stage || '');

        // 1. Check for Exact text match in same job (Cache)
        if (app.job_id && !shouldBypassCache) {
            const { data: existingAnalysis }: any = await withRetry(async () => await supabase
                .from('job_applications')
                .select('criteria_evaluation, ai_score, ai_explanation, ai_tokens_input, ai_tokens_output, ai_tokens_total, ai_cost')
                .eq('job_id', app.job_id!)
                .eq('resume_hash', textHash)
                .eq('ai_status', 'DONE')
                .contains('criteria_evaluation', { analysis_mode: analysisMode })
                .limit(1)
                .maybeSingle());

            if (existingAnalysis) {
                console.log(`   ♻️ [CACHE] Reusing existing analysis for identical resume hash.`);
                await withRetry(async () => await supabase.from('job_applications').update({
                    ...existingAnalysis,
                    ai_status: 'DONE',
                    execution_stage: 'DONE_CACHED',
                    heartbeat: new Date().toISOString()
                } as any).eq('id', app.id));
                return;
            }
        }

        await updateHeartbeat(app.id, 'VALIDATING', { extraction_quality: extractionQuality, resume_hash: textHash });

        console.log(`   🛡️ AGENTE 0: Validating document type...`);
        const guardCompletion = await withRetry(() => openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: SYSTEM_PROMPT_AGENT_0 },
                { role: "user", content: `Documento: \n${resumeText.substring(0, 3000)} ` }
            ],
            response_format: { type: "json_object" }
        }));

        const guardResult = JSON.parse(guardCompletion.choices[0].message.content || '{}');

        if (!guardResult.is_resume) {
            console.log(`   [GUARD] 🚫 REJEITADO: ${guardResult.justification}. Deletando...`);
            await withRetry(async () => await supabase.from('job_applications').delete().eq('id', app.id));
            return;
        }

        // 6. Agent 1 (Analysis v1.2) - Using gpt-4o-mini as requested
        await updateHeartbeat(app.id, 'ANALYZING');
        console.log(`   [ANALYSIS] 🧠 Iniciando Análise Profunda v1.2 (gpt-4o-mini)...`);
        const jobContext = isTalentPool
            ? "CONTEXTO: Banco de Talento (Análise de Perfil Profissional)"
            : `CONTEXTO: Vaga Específica\nTITULO: "${jobTitle}"\nDESCRIÇÃO: "${jobDescription}"\nREQUISITOS: "${jobRequirements}"`;

        const completion = await withRetry(() => openai.chat.completions.create({
            model: "gpt-4o-mini", // Model choice
            messages: [
                { role: "system", content: SYSTEM_PROMPT_AGENT_1(jobContext, analysisConfig) },
                { role: "user", content: `Candidato: ${app.candidate_name || 'Desconhecido'} \nTexto: \n${resumeText.substring(0, 15000)} ` }
            ],
            response_format: { type: "json_object" },
            temperature: 0.3
        }));

        const rawResult = completion.choices[0].message.content;
        if (!rawResult) throw new Error('Empty AI response');

        const parsedResult = JSON.parse(rawResult);
        const validation = AnalysisSchema.safeParse(parsedResult);

        if (!validation.success) {
            const errorMsg = `Schema mismatch: ${validation.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')}`;
            console.error('   ❌ Schema v1.2 Validation Failed:', errorMsg);
            throw new Error(errorMsg);
        }

        const result = validation.data;
        const weightCultura = 0.5;
        let matchGlobal = calculateMatch(result.base_scores.tecnica, result.base_scores.cultura, weightCultura);

        // --- RATIONALE CONSOLIDATION ---
        let consolidatedRationale = result.consolidated_rationale;

        // 7. Costs and Tokens (gpt-4o-mini prices)
        const inputTokens = (guardCompletion.usage?.prompt_tokens || 0) + (completion.usage?.prompt_tokens || 0);
        const outputTokens = (guardCompletion.usage?.completion_tokens || 0) + (completion.usage?.completion_tokens || 0);

        // gpt-4o-mini prices: $0.15 / 1M input, $0.60 / 1M output
        const cost = (inputTokens * 0.15 / 1e6) + (outputTokens * 0.60 / 1e6);

        // 8. Update DB
        await updateHeartbeat(app.id, 'SAVING_RESULTS');
        console.log(`   [SAVE] 💾 Salvando resultados no banco de dados...`);
        const updatePayload: any = {
            ai_score: matchGlobal,
            ai_explanation: consolidatedRationale,
            criteria_evaluation: {
                ...result,
                analysis_mode: analysisMode,
                consolidated_rationale: consolidatedRationale,
                match_global: matchGlobal,
                weights_used: { tecnica: 0.5, cultura: 0.5 }
            },
            ai_status: 'DONE',
            ai_tokens_input: inputTokens,
            ai_tokens_output: outputTokens,
            ai_tokens_total: inputTokens + outputTokens,
            ai_cost: cost,
            execution_stage: 'DONE',
            resume_hash: textHash,
            heartbeat: new Date().toISOString()
        };

        // Intelligent Name/Email Update
        if (result.candidate_name && result.candidate_name !== 'Candidato não identificado') {
            if (!app.candidate_name || app.candidate_name.length < result.candidate_name.length || app.candidate_name.includes('.')) {
                updatePayload.candidate_name = result.candidate_name;
            }
        }
        if (result.candidate_email && result.candidate_email.includes('@') && (!app.candidate_email || !app.candidate_email.includes('@'))) {
            updatePayload.candidate_email = result.candidate_email;
        }

        const { error: finalError } = await withRetry(() => supabase.from('job_applications').update(updatePayload).eq('id', app.id));

        if (finalError) {
            if ((finalError as any).code === '42703') {
                console.log(`   [SAVE] ⚠️ Algumas colunas do schema v1.2 não existem no DB. Salvando dados básicos...`);
                // Tenta salvar apenas o essencial se colunas falharem
                const fallbackPayload = {
                    ai_score: updatePayload.ai_score,
                    ai_explanation: updatePayload.ai_explanation,
                    criteria_evaluation: updatePayload.criteria_evaluation,
                    ai_status: 'DONE'
                };
                await withRetry(async () => await supabase.from('job_applications').update(fallbackPayload as any).eq('id', app.id));
            } else {
                console.error(`   [SAVE] ❌ Erro ao salvar:`, (finalError as any).message);
            }
        }

        console.log(`   [SAVE] ✅ CONCLUÍDO: Match ${matchGlobal}% | Candidato: ${updatePayload.candidate_name || app.candidate_name}`);

    } catch (err: any) {
        console.error(`❌ Error processing ${app.id}: `, err.message);
        try {
            await withRetry(async () => {
                await supabase.from('job_applications').update({
                    ai_status: 'ERROR',
                    ai_explanation: `Erro no processamento: ${err.message}`,
                    execution_stage: 'ERROR'
                }).eq('id', app.id);
            });
        } catch (updateErr) {
            console.error('   ❌ Failed to record error status in DB');
        }
    }
}

async function main() {
    console.log('🤖 AI Agent Started (v1.2 + Dynamic Worker Pool). Polling for pending applications...');

    let lastRecoveryCheck = 0;
    const CONCURRENCY_LIMIT = 10;
    let activeTasks = 0;

    // Helper to claim applications atomically
    async function claimBatch(limit: number): Promise<JobApplication[]> {
        const { data: applications, error: fetchError } = await supabase
            .from('job_applications')
            .select('id, candidate_name, candidate_email, resume_url, job_id, ai_status, execution_stage')
            .in('ai_status', ['PENDING', 'QUEUED_N8N', 'EXTRACTED', 'NEW', 'UPLOADING'])
            .order('created_at', { ascending: true })
            .limit(limit * 2);

        if (fetchError) throw fetchError;
        if (!applications || applications.length === 0) return [];

        const claimedApps: JobApplication[] = [];
        for (const candidate of applications) {
            if (claimedApps.length >= limit) break;

            const { data: claimed, error: claimError } = await supabase
                .from('job_applications')
                .update({
                    ai_status: 'ANALYZING',
                    processing_started_at: new Date().toISOString(),
                    heartbeat: new Date().toISOString(),
                    // Preserve useful stages like QUEUED_REANALYSIS or STARTING_JOB_ANALYSIS
                    execution_stage: ['QUEUED_REANALYSIS', 'STARTING_JOB_ANALYSIS'].includes(candidate.execution_stage)
                        ? candidate.execution_stage
                        : 'STARTING'
                })
                .eq('id', candidate.id)
                .in('ai_status', ['PENDING', 'QUEUED_N8N', 'EXTRACTED', 'NEW', 'UPLOADING'])
                .select()
                .single();

            if (!claimError && claimed) {
                claimedApps.push(claimed as JobApplication);
            }
        }
        return claimedApps;
    }

    while (true) {
        try {
            // 0. Periodic Recovery check (every 1 minute)
            if (Date.now() - lastRecoveryCheck > 60000) {
                await recoverStuckApplications();
                lastRecoveryCheck = Date.now();
            }

            // 1. Maintain Concurrency Pool
            if (activeTasks < CONCURRENCY_LIMIT) {
                const spaceAvailable = CONCURRENCY_LIMIT - activeTasks;
                const claimed = await claimBatch(spaceAvailable);

                if (claimed.length > 0) {
                    console.log(`\n[POOL] Adicionando ${claimed.length} novos candidatos. Ativos: ${activeTasks + claimed.length}/${CONCURRENCY_LIMIT}`);

                    claimed.forEach(app => {
                        activeTasks++;
                        processApplication(app).finally(() => {
                            activeTasks--;
                        });
                    });
                }
            }

            // 2. Adaptive Delay
            if (activeTasks === 0) {
                const { count } = await supabase.from('job_applications').select('*', { count: 'exact', head: true });
                process.stdout.write(`\r[IDLE] Aguardando novas aplicações... (Total no DB: ${count || 0})`);
                await delay(2000);
            } else if (activeTasks < CONCURRENCY_LIMIT) {
                // Se ainda há espaço, mas não encontramos nada no DB, esperamos um pouco
                await delay(2000);
            } else {
                // Pool cheio, espera um pouco para checar novamente
                process.stdout.write(`\r[FULL] Pool de processamento cheio (${activeTasks}/${CONCURRENCY_LIMIT}). Aguardando...`);
                await delay(1000);
            }

        } catch (err: any) {
            console.error(`❌ Global Loop Error: `, err.message);
            await delay(10000);
        }
    }
}

main().catch(err => {
    console.error('❌ Fatal Error:', err);
    process.exit(1);
});

