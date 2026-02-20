
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import OpenAI from 'openai';

const getOpenAI = () => new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: Request) {
    try {
        const openai = getOpenAI();
        const { candidateId } = await request.json();

        if (!candidateId) {
            return NextResponse.json({ error: 'Missing candidateId' }, { status: 400 });
        }

        // 1. Fetch Candidate Data
        const { data: candidate, error: dbError } = await supabaseAdmin
            .from('job_applications')
            .select('*')
            .eq('id', candidateId)
            .single();

        if (dbError || !candidate) {
            console.error('Error fetching candidate:', dbError);
            return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
        }

        // 2. Fetch Job Details (if applicable)
        let jobContext = '';
        if (candidate.job_id) {
            const { data: job } = await supabaseAdmin
                .from('jobs')
                .select('title, description')
                .eq('id', candidate.job_id)
                .single();
            if (job) {
                jobContext = `Vaga: ${job.title}\nDescrição: ${job.description}`;
            }
        }

        // 3. Generate Proposal with OpenAI
        const systemPrompt = `Você é um Recrutador Sênior. Gere uma proposta de contato (e-mail) para o candidato.
        
        Contexto do Candidato:
        Nome: ${candidate.candidate_name}
        Score: ${candidate.ai_score}
        Status da Análise: ${candidate.criteria_evaluation?.classification || 'N/A'}
        Pontos Fortes: ${candidate.criteria_evaluation?.soft_skills_analysis?.evidence || 'N/A'}
        
        ${jobContext}

        Se o score for alto (>70), convide para entrevista técnica.
        Se for médio (50-69), peça mais informações ou portfólio.
        Se for baixo (<50) ou inválido, gere um e-mail educado de rejeição (agradecendo o interesse).
        
        O tom deve ser profissional, empático e direto.
        Retorne APENAS o texto do e-mail.`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: "Gere a proposta." }
            ],
            temperature: 0.7
        });

        const proposalText = completion.choices[0].message.content;

        return NextResponse.json({
            success: true,
            proposal: proposalText
        });

    } catch (error: any) {
        console.error('Error generating proposal:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
