import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '' // Use anon key to test what the frontend sees

const supabase = createClient(supabaseUrl, supabaseKey)

async function verify() {
    console.log('--- VERIFICANDO ESQUEMA ---')
    // Tentando selecionar a coluna is_discarded
    const { data, error } = await supabase
        .from('job_applications')
        .select('id, is_discarded')
        .limit(1)

    if (error) {
        console.error('Erro ao acessar a coluna is_discarded:', error.message)
        if (error.message.includes('column "is_discarded" does not exist')) {
            console.log('CONFIRMADO: A coluna is_discarded NÃO existe no banco de dados.')
        }
    } else {
        console.log('SUCESSO: A coluna is_discarded EXISTE.')
        console.log('Amostra:', data)
    }

    const { data: candidates } = await supabase
        .from('job_applications')
        .select('id, candidate_name, pipeline_status, job_id')
        .eq('pipeline_status', 'triagem')

    console.log('Candidatos com status "triagem":', candidates?.length || 0)
    if (candidates && candidates.length > 0) {
        console.table(candidates)
    }
}

verify()
