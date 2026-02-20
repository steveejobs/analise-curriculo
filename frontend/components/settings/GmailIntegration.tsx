'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { useUser } from '@clerk/nextjs'

export function GmailIntegration() {
    const { user } = useUser()
    const [integration, setIntegration] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function checkIntegration() {
            if (!user) return

            const { data } = await supabase
                .from('email_integrations')
                .select('email_address')
                .eq('user_id', user.id)
                .single()

            setIntegration(data)
            setLoading(false)
        }
        checkIntegration()
    }, [user])

    const handleConnect = () => {
        window.location.href = '/api/auth/google'
    }

    const handleDisconnect = async () => {
        if (!user) return
        setLoading(true)
        await supabase
            .from('email_integrations')
            .delete()
            .eq('user_id', user.id)

        setIntegration(null)
        setLoading(false)
    }

    if (loading) return <Loader2 className="animate-spin text-zinc-400" />

    return (
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                        <Mail size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-zinc-900">Integração Gmail</h3>
                        <p className="text-sm text-zinc-500">Envie e-mails automáticos via Gmail API</p>
                    </div>
                </div>

                {integration ? (
                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold">
                        <CheckCircle2 size={14} /> Ativo
                    </div>
                ) : (
                    <div className="flex items-center gap-2 px-3 py-1 bg-zinc-100 text-zinc-500 rounded-full text-xs font-bold">
                        <AlertCircle size={14} /> Não Conectado
                    </div>
                )}
            </div>

            {integration ? (
                <div className="space-y-4">
                    <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-100">
                        <p className="text-sm font-medium text-zinc-600">Conectado como:</p>
                        <p className="text-base font-bold text-zinc-900">{integration.email_address}</p>
                    </div>
                    <button
                        onClick={handleDisconnect}
                        className="text-sm text-red-600 font-bold hover:underline"
                    >
                        Desconectar conta
                    </button>
                </div>
            ) : (
                <button
                    onClick={handleConnect}
                    className="w-full py-3 bg-zinc-900 text-white rounded-lg font-bold hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
                >
                    <Mail size={18} /> Conectar meu Gmail
                </button>
            )}
        </div>
    )
}
