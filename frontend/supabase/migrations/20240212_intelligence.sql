-- Migration: Intelligence & Decision Support
-- Applied for: Intelligent ATS

-- 1. JOBS Table
create table if not exists public.jobs (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null, -- Removed FK temporarily for portability
  title text not null,
  description text not null,
  requirements jsonb,
  status text default 'ACTIVE' check (status in ('ACTIVE', 'CLOSED', 'REVIEW', 'DRAFT')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. CANDIDATES Table (Expanded)
create table if not exists public.candidates (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null,
  job_id uuid references public.jobs(id) on delete set null,
  name text not null,
  email text not null,
  resume_url text,
  ai_score int, -- 0-100
  priority text check (priority in ('HIGH', 'MEDIUM', 'LOW')),
  status text default 'NEW',
  analysis jsonb,
  confidence float,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. SCREENING MATRIX Table
create table if not exists public.screening_matrix (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null,
  candidate_id uuid references public.candidates(id) on delete cascade not null,
  job_id uuid references public.jobs(id) on delete cascade not null,
  semantic_match_score int,
  skills_gap jsonb,
  ai_reasoning text,
  auditable_decision_log jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(candidate_id, job_id)
);

-- RLS (Basic)
alter table public.jobs enable row level security;
alter table public.candidates enable row level security;
alter table public.screening_matrix enable row level security;

create policy "Enable all for development" on public.jobs using (true) with check (true);
create policy "Enable all for development" on public.candidates using (true) with check (true);
create policy "Enable all for development" on public.screening_matrix using (true) with check (true);
