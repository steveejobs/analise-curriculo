'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Briefcase, X, Plus, Search, Check, Loader2, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface JobSelectorModalProps {
    isOpen: boolean
    onClose: () => void
    onSelect: (jobId: string) => void
    onCreateNew: () => void
}

export function JobSelectorModal({ isOpen, onClose, onSelect, onCreateNew }: JobSelectorModalProps) {
    const [jobs, setJobs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        if (isOpen) {
            fetchJobs()
        }
    }, [isOpen])

    async function fetchJobs() {
        setLoading(true)
        const { data, error } = await supabase
            .from('jobs')
            .select('id, title, department')
            .eq('status', 'OPEN')
            .order('title')

        if (!error && data) {
            setJobs(data)
        }
        setLoading(false)
    }

    const filteredJobs = jobs.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (job.department && job.department.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-zinc-100 overflow-hidden flex flex-col max-h-[80vh]"
            >
                {/* Header */}
                <div className="p-8 pb-4 flex items-center justify-between shrink-0">
                    <h3 className="text-xl font-black text-zinc-900 flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                            <Briefcase size={20} />
                        </div>
                        Adicionar à Vaga
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-xl transition-colors">
                        <X size={20} className="text-zinc-400" />
                    </button>
                </div>

                {/* Search */}
                <div className="px-8 mb-4">
                    <div className="relative group">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            autoFocus
                            placeholder="Buscar vaga..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-bold text-zinc-700 placeholder:text-zinc-400/60"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto px-8 pb-4 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <Loader2 size={24} className="text-indigo-500 animate-spin" />
                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Carregando vagas...</span>
                        </div>
                    ) : filteredJobs.length > 0 ? (
                        <div className="space-y-2">
                            {filteredJobs.map(job => (
                                <button
                                    key={job.id}
                                    onClick={() => onSelect(job.id)}
                                    className="w-full flex items-center justify-between p-4 bg-white border border-zinc-100 rounded-2xl hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group text-left"
                                >
                                    <div>
                                        <p className="text-sm font-black text-zinc-900 group-hover:text-indigo-600 transition-colors">{job.title}</p>
                                        {job.department && (
                                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">{job.department}</p>
                                        )}
                                    </div>
                                    <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-300 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-all">
                                        <Check size={16} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : jobs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mb-4">
                                <AlertCircle size={32} />
                            </div>
                            <p className="text-sm font-black text-zinc-900 mb-1">Nenhuma vaga criada ainda</p>
                            <p className="text-xs font-medium text-zinc-400 px-8">Para adicionar um candidato, você precisa primeiro criar uma vaga ativa.</p>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Nenhuma vaga encontrada</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-8 pt-4 bg-zinc-50 border-t border-zinc-100 shrink-0">
                    <button
                        onClick={onCreateNew}
                        className="w-full py-4 bg-zinc-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-900/10 flex items-center justify-center gap-3 active:scale-[0.98]"
                    >
                        <Plus size={18} />
                        Criar Nova Vaga
                    </button>
                </div>
            </motion.div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #E4E4E7;
                    border-radius: 10px;
                }
            `}</style>
        </div>
    )
}
