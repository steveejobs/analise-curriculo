import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

async function clone() {
    console.log('--- CLONANDO CANDIDATOS ---')

    // 1. Get a job to associate with
    const { data: jobs } = await supabase.from('jobs').select('id, title').limit(1)
    if (!jobs || jobs.length === 0) {
        console.error('Nenhuma vaga encontrada para clonagem.')
        return
    }
    const targetJobId = jobs[0].id
    console.log(`Vaga alvo: ${jobs[0].title} (${targetJobId})`)

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

    const clones = candidates.map(c => {
        const { id, created_at, ...rest } = c
        return {
            ...rest,
            job_id: targetJobId,
            pipeline_status: 'triagem'
        }
    })

    console.log(`Clonando ${clones.length} candidatos...`)
    const { error } = await supabase.from('job_applications').insert(clones)

    if (error) {
        console.error('Erro na clonagem:', error)
    } else {
        console.log('Clonagem concluída com sucesso!')
    }
}

clone()
