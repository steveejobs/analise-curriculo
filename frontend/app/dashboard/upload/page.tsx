'use client'

import { useState, useCallback } from 'react'
import { Upload, FileText, CheckCircle, XCircle, Loader2, Sparkles } from 'lucide-react'

interface UploadItem {
    id: string
    file: File
    status: 'PENDING' | 'UPLOADING' | 'SUCCESS' | 'ERROR'
    error?: string
    ingestionId?: string
}

export default function ManualUpload() {
    const [queue, setQueue] = useState<UploadItem[]>([])
    const [isProcessing, setIsProcessing] = useState(false)

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        const newItems: UploadItem[] = files.map(file => ({
            id: Math.random().toString(36).substring(7),
            file,
            status: 'PENDING'
        }))
        setQueue(prev => [...prev, ...newItems])
    }

    const removeFile = (id: string) => {
        setQueue(prev => prev.filter(item => item.id !== id))
    }

    const startUpload = async () => {
        setIsProcessing(true)

        for (const item of queue) {
            if (item.status !== 'PENDING') continue

            setQueue(prev => prev.map(i => i.id === item.id ? { ...i, status: 'UPLOADING' } : i))

            const formData = new FormData()
            formData.append('file', item.file)
            formData.append('source_type', 'MANUAL_UPLOAD')
            formData.append('company_id', '00000000-0000-0000-0000-000000000001') // Placeholder

            try {
                const res = await fetch('/api/ingestion/process', {
                    method: 'POST',
                    body: formData
                })

                if (!res.ok) throw new Error('Falha no upload')
                const data = await res.json()

                setQueue(prev => prev.map(i => i.id === item.id ? { ...i, status: 'SUCCESS', ingestionId: data.ingestion_id } : i))
            } catch (err: any) {
                setQueue(prev => prev.map(i => i.id === item.id ? { ...i, status: 'ERROR', error: err.message } : i))
            }
        }

        setIsProcessing(false)
    }

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h1 className="text-4xl font-black tracking-tight mb-2 flex items-center gap-3">
                        <Sparkles className="text-amber-500 w-8 h-8" />
                        Ingestão Manual
                    </h1>
                    <p className="text-zinc-500 font-medium">Upload em massa de currículos para processamento via IA.</p>
                </div>

                {queue.length > 0 && (
                    <button
                        onClick={startUpload}
                        disabled={isProcessing}
                        className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:scale-105 transition-all disabled:opacity-50"
                    >
                        {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                        Iniciar Processamento ({queue.filter(i => i.status === 'PENDING').length})
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <label className="flex flex-col items-center justify-center border-4 border-dashed border-zinc-100 dark:border-zinc-800 rounded-[2.5rem] p-10 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all aspect-square text-center sticky top-8">
                        <Upload className="w-16 h-16 text-zinc-300 mb-6" />
                        <span className="text-lg font-bold mb-2">Adicionar Arquivos</span>
                        <span className="text-sm text-zinc-400 font-medium italic">PDF, DOCX até 15MB</span>
                        <input type="file" multiple onChange={onFileChange} className="hidden" />
                    </label>
                </div>

                <div className="lg:col-span-2 space-y-4">
                    {queue.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
                            <FileText className="w-12 h-12 mb-3 opacity-20" />
                            <p className="font-medium italic">Nenhum arquivo na fila...</p>
                        </div>
                    ) : (
                        queue.map(item => (
                            <div key={item.id} className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm flex items-center justify-between group animate-in slide-in-from-right-4">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-2xl ${item.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600' :
                                            item.status === 'ERROR' ? 'bg-red-50 text-red-600' :
                                                'bg-zinc-50 text-zinc-400'
                                        }`}>
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-zinc-800 dark:text-zinc-200 truncate max-w-[200px]">{item.file.name}</h3>
                                        <p className="text-xs font-medium text-zinc-400">{(item.file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    {item.status === 'UPLOADING' && <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />}
                                    {item.status === 'SUCCESS' && <CheckCircle className="w-6 h-6 text-emerald-500" />}
                                    {item.status === 'ERROR' && <XCircle className="w-6 h-6 text-red-500" />}

                                    {item.status === 'PENDING' && (
                                        <button onClick={() => removeFile(item.id)} className="text-zinc-300 hover:text-red-500 p-2 transition-colors">
                                            <XCircle className="w-6 h-6" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
