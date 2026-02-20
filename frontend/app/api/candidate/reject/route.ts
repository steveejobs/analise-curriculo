
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const N8N_FEEDBACK_WEBHOOK = 'https://n8n.lynxa.cloud/webhook/candidate-rejection';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function POST(req: Request) {
    try {
        const { applicationId, candidateEmail, candidateName, feedbackMessage, jobTitle } = await req.json();

        if (!applicationId || !candidateEmail || !feedbackMessage) {
            return NextResponse.json({ error: 'Dados insuficientes para reprovação.' }, { status: 400 });
        }

        console.log(`📤 Enviando feedback para ${candidateEmail}...`);

        // 1. Enviar para o n8n
        const n8nResponse = await fetch(N8N_FEEDBACK_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                candidateEmail,
                candidateName,
                feedbackMessage,
                jobTitle
            })
        });

        if (!n8nResponse.ok) {
            const errorText = await n8nResponse.text();
            throw new Error(`Falha ao disparar e-mail via n8n: ${errorText}`);
        }

        // 2. Atualizar o banco de dados
        // Usamos ai_status = 'REJECTED' para desqualificar formalmente
        const { error: updateError } = await supabase
            .from('job_applications')
            .update({
                ai_status: 'REJECTED',
                audit_log: {
                    rejection_feedback: feedbackMessage,
                    feedback_sent_at: new Date().toISOString(),
                    feedback_status: 'sent'
                }
            })
            .eq('id', applicationId);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Rejection API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
