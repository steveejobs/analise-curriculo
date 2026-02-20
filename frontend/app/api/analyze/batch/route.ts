import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { extractText } from '@/lib/pdf-service'
import { analyzeResume } from '@/lib/analyze-service'

export async function POST(req: Request) {
    try {
        if (!supabaseAdmin) {
            console.error('[Batch Analysis] supabaseAdmin não inicializado (chave ausente?)')
            return NextResponse.json({ error: 'Erro interno: Configuração de servidor incompleta.' }, { status: 500 })
        }

        const { jobId, companyId, files, analysisMode = 'normal' } = await req.json()

        if (!files || !Array.isArray(files) || files.length === 0) {
            return NextResponse.json({ error: 'No files provided' }, { status: 400 })
        }

        console.log(`[Batch Analysis] Iniciando processamento de ${files.length} arquivo(s). JobID: ${jobId || 'Banco de Talentos'}`)

        // ── FASE 1: Extrair texto dos PDFs em paralelo ──────────────
        const extractedFiles = await Promise.all(files.map(async (file: any) => {
            try {
                const { data: fileBlob, error: downloadError } = await supabaseAdmin
                    .storage
                    .from('resumes')
                    .download(file.path)

                if (downloadError || !fileBlob) {
                    console.error(`[Batch] Erro ao baixar ${file.path}:`, downloadError?.message)
                    await supabaseAdmin.from('job_applications').update({
                        ai_status: 'ERROR',
                        ai_explanation: `Falha no download: ${downloadError?.message || 'Erro desconhecido'}`,
                    }).eq('id', file.id)
                    return { ...file, error: 'Download failed' }
                }

                const arrayBuffer = await fileBlob.arrayBuffer()
                const buffer = Buffer.from(arrayBuffer)
                const text = await extractText(buffer, file.name)

                console.log(`[Batch] ✅ Texto extraído: ${file.name} (${text.length} chars)`)

                return {
                    applicationId: file.id,
                    candidateName: file.name.replace(/\.[^/.]+$/, ''),
                    resumeText: text,
                    resumeUrl: file.publicUrl,
                }
            } catch (err: any) {
                console.error(`[Batch] Falha na extração de ${file.id}:`, err.message)
                try {
                    await supabaseAdmin.from('job_applications').update({
                        ai_status: 'ERROR',
                        ai_explanation: `Falha na extração: ${err.message || 'Erro desconhecido'}`,
                    }).eq('id', file.id)
                } catch { }
                return { ...file, error: err.message }
            }
        }))

        const validFiles = extractedFiles.filter(f => !f.error && f.resumeText && f.resumeText.length > 0)
        const extractErrors = extractedFiles.filter(f => f.error)

        if (validFiles.length === 0) {
            return NextResponse.json({
                success: false,
                message: 'Nenhum arquivo pôde ser processado.',
                errors: extractErrors,
            }, { status: 400 })
        }

        // ── FASE 2: Buscar dados da vaga (se houver) ───────────────
        let jobTitle = 'Análise Geral'
        let jobDescription = 'Avaliação de perfil geral.'
        let jobRequirements = 'Boa comunicação e experiência relevante.'

        if (jobId) {
            const { data: job } = await supabaseAdmin
                .from('jobs')
                .select('title, description, requirements')
                .eq('id', jobId)
                .single()

            if (job) {
                jobTitle = job.title || jobTitle
                jobDescription = job.description || jobDescription
                jobRequirements = job.requirements || jobRequirements
            }
        }

        // ── FASE 3: Análise OpenAI para cada candidato ─────────────
        console.log(`[Batch] 🤖 Iniciando análise IA para ${validFiles.length} candidato(s)...`)

        const analysisResults = await Promise.allSettled(
            validFiles.map(async (file: any) => {
                // Marcar como "analisando" antes de começar
                await supabaseAdmin.from('job_applications').update({
                    ai_status: 'ANALYZING',
                    execution_stage: 'STARTING',
                    heartbeat: new Date().toISOString(),
                }).eq('id', file.applicationId)

                const result = await analyzeResume(file.applicationId, file.resumeText, {
                    candidateName: file.candidateName,
                    jobId: jobId || null,
                    jobTitle,
                    jobDescription,
                    jobRequirements,
                    analysisMode,
                })

                if (result.success && result.updatePayload) {
                    // Salvar resultado no banco
                    const { error: saveError } = await supabaseAdmin
                        .from('job_applications')
                        .update(result.updatePayload)
                        .eq('id', file.applicationId)

                    if (saveError) {
                        // Fallback: salvar apenas o essencial
                        console.warn(`[Batch] Fallback save para ${file.applicationId}:`, saveError.message)
                        await supabaseAdmin.from('job_applications').update({
                            ai_score: result.updatePayload.ai_score,
                            ai_explanation: result.updatePayload.ai_explanation,
                            criteria_evaluation: result.updatePayload.criteria_evaluation,
                            ai_status: 'DONE',
                        }).eq('id', file.applicationId)
                    }
                } else if (result.deleted) {
                    // Documento não era currículo — deletar
                    await supabaseAdmin.from('job_applications').delete().eq('id', file.applicationId)
                } else {
                    // Erro na análise
                    await supabaseAdmin.from('job_applications').update({
                        ai_status: 'ERROR',
                        ai_explanation: result.error || 'Erro na análise IA',
                        execution_stage: 'ERROR',
                    }).eq('id', file.applicationId)
                }

                return result
            })
        )

        // Contabilizar resultados
        const successes = analysisResults.filter(r => r.status === 'fulfilled' && (r.value as any).success).length
        const aiErrors = analysisResults.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !(r.value as any).success)).length

        console.log(`[Batch] ✅ Concluído! Sucesso: ${successes} | Erros IA: ${aiErrors} | Erros Extração: ${extractErrors.length}`)

        return NextResponse.json({
            success: true,
            message: `${successes} candidato(s) analisados com sucesso.`,
            processed: successes,
            errors: [...extractErrors, ...analysisResults
                .filter(r => r.status === 'fulfilled' && !(r.value as any).success)
                .map(r => (r as any).value)
            ],
        })

    } catch (error: any) {
        console.error('[Batch Analysis] Erro fatal:', error)
        return NextResponse.json({ error: error.message || 'Erro interno no servidor' }, { status: 500 })
    }
}
