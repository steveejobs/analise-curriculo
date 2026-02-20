'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
    FileText,
    Mail,
    Save,
    Trash2,
    Loader2,
    CheckCircle2,
    XCircle,
    Type,
    Variable,
    Plus,
    Eye,
    Code,
    Sparkles
} from 'lucide-react'

export function EmailTemplateForm() {
    const [templates, setTemplates] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [message, setMessage] = useState('')
    const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit')

    const [formData, setFormData] = useState({
        id: '',
        name: '',
        subject: '',
        body: ''
    })

    const variables = [
        { label: 'Nome do Candidato', value: '{{nome_candidato}}' },
        { label: 'Título da Vaga', value: '{{titulo_vaga}}' },
        { label: 'Empresa', value: '{{nome_empresa}}' },
    ]

    useEffect(() => {
        loadTemplates()
    }, [])

    async function loadTemplates() {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('email_templates')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setTemplates(data || [])
            if (data && data.length > 0 && !formData.id) {
                const first = data[0]
                setFormData({
                    id: first.id,
                    name: first.name,
                    subject: first.subject,
                    body: first.body
                })
            }
        } catch (err: any) {
            console.error('Error loading templates:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!formData.name || !formData.subject || !formData.body) {
            setStatus('error')
            setMessage('Preencha todos os campos obrigatórios.')
            return
        }

        setSaving(true)
        setStatus('idle')

        try {
            const payload = {
                name: formData.name,
                subject: formData.subject,
                body: formData.body,
                company_id: '00000000-0000-0000-0000-000000000000' // Placeholder
            }

            let error
            if (formData.id) {
                const { error: updateError } = await supabase
                    .from('email_templates')
                    .update(payload)
                    .eq('id', formData.id)
                error = updateError
            } else {
                const { error: insertError } = await supabase
                    .from('email_templates')
                    .insert([payload])
                error = insertError
            }

            if (error) throw error

            setStatus('success')
            setMessage('Template salvo com sucesso!')
            await loadTemplates()
        } catch (err: any) {
            console.error(err)
            setStatus('error')
            setMessage('Erro ao salvar o template.')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este template?')) return

        try {
            const { error } = await supabase
                .from('email_templates')
                .delete()
                .eq('id', id)

            if (error) throw error

            if (formData.id === id) {
                setFormData({ id: '', name: '', subject: '', body: '' })
            }
            await loadTemplates()
        } catch (err: any) {
            console.error(err)
            alert('Erro ao excluir template')
        }
    }

    const insertVariable = (variable: string) => {
        setFormData(prev => ({
            ...prev,
            body: prev.body + variable
        }))
    }

    const resetForm = () => {
        setFormData({ id: '', name: '', subject: '', body: '' })
        setStatus('idle')
        setMessage('')
        setViewMode('edit')
    }

    const renderPreview = () => {
        let content = formData.body
        variables.forEach(v => {
            const placeholder = v.label.split(' ')[0] // Simples replace para demo
            content = content.replace(new RegExp(v.value, 'g'), `<span class="bg-indigo-100 text-indigo-700 px-1 rounded font-bold">[${v.label}]</span>`)
        })

        return (
            <div
                className="w-full bg-white border border-zinc-200 rounded-xl px-6 py-6 min-h-[300px] overflow-auto prose prose-indigo max-w-none"
                dangerouslySetInnerHTML={{ __html: content }}
            />
        )
    }

    if (loading && templates.length === 0) {
        return (
            <div className="bg-white p-8 rounded-[2rem] border border-zinc-100 flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-indigo-500" size={32} />
            </div>
        )
    }

    return (
        <div className="bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-sm max-w-5xl">
            <div className="flex items-start justify-between mb-8">
                <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                        <Mail size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-zinc-900">Templates de E-mail</h3>
                        <p className="text-zinc-500 text-sm font-medium mt-1">Configure modelos de mensagem para candidatos com suporte a HTML.</p>
                    </div>
                </div>
                <button
                    onClick={resetForm}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-100 transition-colors"
                >
                    <Plus size={14} /> Novo Template
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Lista lateral */}
                <div className="md:col-span-1 space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2 mb-2 block">Seus Templates</label>
                    <div className="max-h-[600px] overflow-y-auto pr-2 space-y-2">
                        {templates.length === 0 ? (
                            <p className="text-xs text-zinc-400 px-2 italic">Nenhum template cadastrado.</p>
                        ) : (
                            templates.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => {
                                        setFormData({ id: t.id, name: t.name, subject: t.subject, body: t.body })
                                        setViewMode('edit')
                                    }}
                                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-between group ${formData.id === t.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100'
                                        }`}
                                >
                                    <span className="truncate">{t.name}</span>
                                    {formData.id !== t.id && (
                                        <Trash2
                                            size={14}
                                            className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all shrink-0"
                                            onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}
                                        />
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Formulário */}
                <div className="md:col-span-3 space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                <Type size={12} /> Nome do Template
                            </label>
                            <input
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-bold text-zinc-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                placeholder="Ex: Convite para Entrevista"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                <FileText size={12} /> Assunto do E-mail
                            </label>
                            <input
                                value={formData.subject}
                                onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-bold text-zinc-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                placeholder="Ex: Olá {{nome_candidato}}, temos uma atualização!"
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setViewMode('edit')}
                                        className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'edit' ? 'text-indigo-600' : 'text-zinc-400 hover:text-zinc-600'}`}
                                    >
                                        <Code size={14} /> Editor HTML
                                    </button>
                                    <button
                                        onClick={() => setViewMode('preview')}
                                        className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'preview' ? 'text-indigo-600' : 'text-zinc-400 hover:text-zinc-600'}`}
                                    >
                                        <Eye size={14} /> Visualização
                                    </button>
                                </div>

                                <div className="flex gap-2">
                                    {variables.map(v => (
                                        <button
                                            key={v.value}
                                            onClick={() => insertVariable(v.value)}
                                            className="text-[10px] bg-zinc-100 text-zinc-500 px-2 py-1 rounded-md font-bold hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-zinc-200"
                                            title={`Inserir ${v.label}`}
                                        >
                                            {v.value}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {viewMode === 'edit' ? (
                                <textarea
                                    value={formData.body}
                                    onChange={e => setFormData({ ...formData, body: e.target.value })}
                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-medium text-zinc-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all min-h-[300px] font-mono"
                                    placeholder="Escreva sua mensagem em HTML aqui... Ex: <p>Olá {{nome_candidato}}!</p>"
                                />
                            ) : (
                                renderPreview()
                            )}

                            <div className="bg-indigo-50/50 p-4 rounded-xl flex gap-3 items-start">
                                <Sparkles className="text-indigo-500 shrink-0" size={18} />
                                <p className="text-[11px] text-indigo-700 leading-relaxed">
                                    <strong>Dica:</strong> Você pode usar tags HTML como <code className="bg-indigo-100 px-1 rounded">&lt;p&gt;</code>, <code className="bg-indigo-100 px-1 rounded">&lt;b&gt;</code>, <code className="bg-indigo-100 px-1 rounded">&lt;br&gt;</code> e <code className="bg-indigo-100 px-1 rounded">&lt;a&gt;</code> para formatar seu e-mail de forma profissional.
                                </p>
                            </div>
                        </div>
                    </div>

                    {message && (
                        <div className={`p-4 rounded-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${status === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                            {status === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                            <span className="text-sm font-bold">{message}</span>
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-6 border-t border-zinc-100">
                        {formData.id && (
                            <button
                                onClick={() => handleDelete(formData.id)}
                                className="px-6 py-3 rounded-xl font-bold text-sm text-red-500 hover:bg-red-50 transition-colors"
                            >
                                Excluir
                            </button>
                        )}
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-zinc-900 text-white px-8 py-3 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-900/10 active:scale-95 disabled:opacity-70"
                        >
                            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            {formData.id ? 'Salvar Alterações' : 'Criar Template'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
