
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function applyMigration() {
    const migrationPath = path.resolve(__dirname, '../../backend/database/20260218_add_pipeline_config.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('🚀 Aplicando migração...');

    // We can't run multiple statements with .rpc() easily if it's not a function.
    // Instead, we split by ';' and execute one by one, OR we use the database service if available.
    // Since we only have the client, let's try to execute via a temporary function or just use the management API if we had it.

    // Actually, Supabase client doesn't have a direct 'query' method for raw SQL.
    // I will try to use the `supabase.rpc` but for that I need a function.

    // Better: I'll use a hack if possible or just use the `execute_sql` tool from the MCP server if I can fix the auth.
    // Since I can't fix MCP auth, I'll recommend the user to run it in the dashboard OR I'll try to split and use specific clients.

    // Actually, let's try a different approach: check if there's already an 'exec_sql' function in his Supabase.
    // Many Supabase setups have one for internal tools.

    const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);

    for (const statement of statements) {
        console.log(`Running: ${statement.substring(0, 50)}...`);
        // If we don't have exec_sql, this will fail.
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
        if (error) {
            console.warn(`⚠️ Erro ao executar rpc('exec_sql'): ${error.message}. Tentando via Management API se possível...`);
            // If rpc fails, we might be stuck without MCP. 
            // I'll stop here and ask the user to run the SQL file manually to be safe and avoid "hallucinations" or breakages.
            console.error('❌ Não foi possível aplicar automaticamente. Por favor, execute o arquivo backend/database/20260218_add_pipeline_config.sql no SQL Editor do Supabase.');
            return;
        }
    }

    console.log('✅ Migração concluída com sucesso!');
}

applyMigration();
