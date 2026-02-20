'use client'

import React from 'react'
import { Bell, Search, HelpCircle, LogIn, UserPlus, Menu } from 'lucide-react'
import { motion } from 'framer-motion'
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import { useMobileMenu } from './MobileMenuContext'

export function Header({ title, description, onMenuClick }: { title?: string, description?: string, onMenuClick?: () => void }) {
    const { openMobileMenu } = useMobileMenu()
    const handleMenuClick = onMenuClick || openMobileMenu

    return (
        <header className="h-20 border-b border-zinc-200/60 bg-white/50 backdrop-blur-xl sticky top-0 z-40 px-4 md:px-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                {/* Mobile hamburger */}
                <button
                    onClick={handleMenuClick}
                    className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-600 hover:bg-zinc-200 transition-all md:hidden shrink-0"
                >
                    <Menu size={20} />
                </button>

                <div className="flex flex-col justify-center min-w-0">
                    {title && (
                        <motion.h1
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-lg md:text-xl font-bold text-zinc-900 tracking-tight truncate"
                        >
                            {title}
                        </motion.h1>
                    )}
                    {description && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-xs font-medium text-zinc-500 truncate hidden sm:block"
                        >
                            {description}
                        </motion.p>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4 shrink-0">
                <div className="relative group hidden sm:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar candidatos..."
                        className="h-9 pl-9 pr-4 rounded-xl bg-zinc-100/50 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all text-xs w-48 outline-none"
                    />
                </div>

                <div className="flex items-center gap-1 pr-2 md:pr-4 border-r border-zinc-100">
                    <button className="w-9 h-9 rounded-xl hover:bg-zinc-100 flex items-center justify-center text-zinc-400 hover:text-indigo-600 transition-all">
                        <Bell size={18} />
                    </button>
                    <button className="w-9 h-9 rounded-xl hover:bg-zinc-100 flex items-center justify-center text-zinc-400 hover:text-indigo-600 transition-all hidden sm:flex">
                        <HelpCircle size={18} />
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    {/* Auth moved to Sidebar for cleaner UI */}
                </div>
            </div>
        </header>
    )
}
