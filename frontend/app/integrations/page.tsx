'use client'

import { useState } from 'react'
import {
    Mail,
    Linkedin,
    MessageSquare,
    Globe,
    CheckCircle2,
    XCircle,
    Settings2,
    LayoutDashboard,
    Briefcase,
    Upload,
    TrendingUp,
    BrainCircuit,
    Settings,
    Shield,
    RefreshCw,
    ExternalLink
} from 'lucide-react'
import Link from 'next/link'

export default function IntegrationsPage() {
    const [integrations, setIntegrations] = useState([
        { id: 'email', name: 'Gmail / Outlook', type: 'E-mail', status: 'ACTIVE', lastSync: '10 min atrás', icon: <Mail className="text-blue-500" /> },
        { id: 'linkedin', name: 'LinkedIn Scraping', type: 'Social', status: 'INACTIVE', lastSync: '-', icon: <Linkedin className="text-sky-600" /> },
        { id: 'whatsapp', name: 'WhatsApp Business', type: 'Messaging', status: 'INACTIVE', lastSync: '-', icon: <MessageSquare className="text-emerald-500" /> },
        { id: 'webhook', name: 'API / Webhooks', type: 'Tech', status: 'ACTIVE', lastSync: 'Agora', icon: <Globe className="text-zinc-600" /> },
    ])

    return (
        <div className="flex h-screen w-full bg-[#F8FAFC]">
            {/* Sidebar */}
            <aside className="w-64 bg-zinc-950 text-white flex flex-col z-20 border-r border-white/5">
                <div className="p-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-black italic">A</div>
                        <h1 className="text-xl font-bold tracking-tight text-white">ATS<span className="text-emerald-500 italic">Core</span></h1>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    <Link href="/"><SidebarItem icon={<LayoutDashboard size={18} />} label="Visão Geral" /></Link>
                    <Link href="/jobs"><SidebarItem icon={<Briefcase size={18} />} label="Vagas Ativas" /></Link>
                    <Link href="/ingestion"><SidebarItem icon={<Upload size={18} />} label="Ingestão em Massa" /></Link>
                    <Link href="/integrations"><SidebarItem icon={<TrendingUp size={18} />} label="Canais" active /></Link>
                </nav>
            </aside>

            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="h-20 bg-white border-b border-zinc-100 flex items-center justify-between px-10">
                    <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Central de Integrações</h2>
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-2 text-[10px] font-black text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full uppercase">
                            <Shield size={12} /> Segurança OAuth 2.0 Ativa
                        </span>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-10 bg-zinc-50/50">
                    <div className="max-w-5xl mx-auto">
                        <div className="mb-12">
                            <h1 className="text-4xl font-black text-zinc-900 tracking-tight mb-2">Conectores de Entrada</h1>
                            <p className="text-zinc-500 font-medium">Gerencie como os currículos chegam até o ATS Core de forma automática.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {integrations.map((item) => (
                                <div key={item.id} className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm hover:shadow-xl hover:shadow-zinc-200/50 transition-all group relative overflow-hidden">
                                    {item.status === 'ACTIVE' && (
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full -mr-16 -mt-16" />
                                    )}

                                    <div className="flex items-start justify-between mb-8">
                                        <div className="w-14 h-14 rounded-2xl bg-zinc-50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                            {item.icon}
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${item.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-100 text-zinc-400'
                                                }`}>
                                                {item.status === 'ACTIVE' ? 'Conectado' : 'Desconectado'}
                                            </span>
                                            {item.status === 'ACTIVE' && (
                                                <span className="text-[9px] text-zinc-400 font-bold uppercase mt-2 flex items-center gap-1">
                                                    <RefreshCw size={10} className="animate-spin-slow" /> {item.lastSync}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-black text-zinc-900 mb-1 uppercase tracking-tight">{item.name}</h3>
                                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-8">{item.type}</p>

                                    <div className="flex gap-3">
                                        <button className="flex-1 py-4 bg-zinc-900 text-white rounded-2xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest hover:bg-zinc-800 transition-all">
                                            {item.status === 'ACTIVE' ? 'Configurar' : 'Conectar'} <Settings2 size={16} />
                                        </button>
                                        {item.status === 'ACTIVE' && (
                                            <button className="w-14 h-14 bg-zinc-50 text-zinc-400 rounded-2xl flex items-center justify-center hover:bg-zinc-100 transition-all">
                                                <ExternalLink size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Email Filter Section (SaaS Feature) */}
                        <div className="mt-12 bg-zinc-950 p-10 rounded-[3rem] text-white border border-white/5 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full -mr-48 -mt-48" />

                            <div className="relative z-10">
                                <h3 className="text-2xl font-black uppercase tracking-tight mb-6 flex items-center gap-3">
                                    <BrainCircuit className="text-emerald-500" /> Filtros Inteligentes de E-mail
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Assunto do E-mail</label>
                                        <input
                                            placeholder="Ex: Candidatura; Vaga"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-1 focus:ring-emerald-500"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Extensões Permitidas</label>
                                        <input
                                            placeholder="Ex: .pdf; .docx"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-1 focus:ring-emerald-500"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Ações para Span/Lixo</label>
                                        <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-1 focus:ring-emerald-500 appearance-none">
                                            <option>Ignorar Silenciosamente</option>
                                            <option>Mover para Pasta Revisão</option>
                                        </select>
                                    </div>
                                </div>
                                <button className="mt-8 bg-emerald-500 text-zinc-950 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-400 transition-all">
                                    Salvar Configurações de Regra
                                </button>
                            </div>
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
        </button>
    );
}
