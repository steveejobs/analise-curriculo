import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
    console.log('Iniciando checagem...')
    const { data: candidates, error } = await supabase
        .from('job_applications')
        .select('id, candidate_name, pipeline_status, job_id, ai_status')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Erro detalhado:', JSON.stringify(error, null, 2))
        return
    }

    console.log(`Total de candidatos encontrados: ${candidates?.length || 0}`)

    candidates?.forEach(c => {
        console.log(`ID: ${c.id} | Nome: ${c.candidate_name} | Status: ${c.pipeline_status} | Job: ${c.job_id}`)
    })

    const triagem = candidates?.filter(c => c.pipeline_status === 'triagem')
    console.log(`\nCandidatos em 'triagem': ${triagem?.length || 0}`)
}

check()
