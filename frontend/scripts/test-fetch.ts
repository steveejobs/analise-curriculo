import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function testFetch() {
    console.log('--- FETCH TEST ---');
    const endpoint = `${URL}/rest/v1/jobs`;

    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'apikey': KEY,
                'Authorization': `Bearer ${KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                company_id: '00000000-0000-0000-0000-000000000000',
                title: 'FETCH TEST',
                description: 'test'
            })
        });

        console.log('STATUS:', res.status);
        const text = await res.text();
        console.log('RESPONSE:', text);
    } catch (e: any) {
        console.error('FETCH ERROR:', e.message);
    }
}

testFetch();
