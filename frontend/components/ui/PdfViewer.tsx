'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink, Download } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PdfViewerProps {
    url: string | null
    isOpen: boolean
    onClose: () => void
    fileName?: string
    title?: string
}

export function PdfViewer({ url, isOpen, onClose, fileName = "Documento", title }: PdfViewerProps) {
    if (!url || !isOpen) return null

    // Determine content type handling
    const isImage = url.match(/\.(jpeg|jpg|png|gif|webp)$/i);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="relative w-full max-w-5xl h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-white shadow-sm z-20">
                    <h3 className="font-bold text-lg text-zinc-900 truncate max-w-md flex items-center gap-2">
                        <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                            {isImage ? "🖼️ Imagem" : "📄 Documento"}
                        </span>
                        {title || fileName}
                    </h3>
                    <div className="flex items-center gap-2">
                        <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors tooltip"
                            title="Abrir em nova aba"
                        >
                            <ExternalLink size={20} />
                        </a>
                        <div className="w-px h-6 bg-zinc-200 mx-2" />
                        <button
                            onClick={onClose}
                            className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 bg-zinc-100 overflow-hidden relative flex items-center justify-center">
                    {isImage ? (
                        <div className="w-full h-full p-4 flex items-center justify-center overflow-auto">
                            <img src={url} alt={fileName} className="max-w-full max-h-full object-contain shadow-lg rounded-lg" />
                        </div>
                    ) : (
                        <iframe
                            src={`${url}#view=FitH`}
                            className="w-full h-full border-none"
                            title="PDF Viewer"
                        />
                    )}
                </div>
            </motion.div>
        </div>
    )
}
