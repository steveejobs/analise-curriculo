
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { extractText, extractTextFromPdf } from '@/lib/pdf-service'

export async function POST(req: Request) {
    try {
        if (!supabaseAdmin) {
            console.error('[Batch Analysis] supabaseAdmin não inicializado (chave hiante?)')
            return NextResponse.json({ error: 'Erro interno: Configuração de servidor incompleta.' }, { status: 500 })
        }

        const { jobId, companyId, files, analysisMode = 'normal' } = await req.json()

        if (!files || !Array.isArray(files) || files.length === 0) {
            return NextResponse.json({ error: 'No files provided' }, { status: 400 })
        }

        console.log(`[Batch Analysis] Iniciando processamento de ${files.length} arquivos para Job ID: ${jobId}`)

        // 1. Processar arquivos em paralelo
        const processedFiles = await Promise.all(files.map(async (file: any) => {
            try {
                // Baixar arquivo do Supabase Storage
                const { data: fileBlob, error: downloadError } = await supabaseAdmin
                    .storage
                    .from('resumes')
                    .download(file.path)

                if (downloadError || !fileBlob) {
                    console.error(`[Batch] Erro ao baixar arquivo ${file.path}:`, downloadError)
                    return { ...file, error: 'Download failed', text: '' }
                }

                // Extrair texto
                const arrayBuffer = await fileBlob.arrayBuffer()
                const buffer = Buffer.from(arrayBuffer)
                const text = await extractText(buffer, file.name)

                // Atualizar status no banco para indicar que extração foi feita
                const { error: updateError } = await supabaseAdmin
                    .from('job_applications')
                    .update({
                        ai_status: 'EXTRACTED', // Status intermediário
                        audit_log: [{
                            action: 'BATCH_EXTRACT_SUCCESS',
                            timestamp: new Date().toISOString(),
                            details: 'Texto extraído via API Batch'
                        }]
                    })
                    .eq('id', file.id)

                if (updateError) {
                    console.error(`[Batch] Erro ao atualizar status EXTRACTED:`, updateError)
                    // Non-fatal, continue
                }

                return {
                    applicationId: file.id,
                    candidateName: file.name.replace(/\.[^/.]+$/, ""), // Remove extensão
                    resumeText: text,
                    resumeUrl: file.publicUrl
                }
            } catch (err: any) {
                console.error(`[Batch] Falha no processamento do arquivo ${file.id}:`, err)

                // IMPORTANT: Update status to ERROR immediately so UI stops loading
                // Wrap in try-catch to prevent double-crash
                try {
                    await supabaseAdmin
                        .from('job_applications')
                        .update({
                            ai_status: 'ERROR',
                            ai_explanation: `Falha no download/extração: ${err.message || 'Erro desconhecido'}`, // Descriptive error
                            audit_log: [{
                                action: 'BATCH_EXTRACT_ERROR',
                                timestamp: new Date().toISOString(),
                                details: err.message
                            }]
                        })
                        .eq('id', file.id)
                } catch (dbErr) {
                    console.error('[Batch] Falha crítica ao salvar erro no banco:', dbErr)
                }

                return { ...file, error: err.message || 'Extraction failed', text: '' }
            }
        }))

        // Filtrar apenas os sucessos para envio ao AI Agent
        const validApplications = processedFiles.filter(f => !f.error && f.resumeText && f.resumeText.length > 0) // Allow short text if valid
        // Errors are already handled in the loop above (status updated to ERROR)
        const errors = processedFiles.filter(f => f.error)

        // Se houver erros, atualizar status desses (já feito no catch, mas reforçando se vazou)
        // ... (removed redundant error update key) ...

        if (validApplications.length === 0 && errors.length > 0) {
            return NextResponse.json({
                success: false,
                message: 'Nenhum arquivo pôde ser processado com sucesso.',
                errors
            }, { status: 400 }) // Return 400, not 500, with JSON
        }

        // 2. O n8n foi substituído pelo AI Agent (scripts/ai-agent.ts)
        // O robô detecta automaticamente as linhas com status 'EXTRACTED'
        console.log(`[Batch] ✅ Processamento finalizado. O Agente IA assumirá daqui.`)
        console.log(`[Batch] ========================================`)


        return NextResponse.json({
            success: true,
            message: `Enviados ${validApplications.length} candidatos para análise.`,
            processed: validApplications.length,
            errors: errors // Retornar o array completo para o frontend processar
        })

    } catch (error: any) {
        console.error('[Batch Analysis] Erro fatal:', error)
        return NextResponse.json({ error: error.message || 'Erro interno no servidor' }, { status: 500 })
    }
}
