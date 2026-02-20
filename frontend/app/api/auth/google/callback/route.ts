import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const { userId } = await auth();

    if (!code || !userId) {
        return NextResponse.json({ error: 'Missing code or user' }, { status: 400 });
    }

    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
    );

    try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const userInfo = await oauth2.userinfo.get();

        if (!userInfo.data.email) {
            throw new Error('Email not found in user info');
        }

        // Store integration in Supabase
        const { error } = await supabaseAdmin
            .from('email_integrations')
            .upsert({
                user_id: userId,
                company_id: 'default', // TODO: Get from user metadata/organization
                provider: 'google',
                email_address: userInfo.data.email,
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                expires_at: new Date(tokens.expiry_date!).toISOString()
            });

        if (error) throw error;

        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?gmail=connected`);
    } catch (error: any) {
        console.error('OAuth Callback Error:', error);
        return NextResponse.json({ error: 'Failed to authenticate' }, { status: 500 });
    }
}
