import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkUpdatedAt() {
    const { data: sample } = await supabase.from('job_applications').select('*').limit(1)
    if (sample && sample.length > 0) {
        console.log('Existe updated_at?', 'updated_at' in sample[0])
    }
}

checkUpdatedAt()
