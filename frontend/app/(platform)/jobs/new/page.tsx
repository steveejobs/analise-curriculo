'use client'

import React, { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import {
    Briefcase,
    MapPin,
    Save,
    ArrowLeft,
    Plus,
    X,
    Target,
    Sliders
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { AdvancedJobConfig, AnalysisConfig } from '@/components/jobs/advanced/AdvancedJobConfig'

export default function NewJobPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        location: 'Remoto',
        type: 'Full-time'
    })

    // State for Advanced Analysis Configuration
    const [analysisConfig, setAnalysisConfig] = useState<AnalysisConfig>({
        match_threshold: 70,
        hard_skills: {
            education: { level: 'Graduação', area: '', mandatory: false },
            experience: { years: '3-5 anos', mandatory: false },
            languages: [],
            tools: []
        },
        soft_skills: [],
        leadership: null,
        risk_analysis: { grammar: true, job_hopping: true, career_stagnation: false },
        blind_screening: false
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        setLoading(true)

        const { data, error } = await supabase
            .from('jobs')
            .insert([
                {
                    company_id: '7ec9b76a-db33-4272-a72a-d81b4c8347d9', // Mandatory
                    title: formData.title,
                    requirements: formData.description, // Map UI description to DB requirements
                    status: 'OPEN', // DB Check Constraint
                    // Flatten skills for backward compatibility / search
                    recruitment_criteria: [
                        ...analysisConfig.hard_skills.tools.map(t => t.name),
                        ...analysisConfig.soft_skills
                    ],
                    analysis_config: analysisConfig,
                    pipeline_config: [
                        { id: 'triagem', title: 'Triagem', color: 'indigo' },
                        { id: 'qualificacao', title: 'Qualificação', color: 'amber' },
                        { id: 'finalistas', title: 'Finalistas', color: 'emerald' },
                        { id: 'reprovado', title: 'Reprovado', color: 'red' }
                    ]
                }
            ])
            .select()

        setLoading(false)

        if (error) {
            toast.error('Erro ao criar vaga: ' + error.message)
        } else {
            toast.success('Vaga criada com sucesso!')
            router.push('/jobs')
        }
    }

    return (
        <div className="flex flex-col h-full bg-[#F8FAFC]">
            <Header title="Nova Vaga" description="Abra uma nova posição para receber candidaturas." />

            <div className="flex-1 overflow-auto p-8 flex justify-center">
                <form onSubmit={handleSubmit} className="w-full max-w-4xl bg-white rounded-[2rem] border border-zinc-100 shadow-sm p-8 space-y-8 h-fit">

                    <div className="flex items-center justify-between">
                        <Link href="/jobs" className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-900 text-sm font-medium transition-colors">
                            <ArrowLeft size={16} /> Cancelar e Voltar
                        </Link>
                        <div className="text-sm text-zinc-400 font-mono">ID: AUTO-GENERATED</div>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                            <Briefcase size={20} className="text-indigo-600" />
                            Informações Básicas
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-2">
                                <label className="block text-sm font-bold text-zinc-700 mb-2">Título da Vaga</label>
                                <input
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Ex: Senior Frontend Developer"
                                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-zinc-700 mb-2">Localização</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                                    <select
                                        value={formData.location}
                                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium appearance-none"
                                    >
                                        <option>Remoto</option>
                                        <option>Híbrido</option>
                                        <option>Presencial</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-zinc-700 mb-2">Tipo</label>
                                <select
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium appearance-none"
                                >
                                    <option>Full-time</option>
                                    <option>Contract</option>
                                    <option>Freelance</option>
                                    <option>Internship</option>
                                </select>
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-bold text-zinc-700 mb-2">Descrição da Vaga</label>
                                <textarea
                                    required
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Descreva as responsabilidades..."
                                    rows={5}
                                    className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-zinc-100 pt-8 space-y-6">
                        <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                            <Target size={20} className="text-emerald-600" />
                            Critérios de Avaliação (IA)
                        </h3>

                        <div className="space-y-6">
                            {/* Componente de Configuração Avançada */}
                            <AdvancedJobConfig
                                value={analysisConfig}
                                onChange={setAnalysisConfig}
                            />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-zinc-100 flex justify-end gap-3">
                        <Link
                            href="/jobs"
                            className="px-6 py-3 border border-zinc-200 rounded-xl text-zinc-600 font-bold hover:bg-zinc-50 transition-all text-sm"
                        >
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-zinc-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-zinc-800 transition-all flex items-center gap-2 shadow-lg shadow-zinc-900/10 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                            {loading ? 'Salvando...' : (
                                <>
                                    <Save size={18} /> Publicar Vaga
                                </>
                            )}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    )
}
