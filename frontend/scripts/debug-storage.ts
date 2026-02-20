import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function listBuckets() {
    console.log('📂 Listando Buckets do Storage...');

    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
        console.error('❌ Erro ao listar buckets:', error.message);
        return;
    }

    if (!buckets || buckets.length === 0) {
        console.log('⚠️ Nenhum bucket encontrado.');
        return;
    }

    console.log(`Encontrados ${buckets.length} buckets.`);

    for (const b of buckets) {
        const { data: files } = await supabase.storage.from(b.name).list('', { limit: 100 });
        const count = files ? files.length : 0;
        console.log(`- [${b.name}]: ~${count} arquivos visíveis na raiz (id: ${b.id})`);
    }
}

listBuckets();
