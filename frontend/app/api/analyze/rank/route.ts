import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import OpenAI from 'openai'
import { z } from 'zod'

// Schema for Ranking Output (sync with ranking-agent.ts)
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

function getOpenAIClient(): OpenAI {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error('OPENAI_API_KEY não configurada nas variáveis de ambiente.');
    }
    return new OpenAI({ apiKey });
}

export async function POST(req: Request) {
    try {
        if (!supabaseAdmin) {
            return NextResponse.json({ error: 'Supabase Admin not configured' }, { status: 500 })
        }

        const { jobId } = await req.json()

        if (!jobId) {
            return NextResponse.json({ error: 'Job ID is required' }, { status: 400 })
        }

        // 1. Fetch Job
        const { data: job, error: jobError } = await supabaseAdmin
            .from('jobs')
            .select('*')
            .eq('id', jobId)
            .single()

        if (jobError || !job) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 })
        }

        // 2. Fetch Candidates (must be processed by Agent 1 first)
        const { data: applications, error: appsError } = await supabaseAdmin
            .from('job_applications')
            .select('*')
            .eq('job_id', jobId)
            .eq('ai_status', 'DONE')

        if (appsError) {
            throw appsError
        }

        if (!applications || applications.length === 0) {
            return NextResponse.json({ success: true, message: 'Nenhum candidato processado encontrado para esta vaga.' })
        }

        const openai = getOpenAIClient()

        // 3. Process each candidate
        const results = await Promise.allSettled(applications.map(async (app) => {
            const extraction = app.criteria_evaluation || {};

            const prompt = SYSTEM_PROMPT_RANKING
                .replace('{{job_title}}', job.title || '')
                .replace('{{job_department}}', job.department || 'Não especificado')
                .replace('{{job_seniority}}', job.seniority || 'Não especificada')
                .replace('{{job_location}}', job.location || 'Não especificado')
                .replace('{{job_city}}', job.location_city || '-')
                .replace('{{job_state}}', job.location_state || '-')
                .replace('{{job_salary}}', job.salary_range || 'A combinar')
                .replace('{{job_description}}', job.requirements || job.description || '') // Use requirements field if available
                .replace('{{job_essential_requirements}}', JSON.stringify(job.essential_requirements || []))
                .replace('{{candidate_name}}', app.candidate_name)
                .replace('{{candidate_summary}}', extraction.professional_summary || extraction.resumo_profissional || '')
                .replace('{{candidate_skills}}', JSON.stringify(extraction.top_skills || []))
                .replace('{{candidate_seniority}}', `${extraction.estimated_seniority || extraction.senioridade_estimada} - ${extraction.professional_maturity || extraction.maturidade_profissional}`);

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

            const rankingResult = RankingSchema.parse(JSON.parse(rawResult));

            // 4. Save to screening_matrix
            // Find or create candidate in 'candidates' table first (to satisfy FKEY in screening_matrix)
            let candidateId = null;
            const { data: existingCandidate } = await supabaseAdmin
                .from('candidates')
                .select('id')
                .eq('email', app.candidate_email)
                .maybeSingle();

            if (existingCandidate) {
                candidateId = existingCandidate.id;
            } else {
                const { data: newCand, error: candError } = await supabaseAdmin
                    .from('candidates')
                    .insert({
                        name: app.candidate_name,
                        email: app.candidate_email,
                        job_id: jobId,
                        company_id: job.company_id
                    })
                    .select('id')
                    .single();

                if (candError) throw candError;
                candidateId = newCand.id;
            }

            // Save match result
            const { error: smError } = await supabaseAdmin.from('screening_matrix').upsert({
                candidate_id: candidateId,
                job_id: jobId,
                company_id: job.company_id,
                semantic_match_score: rankingResult.semantic_match_score,
                skills_gap: rankingResult.skills_gap,
                matched_skills: rankingResult.matched_skills,
                ai_reasoning: rankingResult.ai_reasoning,
                strengths: rankingResult.strengths,
                weaknesses: rankingResult.weaknesses,
                recommendation: rankingResult.recommendation,
                auditable_decision_log: {
                    model: "gpt-4o-mini",
                    analyzed_at: new Date().toISOString(),
                    application_id: app.id
                }
            }, { onConflict: 'candidate_id, job_id' });

            if (smError) throw smError;

            return { candidate: app.candidate_name, score: rankingResult.semantic_match_score };
        }));

        const successes = results.filter(r => r.status === 'fulfilled').length
        const errors = results.filter(r => r.status === 'rejected').length

        return NextResponse.json({
            success: true,
            processed: successes,
            errors: errors,
            message: `${successes} candidatos ranqueados com sucesso.`
        })

    } catch (error: any) {
        console.error('Rank API Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
