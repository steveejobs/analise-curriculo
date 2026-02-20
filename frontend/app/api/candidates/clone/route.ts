
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
    try {
        const { candidateId, jobId } = await req.json()

        if (!candidateId) {
            return NextResponse.json({ error: 'Candidate ID is required' }, { status: 400 })
        }

        if (!supabaseAdmin) {
            return NextResponse.json({ error: 'Supabase Admin client not configured' }, { status: 500 })
        }

        // 1. Fetch the original candidate
        const { data: candidate, error: fetchError } = await supabaseAdmin
            .from('job_applications')
            .select('*')
            .eq('id', candidateId)
            .single()

        if (fetchError || !candidate) {
            return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
        }

        // 2. Prepare cloned data
        const { id, created_at, ...rest } = candidate

        // If a jobId is provided, we want a fresh AI analysis for that specific job
        const isTargetingJob = !!jobId;

        const clonedData = {
            ...rest,
            job_id: jobId || rest.job_id,
            pipeline_status: 'triagem',
            ai_status: isTargetingJob ? 'PENDING' : 'DONE',
            execution_stage: isTargetingJob ? 'STARTING_JOB_ANALYSIS' : 'CLONED_FROM_BANK',
            ai_explanation: isTargetingJob ? 'Iniciando análise específica para a vaga...' : rest.ai_explanation
        }

        // 3. Insert clone
        const { data: clone, error: insertError } = await supabaseAdmin
            .from('job_applications')
            .insert([clonedData])
            .select()
            .single()

        if (insertError) {
            throw insertError
        }

        return NextResponse.json({ success: true, clone })

    } catch (error: any) {
        console.error('Clone API Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
