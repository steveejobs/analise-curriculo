import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
    const { data, error, count } = await supabase
        .from('job_applications')
        .select('id, ai_status, pipeline_status', { count: 'exact' })

    if (error) {
        console.error('Erro:', error)
        return
    }

    console.log('Total no banco:', count)
    const stats = data.reduce((acc: any, c: any) => {
        const key = `${c.ai_status} | ${c.pipeline_status}`
        acc[key] = (acc[key] || 0) + 1
        return acc
    }, {})
    console.table(stats)
}

run()
