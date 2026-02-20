'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
    LayoutDashboard,
    Activity,
    Briefcase,
    Users,
    UploadCloud,
    Settings,
    ChevronLeft,
    ChevronRight,
    LogOut,
    Menu,
    Trash2,
    X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { UserButton, SignedIn, SignedOut, SignInButton } from '@clerk/nextjs'
import { LogIn } from 'lucide-react'

interface SidebarProps {
    collapsed: boolean
    setCollapsed: (v: boolean) => void
    isMobileOpen?: boolean
    setMobileOpen?: (v: boolean) => void
}

export function Sidebar({ collapsed, setCollapsed, isMobileOpen = false, setMobileOpen }: SidebarProps) {
    const pathname = usePathname()

    // Close mobile sidebar on navigation
    useEffect(() => {
        if (setMobileOpen) setMobileOpen(false)
    }, [pathname])

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
        { icon: Activity, label: 'Pup Line', href: '/pup-line' },
        { icon: Briefcase, label: 'Vagas', href: '/jobs' },
        { icon: Users, label: 'Candidatos', href: '/candidates' },
        { icon: UploadCloud, label: 'Ingestão', href: '/ingestion' },
        { icon: Settings, label: 'Configurações', href: '/settings' },
        { icon: Trash2, label: 'Descartados', href: '/discarded' },
    ]

    return (
        <>
            {/* Mobile Overlay */}
            <AnimatePresence>
                {isMobileOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setMobileOpen?.(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                    />
                )}
            </AnimatePresence>

            <motion.aside
                initial={{ width: collapsed ? 80 : 280 }}
                animate={{ width: collapsed ? 80 : 280 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className={cn(
                    "h-screen bg-zinc-950 text-white flex flex-col border-r border-zinc-800 z-50 fixed left-0 top-0 overflow-hidden",
                    "max-md:transition-transform max-md:duration-300 max-md:ease-in-out max-md:w-[280px]",
                    isMobileOpen ? "max-md:translate-x-0" : "max-md:-translate-x-full"
                )}
            >
                {/* Mobile Close Button */}
                <button
                    onClick={() => setMobileOpen?.(false)}
                    className="absolute top-6 right-4 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/20 transition-all md:hidden z-10"
                >
                    <X size={16} />
                </button>

                {/* Logo Area */}
                <div className="h-20 flex items-center px-6 border-b border-zinc-800/50">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-400 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-900/20">
                            <span className="font-bold text-white text-lg">P</span>
                        </div>
                        {!collapsed && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col"
                            >
                                <span className="font-bold text-lg tracking-tight">PupLine<span className="text-indigo-400">ATS</span></span>
                                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Enterprise</span>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
                    {navItems.map((item) => {
                        const isActive = pathname.startsWith(item.href)

                        return (
                            <Link href={item.href} key={item.href}>
                                <div className={cn(
                                    "relative flex items-center gap-4 px-3 py-3 rounded-xl transition-all group overflow-hidden",
                                    isActive
                                        ? "text-white bg-white/10 shadow-inner"
                                        : "text-zinc-400 hover:text-white hover:bg-white/5"
                                )}>
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute left-0 w-1 h-6 bg-indigo-500 rounded-r-full shadow-[0_0_12px_rgba(99,102,241,0.8)]"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                        />
                                    )}

                                    <item.icon className={cn(
                                        "shrink-0 transition-colors",
                                        isActive ? "text-indigo-400" : "group-hover:text-indigo-400"
                                    )} size={22} strokeWidth={1.5} />

                                    {!collapsed && (
                                        <span className="font-medium text-sm whitespace-nowrap">{item.label}</span>
                                    )}

                                    {!collapsed && isActive && (
                                        <motion.div
                                            layoutId="glow"
                                            className="absolute inset-0 bg-indigo-500/5 rounded-xl z-0"
                                        />
                                    )}
                                </div>
                            </Link>
                        )
                    })}
                </nav>

                {/* User Profile / Footer */}
                <div className="p-4 border-t border-zinc-800/50">
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-zinc-900 text-zinc-500 hover:text-white transition-colors"
                    >
                        {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                    </button>

                    {!collapsed && (
                        <div className="mt-4 flex items-center justify-between gap-3 px-2 py-2 rounded-xl bg-white/5 border border-white/10">
                            <SignedIn>
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <UserButton
                                        afterSignOutUrl="/"
                                        appearance={{
                                            elements: {
                                                userButtonAvatarBox: "w-9 h-9 border border-white/20"
                                            }
                                        }}
                                    />
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-xs font-bold text-zinc-100 truncate">Sessão Ativa</span>
                                        <span className="text-[10px] text-zinc-500 uppercase font-black">Admin</span>
                                    </div>
                                </div>
                            </SignedIn>
                            <SignedOut>
                                <SignInButton mode="modal">
                                    <button className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors">
                                        <LogIn size={16} /> Entrar
                                    </button>
                                </SignInButton>
                            </SignedOut>
                        </div>
                    )}
                </div>
            </motion.aside>
        </>
    )
}
