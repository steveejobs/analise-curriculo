import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const BUCKETS = ['resumes', 'raw_resumes'];

async function cleanupStorage() {
    console.log('🧹 Iniciando limpeza do Storage...');

    for (const bucket of BUCKETS) {
        console.log(`\n📂 Verificando bucket: ${bucket}`);

        // 1. Check if bucket exists first (optional, but good for safety)
        const { data: bucketData, error: bucketError } = await supabase.storage.getBucket(bucket);
        if (bucketError) {
            console.log(`   ⚠️ Bucket '${bucket}' não acessível ou inexistente: ${bucketError.message}`);
            continue;
        }

        // 2. List all files
        let allFiles: string[] = [];
        let hasMore = true;
        let offset = 0;
        const LIMIT = 100;

        while (hasMore) {
            const { data: files, error: listError } = await supabase.storage
                .from(bucket)
                .list('', { limit: LIMIT, offset: offset });

            if (listError) {
                console.error(`   ❌ Erro ao listar arquivos em '${bucket}':`, listError.message);
                hasMore = false;
                break;
            }

            if (!files || files.length === 0) {
                hasMore = false;
            } else {
                // Filter out folders (placeholders mostly) if needed, keeping it simple for now
                // storage.list returns object with 'name'.
                const fileNames = files.map(f => f.name);
                allFiles = [...allFiles, ...fileNames];
                offset += LIMIT;
                // If we got fewer than limit, we are done
                if (files.length < LIMIT) hasMore = false;
            }
        }

        console.log(`   found ${allFiles.length} files to delete.`);

        if (allFiles.length === 0) continue;

        // 3. Delete in batches
        const BATCH_SIZE = 50;
        for (let i = 0; i < allFiles.length; i += BATCH_SIZE) {
            const batch = allFiles.slice(i, i + BATCH_SIZE);
            const { error: deleteError } = await supabase.storage
                .from(bucket)
                .remove(batch);

            if (deleteError) {
                console.error(`   ❌ Falha ao deletar lote ${i}-${i + BATCH_SIZE}:`, deleteError.message);
            } else {
                console.log(`   ✅ Deletados ${batch.length} arquivos.`);
            }
        }
    }

    console.log('\n✨ Limpeza concluída!');
}

cleanupStorage();
