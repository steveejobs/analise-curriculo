'use client'

import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

interface PipelineColumnProps {
    id: string;
    title: string;
    count: number;
    color: 'indigo' | 'amber' | 'cyan' | 'emerald' | 'red' | 'zinc';
    children: React.ReactNode;
    items: string[]; // array of candidate IDs for sortable context
}

export function PipelineColumn({ id, title, count, color, children, items }: PipelineColumnProps) {
    const { setNodeRef } = useDroppable({
        id: id
    })

    const colors = {
        indigo: 'bg-indigo-50/50 text-indigo-700 border-indigo-100',
        amber: 'bg-amber-50/50 text-amber-700 border-amber-100',
        cyan: 'bg-cyan-50/50 text-cyan-700 border-cyan-100',
        emerald: 'bg-emerald-50/50 text-emerald-700 border-emerald-100',
        red: 'bg-rose-50/50 text-rose-700 border-rose-100',
        zinc: 'bg-zinc-100/50 text-zinc-700 border-zinc-200'
    }

    const dotColors = {
        indigo: 'bg-indigo-500',
        amber: 'bg-amber-500',
        cyan: 'bg-cyan-500',
        emerald: 'bg-emerald-500',
        red: 'bg-rose-500',
        zinc: 'bg-zinc-500'
    }

    return (
        <div className="w-80 flex flex-col shrink-0 h-full max-h-full animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Estilo CRM */}
            <div className="bg-white p-5 rounded-t-[2.5rem] border-x border-t border-zinc-100/80 shadow-[0_-4px_20px_rgba(0,0,0,0.01)] shrink-0">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-black text-zinc-900 text-[13px] tracking-tight uppercase">
                        {title}
                    </h3>
                    <div className={`w-2.5 h-2.5 rounded-full ${dotColors[color]} shadow-sm`}></div>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.1em]">
                        {count} {count === 1 ? 'Candidato' : 'Candidatos'}
                    </span>
                </div>
            </div>

            <div
                ref={setNodeRef}
                className="flex-1 p-4 space-y-4 bg-white rounded-b-[2.5rem] border-x border-b border-zinc-100/80 shadow-[0_10px_30px_rgba(0,0,0,0.02)] overflow-y-auto custom-scrollbar min-h-[500px]"
            >
                <SortableContext items={items} strategy={verticalListSortingStrategy}>
                    <div className="flex flex-col gap-4 py-2">
                        {children}
                    </div>
                </SortableContext>
            </div>
        </div>
    )
}
