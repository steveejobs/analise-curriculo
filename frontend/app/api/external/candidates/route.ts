import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
    try {
        const apiKey = request.headers.get('x-api-key')

        if (!apiKey) {
            return NextResponse.json({ error: 'Unauthorized: Missing API Key' }, { status: 401 })
        }

        // 1. Validate API Key and get Company Context
        const { data: keyData, error: keyError } = await supabaseAdmin
            .from('company_api_keys')
            .select('company_id')
            .eq('api_key', apiKey)
            .eq('is_active', true)
            .single()

        if (keyError || !keyData) {
            console.error('[External API] Auth Error:', keyError)
            return NextResponse.json({ error: 'Unauthorized: Invalid API Key' }, { status: 401 })
        }

        const companyId = keyData.company_id
        const body = await request.json()
        const { resume_url, text_content, candidate_metadata } = body

        if (!resume_url && !text_content) {
            return NextResponse.json({ error: 'Missing resume_url or text_content' }, { status: 400 })
        }

        // 2. Create Ingestion Log
        const { data: logEntry, error: logError } = await supabaseAdmin
            .from('ingestion_logs')
            .insert({
                company_id: companyId,
                source_type: 'API',
                status: 'RECEIVED',
                details: { ...candidate_metadata, external_url: resume_url }
            })
            .select('id')
            .single()

        if (logError) {
            return NextResponse.json({ error: 'Failed to create ingestion log' }, { status: 500 })
        }

        // 3. Trigger n8n Worker
        const n8nUrl = process.env.N8N_WORKER_WEBHOOK_URL
        if (n8nUrl) {
            fetch(n8nUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    file_url: resume_url,
                    text: text_content || '',
                    company_id: companyId,
                    ingestion_log_id: logEntry.id
                })
            }).catch(err => console.error('[External API] n8n Trigger Error:', err))
        }

        return NextResponse.json({
            success: true,
            message: 'Candidate received and queued for processing',
            ingestion_id: logEntry.id
        }, { status: 202 })

    } catch (error) {
        console.error('[External API] Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
