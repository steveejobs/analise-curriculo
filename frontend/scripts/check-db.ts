
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing environment variables.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkStatus() {
    const { data, error } = await supabase
        .from('job_applications')
        .select('ai_status, count')
        .select('ai_status');

    if (error) {
        console.error('❌ Error fetching status:', error.message);
        return;
    }

    const stats = data.reduce((acc: any, curr: any) => {
        const status = curr.ai_status || 'NULL';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {});

    console.log('\n📊 Status das Aplicações:');
    console.table(stats);

    const { data: pending } = await supabase
        .from('job_applications')
        .select('id, candidate_name, ai_status')
        .in('ai_status', ['PENDING', 'QUEUED_N8N', 'EXTRACTED', 'NEW', 'UPLOADING'])
        .limit(10);

    if (pending && pending.length > 0) {
        console.log('\n⏳ Amostra de Pendentes:');
        console.table(pending);
    } else {
        console.log('\n✅ Nenhuma aplicação pendente encontrada.');
    }
}

checkStatus();
