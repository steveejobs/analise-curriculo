
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkCandidates() {
    console.log('Checking candidates...')

    // 1. Get recent candidates (original or clones)
    const { data: recent, error } = await supabase
        .from('job_applications')
        .select('id, candidate_name, job_id, pipeline_status, execution_stage, created_at')
        .order('created_at', { ascending: false })
        .limit(10)

    if (error) {
        console.error('Error fetching:', error)
        return
    }

    console.log('Recent Candidates:')
    console.table(recent)

    // 2. specifically check for 'triagem' status
    const { data: triagem } = await supabase
        .from('job_applications')
        .select('id, candidate_name, job_id, pipeline_status, execution_stage')
        .eq('pipeline_status', 'triagem')

    console.log('Candidates in Triagem:', triagem?.length)
    if (triagem?.length) {
        console.table(triagem)
    }
}

checkCandidates()
