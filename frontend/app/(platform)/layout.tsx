'use client'

import React, { useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileMenuProvider } from '@/components/layout/MobileMenuContext'
import { motion } from 'framer-motion'

export default function PlatformLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [collapsed, setCollapsed] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)

    return (
        <div className="flex h-screen bg-background overflow-hidden font-sans">
            <Sidebar
                collapsed={collapsed}
                setCollapsed={setCollapsed}
                isMobileOpen={mobileOpen}
                setMobileOpen={setMobileOpen}
            />

            {/* Desktop: animated margin. Mobile: full width */}
            <motion.main
                initial={false}
                animate={{
                    marginLeft: collapsed ? 80 : 280,
                    width: `calc(100% - ${collapsed ? 80 : 280}px)`
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="flex-1 flex flex-col h-full overflow-y-auto relative max-md:!ml-0 max-md:!w-full"
            >
                <MobileMenuProvider onOpen={() => setMobileOpen(true)}>
                    {children}
                </MobileMenuProvider>
            </motion.main>
        </div>
    )
}

