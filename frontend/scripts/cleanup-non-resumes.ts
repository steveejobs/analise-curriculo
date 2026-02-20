
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

async function cleanup() {
    console.log('🧹 Buscando documentos para limpeza...');

    // 1. Deletar itens com nomes que claramente não são currículos (ex: WhatsApp Image)
    const { data: namesToDelete } = await supabase
        .from('job_applications')
        .select('id, candidate_name')
        .or('candidate_name.ilike.%WhatsApp Image%,candidate_name.ilike.%Contrato%');

    if (namesToDelete && namesToDelete.length > 0) {
        console.log(`🗑️ Deletando ${namesToDelete.length} itens por nome inválido...`);
        for (const item of namesToDelete) {
            console.log(`   - Excluindo: ${item.candidate_name}`);
            await supabase.from('job_applications').delete().eq('id', item.id);
        }
    }

    // 2. Deletar itens marcados como falha na extração (Agente salvou como DONE mas com erro)
    const { data: failedItems } = await supabase
        .from('job_applications')
        .select('id, candidate_name, ai_explanation')
        .ilike('ai_explanation', '%Arquivo ilegível%');

    if (failedItems && failedItems.length > 0) {
        console.log(`🗑️ Deletando ${failedItems.length} itens com falha na extração...`);
        for (const item of failedItems) {
            console.log(`   - Excluindo: ${item.candidate_name}`);
            await supabase.from('job_applications').delete().eq('id', item.id);
        }
    }

    console.log('✅ Limpeza concluída.');
}

cleanup();
