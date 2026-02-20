
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function recover() {
    console.log('🔄 Checking for stuck applications...');

    // Find stuck
    const { data: stuck, error: fetchError } = await supabase
        .from('job_applications')
        .select('id, candidate_name')
        .eq('ai_status', 'ANALYZING'); // Or potentially others

    if (fetchError) {
        console.error('Error fetching:', fetchError);
        return;
    }

    if (!stuck || stuck.length === 0) {
        console.log('✅ No stuck applications found.');
        return;
    }

    console.log(`⚠️ Found ${stuck.length} stuck applications:`, stuck.map(s => s.candidate_name));

    // Reset
    const { error: updateError } = await supabase
        .from('job_applications')
        .update({
            ai_status: 'PENDING',
            ai_explanation: '🔄 Reiniciando análise automática...'
        })
        .in('id', stuck.map(s => s.id));

    if (updateError) {
        console.error('❌ Error recovering:', updateError);
    } else {
        console.log('✅ Successfully reset applications to PENDING.');
    }
}

recover();
