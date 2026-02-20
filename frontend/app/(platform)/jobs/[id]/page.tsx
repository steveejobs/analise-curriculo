'use client'

import React, { useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import {
    ArrowLeft,
    Search,
    Filter
} from 'lucide-react'
import Link from 'next/link'
import { PipelineBoard } from '@/components/crm/PipelineBoard'

export default function JobDetailsPage() {
    const params = useParams()
    const jobId = params.id as string

    interface Job {
        id: string;
        title: string;
        description: string;
        location?: string;
        type?: string;
        created_at: string;
    }

    interface Candidate {
        id: string;
        candidate_name: string;
        email: string;
        ai_score: number;
        ai_status: string;
        created_at: string;
        matching_rationale?: string;
    }

    const [job, setJob] = useState<Job | null>(null)
    const [candidates, setCandidates] = useState<Candidate[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            setLoading(true)

            // Fetch Job details
            const { data: jobData } = await supabase
                .from('jobs')
                .select('*')
                .eq('id', jobId)
                .single()

            if (jobData) setJob(jobData)

            // Fetch Candidates
            const { data: candidatesData } = await supabase
                .from('job_applications')
                .select('id, candidate_name, email, ai_score, ai_status, created_at')
                .eq('job_id', jobId)
                .order('ai_score', { ascending: false })

            if (candidatesData) setCandidates(candidatesData)

            setLoading(false)
        }

        if (jobId) fetchData()
    }, [jobId])

    if (loading) return (
        <div className="flex flex-col h-full bg-[#F8FAFC]">
            <Header title="Carregando..." />
            <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
        </div>
    )

    if (!job) return (
        <div className="flex flex-col h-full bg-[#F8FAFC]">
            <Header title="Vaga não encontrada" />
            <div className="p-8 text-center text-zinc-500 flex flex-col items-center">
                <Link href="/jobs" className="text-indigo-500 hover:underline mb-4">Voltar para Vagas</Link>
                <p>A vaga solicitada não existe ou foi removida.</p>
            </div>
        </div>
    )

    return (
        <div className="flex flex-col h-full bg-[#F8FAFC]">
            <Header title={job.title} description="Gerenciamento de Candidatos" />

            <div className="flex-1 overflow-hidden flex flex-col">
                {/* Filters & Actions Bar */}
                <div className="border-b border-zinc-200 bg-white px-8 py-4 flex items-center justify-between shadow-sm z-10">
                    <div className="flex items-center gap-4">
                        <Link href="/jobs" className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-zinc-900 transition-colors">
                            <ArrowLeft size={20} />
                        </Link>
                        <div className="h-8 w-[1px] bg-zinc-200"></div>
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <input
                                placeholder="Buscar candidato..."
                                className="pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-medium w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                        </div>
                        <button className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors border border-dashed border-zinc-300">
                            <Filter size={16} /> Filtros
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold uppercase tracking-widest">
                            {candidates.length} Candidatos
                        </div>
                    </div>
                </div>

                {/* Pipeline Board */}
                <div className="flex-1 overflow-x-auto p-8">
                    <PipelineBoard jobId={jobId} initialCandidates={candidates} />
                </div>
            </div>
        </div>
    )
}

