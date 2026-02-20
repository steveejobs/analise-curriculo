import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

async function testQuery() {
    console.log('--- TESTANDO QUERY COMPLEXA ---')

    // Supondo que temos pelo menos uma vaga. Vamos pegar o ID da primeira.
    const { data: jobs } = await supabase.from('jobs').select('id').limit(1)
    const selectedJob = jobs?.[0]?.id || '00000000-0000-0000-0000-000000000000'

    console.log(`Testando com Job ID: ${selectedJob}`)

    try {
        const { data, error } = await supabase
            .from('job_applications')
            .select('id, candidate_name, job_id, pipeline_status')
            .or(`job_id.eq.${selectedJob},and(job_id.is.null,pipeline_status.eq.triagem)`)
            .limit(10)

        if (error) {
            console.error('ERRO NA QUERY:', error.message)
            console.error('Detalhes:', error)
            return
        }

        console.log(`Sucesso! Encontrados ${data?.length || 0} registros.`)
        console.table(data)
    } catch (err: any) {
        console.error('EXCEÇÃO:', err.message)
    }
}

testQuery()
