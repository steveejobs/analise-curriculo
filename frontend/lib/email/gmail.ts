import { google } from 'googleapis';
import { supabaseAdmin } from '@/lib/supabase';

export async function getGmailClient(userId: string) {
    const { data: integration, error } = await supabaseAdmin
        .from('email_integrations')
        .select('*')
        .eq('user_id', userId)
        .eq('provider', 'google')
        .single();

    if (error || !integration) {
        throw new Error('Gmail integration not found');
    }

    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
    );

    oauth2Client.setCredentials({
        access_token: integration.access_token,
        refresh_token: integration.refresh_token,
        expiry_date: new Date(integration.expires_at).getTime()
    });

    // Check if token is expired (or about to expire in 5 mins)
    const isExpired = new Date(integration.expires_at).getTime() <= (Date.now() + 300000);

    if (isExpired) {
        try {
            const { credentials } = await oauth2Client.refreshAccessToken();

            if (credentials) {
                // Update tokens in DB
                await supabaseAdmin
                    .from('email_integrations')
                    .update({
                        access_token: credentials.access_token,
                        expires_at: new Date(credentials.expiry_date!).toISOString(),
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', integration.id);

                oauth2Client.setCredentials(credentials);
            }
        } catch (refreshError) {
            console.error('Error refreshing token:', refreshError);
            throw new Error('Failed to refresh Gmail token');
        }
    }

    return google.gmail({ version: 'v1', auth: oauth2Client });
}

export async function sendGmail(userId: string, to: string, subject: string, body: string) {
    const gmail = await getGmailClient(userId);

    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    const messageParts = [
        `To: ${to}`,
        `Content-Type: text/html; charset=utf-8`,
        `MIME-Version: 1.0`,
        `Subject: ${utf8Subject}`,
        '',
        body
    ];

    const message = messageParts.join('\n');
    const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    try {
        const res = await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encodedMessage,
            },
        });

        // Audit Log Webhook
        if (process.env.N8N_AUDIT_LOG_WEBHOOK_URL) {
            fetch(process.env.N8N_AUDIT_LOG_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    to,
                    subject,
                    status: 'sent',
                    messageId: res.data.id,
                    timestamp: new Date().toISOString()
                })
            }).catch(e => console.error('Failed to log email audit:', e));
        }

        return res.data;
    } catch (error) {
        console.error('Gmail Send Error:', error);
        throw error;
    }
}
