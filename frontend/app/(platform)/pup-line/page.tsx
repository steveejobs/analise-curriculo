'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { supabase } from '@/lib/supabase'
import { PipelineBoard } from '@/components/crm/PipelineBoard'
import { Search, Filter, Users, Loader2, Plus, ChevronDown, Check, RefreshCw } from 'lucide-react'
import { NewJobModal } from '@/components/crm/NewJobModal'
import { toast } from 'sonner'

interface JobSelectorProps {
    jobs: any[];
    selectedJob: string;
    onSelect: (jobId: string) => void;
    loading: boolean;
    onRefresh: () => void;
}

function JobSelector({ jobs, selectedJob, onSelect, loading, onRefresh }: JobSelectorProps) {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = React.useRef<HTMLDivElement>(null)

    const selectedJobTitle = selectedJob === 'all' ? 'Todas as Vagas' : jobs.find(j => j.id === selectedJob)?.title || 'Selecionar Vaga'

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div className="relative flex items-center gap-2" ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-between gap-3 px-4 py-2.5 bg-white border ${isOpen ? 'border-zinc-900 shadow-lg' : 'border-zinc-200'} rounded-xl transition-all font-black text-[10px] text-zinc-900 text-left uppercase tracking-widest min-w-[200px]`}
            >
                <span className="truncate">{selectedJobTitle}</span>
                <ChevronDown size={14} className={`text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-zinc-900' : ''}`} />
            </button>

            <button
                onClick={onRefresh}
                disabled={loading}
                className="p-2.5 bg-white border border-zinc-200 rounded-xl text-zinc-400 hover:text-zinc-900 hover:border-zinc-900 transition-all disabled:opacity-30"
                title="Sincronizar"
            >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 z-[100] w-full mt-2 py-2 bg-white border border-zinc-100 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="max-h-60 overflow-y-auto scrollbar-hide">
                        <button
                            type="button"
                            onClick={() => { onSelect('all'); setIsOpen(false) }}
                            className="w-full flex items-center justify-between px-4 py-3 text-[10px] font-black text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors uppercase tracking-widest text-left"
                        >
                            Todas as Vagas
                            {selectedJob === 'all' && <Check size={14} className="text-zinc-900" />}
                        </button>
                        {jobs.map((job) => (
                            <button
                                key={job.id}
                                type="button"
                                onClick={() => {
                                    onSelect(job.id)
                                    setIsOpen(false)
                                }}
                                className="w-full flex items-center justify-between px-4 py-3 text-[10px] font-black text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors uppercase tracking-widest text-left"
                            >
                                <span className="truncate">{job.title}</span>
                                {selectedJob === job.id && <Check size={14} className="text-zinc-900" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

import { Suspense } from 'react'

function PupLinePageContent() {
    const [candidates, setCandidates] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [jobs, setJobs] = useState<any[]>([])
    const searchParams = useSearchParams()
    const urlJobId = searchParams.get('jobId')
    const [selectedJob, setSelectedJob] = useState<string>(urlJobId || 'all')
    const [isNewJobModalOpen, setIsNewJobModalOpen] = useState(false)
    const [rawCount, setRawCount] = useState(0) // Debug state
    const [fetchError, setFetchError] = useState<string | null>(null) // Debug state

    const fetchData = useCallback(async () => {
        setLoading(true)
        setFetchError(null)

        try {
            // Fetch Jobs for the filter
            const { data: jobsData } = await supabase.from('jobs').select('id, title, pipeline_config')
            if (jobsData) setJobs(jobsData)

            // Fetch Candidates
            let query = supabase
                .from('job_applications')
                .select('id, candidate_name, candidate_email, ai_score, ai_status, resume_url, created_at, job_id, criteria_evaluation, pipeline_status, execution_stage')

            if (selectedJob !== 'all') {
                query = query.eq('job_id', selectedJob)
            }

            const { data: candidatesData, error } = await query
                .order('created_at', { ascending: false })
                .limit(100)

            if (error) {
                console.error('Fetch error:', error)
                setFetchError(error.message)
                toast.error('Erro ao buscar: ' + error.message)
            }

            if (candidatesData) {
                setRawCount(candidatesData.length)
                // Filter to strictly show only candidates for the selected job (or all if 'all')
                const filtered = candidatesData.filter(c => {
                    if (selectedJob === 'all') return true;
                    return c.job_id === selectedJob;
                });

                console.log('PupLine Fetch Debug:', {
                    selectedJob,
                    totalRaw: candidatesData.length,
                    totalFiltered: filtered.length,
                    sample: candidatesData.slice(0, 3)
                })
                setCandidates(filtered)
            }
            setLoading(false)
        } catch (error: any) {
            console.error('Fetch error in fetchData:', error)
            setLoading(false)
            toast.error('Erro ao buscar dados')
        }
    }, [selectedJob])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    useEffect(() => {
        if (urlJobId) {
            setSelectedJob(urlJobId)
        }
    }, [urlJobId])

    return (
        <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
            <Header title="Pup Line" description="CRM de Qualificação de Talentos" />

            <div className="flex-1 flex flex-col">
                {/* Master Filter Bar - Premium Design */}
                <div className="bg-white/80 backdrop-blur-md border-b border-zinc-200/60 px-8 py-5 flex items-center justify-between shadow-sm z-30 transition-all sticky top-0">
                    <div className="flex items-center gap-6">
                        <div className="relative group">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors" />
                            <input
                                placeholder="Buscar talento..."
                                className="pl-9 pr-4 py-2.5 bg-zinc-50/50 border border-zinc-200/80 rounded-2xl text-xs font-black w-64 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary focus:bg-white transition-all placeholder:text-zinc-400"
                            />
                        </div>

                        <div className="h-6 w-px bg-zinc-200/60"></div>

                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest whitespace-nowrap">Vaga:</span>
                            <JobSelector
                                jobs={jobs}
                                selectedJob={selectedJob}
                                onSelect={setSelectedJob}
                                loading={loading}
                                onRefresh={fetchData}
                            />
                        </div>

                        <div className="h-6 w-px bg-zinc-200/60"></div>

                        {selectedJob !== 'all' && (
                            <button
                                onClick={async () => {
                                    if (!confirm('Deseja realmente re-analisar todos os candidatos desta vaga? Isso consumirá novos tokens, mas usará o texto já extraído.')) return;
                                    setLoading(true);
                                    try {
                                        const response = await fetch('/api/candidates/reanalyze', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ jobId: selectedJob })
                                        });
                                        if (response.ok) {
                                            toast.success('Re-análise iniciada!');
                                            fetchData();
                                        } else {
                                            const err = await response.json();
                                            toast.error(err.error || 'Erro ao iniciar re-análise');
                                        }
                                    } catch (e) {
                                        toast.error('Erro de conexão');
                                    } finally {
                                        setLoading(false);
                                    }
                                }}
                                disabled={loading}
                                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all active:scale-95 disabled:opacity-50"
                                title="Forçar nova análise da IA para todos os candidatos desta vaga"
                            >
                                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                                <span>Re-analisar Vaga</span>
                            </button>
                        )}

                        <button
                            onClick={() => setIsNewJobModalOpen(true)}
                            className="flex items-center gap-2 px-6 py-2.5 bg-zinc-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-900/10 active:scale-95"
                        >
                            <Plus size={14} />
                            <span>Nova Vaga</span>
                        </button>

                        <button className="flex items-center gap-2 px-4 py-2 text-[10px] font-black text-zinc-400 hover:text-zinc-900 rounded-xl transition-all border border-transparent uppercase tracking-widest">
                            <Filter size={14} />
                            <span>Filtros</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2.5 px-5 py-2.5 bg-white border border-zinc-200 text-zinc-900 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm">
                            <Users size={14} className="text-zinc-400" />
                            {candidates.length} Talentos na Linha
                        </div>
                    </div>
                </div>

                {/* Main Pipeline Area */}
                <div className="flex-1 overflow-x-auto p-12 bg-[#F8FAFC]">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="relative w-12 h-12">
                                <div className="absolute inset-0 rounded-full border-4 border-primary/10 border-t-primary animate-spin"></div>
                            </div>
                        </div>
                    ) : (
                        <PipelineBoard
                            jobId={selectedJob}
                            initialCandidates={candidates}
                            pipelineConfig={jobs.find(j => j.id === selectedJob)?.pipeline_config}
                        />
                    )}
                </div>
            </div>

            <NewJobModal
                isOpen={isNewJobModalOpen}
                onClose={() => setIsNewJobModalOpen(false)}
                onSuccess={(jobId) => {
                    fetchData();
                    setSelectedJob(jobId);
                }}
            />

        </div>
    )
}

export default function PupLinePage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-full min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        }>
            <PupLinePageContent />
        </Suspense>
    )
}
