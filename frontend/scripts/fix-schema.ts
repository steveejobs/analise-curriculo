
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixSchema() {
    console.log('🔍 Verificando estrutura da tabela [job_applications]...');

    // Tenta uma query simples que usa a coluna
    const { error: checkError } = await supabase
        .from('job_applications')
        .select('is_discarded')
        .limit(1);

    if (checkError && checkError.message.includes('column "is_discarded" does not exist')) {
        console.log('⚠️ Coluna "is_discarded" não detectada. Tentando criar via RPC ou SQL (se possível por aqui)...');

        // Infelizmente via cliente JS não dá pra rodar DDL direto sem RPC.
        // Vou verificar se existe um RPC genérico de migração.
        console.log('❌ Não é possível adicionar colunas via cliente JS padrão. Por favor, adicione a coluna manualmente ou verifique se a migração rodou.');
        console.log('SQL sugerido: ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS is_discarded BOOLEAN DEFAULT FALSE;');
    } else if (checkError) {
        console.error('❌ Erro inesperado:', checkError.message);
    } else {
        console.log('✅ A coluna "is_discarded" já existe.');
    }
}

fixSchema();
