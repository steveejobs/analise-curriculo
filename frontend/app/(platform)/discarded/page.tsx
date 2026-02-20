'use client'

import React, { useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { supabase } from '@/lib/supabase'
import { Trash2, RotateCcw, Search, UserX } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

export default function DiscardedCandidatesPage() {
    const [candidates, setCandidates] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    const fetchDiscarded = async () => {
        setLoading(true)

        const { data, error } = await supabase
            .from('job_applications')
            .select('*')
            .eq('pipeline_status', 'discarded')
            .order('created_at', { ascending: false })

        if (error) {
            toast.error('Erro ao carregar descartados: ' + error.message)
        } else {
            setCandidates(data || [])
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchDiscarded()
    }, [])

    const handleRestore = async (id: string) => {
        const { error } = await supabase
            .from('job_applications')
            .update({ pipeline_status: 'new' })
            .eq('id', id)

        if (error) {
            toast.error('Erro ao restaurar: ' + error.message)
        } else {
            toast.success('Candidato restaurado')
            setCandidates(prev => prev.filter(c => c.id !== id))
        }
    }

    const handleDeletePermanent = async (id: string) => {
        if (!confirm('Excluir este candidato permanentemente? Esta ação não pode ser desfeita.')) return

        const { error } = await supabase
            .from('job_applications')
            .delete()
            .eq('id', id)

        if (error) {
            toast.error('Erro ao excluir: ' + error.message)
        } else {
            toast.success('Candidato excluído permanentemente')
            setCandidates(prev => prev.filter(c => c.id !== id))
        }
    }

    const filteredCandidates = candidates.filter(c =>
        c.candidate_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.candidate_email?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="flex flex-col h-full bg-[#F8FAFC]">
            <Header
                title="Currículos Descartados"
                description="Gerencie candidatos que foram movidos para a lixeira"
            />

            <div className="flex-1 p-4 md:p-8 overflow-auto">
                <div className="max-w-6xl mx-auto">
                    {/* Search Bar */}
                    <div className="mb-8 relative group">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar nos descartados..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-white border border-zinc-200 rounded-[2rem] text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all shadow-sm"
                        />
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-10 h-10 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
                        </div>
                    ) : filteredCandidates.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-zinc-400 bg-white rounded-[3rem] border border-dashed border-zinc-200">
                            <UserX size={48} className="mb-4 opacity-20" />
                            <p className="font-medium">Nenhum candidato encontrado na lixeira</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <AnimatePresence mode="popLayout">
                                {filteredCandidates.map((candidate) => (
                                    <motion.div
                                        key={candidate.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="p-6 bg-white border border-zinc-200 rounded-[2.5rem] shadow-sm hover:shadow-md transition-all group"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center font-bold text-zinc-400">
                                                    {candidate.candidate_name?.charAt(0) || '?'}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-zinc-900 text-sm">{candidate.candidate_name || 'Sem nome'}</h3>
                                                    <p className="text-[10px] text-zinc-500">{candidate.candidate_email || candidate.email}</p>
                                                </div>
                                            </div>
                                            <div className="px-2 py-1 bg-zinc-100 rounded-lg text-[10px] font-black text-zinc-400">
                                                {candidate.ai_score || 0}%
                                            </div>
                                        </div>

                                        <div className="flex gap-2 mt-4 pt-4 border-t border-zinc-50">
                                            <button
                                                onClick={() => handleRestore(candidate.id)}
                                                className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100"
                                            >
                                                <RotateCcw size={14} />
                                                RESTAURAR
                                            </button>
                                            <button
                                                onClick={() => handleDeletePermanent(candidate.id)}
                                                className="flex-1 flex items-center justify-center gap-2 py-2 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black hover:bg-rose-600 hover:text-white transition-all border border-rose-100"
                                            >
                                                <Trash2 size={14} />
                                                EXCLUIR
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
