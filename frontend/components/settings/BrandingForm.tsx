'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Save, Palette, Type, Upload, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'

export function BrandingForm() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [settings, setSettings] = useState({
        company_name: '',
        primary_color: '#6366f1',
        logo_url: ''
    })

    useEffect(() => {
        async function fetchSettings() {
            setLoading(true)
            const { data, error } = await supabase
                .from('company_settings')
                .select('*')
                .maybeSingle()

            if (data) {
                setSettings({
                    company_name: data.company_name || '',
                    primary_color: data.primary_color || '#6366f1',
                    logo_url: data.logo_url || ''
                })
            }
            setLoading(false)
        }
        fetchSettings()
    }, [])

    const handleSave = async () => {
        setSaving(true)
        try {
            const { data: existing } = await supabase
                .from('company_settings')
                .select('id')
                .maybeSingle()

            let error
            if (existing) {
                const { error: updateError } = await supabase
                    .from('company_settings')
                    .update(settings)
                    .eq('id', existing.id)
                error = updateError
            } else {
                const { error: insertError } = await supabase
                    .from('company_settings')
                    .insert([settings])
                error = insertError
            }

            if (error) {
                if (error.message.includes('not find the table')) {
                    toast.error('Tabela não encontrada. Por favor, execute a migração SQL no seu painel do Supabase.')
                } else {
                    toast.error('Erro ao salvar: ' + error.message)
                }
                throw error
            }
            toast.success('Branding atualizado com sucesso!')
        } catch (error: any) {
            toast.error('Erro ao salvar: ' + error.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="animate-pulse flex space-x-4 p-8 bg-white rounded-[2rem] border border-zinc-100 h-64"></div>

    return (
        <div className="bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-sm space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Company Name */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-zinc-400">
                        <Type size={18} />
                        <label className="text-xs font-black uppercase tracking-widest">Nome da Empresa</label>
                    </div>
                    <input
                        value={settings.company_name}
                        onChange={e => setSettings({ ...settings, company_name: e.target.value })}
                        placeholder="Ex: ATS Core Tech"
                        className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-sm font-bold text-zinc-900 outline-none focus:bg-white focus:border-zinc-900 transition-all shadow-sm"
                    />
                </div>

                {/* Primary Color */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-zinc-400">
                        <Palette size={18} />
                        <label className="text-xs font-black uppercase tracking-widest">Cor Principal</label>
                    </div>
                    <div className="flex gap-4 items-center">
                        <input
                            type="color"
                            value={settings.primary_color}
                            onChange={e => setSettings({ ...settings, primary_color: e.target.value })}
                            className="w-16 h-14 rounded-xl cursor-pointer bg-zinc-50 border border-zinc-100 p-1"
                        />
                        <input
                            value={settings.primary_color}
                            onChange={e => setSettings({ ...settings, primary_color: e.target.value })}
                            className="flex-1 bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-sm font-bold text-zinc-900 outline-none focus:bg-white focus:border-zinc-900 transition-all shadow-sm"
                        />
                    </div>
                </div>

                {/* Logo URL */}
                <div className="space-y-4 md:col-span-2">
                    <div className="flex items-center gap-2 text-zinc-400">
                        <ImageIcon size={18} />
                        <label className="text-xs font-black uppercase tracking-widest">URL do Logo (SVG ou PNG)</label>
                    </div>
                    <div className="flex gap-4 items-center">
                        <input
                            value={settings.logo_url}
                            onChange={e => setSettings({ ...settings, logo_url: e.target.value })}
                            placeholder="https://suaempresa.com/logo.svg"
                            className="flex-1 bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-sm font-bold text-zinc-900 outline-none focus:bg-white focus:border-zinc-900 transition-all shadow-sm"
                        />
                        {settings.logo_url && (
                            <div className="w-14 h-14 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center p-2 overflow-hidden">
                                <img src={settings.logo_url} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="pt-4 flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-zinc-900 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-900/10 active:scale-95 disabled:opacity-50"
                >
                    <Save size={18} />
                    {saving ? 'Salvando...' : 'Salvar Branding'}
                </button>
            </div>
        </div>
    )
}
