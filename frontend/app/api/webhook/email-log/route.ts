import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const data = await request.json();

        console.log('Email Audit Log Received:', data);

        // Here you would typically forward this to n8n or store in an audit table
        // For now, it's a stub as requested.

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Audit Webhook Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
