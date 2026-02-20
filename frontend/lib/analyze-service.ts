import OpenAI from 'openai';
import { z } from 'zod';
import crypto from 'crypto';

// ============================================================
// CLIENTE OPENAI (inicializado sob demanda para evitar erros de build)
// ============================================================
function getOpenAIClient(): OpenAI {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error('OPENAI_API_KEY não configurada nas variáveis de ambiente.');
    }
    return new OpenAI({ apiKey });
}

// ============================================================
// CONSTANTES
// ============================================================
const PROMPT_VERSION = '2.3-FIX-PRECISION';

// ============================================================
// SCHEMAS
// ============================================================
export const AnalysisSchema = z.object({
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
        maturidade: z.number().min(0).max(100).default(50),
    }).default({ tecnica: 50, cultura: 50, performance: 50, maturidade: 50 }),
    confidence_by_dimension: z.object({
        tecnica: z.number().min(0).max(100).default(50),
        cultura: z.number().min(0).max(100).default(50),
        performance: z.number().min(0).max(100).default(50),
        maturidade: z.number().min(0).max(100).default(50),
    }).default({ tecnica: 50, cultura: 50, performance: 50, maturidade: 50 }),
    detailed_rationale: z.object({
        tecnica: z.string().default(''),
        cultura: z.string().default(''),
        performance: z.string().default(''),
        maturidade: z.string().default(''),
    }).default({ tecnica: '', cultura: '', performance: '', maturidade: '' }),
    caps_applied: z.array(z.object({
        dimension: z.string(),
        cap_value: z.number(),
        reason: z.string(),
    })).default([]),
    technical_capacity: z.object({
        evidencias_comprovadas: z.array(z.string()).default([]),
        evidencias_contextuais: z.array(z.string()).default([]),
        conhecimento_declarado: z.array(z.string()).default([]),
    }).default({ evidencias_comprovadas: [], evidencias_contextuais: [], conhecimento_declarado: [] }),
    behavioral_profile: z.object({
        comportamentos_comprovados: z.array(z.string()).default([]),
        sinais_indiretos: z.array(z.string()).default([]),
        autoafirmacoes: z.array(z.string()).default([]),
    }).default({ comportamentos_comprovados: [], sinais_indiretos: [], autoafirmacoes: [] }),
    identified_differentials: z.array(z.object({
        item: z.string(),
        por_que_importa: z.string(),
        impacto: z.enum(['alto', 'médio', 'baixo']),
        evidencias: z.array(z.string()).optional(),
    })).default([]),
    real_gaps: z.array(z.string()).default([]),
    detailed_experience: z.array(z.object({
        empresa: z.string(),
        cargo: z.string(),
        periodo: z.string(),
        conquistas: z.array(z.string()),
    })).default([]),
    identified_risks: z.array(z.object({
        tipo: z.string(),
        detalhe: z.string(),
    })).default([]),
    interview_questions: z.array(z.string()).default([]),
    consolidated_rationale: z.string().default(''),
});

// ============================================================
// PROMPTS
// ============================================================
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

function SYSTEM_PROMPT_AGENT_1(context: string): string {
    return `Você é um Analista de Recrutamento Executivo (Headhunter) Senior. Sua função é auditar o currículo e fornecer um arquivo JSON estruturado com o Match Score.

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

${context}`;
}

// ============================================================
// UTILITÁRIOS
// ============================================================
function generateTextHash(text: string): string {
    return crypto.createHash('sha256').update(text.trim() + PROMPT_VERSION).digest('hex');
}

