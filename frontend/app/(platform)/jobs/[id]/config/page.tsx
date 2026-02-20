'use client'

import React, { useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import {
    ArrowLeft,
    Save,
    Plus,
    Trash2,
    Eye,
    Type,
    Layers,
    Smartphone,
    Monitor,
    MousePointer2,
    CheckCircle2,
    MapPin,
    Briefcase,
    ShieldCheck,
    Brain,
    Upload
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function JobConfigPage() {
    const params = useParams()
    const router = useRouter()
    const jobId = params.id as string

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [job, setJob] = useState<any>(null)
    const [branding, setBranding] = useState<any>(null)

    // Job Content
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')

    // Layout Settings
    const [isPublic, setIsPublic] = useState(true)
    const [showAboutCareer, setShowAboutCareer] = useState(true)
    const [showAboutSkills, setShowAboutSkills] = useState(true)
    const [showPhoneField, setShowPhoneField] = useState(true)
    const [questions, setQuestions] = useState<any[]>([])
    const [criteria, setCriteria] = useState<string[]>([])

    // Presets
    const [presets, setPresets] = useState<any[]>([])
    const [presetName, setPresetName] = useState('')

    // Preview Mode
    const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')

    useEffect(() => {
        // Load Presets from LocalStorage
        const savedPresets = localStorage.getItem('job_presets')
        if (savedPresets) setPresets(JSON.parse(savedPresets))

        async function fetchData() {
            setLoading(true)
            // ... (rest of fetchData logic is fine)
            const { data: bData } = await supabase.from('company_settings').select('*').maybeSingle()
            if (bData) setBranding(bData)

            const { data } = await supabase.from('jobs').select('*').eq('id', jobId).single()
            if (data) {
                setJob(data)
                setTitle(data.title || '')
                setDescription(data.description || '')
                setIsPublic(data.is_public ?? true)
                setShowAboutCareer(data.show_about_career ?? true)
                setShowAboutSkills(data.show_about_skills ?? true)
                setShowPhoneField(data.show_phone_field ?? true)
                setQuestions(data.form_questions || [])
                setCriteria(data.recruitment_criteria || [])
            }
            setLoading(false)
        }
        if (jobId) fetchData()
    }, [jobId])

    const saveAsPreset = () => {
        if (!presetName) return toast.error('Dê um nome ao modelo')
        const newPreset = {
            id: crypto.randomUUID(),
            name: presetName,
            config: {
                isPublic,
                showAboutCareer,
                showAboutSkills,
                showPhoneField,
                questions,
                criteria
            }
        }
        const updated = [...presets, newPreset]
        setPresets(updated)
        localStorage.setItem('job_presets', JSON.stringify(updated))
        setPresetName('')
        toast.success('Modelo salvo com sucesso!')
    }

    const applyPreset = (preset: any) => {
        const { config } = preset
        setIsPublic(config.isPublic)
        setShowAboutCareer(config.showAboutCareer)
        setShowAboutSkills(config.showAboutSkills)
        setShowPhoneField(config.showPhoneField)
        setQuestions(config.questions || [])
        setCriteria(config.criteria || [])
        toast.success(`Modelo "${preset.name}" aplicado!`)
    }

    const handleSave = async () => {
        // ... (handleSave logic - remains same)
        setSaving(true)
        try {
            const { error } = await supabase
                .from('jobs')
                .update({
                    title,
                    description,
                    is_public: isPublic,
                    form_questions: questions,
                    recruitment_criteria: criteria,
                    show_about_career: showAboutCareer,
                    show_about_skills: showAboutSkills,
                    show_phone_field: showPhoneField
                })
                .eq('id', jobId)
            if (error) throw error
            toast.success('Alterações publicadas!')
        } catch (error: any) {
            toast.error('Erro ao salvar: ' + error.message)
        } finally {
            setSaving(false)
        }
    }

    const addQuestion = () => {
        setQuestions([...questions, { id: crypto.randomUUID(), text: '', type: 'text', required: false }])
    }

    if (loading) return <div className="p-8 text-center text-zinc-500">Iniciando Builder...</div>

    return (
        <div className="flex flex-col h-screen bg-[#F8FAFC] overflow-hidden">
            {/* Top Bar Builder */}
            <div className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between z-50">
                <div className="flex items-center gap-4">
                    <Link href="/jobs" className="p-2 hover:bg-zinc-100 rounded-lg transition-all text-zinc-400 hover:text-zinc-900">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-sm font-black text-zinc-900 uppercase tracking-tighter">Job Page Builder</h1>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest truncate max-w-[200px]">{title}</p>
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-2 bg-zinc-100 p-1 rounded-xl">
                    <button onClick={() => setPreviewMode('desktop')} className={`p-2 rounded-lg transition-all ${previewMode === 'desktop' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-400'}`}>
                        <Monitor size={18} />
                    </button>
                    <button onClick={() => setPreviewMode('mobile')} className={`p-2 rounded-lg transition-all ${previewMode === 'mobile' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-400'}`}>
                        <Smartphone size={18} />
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <Link href={`/careers/${jobId}`} target="_blank" className="hidden sm:block px-4 py-2 text-xs font-black uppercase text-zinc-500 hover:text-zinc-900 transition-all">
                        Visualizar
                    </Link>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-zinc-900 text-white px-4 md:px-6 py-2.5 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-zinc-800 transition-all disabled:opacity-50"
                    >
                        <Save size={16} />
                        {saving ? '...' : (
                            <span className="hidden xs:inline">Publicar</span>
                        )}
                        <span className="xs:hidden">Salvar</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Left Sidebar Customizer */}
                <div className="w-full md:w-80 bg-white border-r border-zinc-200 overflow-y-auto p-6 space-y-8 h-1/2 md:h-full">

                    {/* Presets Section */}
                    <section className="space-y-4 pb-6 border-b border-zinc-100">
                        <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <ShieldCheck size={14} /> Seus Modelos
                        </h3>
                        <div className="space-y-2">
                            {presets.length > 0 && (
                                <select
                                    onChange={(e) => {
                                        const p = presets.find(pr => pr.id === e.target.value)
                                        if (p) applyPreset(p)
                                    }}
                                    className="w-full bg-zinc-50 border border-zinc-100 rounded-lg px-3 py-2 text-[10px] font-black uppercase outline-none"
                                >
                                    <option value="">Carregar Modelo...</option>
                                    {presets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            )}
                            <div className="flex gap-2">
                                <input
                                    value={presetName}
                                    onChange={e => setPresetName(e.target.value)}
                                    placeholder="Nome do Novo Modelo"
                                    className="flex-1 bg-zinc-50 border border-zinc-100 rounded-lg px-3 py-2 text-[10px] font-bold outline-none"
                                />
                                <button onClick={saveAsPreset} className="p-2 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-zinc-600 transition-all">
                                    <Save size={14} />
                                </button>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Type size={14} /> Conteúdo da Vaga
                        </h3>
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Título da Vaga</label>
                                <input
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="Ex: Desenvolvedor Senior"
                                    className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:bg-white focus:border-zinc-900 transition-all"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Descrição</label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="Descreva a vaga..."
                                    rows={4}
                                    className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:bg-white focus:border-zinc-900 transition-all resize-none"
                                />
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Layers size={14} /> Seções Visíveis
                        </h3>
                        <div className="space-y-3">
                            <Toggle label="Sobre a Carreira" checked={showAboutCareer} onChange={setShowAboutCareer} />
                            <Toggle label="Habilidades Exigidas" checked={showAboutSkills} onChange={setShowAboutSkills} />
                            <Toggle label="Status Público" checked={isPublic} onChange={setIsPublic} badge={isPublic ? 'ATIVO' : 'OFF'} />
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <MousePointer2 size={14} /> Campos do Formulário
                        </h3>
                        <div className="space-y-3">
                            <Toggle label="Campo de Telefone" checked={showPhoneField} onChange={setShowPhoneField} />
                        </div>
                    </section>

                    <section className="space-y-4 pt-4 border-t border-zinc-100">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Perguntas Custom</h3>
                            <button onClick={addQuestion} className="p-1.5 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-zinc-600 transition-all">
                                <Plus size={14} />
                            </button>
                        </div>
                        <div className="space-y-3">
                            {questions.map((q, idx) => (
                                <div key={q.id} className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 space-y-3 relative group">
                                    <button
                                        onClick={() => setQuestions(questions.filter(qu => qu.id !== q.id))}
                                        className="absolute top-2 right-2 p-1 text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                    <input
                                        value={q.text}
                                        onChange={e => setQuestions(questions.map((qu, i) => i === idx ? { ...qu, text: e.target.value } : qu))}
                                        placeholder="Título da Pergunta"
                                        className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs font-bold outline-none"
                                    />
                                    <select
                                        value={q.type}
                                        onChange={e => setQuestions(questions.map((qu, i) => i === idx ? { ...qu, type: e.target.value } : qu))}
                                        className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-[10px] font-black uppercase outline-none"
                                    >
                                        <option value="text">Texto</option>
                                        <option value="textarea">Texto Longo</option>
                                        <option value="select">Seleção</option>
                                    </select>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Main Preview Area */}
                <div className="flex-1 bg-zinc-100 p-4 md:p-12 overflow-y-auto flex justify-center h-1/2 md:h-full">
                    <div className={`transition-all duration-500 bg-white shadow-2xl overflow-hidden ${previewMode === 'mobile' ? 'w-[375px] h-fit min-h-[667px] rounded-[3rem] border-[12px] border-zinc-950 my-auto' : 'w-full max-w-5xl h-fit min-h-full rounded-[2.5rem]'}`}>
                        <div className="h-full overflow-y-auto hide-scrollbar">
                            {/* Career Page Component Preview */}
                            <div className="min-h-full bg-white text-zinc-900 font-sans">
                                {/* Header Preview */}
                                <div className="h-64 relative overflow-hidden flex items-end pb-8 px-8 bg-[#09090B]">
                                    <div className="absolute inset-0 bg-gradient-to-tr opacity-20" style={{ backgroundImage: `radial-gradient(circle at top right, ${branding?.primary_color || '#6366f1'}, transparent)` }} />
                                    <div className="max-w-4xl w-full relative z-10">
                                        {branding?.logo_url && <img src={branding.logo_url} className="h-10 mb-6 object-contain" alt="Logo" />}
                                        <h2 className="text-4xl font-black tracking-tighter uppercase text-white mb-4 leading-none">{title || 'Título da Vaga'}</h2>
                                        <div className="flex gap-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                            <span className="flex items-center gap-1"><MapPin size={12} /> {job?.location || 'Remoto'}</span>
                                            <span className="flex items-center gap-1"><Briefcase size={12} /> {job?.type || 'Tempo Integral'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-12">
                                    <div className="lg:col-span-2 space-y-12">
                                        {showAboutCareer && (
                                            <section>
                                                <h3 className="text-xs font-black text-zinc-900 uppercase tracking-[0.3em] mb-4">Sobre a Carreira</h3>
                                                <p className="text-zinc-500 leading-relaxed text-sm whitespace-pre-wrap">{description || 'Descrição da vaga será exibida aqui...'}</p>
                                            </section>
                                        )}
                                        {showAboutSkills && criteria.length > 0 && (
                                            <section>
                                                <h3 className="text-xs font-black text-zinc-900 uppercase tracking-[0.3em] mb-4">Requisitos & Habilidades</h3>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {criteria.map((c, i) => (
                                                        <div key={i} className="flex items-center gap-2 text-xs font-bold text-zinc-700 bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                                                            <CheckCircle2 size={14} className="text-emerald-500" /> {c}
                                                        </div>
                                                    ))}
                                                </div>
                                            </section>
                                        )}
                                    </div>

                                    <div className="relative">
                                        <div className="bg-white border border-zinc-100 rounded-[2rem] p-6 shadow-xl shadow-zinc-200/50 space-y-6">
                                            <h4 className="text-lg font-black uppercase tracking-tight">Aplicar</h4>
                                            <div className="space-y-4">
                                                <div className="h-10 bg-zinc-50 rounded-xl border border-zinc-100" />
                                                <div className="h-10 bg-zinc-50 rounded-xl border border-zinc-100" />
                                                {showPhoneField && <div className="h-10 bg-zinc-50 rounded-xl border border-zinc-100 flex items-center px-4 text-[10px] font-bold text-zinc-300 uppercase">Telefone</div>}
                                                <div className="h-24 bg-zinc-50 border-2 border-dashed border-zinc-100 rounded-2xl flex items-center justify-center text-zinc-300">
                                                    <Upload size={20} />
                                                </div>
                                                <div className="h-12 bg-zinc-900 rounded-xl" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function Toggle({ label, checked, onChange, badge }: { label: string, checked: boolean, onChange: (v: boolean) => void, badge?: string }) {
    return (
        <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100 hover:bg-white transition-all group">
            <span className="text-xs font-bold text-zinc-700">{label}</span>
            <div className="flex items-center gap-2">
                {badge && <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${checked ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>{badge}</span>}
                <button
                    onClick={() => onChange(!checked)}
                    className={`w-10 h-5 rounded-full relative transition-all ${checked ? 'bg-zinc-900' : 'bg-zinc-200'}`}
                >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${checked ? 'left-6' : 'left-1'}`} />
                </button>
            </div>
        </div>
    )
}
