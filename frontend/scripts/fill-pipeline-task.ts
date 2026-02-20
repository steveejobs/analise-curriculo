import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

async function fillPipeline() {
    console.log('--- INICIANDO PREENCHIMENTO DA PIPELINE ---')

    // 1. Create a Job
    const { data: job, error: jobError } = await supabase
        .from('jobs')
        .insert({
            title: 'Vaga de Teste - Triagem Automática',
            status: 'active',
            description: 'Vaga criada automaticamente para processar candidatos curtidos.'
        })
        .select()
        .single()

    if (jobError) {
        console.error('Erro ao criar vaga:', jobError)
        return
    }

    const targetJobId = job.id
    console.log(`Vaga criada: ${job.title} (${targetJobId})`)

    // 2. Get global "triagem" candidates
    const { data: candidates } = await supabase
        .from('job_applications')
        .select('*')
        .eq('pipeline_status', 'triagem')
        .is('job_id', null)

    if (!candidates || candidates.length === 0) {
        console.log('Nenhum candidato em triagem global encontrado.')
        return
    }

    // 3. Clone candidates to this job
    const clones = candidates.map(c => {
        const { id, created_at, ...rest } = c
        return {
            ...rest,
            job_id: targetJobId,
            pipeline_status: 'triagem'
        }
    })

    console.log(`Clonando ${clones.length} candidatos para a vaga ${job.title}...`)
    const { error: cloneError } = await supabase.from('job_applications').insert(clones)

    if (cloneError) {
        console.error('Erro na clonagem:', cloneError)
    } else {
        console.log('Clonagem concluída com sucesso!')
    }
}

fillPipeline()
