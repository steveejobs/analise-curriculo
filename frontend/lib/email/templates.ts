export interface EmailVariables {
    candidate_name: string;
    candidate_email: string;
    job_title: string;
    company_name: string;
    [key: string]: string;
}

export function renderTemplate(htmlContent: string, variables: EmailVariables): string {
    let rendered = htmlContent;

    Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        rendered = rendered.replace(regex, value || '');
    });

    return rendered;
}
