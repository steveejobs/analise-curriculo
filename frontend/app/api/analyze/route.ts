import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
    try {
        const { applicationId, analysisMode = 'normal' } = await req.json()

        // 1. Fetch Application Data
        const { data: application, error: fetchError } = await supabaseAdmin
            .from('job_applications')
            .select('*')
            .eq('id', applicationId)
            .single()

        if (fetchError || !application) {
            throw new Error('Application found not found.')
        }

        // 2. Download & Extract Text (Server-Side)
        let resumeText = ''

        // Extract path from public URL
        // e.g. .../resumes/bulk/abc.pdf -> bulk/abc.pdf
        const publicUrl = application.resume_url
        let storagePath = ''
        if (publicUrl.includes('/resumes/')) {
            storagePath = publicUrl.split('/resumes/').pop() || ''
        }

        if (storagePath) {
            const { data: fileBlob, error: downloadError } = await supabaseAdmin
                .storage
                .from('resumes')
                .download(storagePath)

            if (fileBlob) {
                const arrayBuffer = await fileBlob.arrayBuffer()
                const buffer = Buffer.from(arrayBuffer)

                // Dynamic Import to avoid cold start issues
                const { extractTextFromPdf } = await import('@/lib/pdf-service')
                resumeText = await extractTextFromPdf(buffer)
            }
        }

        if (!resumeText || resumeText.length < 50) {
            console.warn(`[TEXT-EXTRACTION] Texto muito curto ou vazio para AppID: ${applicationId}`)
            resumeText = "Texto não pôde ser extraído ou arquivo é imagem."
        }

        // 3. Update Status to PENDING
        // O script `scripts/ai-agent.ts` está rodando em background e observando o status 'PENDING', 'QUEUED_N8N', etc.
        const { error: updateError } = await supabaseAdmin.from('job_applications').update({
            ai_status: 'PENDING',
            analysis_mode: analysisMode,
            audit_log: [{
                action: 'MANUAL_ANALYSIS_START',
                timestamp: new Date().toISOString(),
                details: `Análise reiniciada via Agente IA nativo (Modo: ${analysisMode}).`
            }]
        }).eq('id', applicationId)

        if (updateError) {
            throw new Error(`Erro ao atualizar status: ${updateError.message}`)
        }

        console.log('✅ Candidato enviado para fila do Agente IA:', { applicationId, analysisMode })

        return NextResponse.json({
            success: true,
            message: 'Análise iniciada e sendo processada em segundo plano.',
            data: {
                applicationId,
                status: 'PENDING',
                ai_status: 'PENDING'
            }
        })

    } catch (err: any) {
        console.error('Falha na orquestração:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
