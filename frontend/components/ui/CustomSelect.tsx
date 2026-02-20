'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check, Briefcase } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Option {
    value: string
    label: string
}

interface CustomSelectProps {
    value: string
    onChange: (value: string) => void
    options: Option[]
    placeholder?: string
    disabled?: boolean
}

export function CustomSelect({ value, onChange, options, placeholder = "Selecione...", disabled = false }: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const selectedOption = options.find(opt => opt.value === value)

    // Determine display label
    let displayLabel = placeholder
    if (value === "") {
        displayLabel = "Análise Geral (Sem Vaga)"
    } else if (selectedOption) {
        displayLabel = selectedOption.label
    }

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const toggleOpen = () => {
        if (!disabled) setIsOpen(!isOpen)
    }

    const handleSelect = (val: string) => {
        onChange(val)
        setIsOpen(false)
    }

    return (
        <div className="relative w-full" ref={containerRef}>
            <motion.div
                whileTap={{ scale: disabled ? 1 : 0.99 }}
                onClick={toggleOpen}
                className={cn(
                    "relative w-full text-left cursor-pointer",
                    "bg-white border text-zinc-900 rounded-2xl py-4 px-5",
                    "flex items-center justify-between",
                    "transition-all duration-200 ease-out",
                    isOpen ? "border-indigo-500 ring-4 ring-indigo-500/10 shadow-lg shadow-indigo-500/10" : "border-zinc-200 shadow-sm hover:border-zinc-300 hover:shadow-md",
                    disabled && "opacity-50 cursor-not-allowed bg-zinc-50"
                )}
            >
                <div className="flex items-center gap-3 overflow-hidden flex-1">
                    <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                        value ? "bg-indigo-50 text-indigo-600" : "bg-zinc-100 text-zinc-400"
                    )}>
                        <Briefcase size={20} />
                    </div>
                    <div className="flex flex-col truncate">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Vaga Selecionada</span>
                        <span className={cn("block truncate font-bold text-base text-zinc-900", !value && "text-zinc-500")}>
                            {displayLabel}
                        </span>
                    </div>
                </div>

                <span className="pointer-events-none flex items-center pl-4">
                    <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronDown className="h-5 w-5 text-zinc-400" aria-hidden="true" />
                    </motion.div>
                </span>
            </motion.div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 8, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.98 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute z-50 w-full overflow-hidden rounded-2xl bg-white shadow-2xl shadow-zinc-900/20 ring-1 ring-black ring-opacity-5 focus:outline-none max-h-80 flex flex-col"
                    >
                        <div className="p-2 overflow-y-auto custom-scrollbar bg-white">
                            {/* Default Option (Empty / General) */}
                            <motion.div
                                whileHover={{ backgroundColor: "rgba(244, 244, 245, 1)", scale: 0.99 }}
                                onClick={() => handleSelect("")}
                                className={cn(
                                    "cursor-pointer select-none relative py-3 pl-3 pr-9 rounded-xl transition-all mb-1",
                                    value === "" ? "bg-indigo-50/80 text-indigo-900" : "text-zinc-700 hover:bg-zinc-50"
                                )}
                            >
                                <div className="flex items-center">
                                    <div className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mr-3",
                                        value === "" ? "bg-indigo-100 text-indigo-600" : "bg-zinc-100 text-zinc-400"
                                    )}>
                                        <Briefcase size={14} />
                                    </div>
                                    <span className={cn("block truncate", value === "" ? "font-bold" : "font-medium")}>
                                        Análise Geral (Sem Vaga)
                                    </span>
                                </div>
                                {value === "" && (
                                    <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-indigo-600">
                                        <Check className="h-5 w-5" aria-hidden="true" />
                                    </span>
                                )}
                            </motion.div>

                            {/* Job Options */}
                            {options.length > 0 ? (
                                options.map((option) => (
                                    <motion.div
                                        key={option.value}
                                        whileHover={{ backgroundColor: "rgba(244, 244, 245, 1)", scale: 0.99 }}
                                        onClick={() => handleSelect(option.value)}
                                        className={cn(
                                            "cursor-pointer select-none relative py-3 pl-3 pr-9 rounded-xl transition-all mb-1",
                                            value === option.value ? "bg-indigo-50/80 text-indigo-900" : "text-zinc-700 hover:bg-zinc-50"
                                        )}
                                    >
                                        <div className="flex items-center">
                                            <div className={cn(
                                                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mr-3",
                                                value === option.value ? "bg-indigo-100 text-indigo-600" : "bg-zinc-100 text-zinc-400"
                                            )}>
                                                <Briefcase size={14} />
                                            </div>
                                            <span className={cn("block truncate", value === option.value ? "font-bold" : "font-medium")}>
                                                {option.label}
                                            </span>
                                        </div>

                                        {value === option.value && (
                                            <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-indigo-600">
                                                <Check className="h-5 w-5" aria-hidden="true" />
                                            </span>
                                        )}
                                    </motion.div>
                                ))
                            ) : (
                                <div className="px-4 py-8 text-sm text-zinc-400 text-center font-medium italic">
                                    Nenhuma vaga encontrada
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
