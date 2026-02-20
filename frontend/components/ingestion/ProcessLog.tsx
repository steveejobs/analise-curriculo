
import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Terminal, X, Minimize2, Maximize2, Activity } from 'lucide-react';

interface LogEntry {
    id: string;
    message: string;
    timestamp: Date;
    type: 'info' | 'success' | 'error' | 'warning';
    candidateClass?: string;
}

export function ProcessLog() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isOpen, setIsOpen] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs, isOpen]);

    useEffect(() => {
        // Initial log
        addLog('Sistema de logs iniciado. Aguardando eventos...', 'info');

        const channel = supabase
            .channel('global_logs')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'job_applications' },
                (payload) => {
                    const newVal = payload.new as any;
                    const oldVal = payload.old as any;

                    // Detect changes in ai_status or ai_explanation
                    if (newVal.ai_status !== oldVal.ai_status || newVal.ai_explanation !== oldVal.ai_explanation) {
                        let type: LogEntry['type'] = 'info';
                        let msg = '';

                        const candidateName = newVal.candidate_name || 'Candidato Desconhecido';

                        if (newVal.ai_status === 'ERROR') {
                            type = 'error';
                            msg = `[${candidateName}] Erro: ${newVal.ai_explanation || 'Erro desconhecido'}`;
                        } else if (newVal.ai_status === 'DONE') {
                            type = 'success';
                            msg = `[${candidateName}] Concluído: ${newVal.ai_explanation || 'Processo finalizado'}`;
                        } else if (newVal.ai_explanation) {
                            msg = `[${candidateName}] ${newVal.ai_explanation}`;
                        } else {
                            msg = `[${candidateName}] Status alterado para ${newVal.ai_status}`;
                        }

                        addLog(msg, type);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const addLog = (message: string, type: LogEntry['type'] = 'info') => {
        setLogs(prev => [...prev.slice(-49), { // Keep last 50 logs
            id: Math.random().toString(36).substring(7),
            message,
            timestamp: new Date(),
            type
        }]);
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 bg-zinc-900 text-emerald-400 p-3 rounded-full shadow-lg hover:bg-zinc-800 transition-all z-50 border border-zinc-800"
                title="Abrir Logs"
            >
                <Terminal size={20} />
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 w-96 bg-zinc-950 text-zinc-300 rounded-xl shadow-2xl border border-zinc-800 flex flex-col z-50 overflow-hidden font-mono text-xs transition-all animate-in slide-in-from-bottom-5">
            {/* Header */}
            <div className="flex items-center justify-between p-3 bg-zinc-900 border-b border-zinc-800 select-none cursor-pointer" onClick={() => setIsOpen(false)}>
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <Terminal size={14} />
                    <span>Live Process Logs</span>
                    <span className="flex h-2 w-2 relative ml-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} className="hover:text-white"><Minimize2 size={14} /></button>
                </div>
            </div>

            {/* Logs Area */}
            <div
                ref={scrollRef}
                className="h-64 overflow-y-auto p-4 space-y-2 bg-zinc-950/95"
            >
                {logs.length === 0 && (
                    <div className="text-zinc-600 italic text-center py-10">Nenhuma atividade recente...</div>
                )}
                {logs.map(log => (
                    <div key={log.id} className="flex gap-2 animate-in fade-in duration-300">
                        <span className="text-zinc-600 shrink-0 select-none">[{log.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                        <span className={`break-words ${log.type === 'error' ? 'text-red-400 font-bold' :
                            log.type === 'success' ? 'text-emerald-400' :
                                log.type === 'warning' ? 'text-amber-400' :
                                    'text-zinc-300'
                            }`}>
                            {log.message}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

