'use client'

import React, { useState, useEffect } from 'react'
import {
    DndContext,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
    rectIntersection,
} from '@dnd-kit/core'
import {
    arrayMove,
    sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { PipelineColumn } from './PipelineColumn'
import { CandidateCard } from './CandidateCard'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { DetailedCandidateView } from '../DetailedCandidateView'

import { Candidate } from '@/lib/types'


interface CandidateCardProps {
    candidate: Candidate;
    filterJobId?: string; // Adicionado para permitir clonagem/vínculo rápido
}

interface PipelineBoardProps {
    jobId: string;
    initialCandidates: Candidate[];
    pipelineConfig?: any[]; // Dynamic stages
}

const DEFAULT_COLUMNS = [
    { id: 'triagem', title: 'Triagem', color: 'indigo' },
    { id: 'qualificacao', title: 'Qualificação', color: 'amber' },
    { id: 'finalistas', title: 'Finalistas', color: 'emerald' },
    { id: 'reprovado', title: 'Reprovado', color: 'red' },
] as const;

export function PipelineBoard({ jobId, initialCandidates, pipelineConfig }: PipelineBoardProps) {
    const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates)
    const [activeId, setActiveId] = useState<string | null>(null)
    const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)

    const currentColumns = pipelineConfig || DEFAULT_COLUMNS;

    // Helper to map DB status to Column ID
    const getColumnId = (candidate: Candidate): string => {
        const pipeStatus = candidate.pipeline_status?.toLowerCase();
        const aiStatus = candidate.ai_status?.toLowerCase();

        // 1. Prioritize pipeline_status
        const validIds = currentColumns.map(c => c.id);

        if (pipeStatus && (validIds.includes(pipeStatus) || ['reviewing', 'new', 'rejected'].includes(pipeStatus))) {
            if (['triagem', 'new'].includes(pipeStatus)) return 'triagem';
            if (['qualificacao', 'reviewing'].includes(pipeStatus)) return 'qualificacao';
            if (['finalistas'].includes(pipeStatus)) return 'finalistas';
            if (['reprovado', 'rejected'].includes(pipeStatus)) return 'reprovado';
            return pipeStatus as any;
        }

        // 2. Fallback para status da IA se o manual for nulo/inválido
        if (['applied', 'new', 'pending', 'uploading', 'analyzing', 'extracted'].includes(aiStatus || '')) return 'triagem';
        if (['done', 'DONE'].includes(aiStatus || '')) return 'triagem';
        if (['reviewing', 'interviewing'].includes(aiStatus || '')) return 'qualificacao';
        if (['hired'].includes(aiStatus || '')) return 'finalistas';
        if (['rejected', 'rejeitado', 'reprovado'].includes(aiStatus || '')) return 'reprovado';

        return currentColumns[0]?.id || 'triagem';
    }

    // Sync state when initialCandidates changes
    useEffect(() => {
        setCandidates(initialCandidates)
    }, [initialCandidates])

    // Columns grouping
    const columns = React.useMemo(() => {
        const groups: Record<string, Candidate[]> = {};
        currentColumns.forEach(col => {
            groups[col.id] = [];
        });

        candidates
            .filter(c => {
                // 1. Job ID filtering is now handled by the parent page or strict mode. 
                // We mainly rely on what's passed in `candidates`.

                // 2. SEGURANÇA: No Pup Line, nunca mostramos o registro ORIGINAL do Banco de Talentos (onde job_id é null)
                // EXCETO se ele estiver explicitamente em 'triagem' (o que acontece se o Like clonar ou se o fallback rodar no original)
                const isOriginalFromBank = !c.job_id && c.execution_stage !== 'CLONED_FROM_BANK';

                // Allow showing original if status is 'triagem' to be robust against cloning failures
                if (isOriginalFromBank && c.pipeline_status !== 'triagem') return false;

                return true;

            })
            .forEach(c => {
                const colId = getColumnId(c);
                if (groups[colId]) {
                    groups[colId].push(c);
                } else {
                    const fallbackId = currentColumns[0]?.id || 'triagem';
                    if (groups[fallbackId]) groups[fallbackId].push(c);
                }
            });
        return groups;
    }, [candidates, currentColumns]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const updateCandidateStatus = async (candidateId: string, newStatus: string) => {
        const oldCandidate = candidates.find(c => c.id === candidateId);
        if (!oldCandidate) return;

        const oldStatus = getColumnId(oldCandidate);

        // 1. Optimistic Update
        setCandidates((items) => {
            return items.map(item =>
                item.id === candidateId
                    ? { ...item, pipeline_status: newStatus }
                    : item
            );
        });

        // 2. Persist to API
        try {
            const { error } = await supabase
                .from('job_applications')
                .update({ pipeline_status: newStatus })
                .eq('id', candidateId);

            if (error) throw error;
            toast.success(`Candidato movido para ${currentColumns.find(c => c.id === newStatus)?.title || newStatus}`);

            // 3. Email Automation
            if (newStatus === 'reprovado') {
                await fetch('/api/email/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ candidateId, templateName: 'Disqualification' })
                }).catch(console.error);
            }
        } catch (err: any) {
            console.error('Error updating status:', err);
            toast.error('Erro ao salvar: ' + err.message);
            // Revert on error
            setCandidates((items) => {
                return items.map(item =>
                    item.id === candidateId
                        ? { ...item, pipeline_status: oldCandidate.pipeline_status }
                        : item
                );
            });
        }
    }

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    }

    const handleDragOver = (event: DragOverEvent) => {
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        const activeCandidate = candidates.find(c => c.id === activeId);
        if (!activeCandidate) return;

        const activeContainer = getColumnId(activeCandidate);

        // Determine target container (column ID)
        let overContainer = over.data.current?.sortable?.containerId || overId;

        // If dropped on a CandidateCard, find its container
        const overValidIds = currentColumns.map(c => c.id);
        if (!overValidIds.includes(overContainer)) {
            const overCandidate = candidates.find(c => c.id === overId);
            if (overCandidate) {
                overContainer = getColumnId(overCandidate);
            } else {
                overContainer = activeContainer; // Fallback
            }
        }

        if (activeContainer !== overContainer) {
            updateCandidateStatus(activeId, overContainer);
        }
    }

    // ... animation ...
    const dropAnimation = {
        sideEffects: defaultDropAnimationSideEffects({
            styles: {
                active: {
                    opacity: '0.5',
                },
            },
        }),
    };

    // Realtime changes
    useEffect(() => {
        const channelName = jobId === 'all' ? 'global-pup-line' : `job-${jobId}`
        const filter = jobId === 'all' ? undefined : `job_id=eq.${jobId}`

        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'job_applications',
                },
                (payload) => {
                    console.log('Realtime update:', payload);
                    if (payload.eventType === 'INSERT') {
                        setCandidates((prev) => {
                            if (prev.some(c => c.id === payload.new.id)) return prev;

                            const newC = payload.new as Candidate;
                            const isOriginalFromBank = !newC.job_id && newC.execution_stage !== 'CLONED_FROM_BANK';

                            // Relaxed check: Allow original if status is 'triagem'
                            if (isOriginalFromBank && newC.pipeline_status !== 'triagem') return prev; // Don't add if strictly bank and not triagem

                            return [...prev, newC];
                        });
                        toast.info('Novo candidato recebido!');
                    } else if (payload.eventType === 'UPDATE') {
                        setCandidates((prev) => {
                            const newC = payload.new as Candidate;
                            const exists = prev.some((c) => c.id === newC.id);

                            const isOriginalFromBank = !newC.job_id && newC.execution_stage !== 'CLONED_FROM_BANK';
                            // Relaxed check: Allow original if status is 'triagem'
                            const shouldShow = !isOriginalFromBank || (newC.pipeline_status === 'triagem');

                            if (exists) {
                                if (!shouldShow) {
                                    // If it exists but shouldn't (e.g. status changed away from triagem), remove it
                                    return prev.filter(c => c.id !== newC.id);
                                }
                                return prev.map((c) => (c.id === newC.id ? newC : c));
                            } else {
                                // If it doesn't exist, only add if allowed
                                if (!shouldShow) return prev;
                                return [...prev, newC];
                            }
                        });
                    } else if (payload.eventType === 'DELETE') {
                        setCandidates((prev) => prev.filter((c) => c.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [jobId]);

    return (
        <>
            <DndContext
                sensors={sensors}
                collisionDetection={rectIntersection}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <div className="flex gap-8 min-w-max pb-10 px-4 h-full">
                    {currentColumns.map((col) => (
                        <PipelineColumn
                            key={col.id}
                            id={col.id}
                            title={col.title}
                            count={columns[col.id]?.length || 0}
                            color={col.color as any}
                            items={columns[col.id]?.map(c => c.id) || []}
                        >
                            {columns[col.id]?.map((candidate) => (
                                <CandidateCard
                                    key={candidate.id}
                                    candidate={candidate as any}
                                    filterJobId={jobId}
                                    onOpenProfile={(c) => setSelectedCandidate(c as any)}
                                    onUpdateStatus={updateCandidateStatus}
                                />
                            ))}
                        </PipelineColumn>
                    ))}
                </div>

                <DragOverlay dropAnimation={dropAnimation}>
                    {activeId ? (
                        <CandidateCard
                            candidate={candidates.find(c => c.id === activeId)! as any}
                        />
                    ) : null}
                </DragOverlay>
            </DndContext>

            {/* Profile Modal Overlay */}
            <AnimatePresence>
                {selectedCandidate && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-10">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedCandidate(null)}
                            className="absolute inset-0 bg-dark/40 backdrop-blur-sm"
                        />

                        {/* Modal Content */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-6xl h-full max-h-[90vh] bg-[#F8FAFC] rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden flex flex-col"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-zinc-100 bg-white z-20">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-indigo-200">
                                        {selectedCandidate.candidate_name?.charAt(0)}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-dark leading-tight tracking-tight">
                                            {selectedCandidate.candidate_name}
                                        </h2>
                                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                                            Ficha do Candidato
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedCandidate(null)}
                                    className="p-3 rounded-2xl bg-zinc-50 text-zinc-400 hover:text-dark hover:bg-zinc-100 transition-all border border-zinc-100"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                                <div className="max-w-5xl mx-auto">
                                    <DetailedCandidateView
                                        candidate={selectedCandidate}
                                        analysis={selectedCandidate.criteria_evaluation || {}}
                                    />

                                    {/* Arquivo Original Acoplado */}
                                    {selectedCandidate.resume_url && (
                                        <section className="mt-12 space-y-6 pt-12 border-t border-zinc-100">
                                            <div className="flex items-center gap-4">
                                                <div className="h-[1px] flex-1 bg-zinc-100" />
                                                <h3 className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.3em] flex items-center gap-2 text-center">
                                                    Documento Original Analisado
                                                </h3>
                                                <div className="h-[1px] flex-1 bg-zinc-100" />
                                            </div>

                                            <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-xl overflow-hidden h-[700px] relative transition-all">
                                                <iframe
                                                    src={`${selectedCandidate.resume_url}#toolbar=0`}
                                                    className="w-full h-full border-none"
                                                    title="Currículo Original"
                                                />
                                            </div>
                                        </section>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    )
}
