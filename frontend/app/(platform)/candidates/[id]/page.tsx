'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft,
    MapPin,
    Mail,
    Linkedin,
    FileText,
    CheckCircle2,
    XCircle,
    Info,
    ShieldCheck,
    ChevronRight,
    Brain,
    TrendingUp,
    Clock,
    Users,
    Download,
    Eye
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { DetailedCandidateView } from '@/components/DetailedCandidateView'

interface Candidate {
    id: string
    candidate_name: string
    candidate_email: string
    resume_url: string
    ai_score: number
    ai_status: string
    ai_explanation: string
    processed_at: string
    created_at: string
    priority?: string
    criteria_evaluation: any
    matching_rationale?: string
    rationale?: string
}

export default function CandidateDetailPage() {
    const { id } = useParams()
    const router = useRouter()
    const [candidate, setCandidate] = useState<Candidate | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchCandidate() {
            if (!id) return
            try {
                const { data, error } = await supabase
                    .from('job_applications')
                    .select('*')
                    .eq('id', id)
                    .single()

                if (error) throw error
                setCandidate(data)
            } catch (err) {
                console.error('Erro ao carregar candidato:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchCandidate()
    }, [id])

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Brain className="w-12 h-12 text-zinc-200 animate-bounce" />
                    <p className="font-black text-zinc-400 uppercase tracking-widest animate-pulse">Sincronizando Dados...</p>
                </div>
            </div>
        )
    }

    if (!candidate) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <div className="text-center">
                    <p className="font-bold text-red-500 mb-4">Candidato não encontrado.</p>
                    <Link href="/candidates" className="text-zinc-500 hover:underline">Voltar para a lista</Link>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
            {/* Header Reduzido e Premium */}
            <div className="bg-white border-b border-zinc-100 p-6 shadow-sm sticky top-0 z-30">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link href="/candidates" className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-all">
                            <ArrowLeft size={18} />
                        </Link>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-zinc-950 flex items-center justify-center text-white text-xl font-black italic shadow-lg shadow-zinc-200">
                                {candidate.candidate_name?.charAt(0) || '?'}
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
                                    {candidate.candidate_name}
                                    {candidate.ai_score >= 80 && <ShieldCheck size={18} className="text-emerald-500" />}
                                </h2>
                                <p className="text-xs font-bold text-zinc-400 flex items-center gap-3">
                                    <span className="flex items-center gap-1"><Mail size={12} /> {candidate.candidate_email}</span>
                                    <span className="w-1 h-1 rounded-full bg-zinc-200" />
                                    <span className="flex items-center gap-1 uppercase tracking-widest">{candidate.ai_status}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <a
                            href={candidate.resume_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-zinc-950 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center gap-2"
                        >
                            <Download size={14} /> Baixar CV
                        </a>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto p-8 w-full space-y-8">
                {/* View de Análise Detalhada */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {candidate.criteria_evaluation ? (
                        <DetailedCandidateView
                            candidate={candidate}
                            analysis={{
                                score: candidate.ai_score,
                                rationale: candidate.rationale || candidate.matching_rationale || candidate.criteria_evaluation?.rationale || candidate.ai_explanation,
                                ...candidate.criteria_evaluation
                            }}
                        />
                    ) : (
                        <div className="p-16 bg-white rounded-[3rem] border border-zinc-100 shadow-xl text-center space-y-4">
                            <Brain className="w-12 h-12 text-zinc-100 mx-auto" />
                            <p className="text-zinc-400 font-black uppercase tracking-widest text-xs">Aguardando Análise Profunda</p>
                            <p className="text-xs text-zinc-300 max-w-xs mx-auto">{candidate.ai_explanation || "Os dados do candidato estão sendo processados pela nossa inteligência artificial para extrair insights técnicos e comportamentais."}</p>
                        </div>
                    )}
                </div>

                {/* Arquivo Original Acoplado */}
                <section className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="h-[1px] flex-1 bg-zinc-100" />
                        <h3 className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.3em] flex items-center gap-2">
                            <Eye size={12} /> Documento Original Analisado
                        </h3>
                        <div className="h-[1px] flex-1 bg-zinc-100" />
                    </div>

                    <div className="bg-white rounded-[3rem] border border-zinc-100 shadow-xl shadow-zinc-200/20 overflow-hidden h-[800px] relative group">
                        <iframe
                            src={`${candidate.resume_url}#toolbar=0`}
                            className="w-full h-full border-none"
                            title="Currículo Original"
                        />
                        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none flex items-end justify-center pb-10 opacity-0 group-hover:opacity-100 transition-opacity">
                            <a
                                href={candidate.resume_url}
                                target="_blank"
                                className="px-8 py-4 bg-zinc-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl flex items-center gap-3 pointer-events-auto hover:scale-105 transition-transform"
                            >
                                <Eye size={18} /> Abrir em tela cheia
                            </a>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="p-10 text-center">
                <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">
                    Intelligent ATS • Audit Layer v2.0
                </p>
            </footer>
        </div>
    )
}
