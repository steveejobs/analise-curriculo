
import React, { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Trash2,
    Eye,
    CheckCircle2,
    AlertCircle,
    Loader2,
    ShieldAlert,
    BrainCircuit,
    UserCheck,
    Briefcase,
    Zap,
    Target,
    Clock,
    Search,
    ChevronDown,
    Mail,
    Globe,
    Upload,
    ThumbsUp,
    ThumbsDown,
    Plus
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { calculateWeightedScore } from '@/lib/scoring'

// Interfaces matching the AI Agent output v1.2
interface JobApplication {
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
}

interface CandidateCardProps {
    candidate: JobApplication
    onDelete: (id: string) => void
    blindMode?: boolean
    rankedScore?: number
    onAddToJob?: (id: string) => void
}

export function CandidateCard({ candidate, onDelete, blindMode = false, rankedScore, onAddToJob }: CandidateCardProps) {
    const [updating, setUpdating] = useState(false)
    const [currentStatus, setCurrentStatus] = useState(candidate.pipeline_status || 'new')
    const [localBlind, setLocalBlind] = useState(false)
    const [isExpanded, setIsExpanded] = useState(false)
    const isBlind = blindMode || localBlind

    // Sync local state with props when they change (e.g. via parent update or realtime)
    React.useEffect(() => {
        if (candidate.pipeline_status) {
            setCurrentStatus(candidate.pipeline_status)
        }
    }, [candidate.pipeline_status])

    const evalData = candidate.criteria_evaluation || {}
    const isTalentPool = !candidate.job_id
    const briefingCategory = evalData.briefing_category || 'Operacional'
    const finalScore = Math.round(rankedScore ?? calculateWeightedScore(candidate))
    const rationale = evalData.rationale_consolidado || candidate.ai_explanation || ''


    async function handleStatusUpdate(newStatus: string) {
        setUpdating(true)

        if (newStatus === 'triagem') {
            try {
                // 1. Clone via API (Primary Method) - sends to the "Global" pipeline
                const response = await fetch('/api/candidates/clone', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ candidateId: candidate.id })
                })

                if (!response.ok) {
                    throw new Error('API Clone Failed')
                }

                // 2. Persist status on the original record to reflect it has been "liked"
                await supabase
                    .from('job_applications')
                    .update({ pipeline_status: 'triagem' })
                    .eq('id', candidate.id)

                setCurrentStatus('triagem')
                toast.success('Candidato curtido e enviado para a Pup Line!')
            } catch (error: any) {
                console.warn('API Clone failed, attempting client-side fallback...', error)

                // --- FALLBACK STRATEGY (Client-Side) ---
                try {
                    const { data: fullCandidate, error: fetchError } = await supabase
                        .from('job_applications')
                        .select('*')
                        .eq('id', candidate.id)
                        .single()

                    if (fetchError || !fullCandidate) throw new Error('Fallback fetch failed')

                    const { id, created_at, ...rest } = fullCandidate
                    const clonedData = {
                        ...rest,
                        job_id: null,
                        pipeline_status: 'triagem',
                        ai_status: 'DONE',
                        execution_stage: 'CLONED_FROM_BANK',
                        ai_explanation: rest.ai_explanation
                    }

                    const { error: insertError } = await supabase
                        .from('job_applications')
                        .insert([clonedData])

                    if (insertError) throw insertError

                    await supabase
                        .from('job_applications')
                        .update({ pipeline_status: 'triagem' })
                        .eq('id', candidate.id)

                    setCurrentStatus('triagem')
                    toast.success('Candidato curtido (Fallback ativo)')

                } catch (fallbackError: any) {
                    console.error('Fallback failed:', fallbackError)
                    toast.error('Erro ao processar: ' + fallbackError.message)
                }
            }
        } else {
            const updates: any = {
                pipeline_status: newStatus
            }

            if (newStatus === 'reviewing') {
                updates.pipeline_status = 'triagem'
                updates.ai_status = 'DONE'
            }

            const { error } = await supabase
                .from('job_applications')
                .update(updates)
                .eq('id', candidate.id)

            if (error) {
                toast.error('Erro ao atualizar status: ' + error.message)
            } else {
                setCurrentStatus(updates.pipeline_status)
                toast.success('Candidato atualizado')
            }
        }
        setUpdating(false)
    }

    async function handleDisqualify() {
        if (!confirm('Deseja desqualificar este candidato? Isso enviará um e-mail automático e o moverá para a lixeira.')) return

        setUpdating(true)

        try {
            // 1. Trigger Local Email API for rejection
            const response = await fetch('/api/email/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    candidateId: candidate.id,
                    templateName: 'Disqualification'
                })
            })

            if (!response.ok) {
                const data = await response.json()
                console.warn('E-mail falhou:', data.error)
            }

            // 2. Mark as discarded using existing pipeline_status
            const { error: dbError } = await supabase
                .from('job_applications')
                .update({
                    pipeline_status: 'discarded'
                })
                .eq('id', candidate.id)

            if (dbError) throw dbError

            toast.success('Candidato desqualificado e movido para a lixeira.')
            onDelete(candidate.id)
        } catch (error: any) {
            toast.error('Erro ao desqualificar: ' + error.message)
        } finally {
            setUpdating(false)
        }
    }

    // Extracted from Schema v1.2
    const skills = evalData.top_skills || []
    const source = evalData.source_detected || 'Upload'

    // UI Helpers


    const getScoreColor = (score: number) => {
        if (briefingCategory === 'Talento Jovem') return 'text-zinc-500' // Neutro para Estrelas em Ascensão
        if (score >= 70) return 'text-emerald-600'
        return 'text-zinc-400'
    }

    const getScoreLabel = () => {
        if (isTalentPool || briefingCategory === 'Talento Jovem') return 'Potencial'
        return 'Match'
    }

    const getCategoryBadge = (cat: string) => {
        switch (cat) {
            case 'Especialista / Sênior': return 'bg-indigo-50 text-indigo-600 border-indigo-100'
            case 'Talento Jovem': return 'bg-zinc-100 text-zinc-600 border-zinc-200' // Label cinza conforme solicitado
            case 'Operacional': return 'bg-blue-50 text-blue-600 border-blue-100'
            default: return 'bg-surface text-muted border-border'
        }
    }

    const getSourceIcon = (src: string) => {
        switch (src) {
            case 'Email': return <Mail size={12} />
            case 'LinkedIn': return <Globe size={12} />
            case 'Upload': return <Upload size={12} />
            default: return <Search size={12} />
        }
    }

    const formatCandidateName = (name: string, isFromAI: boolean = false) => {
        if (!name) return 'Candidato não identificado';

        // If it's already from AI, we just trust it but trim
        if (isFromAI && !name.includes('_') && !name.includes('.') && name.length > 3) {
            return name.trim();
        }

        // Noise words to remove from filenames
        const noiseWords = [
            'Curriculo', 'Currículo', 'CV', 'Resume', 'Resumo', 'Profissional',
            'Atualizado', 'Completo', 'V1', 'V2', 'Final', 'Candidato', 'Marketing', 'Engenharia', 'Vendas', 'Suporte', 'Operacional', 'TI'
        ];

        // Initial cleaning
        let cleaned = name
            .replace(/\.[^/.]+$/, "") // Remove extension
            .replace(/[-_]/g, " ")   // Underscores to spaces
            .replace(/\b(202\d|v\d)\b/gi, "") // Years or versions
            .trim();

        // Word by word cleanup
        const words = cleaned.split(/\s+/);
        const filteredWords = words.filter(word => {
            const normalized = word.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
            return !noiseWords.some(noise =>
                noise.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() === normalized
            );
        });

        const result = filteredWords.join(" ").trim();
        return result || 'Candidato não identificado';
    };


    // Prioritize name extracted by AI
    const extractedName = evalData.candidate_name;
    const displayName = extractedName &&
        extractedName !== 'Candidato não identificado' &&
        extractedName.toLowerCase() !== 'de marketing' &&
        extractedName.toLowerCase() !== 'marketing'
        ? formatCandidateName(extractedName, true)
        : formatCandidateName(candidate.candidate_name, false);


    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileTap={{ scale: 0.98 }}
            className="group p-6 rounded-[2rem] border border-indigo-100/80 bg-white hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/5 transition-all flex flex-col gap-4 relative overflow-hidden animate-in"
        >
            {/* Background Glow Effect on Hover */}
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Header: Name, Score and Actions */}
            <div className="flex items-start justify-between relative z-10">
                <div className="flex items-center gap-4 max-w-[70%]">
                    {/* Progress Ring / Score Visual */}
                    <div className="relative flex items-center justify-center shrink-0 w-16 h-16">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="32"
                                cy="32"
                                r="28"
                                stroke="currentColor"
                                strokeWidth="3"
                                fill="transparent"
                                className="text-border/40"
                            />
                            <motion.circle
                                cx="32"
                                cy="32"
                                r="28"
                                stroke="currentColor"
                                strokeWidth="3.5"
                                fill="transparent"
                                strokeDasharray={176}
                                initial={{ strokeDashoffset: 176 }}
                                animate={{ strokeDashoffset: 176 - (176 * finalScore) / 100 }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className={getScoreColor(finalScore)}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center leading-none">
                            <span className={`text-[15px] font-black tracking-tight ${getScoreColor(finalScore)}`}>
                                {finalScore}%
                            </span>
                            <span className="text-[7px] font-bold uppercase tracking-tight text-muted/40">
                                {getScoreLabel()}
                            </span>
                        </div>
                    </div>

                    <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                            <h3 className={`font-bold text-lg leading-tight transition-all ${isBlind ? 'text-muted/30 blur-sm select-none' : 'text-dark group-hover:text-primary'}`} title={displayName}>
                                {isBlind ? 'Candidato Oculto' : displayName}
                            </h3>

                            <button
                                onClick={() => setLocalBlind(!localBlind)}
                                className="shrink-0 p-1 rounded-md hover:bg-surface text-muted/30 transition-colors"
                                title={isBlind ? "Revelar nome" : "Ocultar nome"}
                            >
                                <Eye size={14} className={isBlind ? "opacity-100" : "opacity-0 group-hover:opacity-100"} />
                            </button>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted">
                            <div className="flex items-center gap-1">
                                {getSourceIcon(source)}
                                <span className="font-medium">{source}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => currentStatus === 'triagem' ? handleStatusUpdate('new') : handleStatusUpdate('triagem')}
                        disabled={updating}
                        className={`p-2 rounded-lg transition-all ${currentStatus === 'triagem' ? 'bg-indigo-100 text-indigo-600 shadow-inner' : 'text-muted hover:text-indigo-600 hover:bg-indigo-50'}`}
                        title={currentStatus === 'triagem' ? "Remover do Pup Line" : "Aprovar para análise (Pup Line)"}
                    >
                        <ThumbsUp size={18} fill={currentStatus === 'triagem' ? 'currentColor' : 'none'} />
                    </button>
                    <button
                        onClick={handleDisqualify}
                        disabled={updating}
                        className="p-2 rounded-lg text-muted hover:text-rose-600 hover:bg-rose-50 transition-all"
                        title="Desqualificar candidato"
                    >
                        <ThumbsDown size={18} />
                    </button>
                    <button
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            onAddToJob?.(candidate.id)
                        }}
                        disabled={updating}
                        className={`p-2 rounded-lg transition-all ml-1 ${!isTalentPool ? 'bg-indigo-600 text-white shadow-lg' : 'text-muted hover:text-indigo-600 hover:bg-indigo-50 bg-indigo-50/30'}`}
                        title={!isTalentPool ? "Candidato vinculado a uma vaga" : "Adicionar à uma Vaga"}
                    >
                        {!isTalentPool ? <CheckCircle2 size={18} /> : <Plus size={18} />}
                    </button>
                </div>

                <div className="w-px h-6 bg-border mx-1" />

                <div className="flex items-center gap-1 bg-surface p-1 rounded-xl">
                    <Link href={`/candidates/${candidate.id}`}>
                        <button className="p-2 text-muted hover:text-primary hover:bg-white hover:shadow-sm rounded-lg transition-all">
                            <Eye size={18} />
                        </button>
                    </Link>
                    <button
                        onClick={() => onDelete(candidate.id)}
                        className="p-2 text-muted hover:text-destructive hover:bg-white hover:shadow-sm rounded-lg transition-all"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            {
                candidate.ai_status === 'DONE' && (evalData.professional_summary || evalData.consolidated_rationale) && (
                    <div className={`relative z-10 overflow-hidden transition-all duration-500 rounded-2xl border mb-2 ${(evalData.professional_summary || "").includes('⚠️') || (evalData.consolidated_rationale || "").includes('⚠️')
                        ? 'bg-destructive/5 border-destructive/10'
                        : isExpanded ? 'bg-white shadow-sm border-primary/20 p-4' : 'bg-surface/50 border-border/40 p-3'
                        }`}>
                        <motion.div
                            layout
                            initial={false}
                            animate={{
                                height: isExpanded ? "auto" : "55px",
                            }}
                            transition={{
                                duration: 0.4,
                                ease: [0.4, 0, 0.2, 1]
                            }}
                            className="relative overflow-hidden"
                        >
                            <div className="flex flex-col gap-2">
                                {evalData.professional_summary && (
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-primary/60 uppercase tracking-widest mb-0.5">Resumo do Perfil</span>
                                        <p className="text-[11px] leading-relaxed text-zinc-600 font-medium">
                                            {evalData.professional_summary}
                                        </p>
                                    </div>
                                )}

                                {isExpanded && evalData.consolidated_rationale && (
                                    <div className="flex flex-col pt-2 border-t border-zinc-100 mt-1">
                                        <span className="text-[10px] font-black text-primary/60 uppercase tracking-widest mb-0.5">Análise</span>
                                        <p className={`text-[11px] leading-relaxed ${evalData.consolidated_rationale.includes('⚠️') ? 'text-destructive font-bold' : 'text-muted italic'}`}>
                                            "{evalData.consolidated_rationale}"
                                        </p>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {(evalData.professional_summary?.length > 100 || evalData.consolidated_rationale) && (
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="mt-2 flex items-center gap-1.5 text-[9px] font-black text-primary/60 hover:text-primary transition-all uppercase tracking-widest group/btn"
                            >
                                <span className="relative">
                                    {isExpanded ? 'Recolher Detalhes' : 'Ver Parecer Completo'}
                                    <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-primary/30 transition-all group-hover/btn:w-full" />
                                </span>
                                <div className={`p-0.5 rounded-full bg-primary/5 transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`}>
                                    <ChevronDown size={10} />
                                </div>
                            </button>
                        )}
                    </div>
                )
            }

            {/* Skills & Quick Insights */}
            <div className="relative z-10 flex flex-col gap-3">
                {candidate.ai_status === 'DONE' ? (
                    <>


                        <div className="flex flex-wrap gap-1.5 min-h-[48px]">
                            {skills.slice(0, 10).map((skill: string, idx: number) => (
                                <span
                                    key={idx}
                                    className="px-2 py-1 rounded-lg bg-primary/5 text-primary text-[10px] font-bold border border-primary/10 hover:bg-primary hover:text-white transition-colors cursor-default capitalize"
                                >
                                    {skill}
                                </span>
                            ))}
                            {skills.length > 10 && (
                                <span className="px-2 py-1 rounded-lg bg-surface text-muted text-[10px] font-bold border border-border">
                                    +{skills.length - 10}
                                </span>
                            )}
                        </div>


                    </>
                ) : (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border animate-pulse">
                        <Loader2 size={16} className="text-muted/50 animate-spin" />
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-muted">
                                {candidate.ai_status === 'ERROR' ? 'Erro na análise' : 'Analisando currículo...'}
                            </span>
                            {candidate.execution_stage && candidate.ai_status !== 'ERROR' && (
                                <span className="text-[10px] text-muted/60 font-medium uppercase tracking-widest">
                                    Etapa: {candidate.execution_stage.replace(/_/g, ' ')}
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>


            <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-[10px] text-muted/50 font-medium">
                    <Clock size={10} />
                    Recebido em {new Date(candidate.created_at).toLocaleDateString('pt-BR')}
                </span>
            </div>
        </motion.div>
    )
}

function StatusBadge({ status, score }: { status: string, score: number }) {
    if (status === 'DONE') {
        const isHigh = score >= 70
        const isMed = score >= 50 && score < 70

        let colorClass = 'bg-surface text-muted'
        if (isHigh) colorClass = 'bg-primary/5 text-primary border border-primary/10'
        else if (isMed) colorClass = 'bg-warning/5 text-warning border border-warning/10'

        return (
            <div className="flex items-center gap-3">
                <div className={`px-3 py-1 rounded-lg text-xs font-black ${colorClass}`}>
                    Score {score || 0}
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/5 px-3 py-1 rounded-full border border-primary/10">
                    <CheckCircle2 size={12} />
                    <span className="hidden sm:inline">Processado</span>
                </div>
            </div>
        )
    }

    if (status === 'ERROR') {
        return (
            <div className="flex items-center gap-1.5 text-xs font-bold text-destructive bg-destructive/5 px-3 py-1 rounded-full border border-destructive/10">
                <AlertCircle size={12} />
                <span>Erro</span>
            </div>
        )
    }

    return (
        <div className="flex items-center gap-1.5 text-xs font-bold text-warning bg-warning/5 px-3 py-1 rounded-full border border-warning/10 animate-pulse">
            <Loader2 size={12} className="animate-spin" />
            <span className="hidden sm:inline">Analisando...</span>
        </div>
    )
}
