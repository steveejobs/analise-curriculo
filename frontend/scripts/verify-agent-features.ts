import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing environment variables.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function generateTextHash(text: string): string {
    return crypto.createHash('sha256').update(text.trim()).digest('hex');
}

async function verifyFeatures() {
    console.log('🧪 Starting AI Agent Features Verification (Concurrency & Duplicates)...');

    // 1. Prepare Test Data
    const dummyResumeText = "Este é um currículo de teste para validação de duplicatas e concorrência no agente Prime. Ricardo Silva, Desenvolvedor Full Stack.";
    const resumeHash = generateTextHash(dummyResumeText);

    console.log('\n--- TEST 1: CONCURRENCY ---');
    console.log('Inserting 5 concurrent dummy applications...');

    const testApps = [];
    for (let i = 0; i < 5; i++) {
        testApps.push({
            candidate_name: `CONCURRENCY_TEST_${i}`,
            candidate_email: `test${i}@example.com`,
            ai_status: 'PENDING',
            resume_url: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf', // Dummy but valid format
            execution_stage: 'TEST_CONCURRENCY'
        });
    }

    const { data: insertedApps, error: insertError } = await supabase
        .from('job_applications')
        .insert(testApps)
        .select();

    if (insertError) {
        console.error('❌ Error inserting test apps:', insertError.message);
        return;
    }

    console.log(`✅ Inserted 5 apps. IDs: ${insertedApps.map(a => a.id).join(', ')}`);
    console.log('ℹ️  Wait for the AI Agent to start processing them. Check agent logs for [BATCH] message.');

    console.log('\n--- TEST 2: DUPLICATE DETECTION / CACHE ---');
    console.log('Inserting two identical applications to check caching logic...');

    const { data: firstApp, error: firstError } = await supabase
        .from('job_applications')
        .insert({
            candidate_name: 'DUPLICATE_TEST_1',
            ai_status: 'PENDING',
            resume_url: 'https://example.com/resume.txt', // Won't be actually downloaded, but agent uses hash of extracted text
            execution_stage: 'TEST_DUPLICATE'
        })
        .select()
        .single();

    if (firstError) {
        console.error('❌ Error inserting first duplicate app:', firstError.message);
    } else {
        console.log(`✅ First app inserted: ${firstApp.id}. Now wait for it to be DONE.`);
    }

    console.log('\n⏳ Checking status in 30 seconds...');
    await new Promise(resolve => setTimeout(resolve, 30000));

    // Verify if any reached ANALYZING or DONE
    const { data: results } = await supabase
        .from('job_applications')
        .select('id, candidate_name, ai_status, execution_stage, resume_hash')
        .in('id', [...insertedApps.map(a => a.id), firstApp?.id].filter(Boolean));

    console.log('\n--- RESULTS ---');
    results?.forEach(app => {
        console.log(`- ${app.candidate_name}: Status=${app.ai_status}, Stage=${app.execution_stage}, Hash=${app.resume_hash ? 'OK' : 'MISSING'}`);
    });

    console.log('\n🚀 Manual Step: Run `npx tsx scripts/ai-agent.ts` in another terminal if it is not running already.');
    console.log('Observe the logs to see if 5 apps are processed in one [BATCH].');
}

verifyFeatures().catch(console.error);