function calculateMatch(tecnica: number, cultura: number, weightCultura: number = 0.5): number {
    const wc = Math.max(0.15, Math.min(0.85, weightCultura));
    const wt = 1 - wc;
    return Math.round((tecnica * wt) + (cultura * wc));
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function withRetry<T>(fn: () => Promise<T>, retries = 3, minDelay = 1000): Promise<T> {
    try {
        return await fn();
    } catch (error: any) {
        if (retries <= 0) throw error;
        const sleepTime = minDelay * (4 - retries);
        console.warn(`   ⚠️ [ANALYZE] Retrying after error: ${error.message || 'Unknown'}. Attempts left: ${retries}`);
        await delay(sleepTime);
        return withRetry(fn, retries - 1, minDelay);
    }
}

// ============================================================
// INTERFACE DO RESULTADO
// ============================================================
export interface AnalyzeResult {
    success: boolean;
    applicationId: string;
    candidateName?: string;
    matchScore?: number;
    updatePayload?: Record<string, any>;
    error?: string;
    deleted?: boolean; // true se o documento não era um currículo
}

// ============================================================
// FUNÇÃO PRINCIPAL DE ANÁLISE
// ============================================================
export async function analyzeResume(
    applicationId: string,
    resumeText: string,
    options: {
        candidateName?: string;
        candidateEmail?: string;
        jobId?: string | null;
        jobTitle?: string;
        jobDescription?: string;
        jobRequirements?: string;
        analysisMode?: string;
    } = {}
): Promise<AnalyzeResult> {
    const openai = getOpenAIClient();

    const {
        candidateName = 'Desconhecido',
        candidateEmail = '',
        jobId = null,
        jobTitle = 'Análise Geral',
        jobDescription = 'Avaliação de perfil geral.',
        jobRequirements = 'Boa comunicação e experiência relevante.',
        analysisMode = 'normal',
    } = options;

    const textHash = generateTextHash(resumeText);

    try {
        // ── AGENTE 0: Filtro de documento ──────────────────────────
        console.log(`   [ANALYZE] 🛡️ Agente 0: Validando documento para ${applicationId}...`);
        const guardCompletion = await withRetry(() => openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT_AGENT_0 },
                { role: 'user', content: `Documento: \n${resumeText.substring(0, 3000)}` },
            ],
            response_format: { type: 'json_object' },
        }));

        const guardResult = JSON.parse(guardCompletion.choices[0].message.content || '{}');

        if (!guardResult.is_resume) {
            console.log(`   [ANALYZE] 🚫 NÃO é currículo: ${guardResult.justification}. Marcando como inválido...`);
            return {
                success: false,
                applicationId,
                deleted: true,
                error: `Documento rejeitado: ${guardResult.justification}`,
            };
        }

        console.log(`   [ANALYZE] ✅ É um currículo válido. Iniciando análise profunda...`);

        // ── AGENTE 1: Análise Profunda ─────────────────────────────
        const isTalentPool = !jobId;
        const jobContext = isTalentPool
            ? 'CONTEXTO: Banco de Talento (Análise de Perfil Profissional)'
            : `CONTEXTO: Vaga Específica\nTITULO: "${jobTitle}"\nDESCRIÇÃO: "${jobDescription}"\nREQUISITOS: "${jobRequirements}"`;

        const completion = await withRetry(() => openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT_AGENT_1(jobContext) },
                { role: 'user', content: `Candidato: ${candidateName}\nTexto:\n${resumeText.substring(0, 15000)}` },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.3,
        }));

        const rawResult = completion.choices[0].message.content;
        if (!rawResult) throw new Error('Resposta vazia da OpenAI');

        const parsedResult = JSON.parse(rawResult);
        const validation = AnalysisSchema.safeParse(parsedResult);

        if (!validation.success) {
            const errorMsg = `Schema inválido: ${validation.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')}`;
            console.error('   [ANALYZE] ❌ Falha na validação do schema:', errorMsg);
            throw new Error(errorMsg);
        }

        const result = validation.data;
        const matchGlobal = calculateMatch(result.base_scores.tecnica, result.base_scores.cultura, 0.5);

        // Calcular custo
        const inputTokens = (guardCompletion.usage?.prompt_tokens || 0) + (completion.usage?.prompt_tokens || 0);
        const outputTokens = (guardCompletion.usage?.completion_tokens || 0) + (completion.usage?.completion_tokens || 0);
        const cost = (inputTokens * 0.15 / 1e6) + (outputTokens * 0.60 / 1e6);

        const updatePayload: Record<string, any> = {
            ai_score: matchGlobal,
            ai_explanation: result.consolidated_rationale,
            criteria_evaluation: {
                ...result,
                analysis_mode: analysisMode,
                consolidated_rationale: result.consolidated_rationale,
                match_global: matchGlobal,
                weights_used: { tecnica: 0.5, cultura: 0.5 },
            },
            ai_status: 'DONE',
            ai_tokens_input: inputTokens,
            ai_tokens_output: outputTokens,
            ai_tokens_total: inputTokens + outputTokens,
            ai_cost: cost,
            execution_stage: 'DONE',
            resume_hash: textHash,
            heartbeat: new Date().toISOString(),
        };

        // Atualizar nome/email se a IA detectou melhor
        if (result.candidate_name && result.candidate_name !== 'Candidato não identificado') {
            if (!candidateName || candidateName.length < result.candidate_name.length || candidateName.includes('.')) {
                updatePayload.candidate_name = result.candidate_name;
            }
        }
        if (result.candidate_email && result.candidate_email.includes('@') && (!candidateEmail || !candidateEmail.includes('@'))) {
            updatePayload.candidate_email = result.candidate_email;
        }

        console.log(`   [ANALYZE] 💾 Concluído! Match: ${matchGlobal}% | Candidato: ${updatePayload.candidate_name || candidateName}`);

        return {
            success: true,
            applicationId,
            candidateName: updatePayload.candidate_name || candidateName,
            matchScore: matchGlobal,
            updatePayload,
        };

    } catch (err: any) {
        console.error(`   [ANALYZE] ❌ Erro ao analisar ${applicationId}:`, err.message);
        return {
            success: false,
            applicationId,
            error: err.message || 'Erro desconhecido na análise',
        };
    }
}
