'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Users, BrainCircuit, CheckCircle2, Filter, Loader2, Zap, LayoutGrid, List, Trash2, AlertCircle } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { CandidateCard } from '@/components/candidates/CandidateCard'
import { CandidateSkeleton } from '@/components/candidates/CandidateSkeleton'
import { PdfViewer } from '@/components/candidates/PdfViewer'
import { JobSelectorModal } from '@/components/candidates/JobSelectorModal'
import { NewJobModal } from '@/components/candidates/NewJobModal'
import { calculateWeightedScore } from '@/lib/scoring'

function CandidatesPageContent() {
    const searchParams = useSearchParams()
    const initialStatus = searchParams.get('status') || 'ALL'
    const initialCandidateId = searchParams.get('id')
    const initialMinScore = searchParams.get('minScore') ? parseInt(searchParams.get('minScore')!) : 0

    const [candidates, setCandidates] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [filterStatus, setFilterStatus] = useState(initialStatus)
    const [blindMode, setBlindMode] = useState(false)
    const [techWeight, setTechWeight] = useState(70)
    const [mustHaveEnglish, setMustHaveEnglish] = useState(false)
    const [minSeniority, setMinSeniority] = useState('ALL')
    const [minEducation, setMinEducation] = useState('ALL')
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [pipelineFilter, setPipelineFilter] = useState('ALL')
    const [page, setPage] = useState(0)
    const [hasMore, setHasMore] = useState(true)
    const PAGE_SIZE = 12

    // Modal States
    const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null)
    const [isJobSelectorOpen, setIsJobSelectorOpen] = useState(false)
    const [isNewJobModalOpen, setIsNewJobModalOpen] = useState(false)

    // Derived Weights
    const cultureWeight = 100 - techWeight

    // Funnel Stats
    const stats = {
        total: candidates.length,
        processed: candidates.filter(c => c.ai_status === 'DONE').length,
        qualified: candidates.filter(c => c.ai_status === 'DONE' && c.ai_score >= 70).length,
        hired: 0 // Future extension
    }



    const [isInitialLoading, setIsInitialLoading] = useState(true)
    const candidatesRef = React.useRef(candidates)

    // Sync ref with state
    useEffect(() => {
        candidatesRef.current = candidates
    }, [candidates])

    useEffect(() => {
        loadCandidates()

        // 🟢 Realtime Subscription
        const channel = supabase
            .channel('job_applications_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'job_applications'
                },
                (payload) => {
                    console.log('Realtime change received:', payload)

                    if (payload.eventType === 'INSERT') {
                        setCandidates(prev => [payload.new, ...prev])
                    }
                    else if (payload.eventType === 'UPDATE') {
                        setCandidates(prev => prev.map(c =>
                            c.id === payload.new.id ? { ...c, ...payload.new } : c
                        ))
                    }
                    else if (payload.eventType === 'DELETE') {
                        setCandidates(prev => prev.filter(c => c.id !== payload.old.id))
                    }
                }
            )
            .subscribe()

        // 🔄 Polling Fallback (every 5 seconds)
        const pollInterval = setInterval(() => {
            const hasProcessing = candidatesRef.current.some(c =>
                !['DONE', 'ERROR', 'INVALID_DOCUMENT'].includes(c.ai_status)
            )

            if (hasProcessing) {
                console.log('Polling for updates...')
                loadCandidatesSilent()
            }
        }, 5000)

        return () => {
            supabase.removeChannel(channel)
            clearInterval(pollInterval)
        }
    }, []) // Run only once on mount

    async function loadCandidates(isLoadMore = false) {
        if (!isLoadMore) {
            if (candidates.length === 0) setIsInitialLoading(true)
            setPage(0)
        }
        setLoading(true)

        const from = isLoadMore ? (page + 1) * PAGE_SIZE : 0
        const to = from + PAGE_SIZE - 1

        let query = supabase
            .from('job_applications')
            .select('id, candidate_name, candidate_email, created_at, ai_status, ai_score, criteria_evaluation, resume_url, job_id, pipeline_status, execution_stage', { count: 'exact' })
            .neq('pipeline_status', 'discarded')
            .or('execution_stage.is.null,execution_stage.neq.CLONED_FROM_BANK')
            .order('created_at', { ascending: false })
            .range(from, to)

        const { data, error, count } = await query

        if (error) {
            toast.error('Erro ao carregar candidatos: ' + error.message)
        } else {
            if (isLoadMore) {
                setCandidates(prev => [...prev, ...(data || [])])
                setPage(prev => prev + 1)
            } else {
                setCandidates(data || [])
            }
            setHasMore(count ? (isLoadMore ? candidates.length + (data?.length || 0) : (data?.length || 0)) < count : false)
        }
        setLoading(false)
        setIsInitialLoading(false)
    }

    // Silent version for polling to avoid flashing loading states
    async function loadCandidatesSilent() {
        // Buscamos apenas os candidatos que estão nos estados de processamento
        // para atualizar seus status na lista local de forma eficiente.
        const processingIds = candidatesRef.current
            .filter(c => !['DONE', 'ERROR', 'INVALID_DOCUMENT'].includes(c.ai_status))
            .map(c => c.id)

        if (processingIds.length === 0) return

        const { data, error } = await supabase
            .from('job_applications')
            .select('id, candidate_name, candidate_email, created_at, ai_status, ai_score, criteria_evaluation, resume_url, job_id, pipeline_status')
            .in('id', processingIds)

        if (!error && data) {
            setCandidates(prev => prev.map(c => {
                const updated = data.find(u => u.id === c.id)
                return updated ? { ...c, ...updated } : c
            }))
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Tem certeza que deseja excluir este candidato permanentemente?')) return

        // 1. Get Resume URL to delete from Storage
        const { data: candidate } = await supabase
            .from('job_applications')
            .select('resume_url')
            .eq('id', id)
            .single()

        if (candidate?.resume_url) {
            try {
                // Extract path from URL (supports both public URLs and direct paths)
                const url = candidate.resume_url
                let bucketName = 'resumes'
                let filePath = ''

                if (url.includes('/resumes/')) {
                    filePath = url.split('/resumes/')[1]
                } else if (url.includes('/bulk/')) {
                    // Check if it's in resumes bucket but under bulk folder
                    filePath = 'bulk/' + url.split('/bulk/')[1]
                } else {
                    // Fallback: try to just get the filename
                    filePath = url.split('/').pop() || ''
                }

                // Clean query params if any
                filePath = filePath.split('?')[0]

                if (filePath) {
                    await supabase.storage.from(bucketName).remove([filePath])
                }
            } catch (err) {
                console.error('Erro ao excluir arquivo do storage:', err)
                // Continue to delete record even if file delete fails (or log it)
            }
        }

        const { error } = await supabase
            .from('job_applications')
            .delete()
            .eq('id', id)

        if (error) {
            toast.error('Erro ao excluir: ' + error.message)
        } else {
            toast.success('Candidato e arquivo excluídos com sucesso.')
            setCandidates(prev => prev.filter(c => c.id !== id))
        }
    }

    async function handleDeleteAll() {
        if (candidates.length === 0) return
        if (!confirm('⚠️ PERIGO: Você está prestes a excluir TODOS os candidatos.\n\nEsta ação apagará todo o histórico e também removerá os arquivos do sistema.\n\nDeseja confirmar a exclusão completa?')) return

        setLoading(true)

        try {
            const response = await fetch('/api/candidates/delete-all', {
                method: 'DELETE'
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Erro desconhecido ao excluir')
            }

            toast.success(`Banco de talentos limpo! ${result.stats?.storage_deleted || 0} arquivos removidos.`)
            setCandidates([])
        } catch (error: any) {
            console.error('Erro delete-all:', error)
            toast.error('Erro ao excluir tudo: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    async function handleAddToJob(candidateId: string) {
        setSelectedCandidateId(candidateId)
        setIsJobSelectorOpen(true)
    }

    async function handleSelectJob(jobId: string) {
        if (!selectedCandidateId) return

        setIsJobSelectorOpen(false)
        setLoading(true)

        try {
            const response = await fetch('/api/candidates/clone', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    candidateId: selectedCandidateId,
                    jobId: jobId
                })
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Erro ao vincular candidato')
            }

            // 4. Update the original candidate record in the Bank to reflect it's now linked and in triagem
            await supabase
                .from('job_applications')
                .update({
                    job_id: jobId,
                    pipeline_status: 'triagem'
                })
                .eq('id', selectedCandidateId)

            toast.success('Candidato vinculado à vaga e enviado para o Pup Line!')
        } catch (error: any) {
            toast.error('Erro ao vincular: ' + error.message)
        } finally {
            setLoading(false)
            setSelectedCandidateId(null)
        }
    }

    function getWeightedScore(c: any) {
        return calculateWeightedScore(c, { tech: techWeight, culture: cultureWeight })
    }

    const filtered = candidates
        .filter(c => c.ai_status !== 'INVALID_DOCUMENT')
        .filter(c => c.pipeline_status !== 'discarded')
        .filter(c => {
            if (filterStatus === 'ALL') return true
            if (filterStatus === 'DONE') return c.ai_status === 'DONE'
            if (filterStatus === 'PENDING') return ['PENDING', 'QUEUED_N8N', 'EXTRACTED', 'ANALYZING', 'NEW', 'UPLOADING', 'RECOVERED_STUCK', 'STARTING'].includes(c.ai_status)
            if (filterStatus === 'ERROR') return c.ai_status === 'ERROR'
            return true
        })
        .filter(c => {
            if (pipelineFilter === 'ALL') return true
            return c.pipeline_status === pipelineFilter
        })
        .filter(c => {
            if (mustHaveEnglish && c.ai_status === 'DONE') {
                const evalData = c.criteria_evaluation || {}
                const skills = evalData.top_skills || evalData.hard_skills_analysis?.skills_found || []
                return skills.some((s: string) =>
                    s.toLowerCase().includes('inglês') ||
                    s.toLowerCase().includes('english') ||
                    s.toLowerCase().includes('advanced english') ||
                    s.toLowerCase().includes('inglês avançado')
                )
            }
            return true
        })
        .filter(c => {
            if (minSeniority !== 'ALL' && c.ai_status === 'DONE') {
                const levels: Record<string, number> = {
                    'Estagiário': 0,
                    'Júnior': 1,
                    'Pleno': 2,
                    'Sênior': 3,
                    'Especialista': 4,
                    // Legado
                    'Junior': 1,
                    'Mid-Level': 1,
                    'Senior': 3
                }

                const filterLevels: Record<string, number> = {
                    'Junior': 1,
                    'Mid-Level': 2,
                    'Senior': 3
                }

                const minLevel = filterLevels[minSeniority] || 0
                const candLevel = levels[c.criteria_evaluation?.senioridade_estimada] || levels[c.criteria_evaluation?.profile?.seniority] || 0
                return candLevel >= minLevel
            }
            return true
        })
        .filter(c => {
            if (minEducation !== 'ALL' && c.ai_status === 'DONE') {
                const edu = c.criteria_evaluation?.hard_skills_analysis?.education_level || ''
                return edu.toLowerCase().includes(minEducation.toLowerCase())
            }
            return true
        })
        .filter(c => {
            if (initialMinScore > 0 && c.ai_status === 'DONE') {
                return c.ai_score >= initialMinScore
            }
            return true
        })
        .filter(c => {
            if (initialCandidateId) {
                return c.id === initialCandidateId
            }
            return true
        })
        .map(c => ({
            ...c,
            finalScore: getWeightedScore(c)
        }))
        .sort((a, b) => {
            if (a.ai_status === 'DONE' && b.ai_status === 'DONE') {
                return b.finalScore - a.finalScore
            }
            return 0
        })

    return (
        <div className="flex flex-col h-full bg-[#F8FAFC]">
            <Header
                title="Banco de Talentos"
                description="Gerencie todos os currículos processados pela IA."
            />

            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-7xl mx-auto w-full space-y-8">
                    {/* Cockpit Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-sm flex flex-col justify-center">
                            <span className="text-3xl font-black text-indigo-600 mb-1">{stats.total}</span>
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none flex items-center gap-2">
                                <Users size={12} /> Inscritos
                            </span>
                        </div>
                        <div className="bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-sm flex flex-col justify-center">
                            <span className="text-3xl font-black text-blue-500 mb-1">{stats.processed}</span>
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none flex items-center gap-2">
                                <BrainCircuit size={12} /> Triados pela IA
                            </span>
                        </div>
                        <div className="bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-sm flex flex-col justify-center">
                            <div className="flex items-end gap-2 mb-1">
                                <span className="text-3xl font-black text-indigo-600">{stats.qualified}</span>
                                <span className="text-xs font-bold text-zinc-400 mb-1">({stats.processed > 0 ? Math.round((stats.qualified / stats.processed) * 100) : 0}%)</span>
                            </div>
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none flex items-center gap-2">
                                <CheckCircle2 size={12} /> Qualificados ({'>'}70%)
                            </span>
                        </div>
                        <div className="bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-sm flex flex-col items-center justify-center text-center group cursor-pointer" onClick={() => setBlindMode(!blindMode)}>
                            <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${blindMode ? 'bg-indigo-600' : 'bg-zinc-200'}`}>
                                <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${blindMode ? 'translate-x-6' : 'translate-x-0'}`} />
                            </div>
                            <span className={`text-[10px] font-black mt-2 uppercase tracking-widest ${blindMode ? 'text-indigo-600' : 'text-zinc-400'}`}>
                                Modo Cego {blindMode ? 'Ativo' : 'Inativo'}
                            </span>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
                        <div className="flex items-center gap-2">
                            <Filter size={16} className="text-zinc-400" />
                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Filtros:</span>

                            <button
                                onClick={() => setFilterStatus('ALL')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterStatus === 'ALL' ? 'bg-zinc-900 text-white' : 'hover:bg-zinc-50 text-zinc-600'}`}
                            >
                                Todos
                            </button>
                            <button
                                onClick={() => setFilterStatus('DONE')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterStatus === 'DONE' ? 'bg-blue-600 text-white' : 'hover:bg-blue-50 text-blue-600'}`}
                            >
                                Processados
                            </button>
                            <button
                                onClick={() => setFilterStatus('PENDING')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterStatus === 'PENDING' ? 'bg-amber-500 text-white' : 'hover:bg-amber-50 text-amber-600'}`}
                            >
                                Em Análise
                            </button>
                            <button
                                onClick={() => setFilterStatus('ERROR')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterStatus === 'ERROR' ? 'bg-red-500 text-white' : 'hover:bg-red-50 text-red-600'}`}
                            >
                                Erros
                            </button>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex bg-zinc-100 p-1 rounded-xl">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-zinc-400 hover:text-zinc-600'}`}
                                >
                                    <LayoutGrid size={16} />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-zinc-400 hover:text-zinc-600'}`}
                                >
                                    <List size={16} />
                                </button>
                            </div>

                            <span className="text-xs font-bold text-zinc-400">
                                {filtered.length} candidatos
                            </span>

                            {candidates.length > 0 && (
                                <button
                                    onClick={handleDeleteAll}
                                    className="px-4 py-2 bg-white border border-red-200 text-red-500 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-50 hover:border-red-300 transition-all flex items-center gap-2"
                                >
                                    <Trash2 size={14} /> Excluir Tudo
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Sidebar / Filters */}
                        <aside className="lg:col-span-1 space-y-6">
                            <section className="bg-white p-6 rounded-[2.5rem] border border-zinc-100 shadow-sm sticky top-28">
                                <h3 className="font-black text-zinc-900 uppercase tracking-tighter mb-6 flex items-center gap-2">
                                    <Filter size={16} /> Refinar Ranking
                                </h3>

                                {/* Weight Sliders */}
                                <div className="space-y-4">
                                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-2 px-1">Requisitos "Must-Have"</span>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 cursor-pointer transition-all border border-transparent hover:border-zinc-100 group">
                                            <input type="checkbox" className="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500" />
                                            <span className="text-xs font-bold text-zinc-600 group-hover:text-zinc-900">Fluência em Inglês</span>
                                        </label>
                                        <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 cursor-pointer transition-all border border-transparent hover:border-zinc-100 group">
                                            <input type="checkbox" className="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500" />
                                            <span className="text-xs font-bold text-zinc-600 group-hover:text-zinc-900">Híbrido / Remoto</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-1">
                                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Prioridade do Match</span>
                                        <Zap size={14} className="text-amber-400" />
                                    </div>
                                    <div className="p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100/50 space-y-4">
                                        <div className="flex items-center justify-between text-[10px] font-bold uppercase">
                                            <div className="flex flex-col items-start gap-1">
                                                <span className={techWeight < 50 ? 'text-indigo-600' : 'text-zinc-400'}>Cultura</span>
                                                <span className="text-zinc-900">{100 - techWeight}%</span>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className={techWeight >= 50 ? 'text-indigo-600' : 'text-zinc-400'}>Técnica</span>
                                                <span className="text-zinc-900">{techWeight}%</span>
                                            </div>
                                        </div>
                                        <input
                                            type="range"
                                            min="0" max="100"
                                            value={techWeight}
                                            onChange={(e) => setTechWeight(parseInt(e.target.value))}
                                            className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                        />
                                        <p className="text-[10px] text-zinc-500 font-medium leading-relaxed italic">
                                            {techWeight > 70 ? 'Foco em domínio técnico e senioridade.' :
                                                techWeight < 30 ? 'Foco em competências comportamentais e potencial.' :
                                                    'Equilíbrio entre habilidades técnicas e perfil cultural.'}
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-zinc-50 space-y-4">
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase">Must-Haves</span>
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div
                                            onClick={() => setMustHaveEnglish(!mustHaveEnglish)}
                                            className={`w-10 h-6 rounded-full p-1 transition-colors ${mustHaveEnglish ? 'bg-indigo-600' : 'bg-zinc-100'}`}
                                        >
                                            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${mustHaveEnglish ? 'translate-x-4' : 'translate-x-0'}`} />
                                        </div>
                                        <span className="text-xs font-bold text-zinc-600 group-hover:text-zinc-900 transition-colors">Inglês Fluente</span>
                                    </label>
                                </div>

                                <div className="pt-4 border-t border-zinc-50 space-y-4">
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase">Senioridade Real</span>
                                    <select
                                        value={minSeniority}
                                        onChange={(e) => setMinSeniority(e.target.value)}
                                        className="w-full bg-zinc-50 border-none rounded-xl p-3 text-xs font-bold text-zinc-600 outline-none focus:ring-2 focus:ring-indigo-500/10"
                                    >
                                        <option value="ALL">Todos os níveis</option>
                                        <option value="Junior">Junior (0-2 anos)</option>
                                        <option value="Mid-Level">Pleno (2-5 anos)</option>
                                        <option value="Senior">Senior (5+ anos)</option>
                                    </select>
                                </div>

                                <div className="pt-4 border-t border-zinc-50 space-y-4">
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase">Nível de Escolaridade</span>
                                    <select
                                        value={minEducation}
                                        onChange={(e) => setMinEducation(e.target.value)}
                                        className="w-full bg-zinc-50 border-none rounded-xl p-3 text-xs font-bold text-zinc-600 outline-none focus:ring-2 focus:ring-indigo-500/10"
                                    >
                                        <option value="ALL">Qualquer formação</option>
                                        <option value="Graduação">Graduação</option>
                                        <option value="Pós-Graduação">Pós-Graduação / MBA</option>
                                        <option value="Mestrado">Mestrado / Doutorado</option>
                                        <option value="Técnico">Ensino Técnico</option>
                                    </select>
                                </div>

                                <div className="pt-4 border-t border-zinc-50 space-y-4">
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase">Funil de Recrutamento</span>
                                    <div className="flex flex-col gap-2">
                                        <button
                                            onClick={() => setPipelineFilter('ALL')}
                                            className={`p-3 rounded-xl text-xs font-bold text-left transition-all ${pipelineFilter === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100'}`}
                                        >
                                            Todos
                                        </button>
                                        <button
                                            onClick={() => setPipelineFilter('new')}
                                            className={`p-3 rounded-xl text-xs font-bold text-left transition-all ${pipelineFilter === 'new' ? 'bg-indigo-600 text-white' : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100'}`}
                                        >
                                            Novos
                                        </button>
                                    </div>
                                </div>
                            </section>
                        </aside>

                        {/* List */}
                        <div className="lg:col-span-3 space-y-4">
                            {isInitialLoading ? (
                                <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>
                                    {[1, 2, 3, 4, 5, 6].map(i => (
                                        <CandidateSkeleton key={i} />
                                    ))}
                                </div>
                            ) : filtered.length === 0 ? (
                                <div className="text-center p-12 bg-white rounded-[2rem] border border-dashed border-zinc-200">
                                    <Users className="mx-auto h-12 w-12 text-zinc-200 mb-4" />
                                    <p className="text-zinc-400 font-bold">Nenhum candidato encontrado.</p>
                                </div>
                            ) : (
                                <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>
                                    {filtered.map(candidate => (
                                        <CandidateCard
                                            key={candidate.id}
                                            candidate={candidate}
                                            onDelete={handleDelete}
                                            blindMode={blindMode}
                                            rankedScore={candidate.finalScore}
                                            onAddToJob={handleAddToJob}
                                        />
                                    ))}
                                </div>
                            )}


                        </div>
                    </div>
                </div>

                <PdfViewer
                    isOpen={!!previewUrl}
                    url={previewUrl}
                    onClose={() => setPreviewUrl(null)}
                />

                <JobSelectorModal
                    isOpen={isJobSelectorOpen}
                    onClose={() => setIsJobSelectorOpen(false)}
                    onSelect={handleSelectJob}
                    onCreateNew={() => {
                        setIsJobSelectorOpen(false)
                        setIsNewJobModalOpen(true)
                    }}
                />

                <NewJobModal
                    isOpen={isNewJobModalOpen}
                    onClose={() => setIsNewJobModalOpen(false)}
                    onSuccess={(jobId) => {
                        setIsNewJobModalOpen(false)
                        // After creating a new job, we automatically select it for the pending candidate
                        if (selectedCandidateId) {
                            handleSelectJob(jobId)
                        }
                    }}
                />
            </div>
        </div>
    );
}

export default function CandidatesPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        }>
            <CandidatesPageContent />
        </Suspense>
    )
}

function StatusBadge({ status, score }: { status: string, score: number }) {
    if (status === 'DONE') {
        const isTalentPool = !score // Simplificação ou checar se existe job_id
        return (
            <div className="flex items-center gap-3">
                <div className={`px-3 py-1 rounded-lg text-xs font-black ${score >= 70 ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-100 text-zinc-500'}`}>
                    {score || 0}%
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                    <CheckCircle2 size={12} />
                    <span>Processado</span>
                </div>
            </div>
        )
    }

    if (status === 'ERROR') {
        return (
            <div className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full">
                <AlertCircle size={12} />
                <span>Erro na IA</span>
            </div>
        )
    }

    return (
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full animate-pulse">
            <Loader2 size={12} className="animate-spin" />
            <span>Processando...</span>
        </div>
    )
}
