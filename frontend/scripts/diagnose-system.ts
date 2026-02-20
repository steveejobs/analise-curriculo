
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

async function diagnose() {
    console.log('🔍 Iniciando Diagnóstico do Sistema PupLine ATS...\n')

    // 1. Verificação de Variáveis de Ambiente
    const requiredEnv = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'OPENAI_API_KEY']
    const missingEnv = requiredEnv.filter(key => !process.env[key])

    if (missingEnv.length > 0) {
        console.error('❌ Variáveis de ambiente faltando:', missingEnv.join(', '))
        return
    }
    console.log('✅ Variáveis de ambiente detectadas.')

    // 2. Teste Supabase
    console.log('\n📡 Testando Conexão Supabase...')
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        const { data, error } = await supabase.from('jobs').select('count', { count: 'exact', head: true })

        if (error) throw error
        console.log(`✅ Conexão Supabase OK! Tabela 'jobs' acessível.`)
    } catch (error: any) {
        console.error('❌ Erro no Supabase:', error.message)
    }

    // 3. Teste OpenAI
    console.log('\n🧠 Testando Conexão OpenAI...')
    try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
        const models = await openai.models.list()

        if (models.data.length > 0) {
            console.log(`✅ Conexão OpenAI OK! Modelos listados com sucesso.`)
        } else {
            console.warn('⚠️ OpenAI conectou mas não retornou modelos.')
        }
    } catch (error: any) {
        console.error('❌ Erro na OpenAI:', error.message)
    }

    console.log('\n🏁 Diagnóstico Finalizado.')
}

diagnose()
