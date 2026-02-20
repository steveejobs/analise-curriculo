export interface JobStatistics {
    job_id: string;
    job_title: string;
    total_candidates: number;
    qualified_candidates: number;
    avg_score: number;
}

export interface JobApplication {
    id: string
    candidate_name: string
    candidate_email: string
    created_at: string
    ai_status: string
    ai_score: number
    criteria_evaluation: any
    resume_url: string
    job_id?: string | null
    pipeline_status?: string
    ai_explanation?: string
    execution_stage?: string
    matching_rationale?: string
    rationale?: string
    location?: string
    is_discarded?: boolean
}

export interface Candidate extends JobApplication {
    status: string; // Legacy support
    jobs?: {
        title: string;
    } | null;
}

export interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    trend?: string;
    trendUp?: boolean;
}
