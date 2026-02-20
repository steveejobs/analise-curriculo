import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { company_id, ingestion_log_id, data } = body

        // 1. Enforce Lineage
        if (!company_id || !ingestion_log_id) {
            return NextResponse.json({ error: 'Missing company_id or ingestion_log_id' }, { status: 400 })
        }

        if (!data) {
            return NextResponse.json({ error: 'Missing candidate data' }, { status: 400 })
        }

        // 2. Insert Candidate into Database
        const { data: candidate, error: candidateError } = await supabaseAdmin
            .from('candidates')
            .insert({
                company_id,
                name: data.name,
                email: data.email,
                resume_url: data.resume_url,
                ai_score: data.ai_score,
                priority: data.priority,
                status: data.status || 'NEW',
                analysis: data.analysis,
                confidence: data.confidence
            })
            .select('id')
            .single()

        if (candidateError) {
            console.error('[Webhook] Candidate Insertion Error:', candidateError)

            // Update Log to ERROR
            await supabaseAdmin
                .from('ingestion_logs')
                .update({ status: 'ERROR', details: { error: candidateError.message } })
                .eq('id', ingestion_log_id)

            return NextResponse.json({ error: 'Failed to save candidate' }, { status: 500 })
        }

        // 3. Update Ingestion Log to SUCCESS
        await supabaseAdmin
            .from('ingestion_logs')
            .update({
                status: 'SUCCESS',
                details: {
                    candidate_id: candidate.id,
                    processed_at: new Date().toISOString()
                }
            })
            .eq('id', ingestion_log_id)

        return NextResponse.json({
            success: true,
            candidate_id: candidate.id,
            message: 'Candidate processed and persisted successfully'
        }, { status: 200 })

    } catch (error) {
        console.error('[Webhook] Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

