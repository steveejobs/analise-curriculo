
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import path from 'path';
// import { extractText } from '../lib/pdf-service'; // Cannot import directly if module resolution issues. Copy paste logic or try import.
// Let's try direct import first.
import pdf from 'pdf-parse';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function extractText(buffer: Buffer) {
    try {
        const data = await pdf(buffer);
        return data.text;
    } catch (error) {
        console.error('PDF Parse Error:', error);
        return '';
    }
}

async function run() {
    console.log('⬇️ Downloading bulk/uymkzd.pdf...');
    const { data, error } = await supabase.storage.from('resumes').download('bulk/uymkzd.pdf');

    if (error || !data) {
        console.error('Download failed:', error);
        return;
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    console.log(`📦 Buffer size: ${buffer.length}`);

    const text = await extractText(buffer);
    console.log(`📝 Text length: ${text.length}`);

    fs.writeFileSync('debug_text.txt', text);
    console.log('✅ Saved to debug_text.txt');
}

run();
