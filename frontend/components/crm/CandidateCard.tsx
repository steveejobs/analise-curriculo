'use client'

import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { MoreHorizontal, GripVertical, Star, Calendar, Zap, Trash2, Eye, ThumbsDown, Plus, Briefcase, MapPin, Loader2, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react'
import { JobSelectorModal } from '@/components/candidates/JobSelectorModal'
import { NewJobModal } from '@/components/crm/NewJobModal'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import Link from 'next/link'
import { calculateWeightedScore } from '@/lib/scoring'

import { JobApplication } from '@/lib/types'

interface CandidateCardProps {
    candidate: JobApplication;
    filterJobId?: string;
    onOpenProfile?: (candidate: JobApplication) => void;
    onUpdateStatus?: (candidateId: string, newStatus: string) => void;
}

export function CandidateCard({ candidate, filterJobId, onOpenProfile, onUpdateStatus }: CandidateCardProps) {
    const [isUpdating, setIsUpdating] = React.useState(false)
    const [isJobSelectorOpen, setIsJobSelectorOpen] = React.useState(false)
    const [isNewJobModalOpen, setIsNewJobModalOpen] = React.useState(false)
    const [isExpanded, setIsExpanded] = React.useState(false)

    const formatCandidateName = (name: string, isFromAI: boolean = false) => {
        if (!name) return 'Candidato não identificado';

        if (isFromAI && !name.includes('_') && !name.includes('.') && name.length > 3) {
            return name.trim();
        }

        const noiseWords = [
            'Curriculo', 'Currículo', 'CV', 'Resume', 'Resumo', 'Profissional',
            'Atualizado', 'Completo', 'V1', 'V2', 'Final', 'Candidato'
        ];

        let cleaned = name
            .replace(/\.[^/.]+$/, "")
            .replace(/[-_]/g, " ")
            .replace(/\b(202\d|v\d)\b/gi, "")
            .trim();

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

    const evalData = candidate.criteria_evaluation || {}
    const extractedName = evalData.candidate_name;
    const displayName = extractedName && extractedName !== 'Candidato não identificado'
        ? formatCandidateName(extractedName, true)
        : formatCandidateName(candidate.candidate_name, false);

    const briefingCategory = evalData.briefing_category || 'Operacional'
    const skills = evalData.top_skills || []

    const status = (candidate.ai_status || '').toUpperCase();
    const stage = (candidate.execution_stage || '').toUpperCase();

    const isAnalyzing = ['PENDING', 'ANALYZING', 'QUEUED_REANALYSIS', 'STARTING_JOB_ANALYSIS'].includes(status) ||
        ['PENDING', 'ANALYZING', 'QUEUED_REANALYSIS', 'STARTING_JOB_ANALYSIS'].includes(stage);

    const finalScore = isAnalyzing ? 0 : calculateWeightedScore(candidate)

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: candidate.id,
        data: {
            type: 'candidate',
            candidate
        }
    })

    const handleUnlike = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsUpdating(true)
        const { error } = await supabase
            .from('job_applications')
            .update({
                pipeline_status: 'new',
                ai_status: 'DONE'
            })
            .eq('id', candidate.id)

        if (error) {
            toast.error('Erro ao remover: ' + error.message)
        } else {
            toast.success('Candidato removido do Pup Line')
        }
        setIsUpdating(false)
    }

    const handleDiscard = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        onUpdateStatus?.(candidate.id, 'reprovado')
    }

    const handleAssignToJob = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsJobSelectorOpen(true)
    }

    const handleSelectJob = async (jobId: string) => {
        setIsJobSelectorOpen(false)
        setIsUpdating(true)

        try {
            const response = await fetch('/api/candidates/clone', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    candidateId: candidate.id,
                    jobId: jobId
                })
            })

            const result = await response.json()
            if (!response.ok) throw new Error(result.error || 'Erro ao vincular')

            // Update the original if it was "loose" (no job_id)
            if (!candidate.job_id) {
                await supabase
                    .from('job_applications')
                    .update({ job_id: jobId, pipeline_status: 'triagem' })
                    .eq('id', candidate.id)
            }

            toast.success('Candidato vinculado com sucesso!')
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setIsUpdating(false)
        }
    }

    const professionalSummary = evalData.professional_summary;

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 1,
        opacity: isDragging ? 0.3 : 1
    }

    const getScoreColor = (score: number) => {
        if (score >= 70) return 'text-emerald-500 bg-emerald-50 border-emerald-100'
        return 'text-zinc-500 bg-zinc-50 border-zinc-100'
    }

    return (
        <>
            <motion.div
                ref={setNodeRef}
                style={style}
                {...attributes}
                {...listeners}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -4, boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.08)" }}
                whileTap={{ scale: 0.98 }}
                className={`
                    relative p-5 rounded-[2.2rem] border bg-white transition-all
                    hover:border-indigo-200 active:cursor-grabbing group
                    ${isDragging ? 'border-indigo-400 shadow-2xl z-50 ring-4 ring-indigo-500/10' : 'border-zinc-100'}
                    ${isUpdating ? 'opacity-50 pointer-events-none' : ''}
                `}
            >
                {/* Action Bar Overlay */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0 z-20">
                    <button
                        onClick={handleAssignToJob}
                        className="p-2 bg-white/80 backdrop-blur-md shadow-sm border border-zinc-100 rounded-xl text-zinc-400 hover:text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50 transition-all group/btn flex items-center gap-1"
                        title="Vincular a uma Vaga"
                    >
                        <Plus size={14} />
                    </button>

                    {/* Discard Button (Trash) - Lixeiro */}
                    <button
                        onClick={handleDiscard}
                        className="p-2 bg-white/80 backdrop-blur-md shadow-sm border border-zinc-100 rounded-xl text-zinc-400 hover:text-rose-500 hover:border-rose-100 hover:bg-rose-50 transition-all group/btn flex items-center gap-1"
                        title="Descartar Candidato"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>

                <div className="absolute -left-1 opacity-0 group-hover:opacity-100 transition-all duration-300 top-1/2 -translate-y-1/2 text-zinc-200">
                    <GripVertical size={16} />
                </div>

                <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between relative group/card-link">
                        <div
                            className="absolute inset-0 z-10 cursor-pointer"
                            onClick={(e) => {
                                if (isDragging) {
                                    e.preventDefault();
                                    return;
                                }
                                onOpenProfile?.(candidate);
                            }}
                        />
                        <div className="flex items-center gap-3.5 relative z-0">
                            <div className="w-11 h-11 rounded-2xl border border-zinc-100 flex items-center justify-center overflow-hidden bg-zinc-50 shadow-sm">
                                <div className="w-full h-full flex items-center justify-center text-sm font-black text-zinc-400 bg-gradient-to-br from-zinc-50 to-zinc-100/50 uppercase">
                                    {displayName.charAt(0)}
                                </div>
                            </div>
                            <div className="min-w-0">
                                <h4 className="font-black text-zinc-900 text-[13px] leading-tight truncate tracking-tight group-hover/card-link:text-indigo-600 transition-colors" title={displayName}>
                                    {displayName}
                                </h4>
                                <div className="flex flex-col mt-0.5">
                                    {/* Cargo/Função e Localização */}
                                    <div className="flex flex-col gap-0.5 mb-1">
                                        <span className="text-[10px] text-zinc-500 font-black uppercase tracking-tight truncate leading-none">
                                            {evalData.senioridade_estimada ? `${evalData.senioridade_estimada} • ` : ''}
                                            {evalData.cargos_compativeis?.[0] || 'Profissional'}
                                        </span>
                                        {(evalData.location || (candidate as any).location) && (
                                            <div className="flex items-center gap-1 text-[9px] text-zinc-400 font-bold">
                                                <MapPin size={8} />
                                                <span className="truncate">{evalData.location || (candidate as any).location}</span>
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-[9px] text-zinc-400 font-bold truncate tracking-tight opacity-60">
                                        {candidate.candidate_email}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {isAnalyzing ? (
                            <div className="flex items-center justify-center w-10 h-8 rounded-xl bg-indigo-50 border border-indigo-100 shadow-sm relative z-20 overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                                <Loader2 size={14} className="text-indigo-600 animate-spin" />
                            </div>
                        ) : (
                            <div className={`px-2.5 py-1 rounded-xl text-[11px] font-black border ${getScoreColor(finalScore)} shadow-sm tracking-tighter relative z-20`}>
                                {finalScore}%
                            </div>
                        )}
                    </div>

                    {/* Resuminho Minimizado */}
                    {professionalSummary && (
                        <div className="bg-zinc-50/50 rounded-[1.2rem] p-3.5 border border-zinc-100/50 group/summary relative">
                            <p className={`text-[11px] leading-relaxed text-zinc-500 font-bold ${isExpanded ? '' : 'line-clamp-2'}`}>
                                {professionalSummary}
                            </p>
                            <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsExpanded(!isExpanded) }}
                                className="mt-2 text-[9px] font-black text-indigo-600 uppercase tracking-tight flex items-center gap-1 hover:text-indigo-700 transition-colors"
                            >
                                {isExpanded ? (
                                    <><ChevronUp size={10} /> Ver menos</>
                                ) : (
                                    <><ChevronDown size={10} /> Ver mais</>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Botões de Ação Rápida Removidos - Ações agora no Overlay Superior */}

                    {/* Skills Tags */}
                    {skills && skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {skills.slice(0, 3).map((skill: string, idx: number) => (
                                <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-tight border border-indigo-100"
                                >
                                    {skill}
                                </span>
                            ))}
                            {skills.length > 3 && (
                                <span className="px-2 py-0.5 rounded-lg bg-zinc-50 text-zinc-400 text-[9px] font-black uppercase tracking-tight border border-zinc-100">
                                    +{skills.length - 3}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Footer Info */}
                    <div className="flex items-center justify-between pt-3 mt-1 border-t border-zinc-50/80">
                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.1em]">
                            {briefingCategory}
                        </span>

                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-zinc-400 opacity-60">
                            <Calendar size={10} />
                            {new Date(candidate.created_at).toLocaleDateString('pt-BR')}
                        </div>
                    </div>
                </div>
            </motion.div>

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
                    handleSelectJob(jobId)
                }}
            />
        </>
    )
}

