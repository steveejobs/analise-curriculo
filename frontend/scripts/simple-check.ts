
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function run() {
    const { data } = await supabase.from('job_applications').select('ai_status');
    console.log('Status counts:', data?.reduce((acc: any, curr: any) => {
        acc[curr.ai_status] = (acc[curr.ai_status] || 0) + 1;
        return acc;
    }, {}));
}
run();
