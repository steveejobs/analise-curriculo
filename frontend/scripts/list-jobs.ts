import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

async function listJobs() {
    console.log('--- LISTANDO VAGAS ---')
    const { data: jobs, error } = await supabase.from('jobs').select('*')

    if (error) {
        console.error('Erro:', error)
        return
    }

    console.log(`Vagas encontradas: ${jobs?.length || 0}`)
    console.table(jobs)
}

listJobs()
