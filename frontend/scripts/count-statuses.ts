import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

async function countStatuses() {
    console.log('--- CONTAGEM DE STATUS ---')
    const { data: candidates, error } = await supabase
        .from('job_applications')
        .select('pipeline_status')

    if (error) {
        console.error('Erro:', error)
        return
    }

    const counts: Record<string, number> = {}
    candidates?.forEach(c => {
        const s = c.pipeline_status || 'null/vazio'
        counts[s] = (counts[s] || 0) + 1
    })

    console.log('Total de candidatos:', candidates?.length || 0)
    console.log('Distribuição de status:', counts)
}

countStatuses()
