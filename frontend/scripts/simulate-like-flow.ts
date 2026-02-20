import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

async function simulateLike() {
    console.log('--- SIMULANDO LIKE ---')

    // 1. Encontrar um candidato 'new' ou sem status de triagem
    const { data: candidates } = await supabase
        .from('job_applications')
        .select('id, candidate_name')
        .neq('pipeline_status', 'triagem')
        .limit(1)

    if (!candidates || candidates.length === 0) {
        console.log('Nenhum candidato disponível para testar LIKE.')
        return
    }

    const testId = candidates[0].id
    console.log(`Testando LIKE no candidato: ${candidates[0].candidate_name} (${testId})`)

    // 2. Aplicar o UPDATE igual ao do componente CandidateCard
    const { error: updateError } = await supabase
        .from('job_applications')
        .update({
            pipeline_status: 'triagem',
            ai_status: 'DONE'
        })
        .eq('id', testId)

    if (updateError) {
        console.error('Erro no UPDATE:', updateError.message)
        return
    }
    console.log('Update realizado com sucesso.')

    // 3. Verificar se ele aparece na query do Pup Line (Todas as Vagas)
    const { data: allData } = await supabase
        .from('job_applications')
        .select('id, candidate_name')
        .eq('pipeline_status', 'triagem')

    const foundAll = allData?.find(c => c.id === testId)
    console.log(`Aparece em 'Todas as Vagas'? ${foundAll ? 'SIM' : 'NÃO'}`)

    // 4. Verificar se ele aparece na query de uma vaga específica
    const { data: jobs } = await supabase.from('jobs').select('id').limit(1)
    if (jobs && jobs.length > 0) {
        const jobId = jobs[0].id
        const { data: jobData } = await supabase
            .from('job_applications')
            .select('id, candidate_name')
            .or(`job_id.eq.${jobId},and(job_id.is.null,pipeline_status.eq.triagem)`)

        const foundJob = jobData?.find(c => c.id === testId)
        console.log(`Aparece na visão da vaga ${jobId}? ${foundJob ? 'SIM' : 'NÃO'}`)
    }
}

simulateLike()
