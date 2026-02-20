'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Brain } from 'lucide-react'

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">

            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-900/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-900/10 rounded-full blur-[120px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 shadow-2xl z-10"
            >
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20">
                        <Brain className="text-zinc-900" size={24} />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Intelligent ATS</h1>
                    <p className="text-zinc-400 text-sm mt-1">Recrutamento potencializado por IA</p>
                </div>

                {children}
            </motion.div>

            <p className="text-zinc-500 text-xs mt-8 z-10">
                &copy; {new Date().getFullYear()} Intelligent Enterprise. Todos os direitos reservados.
            </p>
        </div>
    )
}
