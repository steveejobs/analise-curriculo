'use client'

import React from 'react'
import { Header } from '@/components/layout/Header'
import { EmailIntegrationForm } from '@/components/settings/EmailIntegrationForm'
import { EmailTemplateForm } from '@/components/settings/EmailTemplateForm'
import { BrandingForm } from '@/components/settings/BrandingForm'

export default function SettingsPage() {
    return (
        <div className="flex flex-col h-full bg-[#F8FAFC]">
            <Header title="Configurações do Sistema" description="Gerencie integrações, branding e preferências da plataforma." />

            <div className="flex-1 overflow-auto p-8">
                <div className="max-w-4xl mx-auto space-y-12">

                    <section>
                        <h2 className="text-lg font-black text-zinc-400 uppercase tracking-widest mb-4 px-2">Identidade Visual</h2>
                        <BrandingForm />
                    </section>

                    <section>
                        <h2 className="text-lg font-black text-zinc-400 uppercase tracking-widest mb-4 px-2">Canais de Entrada</h2>
                        <EmailIntegrationForm />
                    </section>

                    <section>
                        <h2 className="text-lg font-black text-zinc-400 uppercase tracking-widest mb-4 px-2">Comunicação</h2>
                        <EmailTemplateForm />
                    </section>

                    {/* Placeholder for future settings */}
                    <section className="opacity-50 pointer-events-none filter grayscale">
                        <h2 className="text-lg font-black text-zinc-400 uppercase tracking-widest mb-4 px-2">Webhooks & API</h2>
                        <div className="bg-white p-8 rounded-[2rem] border border-zinc-100 h-40 flex items-center justify-center">
                            <p className="font-bold text-zinc-300">Em breve...</p>
                        </div>
                    </section>

                </div>
            </div>
        </div>
    )
}
