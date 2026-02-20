
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
    try {
        const { jobId } = await req.json()

        if (!jobId || jobId === 'all') {
            return NextResponse.json({ error: 'Job ID is required' }, { status: 400 })
        }

        if (!supabaseAdmin) {
            return NextResponse.json({ error: 'Supabase Admin client not configured' }, { status: 500 })
        }

        // Update all candidates in this job to PENDING and QUEUED_REANALYSIS
        // We also clear the explanation to show it's starting fresh
        const { data, error } = await supabaseAdmin
            .from('job_applications')
            .update({
                ai_status: 'PENDING',
                execution_stage: 'QUEUED_REANALYSIS',
                ai_explanation: 'Aguardando re-análise específica da vaga...',
                heartbeat: new Date().toISOString()
            })
            .eq('job_id', jobId)
            .select('id')

        if (error) {
            throw error
        }

        return NextResponse.json({
            success: true,
            count: data?.length || 0,
            message: `Re-análise iniciada para ${data?.length || 0} candidatos.`
        })

    } catch (error: any) {
        console.error('Reanalyze API Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
