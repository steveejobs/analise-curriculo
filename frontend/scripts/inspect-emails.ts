import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

async function inspectEmails() {
    console.log('--- INSPECCIONANDO EMAILS ---')
    const { data: triagem } = await supabase
        .from('job_applications')
        .select('id, candidate_name, candidate_email, email, job_id, pipeline_status')
        .eq('pipeline_status', 'triagem')

    if (!triagem || triagem.length === 0) {
        console.log('Nenhum candidato em triagem encontrado.')
        return
    }

    console.table(triagem)
}

inspectEmails()
