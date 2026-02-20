import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

async function debug() {
    console.log('--- DEBUG CANDIDATOS ---')
    const { data: candidates, error } = await supabase
        .from('job_applications')
        .select('id, candidate_name, pipeline_status, is_discarded, job_id, ai_status')
        .order('created_at', { ascending: false })
        .limit(10)

    if (error) {
        console.error('Erro:', error)
        return
    }

    console.table(candidates)
}

debug()
