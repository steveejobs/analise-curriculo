import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import imaps from 'imap-simple'
import { simpleParser } from 'mailparser'

// Use service role to bypass RLS for system operations
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { limit = 10, markAsRead = true } = body

        // 1. Convert Limit for IMAP
        // Since we fetch by date, limiting is tricky with search. We'll search recent first.

        // 2. Get Active IMAP Config
        const { data: settings } = await supabaseAdmin
            .from('integration_settings')
            .select('config')
            .eq('type', 'IMAP')
            .eq('is_active', true)
            .single()

        if (!settings?.config) {
            return NextResponse.json({
                error: 'Nenhuma configuração de email ativa encontrada.'
            }, { status: 404 })
        }

        const config = settings.config

        // 3. Connect to IMAP
        const connectionConfig = {
            imap: {
                user: config.user,
                password: config.password,
                host: config.host,
                port: config.port,
                tls: config.secure || true,
                authTimeout: 10000
            }
        };

        const connection = await imaps.connect(connectionConfig);
        await connection.openBox('INBOX');

        // 4. Search for Unread Emails
        const searchCriteria = ['UNSEEN'];
        const fetchOptions = {
            bodies: [''],
            markSeen: false
        };

        const messages = await connection.search(searchCriteria, fetchOptions);
        // Process oldest first? Or newest? Usually newest first makes sense for UI, but fifo for queue.
        // Let's take the first N found (which are usually oldest in IMAP order unless sorted).
        const batch = messages.slice(0, limit);

        console.log(`[IMAP] Encontrados ${messages.length} emails não lidos. Processando ${batch.length}...`)

        const processPromises = batch.map(async (message) => {
            try {
                const id = message.attributes.uid;
                const all = message.parts.find((part: any) => part.which === '')
                if (!all) {
                    console.log(`[IMAP] Email ${id} ignorado: Corpo não encontrado.`)
                    return null
                }

                // Parse full email content including attachments
                const parsed = await simpleParser(all.body)

                const subject = parsed.subject || '(Sem Assunto)'
                const from = parsed.from?.text || 'Desconhecido'
                const date = parsed.date || new Date();

                // Find Resume Attachment (PDF only for now to be safe)
                const resumeAttachment = parsed.attachments.find(att =>
                    att.contentType === 'application/pdf' ||
                    att.filename?.toLowerCase().endsWith('.pdf')
                )

                let resumeUrl = null;

                if (resumeAttachment) {
                    const filename = `${Date.now()}_${resumeAttachment.filename || 'resume.pdf'}`.replace(/\s+/g, '_');
                    const filePath = `resumes/${filename}`

                    // Upload to Supabase Storage
                    const { data: uploadData, error: uploadError } = await supabaseAdmin
                        .storage
                        .from('resumes')
                        .upload(filePath, resumeAttachment.content, {
                            contentType: resumeAttachment.contentType,
                            upsert: false
                        })

                    if (uploadError) {
                        console.error('Falha no upload:', uploadError)
                    } else {
                        // Get Public URL
                        const { data: urlData } = supabaseAdmin
                            .storage
                            .from('resumes')
                            .getPublicUrl(uploadData.path)

                        resumeUrl = urlData.publicUrl
                    }
                }

                // Insert into Supabase FIRST
                const { data: appData, error: dbError } = await supabaseAdmin
                    .from('job_applications')
                    .insert([{
                        candidate_name: from.split('<')[0].trim() || 'Desconhecido',
                        candidate_email: from.match(/<(.+)>/)?.[1] || from,
                        resume_url: resumeUrl,
                        ai_status: 'PENDING', // Alterado para PENDING para o ai-agent processar automaticamente
                        score: 0,
                        status: 'applied',
                        source: 'email'
                    }])
                    .select()
                    .single()

                if (dbError) {
                    console.error('Erro ao criar aplicação via email:', dbError)
                }

                if (markAsRead) {
                    await connection.addFlags(id, '\\Seen');
                }

                return {
                    id,
                    subject,
                    from,
                    has_resume: !!resumeUrl
                }

            } catch (err) {
                console.error(`Erro ao processar email UID ${message.attributes.uid}:`, err)
                return null
            }
        });

        const completedProcessed = await Promise.all(processPromises);
        const processed = completedProcessed.filter((p): p is NonNullable<typeof p> => p !== null);

        connection.end();

        return NextResponse.json({
            success: true,
            emails_found: processed.length,
            details: processed
        })

    } catch (error: any) {
        console.error('Erro no sync de email:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
