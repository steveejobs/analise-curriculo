'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
    MapPin,
    Briefcase,
    Clock,
    CheckCircle2,
    Upload,
    ArrowRight,
    Brain,
    ShieldCheck,
    X
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Job {
    id: string
    title: string
    location: string
    description: string
    recruitment_criteria: string[]
    is_public: boolean
    form_questions: any[]
}

export default function CareerPage() {
    const params = useParams()
    const [job, setJob] = useState<any>(null)
    const [branding, setBranding] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [submitted, setSubmitted] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
    })
    const [formResponses, setFormResponses] = useState<Record<string, string>>({})
    const [file, setFile] = useState<File | null>(null)

    useEffect(() => {
        async function fetchData() {
            // 1. Fetch Branding
            const { data: bData } = await supabase
                .from('company_settings')
                .select('*')
                .maybeSingle()
            if (bData) setBranding(bData)

            // 2. Fetch Job
            const { data, error } = await supabase
                .from('jobs')
                .select('*')
                .eq('id', params.id)
                .single()

            if (!error && data && data.is_public) {
                setJob(data)
            }
            setLoading(false)
        }
        fetchData()
    }, [params.id])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!file) {
            alert('Por favor, faça o upload do seu currículo em PDF.')
            return
        }

        setSubmitting(true)

        try {
            // 1. Upload File to Supabase Storage
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random()}.${fileExt}`
            const filePath = `${job?.id}/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('resumes')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('resumes')
                .getPublicUrl(filePath)

            // 3. Insert Application Record
            const { error: insertError } = await supabase.from('job_applications').insert([{
                job_id: job?.id,
                candidate_name: formData.name,
                candidate_email: formData.email,
                phone: formData.phone,
                resume_url: publicUrl,
                form_responses: formResponses,
                ai_status: 'NEW'
            }])

            if (insertError) throw insertError
            setSubmitted(true)

        } catch (err: any) {
            console.error('Erro na candidatura:', err)
            alert('Erro ao enviar candidatura: ' + err.message)
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="animate-pulse text-zinc-900 font-black tracking-widest uppercase">Processando...</div>
        </div>
    )

    if (!job) return (
        <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 text-center">
            <X size={48} className="text-zinc-200 mb-6" />
            <h1 className="text-2xl font-black text-zinc-900 uppercase tracking-tight">Vaga não encontrada</h1>
            <p className="text-zinc-400 mt-2 font-bold uppercase tracking-widest text-[10px]">Esta oportunidade não está disponível no momento.</p>
        </div>
    )

    const primaryColor = branding?.primary_color || '#6366f1'

    return (
        <div className="min-h-screen bg-white text-zinc-900 selection:bg-zinc-900 selection:text-white">
            {/* Premium Header */}
            <div className="h-[40vh] relative overflow-hidden flex items-end pb-16 px-6 bg-[#09090B]">
                <div
                    className="absolute inset-0 opacity-30"
                    style={{ backgroundImage: `radial-gradient(circle at top right, ${primaryColor}, transparent)` }}
                />

                <div className="max-w-5xl mx-auto w-full relative z-10 flex flex-col items-start gap-4 md:gap-8">
                    {branding?.logo_url && (
                        <div className="bg-white/5 backdrop-blur-xl p-3 md:p-4 rounded-3xl border border-white/10 shadow-2xl">
                            <img src={branding.logo_url} className="h-8 md:h-12 object-contain" alt={branding.company_name} />
                        </div>
                    )}

                    <div>
                        <div className="flex items-center gap-3 mb-4 md:mb-6">
                            <span className="bg-white/10 text-white text-[8px] md:text-[10px] font-black px-3 md:px-4 py-1.5 rounded-full uppercase tracking-[0.2em] border border-white/20">Vaga Aberta</span>
                        </div>
                        <h1 className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter uppercase mb-6 md:mb-8 leading-[0.9] text-white">
                            {job.title}
                        </h1>
                        <div className="flex flex-wrap items-center gap-4 md:gap-6 text-[10px] font-black text-white/50 uppercase tracking-[0.3em]">
                            <div className="flex items-center gap-2"><MapPin size={14} className="text-white/20" /> {job.location || 'Remoto'}</div>
                            <div className="flex items-center gap-2"><Briefcase size={14} className="text-white/20" /> {job.type || 'Integral'}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-3 gap-12 md:gap-20">
                {/* Job Details */}
                <div className="lg:col-span-2 space-y-12 md:space-y-20">
                    {job.show_about_career !== false && (
                        <section className="relative">
                            <div className="absolute -left-8 top-0 bottom-0 w-[2px]" style={{ background: `linear-gradient(to b, ${primaryColor}50, transparent)` }} />
                            <h3 className="text-xs font-black uppercase tracking-[0.4em] mb-8" style={{ color: primaryColor }}>Sobre a Posição</h3>
                            <div className="prose prose-zinc max-w-none">
                                <p className="text-zinc-600 text-xl leading-relaxed font-medium">
                                    {job.description}
                                </p>
                            </div>
                        </section>
                    )}

                    {job.show_about_skills !== false && job.recruitment_criteria && job.recruitment_criteria.length > 0 && (
                        <section className="relative">
                            <div className="absolute -left-8 top-0 bottom-0 w-[2px] bg-gradient-to-b from-emerald-500/50 to-transparent" />
                            <h3 className="text-xs font-black text-emerald-500 uppercase tracking-[0.4em] mb-8">Critérios de Avaliação Inteligente</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {job.recruitment_criteria.map((c: string, i: number) => (
                                    <div key={i} className="bg-zinc-50 border border-zinc-100 p-5 rounded-2xl flex items-start gap-4 hover:border-emerald-500/30 transition-all group hover:bg-white hover:shadow-xl hover:shadow-emerald-500/5">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                                            <CheckCircle2 size={18} className="text-emerald-500 group-hover:scale-110 transition-transform" />
                                        </div>
                                        <span className="text-sm font-bold text-zinc-900 uppercase tracking-tight leading-snug">{c}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-8 p-4 rounded-xl bg-zinc-900 text-white flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-emerald-500/20">
                                    <Brain size={16} className="text-emerald-400" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Este processo utiliza triagem inteligente assistida por IA para máxima meritocracia</span>
                            </div>
                        </section>
                    )}
                </div>

                {/* Application Form */}
                <div className="relative">
                    <div className="sticky top-12 bg-white border border-zinc-100 rounded-[3rem] p-10 shadow-2xl shadow-indigo-500/10 active:scale-[0.99] transition-transform">
                        {submitted ? (
                            <div className="text-center py-16 animate-in fade-in zoom-in slide-in-from-bottom-4">
                                <div className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-500/40">
                                    <CheckCircle2 size={48} />
                                </div>
                                <h3 className="text-3xl font-black uppercase tracking-tighter mb-4 text-zinc-900">Sucesso!</h3>
                                <p className="text-sm text-zinc-500 font-bold mb-10 leading-relaxed uppercase tracking-tighter text-center">Sua candidatura foi recebida. Nossa IA já está analisando seu perfil em tempo real.</p>
                                <button
                                    onClick={() => setSubmitted(false)}
                                    className="w-full bg-zinc-900 hover:bg-zinc-800 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all shadow-xl active:scale-95"
                                >
                                    Nova Candidatura
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-10">
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black uppercase tracking-tighter text-zinc-900">Aplicar Agora</h3>
                                    <div className="flex items-center gap-2">
                                        <div className="h-1 w-8 rounded-full" style={{ backgroundColor: primaryColor }}></div>
                                        <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Processo acelerado via IA</p>
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Seu Nome Completo</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Ex: João Silva"
                                            className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-sm font-bold text-zinc-900 outline-none focus:bg-white focus:ring-4 transition-all placeholder:text-zinc-300"
                                            style={{ borderColor: formData.name ? primaryColor + '30' : undefined }}
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">E-mail para Contato</label>
                                        <input
                                            required
                                            type="email"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="joao@exemplo.com"
                                            className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-sm font-bold text-zinc-900 outline-none focus:bg-white focus:ring-4 transition-all placeholder:text-zinc-300"
                                            style={{ borderColor: formData.email ? primaryColor + '30' : undefined }}
                                        />
                                    </div>

                                    {job.show_phone_field !== false && (
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Telefone WhatsApp</label>
                                            <input
                                                required
                                                type="tel"
                                                value={formData.phone}
                                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                placeholder="(11) 99999-9999"
                                                className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-sm font-bold text-zinc-900 outline-none focus:bg-white focus:ring-4 transition-all placeholder:text-zinc-300"
                                                style={{ borderColor: formData.phone ? primaryColor + '30' : undefined }}
                                            />
                                        </div>
                                    )}

                                    {/* Dynamic Questions */}
                                    {job.form_questions && job.form_questions.map((q: any) => (
                                        <div key={q.id} className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">{q.text}</label>
                                                {q.required && <span className="text-[9px] font-black text-red-400 uppercase tracking-widest">Obrigatório</span>}
                                            </div>
                                            {q.type === 'textarea' ? (
                                                <textarea
                                                    required={q.required}
                                                    value={formResponses[q.id] || ''}
                                                    onChange={e => setFormResponses({ ...formResponses, [q.id]: e.target.value })}
                                                    rows={4}
                                                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-sm font-bold text-zinc-900 outline-none focus:bg-white focus:ring-4 transition-all placeholder:text-zinc-300 resize-none"
                                                />
                                            ) : (
                                                <input
                                                    required={q.required}
                                                    type="text"
                                                    value={formResponses[q.id] || ''}
                                                    onChange={e => setFormResponses({ ...formResponses, [q.id]: e.target.value })}
                                                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-sm font-bold text-zinc-900 outline-none focus:bg-white focus:ring-4 transition-all"
                                                />
                                            )}
                                        </div>
                                    ))}

                                    <div className="space-y-3">
                                        <button
                                            disabled={submitting}
                                            className="w-full text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 group"
                                            style={{ backgroundColor: primaryColor, boxShadow: `0 20px 40px ${primaryColor}30` }}
                                        >
                                            {submitting ? 'PROCESSANDO...' : 'CONFIRMAR CANDIDATURA'}
                                            {!submitting && <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform text-white/50" />}
                                        </button>
                                    </div>
                                </form>

                                <div className="flex items-center gap-3 justify-center">
                                    <div className="h-[1px] w-4 bg-zinc-100"></div>
                                    <p className="text-[9px] text-zinc-400 font-black uppercase tracking-widest text-center">
                                        Ambiente seguro {branding?.company_name && `por ${branding.company_name}`}
                                    </p>
                                    <div className="h-[1px] w-4 bg-zinc-100"></div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
