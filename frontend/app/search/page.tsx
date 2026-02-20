'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
    Search,
    Filter,
    Users,
    LayoutDashboard,
    Briefcase,
    BrainCircuit,
    Settings,
    Sparkles,
    TrendingUp
} from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react' // Added for useEffect

export default function RediscoveryPage() {
    const [query, setQuery] = useState('')

    // Added useEffect for data fetching
    useEffect(() => {
        async function fetchCandidates() {
            const { data, error } = await supabase
                .from('candidates')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Error fetching candidates:', error)
            } else {
                console.log('Candidates:', data)
                // You would typically set this data to state here
            }
        }
        fetchCandidates()
    }, []) // Empty dependency array means this runs once on mount

    return (
        <div className="flex h-screen w-full bg-[#F8FAFC]">
            {/* Sidebar - Consistent */}
            <aside className="w-64 bg-zinc-950 text-white flex flex-col z-20 border-r border-white/5">
                <div className="p-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-black italic">A</div>
                        <h1 className="text-xl font-bold tracking-tight text-white">ATS<span className="text-emerald-500 italic">Core</span></h1>
                    </div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Triagem Inteligente</p>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    <Link href="/">
                        <SidebarItem icon={<LayoutDashboard size={18} />} label="Visão Geral" />
                    </Link>
                    <Link href="/search">
                        <SidebarItem icon={<Search size={18} />} label="Recuperação de Talentos" active />
                    </Link>
                    <Link href="/jobs">
                        <SidebarItem icon={<Briefcase size={18} />} label="Vagas Ativas" />
                    </Link>
                    <Link href="/integrations">
                        <SidebarItem icon={<TrendingUp size={18} />} label="Canais de Entrada" />
                    </Link>
                    <SidebarItem icon={<BrainCircuit size={18} />} label="Treinamento de IA" />
                    <div className="pt-4 mt-4 border-t border-white/5">
                        <SidebarItem icon={<Settings size={18} />} label="Configurações" />
                    </div>
                </nav>
            </aside>

            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="h-20 bg-white/80 backdrop-blur-md border-b border-zinc-100 flex items-center justify-between px-10">
                    <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Talent Rediscovery</h2>
                </header>

                <div className="flex-1 overflow-auto p-10">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-16">
                            <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-100">
                                <Search className="w-10 h-10 text-emerald-500" />
                            </div>
                            <h3 className="text-5xl font-black text-zinc-900 tracking-tighter mb-4 italic">Encontre o Talento Oculto</h3>
                            <p className="text-zinc-500 font-medium text-lg max-w-xl mx-auto">
                                Utilize busca semântica para encontrar candidatos ideais em todo o seu histórico de banco de dados.
                            </p>
                        </div>

                        <div className="relative mb-12">
                            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                                <Sparkles className="h-6 w-6 text-emerald-500 animate-pulse" />
                            </div>
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="block w-full pl-16 pr-24 py-8 bg-white border border-zinc-100 rounded-[2.5rem] text-xl font-bold shadow-2xl shadow-zinc-200 outline-none focus:ring-4 focus:ring-emerald-50 transition-all placeholder:text-zinc-300"
                                placeholder="Busque por 'Dev Senior com React e Node em SP'..."
                            />
                            <button className="absolute right-4 top-1/2 -translate-y-1/2 bg-zinc-900 text-white px-8 py-4 rounded-[2rem] text-sm font-black hover:bg-emerald-600 transition-all active:scale-95">
                                Pesquisar com IA
                            </button>
                        </div>

                        <div className="flex items-center justify-center gap-4">
                            <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">Filtros Populares:</span>
                            <button className="px-4 py-2 bg-zinc-100 rounded-full text-xs font-bold hover:bg-zinc-200 transition-colors">Python</button>
                            <button className="px-4 py-2 bg-zinc-100 rounded-full text-xs font-bold hover:bg-zinc-200 transition-colors">São Paulo</button>
                            <button className="px-4 py-2 bg-zinc-100 rounded-full text-xs font-bold hover:bg-zinc-200 transition-colors">Sênior</button>
                            <button className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold hover:bg-emerald-100 transition-colors"><Filter size={14} className="inline mr-1" /> Mais Filtros</button>
                        </div>

                        <div className="mt-20 border-t border-zinc-100 pt-20 text-center">
                            <Users className="w-20 h-20 text-zinc-100 mx-auto mb-6" />
                            <p className="text-zinc-300 font-bold italic uppercase tracking-tighter text-2xl">Mais de 2.000 currículos em sua base prontos para rediscovery.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

function SidebarItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
    return (
        <button className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-bold transition-all ${active
            ? "bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]"
            : "text-zinc-500 hover:text-white hover:bg-white/5"
            }`}>
            {icon}
            <span>{label}</span>
            {active && <div className="ml-auto w-1 h-4 bg-emerald-500 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.5)]"></div>}
        </button>
    );
}
