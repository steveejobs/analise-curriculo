import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

console.log('--- VERIFICANDO ARQUIVOS .ENV ---')
const envPath = path.resolve(process.cwd(), '.env')
const envLocalPath = path.resolve(process.cwd(), '.env.local')

if (fs.existsSync(envPath)) {
    const env = fs.readFileSync(envPath, 'utf8')
    console.log('.env URL:', env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1])
}
if (fs.existsSync(envLocalPath)) {
    const envLocal = fs.readFileSync(envLocalPath, 'utf8')
    console.log('.env.local URL:', envLocal.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1])
}

dotenv.config()
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
    console.log('\n--- VERIFICANDO COLUNAS DE job_applications ---')
    const { data: sample } = await supabase.from('job_applications').select('*').limit(1)
    if (sample && sample.length > 0) {
        console.log('Colunas disponíveis:', Object.keys(sample[0]))
    } else {
        console.log('Nenhum dado para verificar colunas.')
    }
}

checkSchema()
