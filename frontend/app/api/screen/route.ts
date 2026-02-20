import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
    try {
        const { applicationId } = await req.json()

        // 1. Buscar candidatura e critérios da vaga
        const { data: application, error: appError } = await supabaseAdmin
            .from('job_applications')
            .select('*, jobs(*)')
            .eq('id', applicationId)
            .single()

        if (appError || !application) {
            return NextResponse.json({ error: 'Candidatura não encontrada' }, { status: 404 })
        }

        const job = application.jobs
        const criteria = job.recruitment_criteria || []

        // 2. Lógica de Agente de IA com Critérios Eliminatórios (Módulo D)
        let totalScore = 0
        let disqualified = false
        const evaluation: Record<string, any> = {}

        criteria.forEach((c: string) => {
            // Verifica se o critério é eliminatório (ex: "Inglês (Obrigatório)")
            const isEliminatory = c.toLowerCase().includes('obrigatório') || c.toLowerCase().includes('eliminatório')

            const match = Math.random() > 0.3 // Simulação
            evaluation[c] = match ? 'ADERE' : 'NÃO ADERE'

            if (isEliminatory && !match) {
                disqualified = true
            }

            if (match) {
                totalScore += (100 / criteria.length)
            }
        })

        const finalScore = disqualified ? 0 : Math.round(totalScore)

        let explanation = `O candidato apresenta aderência em ${Object.values(evaluation).filter(v => v === 'ADERE').length} de ${criteria.length} critérios técnicos.`

        if (disqualified) {
            explanation = `⚠️ REPROVADO AUTOMATICAMENTE: O candidato não atende a critérios eliminatórios obrigatórios definidos para a vaga.`
        } else {
            explanation += ` Destaque para: ${criteria.filter((c: string) => evaluation[c] === 'ADERE').join(', ')}.`
        }

        // 3. Atualizar candidatura
        const { error: updateError } = await supabaseAdmin
            .from('job_applications')
            .update({
                ai_score: finalScore,
                ai_status: disqualified ? 'REJECTED' : (finalScore > 75 ? 'OFFERED' : 'SCREENING'),
                ai_explanation: explanation,
                criteria_evaluation: evaluation
            })
            .eq('id', applicationId)

        if (updateError) throw updateError

        return NextResponse.json({
            success: true,
            score: finalScore,
            explanation
        })

    } catch (error: any) {
        console.error('Erro na triagem IA:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
