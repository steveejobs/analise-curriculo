import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendGmail } from '@/lib/email/gmail';
import { renderTemplate } from '@/lib/email/templates';

export async function POST(request: Request) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { candidateId, templateName, variables } = await request.json();

        // 1. Fetch Candidate details
        const { data: candidate, error: candError } = await supabaseAdmin
            .from('job_applications')
            .select('candidate_name, email, jobs(title)')
            .eq('id', candidateId)
            .single();

        if (candError || !candidate) throw new Error('Candidate not found');

        // 2. Fetch Template
        const { data: template, error: tempError } = await supabaseAdmin
            .from('email_templates')
            .select('*')
            .eq('name', templateName)
            .single();

        if (tempError || !template) throw new Error('Template not found');

        // 3. Prepare variables
        const emailVariables = {
            candidate_name: candidate.candidate_name,
            candidate_email: candidate.email,
            job_title: (candidate.jobs as any)?.title || 'Vaga',
            company_name: 'ATS System', // Replace with real company name if available
            ...variables
        };

        // 4. Render and Send
        const html = renderTemplate(template.html_content, emailVariables);
        const subject = renderTemplate(template.subject, emailVariables);

        await sendGmail(userId, candidate.email, subject, html);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Send Email API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
