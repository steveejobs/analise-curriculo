
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function DELETE() {
    try {
        if (!supabaseAdmin) {
            return NextResponse.json({ error: 'Configuração de servidor incompleta (Admin Key ausente).' }, { status: 500 })
        }

        console.log('[Delete All] Iniciando exclusão completa...')

        // 1. Listar todos os arquivos no bucket 'resumes' (se possível)
        // Como o Supabase Storage API de listagem pode ser paginado e lento,
        // vamos usar o banco de dados para encontrar os caminhos dos arquivos.

        // Pega todos os candidatos com resume_url
        const { data: candidates, error: fetchError } = await supabaseAdmin
            .from('job_applications')
            .select('resume_url')
            .not('resume_url', 'is', null)

        if (fetchError) {
            throw fetchError
        }

        const stats = {
            db_deleted: 0,
            storage_deleted: 0,
            errors: 0
        }

        // 2. Excluir arquivos do Storage
        if (candidates && candidates.length > 0) {
            const filesToDelete: string[] = []

            for (const c of candidates) {
                if (!c.resume_url) continue;

                // Extrair path
                // Ex: https://.../storage/v1/object/public/resumes/bulk/xyz.pdf
                // Path: bulk/xyz.pdf
                try {
                    const url = c.resume_url
                    let path = ''
                    if (url.includes('/resumes/')) {
                        path = url.split('/resumes/')[1]
                    } else if (url.includes('/public/')) {
                        // Fallback generic
                        const parts = url.split('/')
                        path = parts[parts.length - 1]
                    }

                    if (path) {
                        // Remove queries
                        path = path.split('?')[0]
                        filesToDelete.push(path)
                    }
                } catch (e) {
                    console.warn('Erro ao extrair path:', c.resume_url)
                }
            }

            // Batch delete (max 1000 per call usually, but we'll try all)
            // Se houver muitos, ideal seria chunkar. Vamos fazer chunks de 100.
            const chunkSize = 100
            for (let i = 0; i < filesToDelete.length; i += chunkSize) {
                const chunk = filesToDelete.slice(i, i + chunkSize)
                const { error: storageError } = await supabaseAdmin
                    .storage
                    .from('resumes')
                    .remove(chunk)

                if (storageError) {
                    console.error('[Delete All] Erro ao excluir chunk do storage:', storageError)
                    stats.errors++
                } else {
                    stats.storage_deleted += chunk.length
                }
            }
        }

        // 3. Limpar Banco de Dados
        // Excluir todos exceto o ID 0 (placeholder se existir)
        const { count, error: deleteError } = await supabaseAdmin
            .from('job_applications')
            .delete({ count: 'exact' })
            .neq('id', '00000000-0000-0000-0000-000000000000')

        if (deleteError) throw deleteError

        stats.db_deleted = count || 0

        console.log('[Delete All] Concluído:', stats)

        return NextResponse.json({
            success: true,
            message: 'Limpeza concluída.',
            stats
        })

    } catch (error: any) {
        console.error('[Delete All] Erro fatal:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
