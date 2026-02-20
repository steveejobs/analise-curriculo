'use client'

import React, { useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { supabase } from '@/lib/supabase'
import {
    Briefcase,
    MapPin,
    Calendar,
    ArrowRight,
    Plus,
    MoreHorizontal,
    Share2,
    Eye,
    Settings
} from 'lucide-react'
import Link from 'next/link'
import { JobStatistics } from '@/lib/types'
import { formatDistanceToNow } from '@/lib/utils'
import { toast } from 'sonner'

export default function JobsPage() {
    const [jobs, setJobs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchJobs() {
            setLoading(true)
            try {
                // 1. Fetch all jobs directly from 'jobs' table
                const { data: jobsData, error: jobsError } = await supabase
                    .from('jobs')
                    .select('id, title, status, created_at, location, type')
                    .order('title')

                if (jobsError) throw jobsError

                // 2. Fetch applications counts and metrics directly from 'job_applications' table
                const { data: appsData, error: appsError } = await supabase
                    .from('job_applications')
                    .select('job_id, ai_score, pipeline_status')
                    .neq('pipeline_status', 'discarded')

                if (appsError) throw appsError

                // 3. Merge data in frontend to build JobStatistics
                const processedJobs: any[] = (jobsData || []).map(job => {
                    const jobApps = (appsData || []).filter(app => app.job_id === job.id)
                    const scores = jobApps.map(a => a.ai_score || 0)

                    return {
                        job_id: job.id,
                        job_title: job.title,
                        total_candidates: jobApps.length,
                        qualified_candidates: jobApps.filter(a => (a.ai_score || 0) >= 70).length,
                        avg_score: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
                        created_at: job.created_at,
                        location: job.location || 'Remoto',
                        type: job.type || 'Full-time'
                    }
                })

                setJobs(processedJobs)
            } catch (error: any) {
                console.error('Error in fetchJobs:', error.message)
            } finally {
                setLoading(false)
            }
        }
        fetchJobs()
    }, [])

    const handleCopyLink = (jobId: string) => {
        const url = `${window.location.origin}/careers/${jobId}`
        navigator.clipboard.writeText(url)
        toast.success('Link de candidatura copiado!')
    }

    return (
        <div className="flex flex-col h-full bg-[#F8FAFC]">
            <Header title="Vagas Ativas" description="Gerencie suas vagas e acompanhe o funil de candidatos." />

            <div className="flex-1 overflow-auto p-4 md:p-8">
                <div className="max-w-6xl mx-auto space-y-6">

                    <div className="flex justify-end">
                        <Link href="/jobs/new">
                            <button className="bg-zinc-900 text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-900/10 active:scale-95">
                                <Plus size={18} />
                                Criar Nova Vaga
                            </button>
                        </Link>
                    </div>

                    {loading ? (
                        /* Skeleton Loading */
                        <div className="grid grid-cols-1 gap-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-sm">
                                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                                        <div className="flex-1">
                                            <div className="skeleton h-6 w-48 mb-3" />
                                            <div className="flex gap-4">
                                                <div className="skeleton h-4 w-24" />
                                                <div className="skeleton h-4 w-20" />
                                                <div className="skeleton h-4 w-28" />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-8">
                                            <div className="text-center">
                                                <div className="skeleton h-3 w-16 mx-auto mb-2" />
                                                <div className="skeleton h-8 w-10 mx-auto" />
                                            </div>
                                            <div className="text-center">
                                                <div className="skeleton h-3 w-16 mx-auto mb-2" />
                                                <div className="skeleton h-8 w-10 mx-auto" />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="skeleton h-11 w-24 rounded-xl" />
                                            <div className="skeleton h-11 w-24 rounded-xl" />
                                            <div className="skeleton h-11 w-11 rounded-xl" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : jobs.length === 0 ? (
                        /* Empty State */
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[3rem] border border-dashed border-zinc-200">
                            <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center mb-4">
                                <Briefcase size={28} className="text-zinc-300" />
                            </div>
                            <h3 className="text-lg font-bold text-zinc-900 mb-1">Nenhuma vaga criada</h3>
                            <p className="text-sm text-zinc-500 mb-6">Crie sua primeira vaga para começar a receber candidatos.</p>
                            <Link href="/jobs/new">
                                <button className="bg-zinc-900 text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-zinc-800 transition-all active:scale-95">
                                    <Plus size={18} />
                                    Criar Primeira Vaga
                                </button>
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {jobs.map((job) => (
                                <div key={job.job_id} className="bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">

                                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                                        <div className="flex-1 text-left">
                                            <h3 className="text-xl font-bold text-zinc-900 mb-2">{job.job_title}</h3>
                                            <div className="flex flex-wrap gap-4 text-sm text-zinc-500 font-medium">
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin size={16} className="text-zinc-400" />
                                                    {job.location}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Briefcase size={16} className="text-zinc-400" />
                                                    {job.type}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar size={16} className="text-zinc-400" />
                                                    {formatDistanceToNow(job.created_at)}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-8 md:border-l md:border-zinc-100 md:pl-8">
                                            <div className="text-center">
                                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Candidatos</p>
                                                <p className="text-2xl font-black text-zinc-900">{job.total_candidates}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Qualificados</p>
                                                <p className="text-2xl font-black text-emerald-500">{job.qualified_candidates}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 md:pl-4">
                                            <Link
                                                href={`/pup-line?jobId=${job.job_id}`}
                                                className="h-11 px-4 rounded-xl bg-zinc-50 flex items-center gap-2 text-zinc-900 font-bold text-xs hover:bg-zinc-900 hover:text-white transition-all border border-zinc-100"
                                                title="Ver Pup Line / CRM"
                                            >
                                                <Eye size={18} />
                                                <span>Triagem</span>
                                            </Link>

                                            <button
                                                onClick={() => handleCopyLink(job.job_id)}
                                                className="h-11 px-4 rounded-xl bg-indigo-50 flex items-center gap-2 text-indigo-600 font-bold text-xs hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100"
                                                title="Copiar Link de Candidatura"
                                            >
                                                <Share2 size={18} />
                                                <span>Divulgar</span>
                                            </button>

                                            <Link
                                                href={`/jobs/${job.job_id}/config`}
                                                className="w-11 h-11 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-all border border-zinc-100"
                                                title="Configurar Formulário"
                                            >
                                                <Settings size={18} />
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-50">
                                        <div
                                            className="h-full bg-emerald-500"
                                            style={{ width: `${job.total_candidates > 0 ? (job.qualified_candidates / job.total_candidates) * 100 : 0}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

