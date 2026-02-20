-- Tables for Gmail OAuth Integration and Email Templates

-- Table for storing OAuth tokens
CREATE TABLE IF NOT EXISTS public.email_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    provider TEXT NOT NULL DEFAULT 'google',
    email_address TEXT NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, user_id, provider)
);

-- Table for email templates
CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id TEXT NOT NULL,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    html_content TEXT NOT NULL,
    variables JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, name)
);

-- Enable RLS
ALTER TABLE public.email_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Policies for email_integrations
-- Assuming company_id is the tenant identifier. 
-- In a real app, you'd check this against the user's metadata or a session variable.
CREATE POLICY "Users can view their own company integrations" 
ON public.email_integrations FOR SELECT 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own integrations" 
ON public.email_integrations FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own integrations" 
ON public.email_integrations FOR UPDATE 
USING (auth.uid()::text = user_id);

-- Policies for email_templates
CREATE POLICY "Users can view their company templates" 
ON public.email_templates FOR SELECT 
USING (true); -- Simplified for now, should ideally filter by company_id

CREATE POLICY "Users can manage company templates" 
ON public.email_templates FOR ALL 
USING (true); -- Simplified

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_email_integrations_updated_at
    BEFORE UPDATE ON public.email_integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at
    BEFORE UPDATE ON public.email_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default Disqualification template
INSERT INTO public.email_templates (company_id, name, subject, html_content, variables)
VALUES (
    'default', 
    'Disqualification', 
    'Atualização sobre sua candidatura - {{candidate_name}}', 
    '<p>Olá {{candidate_name}},</p><p>Obrigado por seu interesse na vaga. No momento, decidimos seguir com outros candidatos cujos perfis estão mais alinhados com os requisitos técnicos da posição.</p><p>Desejamos sucesso em sua jornada profissional.</p>',
    '["candidate_name", "candidate_email"]'::jsonb
) ON CONFLICT (company_id, name) DO NOTHING;
