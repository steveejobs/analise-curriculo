import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

// Using public/anon key as the frontend does
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAnonUpdate() {
    console.log('--- TESTANDO UPDATE COM CHAVE ANON ---')

    const { data: candidates } = await supabase
        .from('job_applications')
        .select('id')
        .limit(1)

    if (!candidates || candidates.length === 0) {
        console.log('Nenhum candidato para testar.')
        return
    }

    const testId = candidates[0].id
    const { error } = await supabase
        .from('job_applications')
        .update({ pipeline_status: 'triagem' })
        .eq('id', testId)

    if (error) {
        console.error('ERRO DE PERMISSÃO (ANON):', error.message)
    } else {
        console.log('Sucesso! A chave ANON tem permissão de update.')
    }
}

testAnonUpdate()
