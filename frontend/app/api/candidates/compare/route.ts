import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import OpenAI from 'openai';

const getOpenAI = () => new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(req: Request) {
    try {
        const openai = getOpenAI();
        const { jobId } = await req.json();

        if (!jobId) {
            return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
        }

        // 1. Fetch Job Details
        const { data: job, error: jobError } = await supabaseAdmin
            .from('jobs')
            .select('title, description, requirements')
            .eq('id', jobId)
            .single();

        if (jobError || !job) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 });
        }

        // 2. Fetch Candidates for this job with analysis DONE
        const { data: candidates, error: candidatesError } = await supabaseAdmin
            .from('job_applications')
            .select('id, candidate_name, criteria_evaluation, ai_score, classification')
            .eq('job_id', jobId)
            .eq('ai_status', 'DONE');

        if (candidatesError) {
            return NextResponse.json({ error: 'Error fetching candidates' }, { status: 500 });
        }

        if (!candidates || candidates.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No analyzed candidates found for this job.',
                data: null
            });
        }

        // 3. Prepare data for AGENTE 2
        const candidatesProfile = candidates.map((c: any) => ({
            id: c.id,
            name: c.candidate_name || 'Candidato Sem Nome',
            analysis: c.criteria_evaluation || {}
        }));

        const systemPrompt = `Você é o AGENTE 2: Especialista em Seleção e Match de Talentos.
Sua missão é comparar os candidatos abaixo com base na vaga fornecida e identificar o melhor perfil.

VAGA:
Título: ${job.title}
Descrição: ${job.description}
Requisitos: ${job.requirements}

DIRETRIZES DE AVALIAÇÃO:
1. ADERÊNCIA TÉCNICA: O quanto as skills comprovadas batem com os requisitos.
2. ALINHAMENTO CULTURAL: Baseado na descrição e tom da vaga.
3. EVIDÊNCIAS REAIS: Valorize quem tem métricas e resultados claros. Discursos vagos reduzem a pontuação.
4. SENIORIDADE: Verifique se o nível está compatível com a expectativa da vaga.

REGRAS ESTREITAS:
- Não confunda discurso com evidência.
- Se requisitos obrigatórios estiverem ausentes, sinalize.
- Seja objetivo, crítico e justificável.

FORMATO DE SAÍDA (JSON APENAS):
{
  "ranking": [
    {
      "candidate_id": "string",
      "candidate_name": "string",
      "match_geral_percent": number (0-100),
      "match_tecnico": "Explicação curta",
      "match_cultural": "Explicação curta",
      "evidencias_principais": ["Evidência 1", "Evidência 2"],
      "requisitos_faltantes": ["Requisito X", "Requisito Y"],
      "riscos_contratacao": ["Risco 1"],
      "recomendacao": "Aprovado | Entrevistar | Reserva | Reprovado",
      "perguntas_validacao": ["Pergunta 1", "Pergunta 2"]
    }
  ],
  "melhor_candidato": {
      "id": "string",
      "nome": "string",
      "por_que_e_o_melhor": "Justificativa detalhada",
      "pontos_atencao": ["Ponto 1", "Ponto 2"]
  }
}`;

        const userContent = `Candidatos Analisados:\n${JSON.stringify(candidatesProfile, null, 2)}`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userContent }
            ],
            response_format: { type: "json_object" },
            temperature: 0.2
        });

        const result = JSON.parse(completion.choices[0].message.content || '{}');

        return NextResponse.json({
            success: true,
            data: result
        });

    } catch (error: any) {
        console.error('[Candidate Comparison] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
