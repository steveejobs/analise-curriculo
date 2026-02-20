'use client'

import React, { createContext, useContext } from 'react'

interface MobileMenuContextType {
    openMobileMenu: () => void
}

const MobileMenuContext = createContext<MobileMenuContextType>({
    openMobileMenu: () => { }
})

export function MobileMenuProvider({
    children,
    onOpen,
}: {
    children: React.ReactNode
    onOpen: () => void
}) {
    return (
        <MobileMenuContext.Provider value={{ openMobileMenu: onOpen }}>
            {children}
        </MobileMenuContext.Provider>
    )
}

export function useMobileMenu() {
    return useContext(MobileMenuContext)
}
