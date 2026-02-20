'use client'

import React, { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Briefcase, MapPin, Save, X, Target, Layers, TrendingUp, DollarSign, Plus, Trash2, Globe, Building2, ChevronDown, Check } from 'lucide-react'
import { toast } from 'sonner'

interface NewJobModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (jobId: string) => void;
}

interface CustomSelectProps {
    label: string;
    value: string;
    options: string[];
    onChange: (value: string) => void;
    icon: React.ReactNode;
}

function CustomSelect({ label, value, options, onChange, icon }: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div className="relative" ref={containerRef}>
            <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5 ml-1">{label}</label>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between px-4 py-3.5 bg-zinc-50 border ${isOpen ? 'border-indigo-500 ring-4 ring-indigo-500/5' : 'border-zinc-200'} rounded-2xl transition-all font-bold text-zinc-700 text-left`}
            >
                <div className="flex items-center gap-3">
                    <div className={`${isOpen ? 'text-indigo-600' : 'text-zinc-400'}`}>
                        {icon}
                    </div>
                    <span>{value}</span>
                </div>
                <ChevronDown size={18} className={`text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-500' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-[110] w-full mt-2 py-2 bg-white border border-zinc-100 rounded-2xl shadow-xl animate-in fade-in zoom-in-95 duration-200">
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        {options.map((option) => (
                            <button
                                key={option}
                                type="button"
                                onClick={() => {
                                    onChange(option)
                                    setIsOpen(false)
                                }}
                                className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-zinc-600 hover:bg-zinc-50 hover:text-indigo-600 transition-colors"
                            >
                                {option}
                                {value === option && <Check size={16} className="text-indigo-500" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export function NewJobModal({ isOpen, onClose, onSuccess }: NewJobModalProps) {
    const [loading, setLoading] = useState(false)
    const [requirementInput, setRequirementInput] = useState('')
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        location: 'Presencial',
        type: 'Full-time',
        department: 'Não informado',
        seniority: 'Não informado',
        salary_range: 'A combinar',
        location_city: '',
        location_state: '',
        essential_requirements: [] as string[]
    })

    if (!isOpen) return null;

    const addRequirement = () => {
        if (requirementInput.trim()) {
            setFormData({
                ...formData,
                essential_requirements: [...formData.essential_requirements, requirementInput.trim()]
            })
            setRequirementInput('')
        }
    }

    const removeRequirement = (index: number) => {
        setFormData({
            ...formData,
            essential_requirements: formData.essential_requirements.filter((_, i) => i !== index)
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { data, error } = await supabase
                .from('jobs')
                .insert([
                    {
                        company_id: '7ec9b76a-db33-4272-a72a-d81b4c8347d9',
                        title: formData.title,
                        requirements: formData.description,
                        location: formData.location,
                        type: formData.type,
                        department: formData.department === 'Não informado' ? null : formData.department,
                        seniority: formData.seniority === 'Não informado' ? null : formData.seniority,
                        salary_range: formData.salary_range,
                        location_city: formData.location_city,
                        location_state: formData.location_state,
                        essential_requirements: formData.essential_requirements,
                        status: 'OPEN',
                        pipeline_config: [
                            { id: 'triagem', title: 'Triagem', color: 'indigo' },
                            { id: 'qualificacao', title: 'Qualificação', color: 'amber' },
                            { id: 'finalistas', title: 'Finalistas', color: 'emerald' },
                            { id: 'reprovado', title: 'Reprovado', color: 'red' }
                        ]
                    }
                ])
                .select()

            if (error) throw error;

            if (data && data[0]) {
                const newJobId = data[0].id

                // Auto-link temporary candidates (those cloned from bank without a job)
                await supabase
                    .from('job_applications')
                    .update({ job_id: newJobId })
                    .is('job_id', null)
                    .eq('execution_stage', 'CLONED_FROM_BANK')
                    .eq('pipeline_status', 'triagem')

                toast.success('Vaga criada com sucesso!')
                onSuccess(newJobId)
                onClose()
            }
        } catch (error: any) {
            toast.error('Erro ao criar vaga: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    const inputStyles = "w-full px-4 py-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-bold text-zinc-700 placeholder:text-zinc-400/60 placeholder:font-medium"
    const labelStyles = "block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5 ml-1"

    const departmentOptions = ['Não informado', 'Marketing', 'Comercial', 'Operacional', 'Administrativo', 'Tecnologia', 'Recursos Humanos', 'Financeiro', 'Vendas', 'Atendimento', 'Outros']
    const seniorityOptions = ['Não informado', 'Estágio / Trainee', 'Júnior', 'Pleno', 'Sênior', 'Especialista', 'Gerência', 'Diretoria']
    const locationOptions = ['Remoto', 'Híbrido', 'Presencial']
    const contractTypeOptions = ['Full-time (CLT)', 'Contract (PJ)', 'Temporário', 'Freelance', 'Meio Período']

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-zinc-100 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[95vh]">
                {/* Header */}
                <div className="p-8 pb-4 flex items-center justify-between shrink-0">
                    <h3 className="text-2xl font-black text-zinc-900 flex items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                            <Briefcase size={24} />
                        </div>
                        Nova Vaga
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-xl transition-colors">
                        <X size={20} className="text-zinc-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 pt-2 custom-scrollbar">
                    <form id="new-job-form" onSubmit={handleSubmit} className="space-y-6">
                        {/* Nome da Vaga */}
                        <div>
                            <label className={labelStyles}>Nome da Vaga <span className="text-indigo-500">*</span></label>
                            <input
                                required
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Ex: Auxiliar de Manutenção"
                                className={inputStyles}
                            />
                        </div>

                        {/* Área e Senioridade */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <CustomSelect
                                label="Área / Departamento"
                                value={formData.department}
                                options={departmentOptions}
                                icon={<Layers size={18} />}
                                onChange={val => setFormData({ ...formData, department: val })}
                            />
                            <CustomSelect
                                label="Nível / Senioridade"
                                value={formData.seniority}
                                options={seniorityOptions}
                                icon={<TrendingUp size={18} />}
                                onChange={val => setFormData({ ...formData, seniority: val })}
                            />
                        </div>

                        {/* Localização e Tipo */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <CustomSelect
                                label="Localização"
                                value={formData.location}
                                options={locationOptions}
                                icon={<Globe size={18} />}
                                onChange={val => setFormData({ ...formData, location: val })}
                            />
                            <CustomSelect
                                label="Tipo de Contrato"
                                value={formData.type}
                                options={contractTypeOptions}
                                icon={<Building2 size={18} />}
                                onChange={val => setFormData({ ...formData, type: val })}
                            />
                        </div>

                        {/* Cidade/UF Condicional */}
                        {(formData.location === 'Presencial' || formData.location === 'Híbrido') && (
                            <div className="grid grid-cols-3 gap-4 animate-in slide-in-from-top-4 duration-300">
                                <div className="col-span-2">
                                    <label className={labelStyles}>Cidade</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
                                            <MapPin size={18} />
                                        </div>
                                        <input
                                            value={formData.location_city}
                                            onChange={e => setFormData({ ...formData, location_city: e.target.value })}
                                            placeholder="Ex: São Paulo"
                                            className={`${inputStyles} pl-12`}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelStyles}>UF</label>
                                    <input
                                        maxLength={2}
                                        value={formData.location_state}
                                        onChange={e => setFormData({ ...formData, location_state: e.target.value.toUpperCase() })}
                                        placeholder="SP"
                                        className={`${inputStyles} text-center font-black uppercase`}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Faixa Salarial */}
                        <div>
                            <label className={labelStyles}>Faixa Salarial</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
                                    <DollarSign size={18} />
                                </div>
                                <input
                                    value={formData.salary_range}
                                    onChange={e => setFormData({ ...formData, salary_range: e.target.value })}
                                    placeholder="Ex: R$ 4.000 - R$ 6.000 ou A combinar"
                                    className={`${inputStyles} pl-12`}
                                />
                            </div>
                        </div>

                        {/* Requisitos Essenciais */}
                        <div>
                            <label className={labelStyles}>Requisitos Essenciais</label>
                            <div className="flex gap-3">
                                <div className="relative flex-1">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
                                        <Target size={18} />
                                    </div>
                                    <input
                                        value={requirementInput}
                                        onChange={e => setRequirementInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                                        placeholder="Adicionar requisito (Ex: CNH B, Inglês...)"
                                        className={`${inputStyles} pl-12`}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={addRequirement}
                                    className="px-6 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-all font-black"
                                >
                                    <Plus size={24} />
                                </button>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                                {formData.essential_requirements.map((req, index) => (
                                    <div key={index} className="flex items-center gap-2 px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl animate-in zoom-in-95 duration-200 group hover:border-indigo-200 hover:bg-indigo-50/30 transition-all">
                                        <span className="text-xs font-black text-zinc-600">{req}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeRequirement(index)}
                                            className="text-zinc-400 hover:text-rose-500 transition-colors bg-white shadow-sm p-1 rounded-md"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                                {formData.essential_requirements.length === 0 && (
                                    <div className="text-[10px] font-bold text-zinc-300 italic py-2">
                                        Nenhum requisito adicionado ainda. Sugerimos de 3 a 8 itens.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Descrição */}
                        <div>
                            <label className={labelStyles}>Descrição Completa</label>
                            <textarea
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                rows={5}
                                placeholder="Dê detalhes sobre a vaga (opcional)..."
                                className={`${inputStyles} font-bold resize-none leading-relaxed text-sm`}
                            />
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="p-8 pt-4 bg-zinc-50 border-t border-zinc-100 shrink-0">
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 bg-white border border-zinc-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:bg-zinc-100 hover:text-zinc-500 transition-all shadow-sm"
                        >
                            Cancelar
                        </button>
                        <button
                            form="new-job-form"
                            type="submit"
                            disabled={loading}
                            className="flex-[2] py-4 bg-zinc-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-900/10 flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Save size={18} />
                            )}
                            {loading ? 'PROCESSANDO...' : 'PUBLICAR VAGA'}
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #E4E4E7;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #D4D4D8;
                }
            `}</style>
        </div>
    )
}
