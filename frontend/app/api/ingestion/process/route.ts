import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File | null
        const text = formData.get('text') as string | null
        const companyId = formData.get('company_id') as string
        const sourceType = formData.get('source_type') as string

        if (!companyId || !sourceType) {
            return NextResponse.json({ error: 'Missing defined parameters' }, { status: 400 })
        }

        if (!file && !text) {
            return NextResponse.json({ error: 'No file or text provided' }, { status: 400 })
        }

        // --- START: EXTRACT TEXT FROM FILE ---
        let extractedText = text || '';

        if (file && !extractedText) {
            try {
                const arrayBuffer = await file.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                const { extractText } = await import('@/lib/pdf-service'); // Lazy import to avoid issues if any
                extractedText = await extractText(buffer, file.name);
            } catch (extractError) {
                console.error('[Ingestion] Text Extraction Error:', extractError);
                extractedText = `[EXTRACTION_ERROR] Falha ao extrair texto do arquivo ${file.name}.`;
            }
        }
        // --- END: EXTRACT TEXT FROM FILE ---

        // 1. Upload File to Supabase Storage if present
        let fileUrl = null
        let externalRef = null

        if (file) {
            const fileName = `${companyId}/${crypto.randomUUID()}-${file.name}`
            const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
                .from('raw_resumes')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                })

            if (uploadError) {
                console.error('[Ingestion] Storage Error:', uploadError)
                return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
            }

            // Get Public URL
            const { data: publicUrlData } = supabaseAdmin.storage
                .from('raw_resumes')
                .getPublicUrl(uploadData.path)

            fileUrl = publicUrlData.publicUrl
            externalRef = uploadData.path
        }

        // 2. Create Ingestion Log in Database
        const { data: logEntry, error: logError } = await supabaseAdmin
            .from('ingestion_logs')
            .insert({
                company_id: companyId,
                source_type: sourceType,
                status: 'RECEIVED',
                external_reference_id: externalRef,
                details: { fileName: file?.name || 'text_input' }
            })
            .select('id')
            .single()

        if (logError) {
            console.error('[Ingestion] Database Error:', logError)
            return NextResponse.json({ error: 'Failed to create ingestion log' }, { status: 500 })
        }

        // 3. Insert into job_applications so AI Agent can process it
        const { data: applicationEntry, error: appError } = await supabaseAdmin
            .from('job_applications')
            .insert({
                company_id: companyId,
                candidate_name: file ? file.name.split('.')[0] : 'Candidato Desconhecido',
                resume_url: fileUrl,
                ai_status: 'PENDING',
                source_type: sourceType,
                ai_explanation: 'Aguardando processamento...'
            })
            .select('id')
            .single()

        if (appError) {
            console.error('[Ingestion] Job Application Insert Error:', appError)
            // Non-fatal, but logged
        }

        console.log(`[Ingestion] ✅ Log criado. O Agente IA processará o ID: ${applicationEntry?.id || 'N/A'}`)

        return NextResponse.json({
            success: true,
            ingestion_id: logEntry.id,
            message: 'Processamento iniciado pelo Agente IA'
        }, { status: 202 })

    } catch (error) {
        console.error('[Ingestion] Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

