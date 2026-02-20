
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function reprocessFailed() {
    console.log('--- Resetting Failed Uploads to EXTRACTED ---')

    // Find candidates with Score 0 or Calc D created in last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

    const { data: failedApps, error: fetchError } = await supabase
        .from('job_applications')
        .select('id, candidate_name')
        .or('ai_score.eq.0,ai_status.eq.ERROR')
        .gt('created_at', oneHourAgo)

    if (fetchError) {
        console.error('Error fetching failed apps:', fetchError)
        return
    }

    if (!failedApps || failedApps.length === 0) {
        console.log('No recently failed apps found.')
        return
    }

    console.log(`Found ${failedApps.length} failed apps. Resetting...`)

    for (const app of failedApps) {
        const { error: updateError } = await supabase
            .from('job_applications')
            .update({
                ai_status: 'EXTRACTED',
                ai_explanation: null,
                ai_score: null,
                criteria_evaluation: null
            })
            .eq('id', app.id)

        if (updateError) console.error(`Failed to reset ${app.candidate_name}:`, updateError)
        else console.log(`Reset ${app.candidate_name} to EXTRACTED.`)
    }
}

reprocessFailed()
