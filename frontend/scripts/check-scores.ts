
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkCandidates() {
    const names = ['Gabriel', 'Jardete'];
    const results: any[] = [];

    for (const name of names) {
        const { data, error } = await supabase
            .from('job_applications')
            .select('candidate_name, ai_score, ai_explanation, criteria_evaluation')
            .ilike('candidate_name', `%${name}%`);

        if (error) {
            console.error(`Erro ao buscar ${name}:`, error.message);
            continue;
        }

        if (data && data.length > 0) {
            results.push(...data);
        }
    }

    fs.writeFileSync('comparison_results.json', JSON.stringify(results, null, 2));
    console.log('Resultados salvos em comparison_results.json');
}

checkCandidates();
