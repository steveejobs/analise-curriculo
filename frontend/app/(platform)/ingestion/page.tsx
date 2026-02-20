'use client'

import { useState, useEffect } from 'react'
import {
    Upload,
    FileText,
    CheckCircle2,
    X,
    LayoutDashboard,
    Search,
    Briefcase,
    TrendingUp,
    BrainCircuit,
    Settings,
    Clock,
    Loader2,
    ChevronRight,
    Brain,
    Mail,
    RefreshCw,
    AlertCircle,
    Eye,
    ShieldAlert,
    Trash2
} from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/Header'
import { toast } from 'sonner'
import { CustomSelect } from '@/components/ui/CustomSelect'
import { PdfViewer } from '@/components/ui/PdfViewer'

interface IngestionFile {
    id?: string
    file: File
    status: 'WAIT' | 'UPLOADING' | 'EXTRACTING' | 'EXTRACTED' | 'QUEUED_N8N' | 'ANALYZING' | 'DONE' | 'SCREENED' | 'ERROR'
    progress: number
    extractedData?: any
    error?: string
    publicUrl?: string
}

interface Job {
    id: string
    title: string
    status: string
}

export default function IngestionPage() {
    const [files, setFiles] = useState<IngestionFile[]>([])
    const [isDragging, setIsDragging] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [isSyncingEmail, setIsSyncingEmail] = useState(false)
    const [emailSyncResult, setEmailSyncResult] = useState<any>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [isLoadingJobs, setIsLoadingJobs] = useState(true)

    // Helper to calculate progress consistently
    const calculateProgress = (status: string, score: number = 0) => {
        if (status === 'ERROR' || status === 'DONE' || status === 'SCREENED' || status === 'EXTRACTED' || status === 'ANALYZING' || score > 0) return 100;
        if (status === 'QUEUED_N8N') return 60;
        if (status === 'EXTRACTING') return 40;
        if (status === 'UPLOADING') return 20;
        return 10;
    };

    // Job Selection    // Stats State
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        analyzing: 0,
        done: 0,
        error: 0
    })

    // Update stats whenever files change
    useEffect(() => {
        const newStats = {
            total: files.length,
            pending: files.filter(f => f.status === 'WAIT' || f.status === 'QUEUED_N8N').length,
            analyzing: files.filter(f => f.status === 'EXTRACTING' || f.status === 'UPLOADING' || f.status === 'ANALYZING').length,
            done: files.filter(f => f.status === 'DONE').length,
            error: files.filter(f => f.status === 'ERROR').length
        }
        setStats(newStats)
    }, [files])

    // Job Selection State
    const [jobs, setJobs] = useState<Job[]>([])
    const [selectedJobId, setSelectedJobId] = useState<string>('')
    const [analysisMode, setAnalysisMode] = useState<'normal' | 'strict'>('normal')

    // 1. Fetch Jobs & Pending Uploads on Mount
    useEffect(() => {
        async function loadInitialData() {
            setIsLoadingJobs(true)
            try {
                // Fetch Jobs
                const { data: jobsData } = await supabase
                    .from('jobs')
                    .select('id, title, status')
                    .in('status', ['OPEN', 'active', 'ACTIVE'])
                    .order('created_at', { ascending: false })

                if (jobsData) setJobs(jobsData)

                // Fetch Pending/Processing Files (Persistence)
                const { data: pendingData } = await supabase
                    .from('job_applications')
                    .select('*')
                    .in('ai_status', ['PENDING', 'UPLOADING', 'EXTRACTING', 'EXTRACTED', 'QUEUED_N8N', 'ANALYZING', 'ERROR', 'NEW', 'STARTING'])
                    .order('created_at', { ascending: false })

                if (pendingData) {
                    const mappedFiles: IngestionFile[] = pendingData.map(app => ({
                        id: app.id,
                        file: new File([""], app.candidate_name || "Unknown", { type: "application/pdf" }), // Mock File object
                        status: app.ai_status as any,
                        progress: calculateProgress(app.ai_status, app.ai_score),
                        extractedData: app,
                        publicUrl: app.resume_url,
                        error: app.ai_status === 'ERROR' ? app.ai_explanation : undefined
                    }))
                    setFiles(prev => [...prev, ...mappedFiles])
                }

            } catch (err: any) {
                console.error('Erro detalhado ao carregar dados iniciais:', {
                    message: err.message,
                    stack: err.stack,
                    err
                })
                toast.error('Erro ao carregar dados. Verifique a conexão com o Supabase.')
            } finally {
                setIsLoadingJobs(false)
            }
        }
        loadInitialData()
    }, [])

    // 2. Clear Queue
    async function handleClearQueue() {
        if (files.length === 0) return

        const confirmDelete = confirm('Tem certeza que deseja excluir TODOS os itens da fila?')
        if (!confirmDelete) return

        try {
            // Get IDs of persisted files
            const persistedIds = files.filter(f => f.id).map(f => f.id as string)

            if (persistedIds.length > 0) {
                const { error } = await supabase
                    .from('job_applications')
                    .delete()
                    .in('id', persistedIds)

                if (error) throw error
            }

            setFiles([])
            toast.success('Fila limpa com sucesso.')
        } catch (err) {
            console.error('Erro ao limpar fila:', err)
            toast.error('Erro ao excluir alguns itens.')
        }
    }

    // 2. Realtime Updates
    useEffect(() => {
        const channel = supabase
            .channel('ingestion_live')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'job_applications' },
                (payload) => {
                    const updated = payload.new as any
                    setFiles(currentFiles => {
                        const index = currentFiles.findIndex(f => f.id === updated.id)
                        if (index === -1) return currentFiles

                        const next = [...currentFiles]

                        // Mapear status do banco para status da UI
                        let newStatus = updated.ai_status
                        if (updated.ai_status === 'DONE' || updated.ai_status === 'SCREENED') {
                            newStatus = 'DONE'
                        }

                        next[index] = {
                            ...next[index],
                            status: newStatus,
                            progress: calculateProgress(updated.ai_status, updated.ai_score),
                            extractedData: { ...(next[index].extractedData || {}), ...updated }
                        }
                        return next
                    })
                }
            )
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [])


    // 3. Fallback Polling (Every 4 seconds)
    useEffect(() => {
        const interval = setInterval(async () => {
            const pendingIds = files
                .filter(f => ['WAIT', 'UPLOADING', 'EXTRACTING', 'QUEUED_N8N', 'ANALYZING'].includes(f.status || '') && f.id)
                .map(f => f.id)

            if (pendingIds.length === 0) return

            const { data: updates } = await supabase
                .from('job_applications')
                .select('*')
                .in('id', pendingIds)

            if (updates) {
                console.log(`[INGESTION] Polling found ${updates.length} updates`);
                setFiles(current => {
                    const next = [...current]
                    updates.forEach(update => {
                        const idx = next.findIndex(f => f.id === update.id)
                        if (idx !== -1) {
                            console.log(`[INGESTION] Updating file ${update.candidate_name}: ${update.ai_status}`);
                            // Logic copied from realtime
                            let newStatus = update.ai_status
                            if (update.ai_status === 'DONE' || update.ai_status === 'SCREENED') {
                                newStatus = 'DONE'
                            }

                            next[idx] = {
                                ...next[idx],
                                status: newStatus || next[idx].status,
                                progress: calculateProgress(update.ai_status, update.ai_score),
                                extractedData: { ...(next[idx].extractedData || {}), ...update }
                            }
                        }
                    })
                    return next
                })
            }
        }, 2000)

        return () => clearInterval(interval)
    }, [files]) // Re-run effect when files list changes to update pendingIds

    const handleFilesAdded = (newFiles: File[]) => {
        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
            'image/png',
            'image/jpeg',
            'text/plain',
            'text/markdown'
        ]

        const filtered = newFiles.filter(f => allowedTypes.includes(f.type))
        if (filtered.length === 0) return

        // Duplicate Check
        const uniqueFiles = filtered.filter(newFile => {
            // Check only against current queue names to avoid blocking legitimate re-uploads/different sessions
            const isDuplicateInQueue = files.some(existing =>
                existing.file.name === newFile.name && existing.status !== 'ERROR'
            )

            if (isDuplicateInQueue) {
                toast.warning(`Arquivo já está na fila: ${newFile.name}`)
                return false
            }
            return true
        })

        if (uniqueFiles.length === 0) return

        const newItems = uniqueFiles.map(f => ({ file: f, status: 'WAIT' as const, progress: 0 }))
        setFiles(prev => [...prev, ...newItems])
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        handleFilesAdded(Array.from(e.dataTransfer.files))
    }

    // Process Batch Function
    const processBatch = async () => {
        if (isProcessing) return

        // Removed mandatory job selection check

        const pendingFiles = files.filter(f => f.status === 'WAIT')
        if (pendingFiles.length === 0) return

        setIsProcessing(true)
        toast.info(`Iniciando processamento de ${pendingFiles.length} arquivos...`)

        const uploadedRefs: { id: string, path: string, publicUrl: string, originalName: string, index: number }[] = []

        try {
            // 1. Upload Parallel to Storage
            const uploadPromises = pendingFiles.map(async (fileItem) => {
                const index = files.findIndex(f => f === fileItem)

                // Update UI to Uploading
                setFiles(prev => {
                    const next = [...prev]
                    if (next[index]) next[index] = { ...next[index], status: 'UPLOADING', progress: 20 }
                    return next
                })

                try {
                    const fileExt = fileItem.file.name.split('.').pop()
                    const fileName = `${Math.random().toString(36).substring(7)}.${fileExt}`
                    const filePath = `bulk/${fileName}`

                    const { error: uploadError } = await supabase.storage
                        .from('resumes')
                        .upload(filePath, fileItem.file)

                    if (uploadError) throw uploadError

                    const { data: { publicUrl } } = supabase.storage.from('resumes').getPublicUrl(filePath)

                    // Create DB Record
                    const { data: application, error: insertError } = await supabase.from('job_applications').insert([{
                        candidate_name: fileItem.file.name.replace(/\.[^/.]+$/, ""),
                        candidate_email: 'pending@extraction.ai',
                        resume_url: publicUrl,
                        ai_status: 'UPLOADING',
                        job_id: selectedJobId || null,
                        criteria_evaluation: {
                            analysis_mode: analysisMode
                        }
                    }]).select().single()

                    if (insertError || !application) throw insertError || new Error('Falha ao criar registro no banco (application is null)')

                    // Update UI with ID
                    setFiles(prev => {
                        const next = [...prev]
                        if (next[index]) {
                            next[index].id = application.id
                            next[index].status = 'EXTRACTING'
                            next[index].progress = 40
                            next[index].publicUrl = publicUrl // Save publicUrl for preview
                        }
                        return next
                    })

                    return {
                        id: application.id,
                        path: filePath,
                        publicUrl,
                        originalName: fileItem.file.name,
                        index
                    }

                } catch (err: any) {
                    console.error('Upload error for file:', fileItem.file.name, err)
                    setFiles(prev => {
                        const next = [...prev]
                        if (next[index]) next[index] = { ...next[index], status: 'ERROR', error: err.message, progress: 0 }
                        return next
                    })
                    return null
                }
            })

            const results = await Promise.all(uploadPromises)
            const successUploads = results.filter((r): r is NonNullable<typeof r> => r !== null)

            if (successUploads.length === 0) {
                toast.error('Falha no upload de todos os arquivos.')
                setIsProcessing(false)
                return
            }

            // 2. Call Batch API
            toast.info(`Extraindo texto de ${successUploads.length} arquivos...`)

            let batchResult;
            try {
                const response = await fetch('/api/analyze/batch', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        jobId: selectedJobId,
                        analysisMode: analysisMode,
                        files: successUploads.map(u => ({
                            id: u.id,
                            path: u.path,
                            publicUrl: u.publicUrl,
                            name: u.originalName
                        }))
                    })
                })

                batchResult = await response.json()

                if (!response.ok) {
                    // Se houver erros detalhados na resposta, atualizar UI
                    if (batchResult.errors && Array.isArray(batchResult.errors)) {
                        batchResult.errors.forEach((errItem: any) => {
                            const fileId = errItem.id || errItem.applicationId;
                            setFiles(prev => {
                                const next = [...prev];
                                const idx = next.findIndex(f => f.id === fileId);
                                if (idx !== -1) {
                                    next[idx] = {
                                        ...next[idx],
                                        status: 'ERROR',
                                        error: errItem.error || 'Erro no processamento',
                                        progress: 100 // Finish progress bar
                                    };
                                }
                                return next;
                            });
                        });
                    }
                    throw new Error(batchResult.message || 'Erro na API Batch')
                }

            } catch (fetchErr: any) {
                // Rede ou JSON parse error
                throw fetchErr;
            }

            toast.success(`Enviados ${batchResult.processed} currículos para análise!`)

            // Update UI to Queued for success items
            if (batchResult.processed > 0) {
                // We can rely on realtime for status updates, or optimistically update
                // But for now, let's leave it to realtime or the user refresh
                // Actually, let's mark as QUEUED_N8N (or whatever the API returns)
                // The API updates DB to EXTRACTED. The Agent picks it up.
                // So we keep it as is.
            }

            // Also check for partial errors in 200 OK response (if any)
            if (batchResult.errors && Array.isArray(batchResult.errors) && batchResult.errors.length > 0) {
                batchResult.errors.forEach((errItem: any) => {
                    const fileId = errItem.id || errItem.applicationId;
                    setFiles(prev => {
                        const next = [...prev];
                        const idx = next.findIndex(f => f.id === fileId);
                        if (idx !== -1) {
                            next[idx] = {
                                ...next[idx],
                                status: 'ERROR',
                                error: errItem.error || 'Erro na extração',
                                progress: 100
                            };
                        }
                        return next;
                    });
                });
                toast.warning(`${batchResult.errors.length} arquivo(s) falharam na extração.`);
            }

            // Success items are handled by realtime mostly, but we can set them to QUEUED locally
            successUploads.forEach(u => {
                // Only if not in error list
                const isError = batchResult.errors?.some((e: any) => (e.id || e.applicationId) === u.id);
                if (!isError) {
                    setFiles(prev => {
                        const next = [...prev]
                        if (next[u.index]) {
                            next[u.index].status = 'QUEUED_N8N'
                            next[u.index].progress = 60
                        }
                        return next
                    })
                }
            })

        } catch (err: any) {
            console.error('Batch Process Error:', err)
            toast.error('Erro no processamento: ' + err.message)
            // Force stop processing state
        } finally {
            setIsProcessing(false)
        }
    }

    const handleSyncEmail = async () => {
        if (isSyncingEmail) return
        setIsSyncingEmail(true)
        setEmailSyncResult(null)

        try {
            const res = await fetch('/api/ingestion/sync-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'unread', limit: 10 })
            })

            const data = await res.json()

            if (res.ok) {
                setEmailSyncResult({
                    success: true,
                    count: data.emails_found || 0,
                    message: data.emails_found > 0
                        ? `${data.emails_found} email(s) encontrado(s) e processado(s)!`
                        : 'Nenhum novo email encontrado.'
                })
            } else {
                throw new Error(data.error || 'Erro na sincronização')
            }
        } catch (err: any) {
            setEmailSyncResult({
                success: false,
                message: 'Erro ao sincronizar: ' + err.message
            })
        } finally {
            setIsSyncingEmail(false)
        }
    }

    // Auto-process trigger removed - User must click button to confirm batch and job

    return (
        <div className="flex flex-col h-full bg-[#F8FAFC]">
            <Header title="Ingestão de Talentos" description="Gerencie a entrada de novos currículos via upload ou email." />

            <div className="flex-1 overflow-auto p-8">
                <div className="max-w-5xl mx-auto space-y-8">

                    {/* Job Selection Hero */}
                    <div className="bg-white rounded-[2rem] border border-zinc-100 p-8 shadow-xl shadow-zinc-200/50">
                        <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                            <div className="flex-1">
                                <h1 className="text-2xl font-bold tracking-tight mb-2 text-zinc-900 flex items-center gap-2">
                                    <Briefcase className="text-indigo-600" />
                                    Configuração da Triagem
                                </h1>
                                <p className="text-zinc-500 font-medium max-w-xl">
                                    Selecione a vaga e o nível de rigor que o sistema deve aplicar na análise.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto items-center">
                                {/* Job Selector */}
                                <div className="flex flex-col gap-2 w-full sm:w-[400px]">
                                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Vaga de Destino</span>
                                    {isLoadingJobs ? (
                                        <div className="h-10 w-full bg-zinc-100 animate-pulse rounded-xl"></div>
                                    ) : (
                                        <div className="relative w-full">
                                            <CustomSelect
                                                value={selectedJobId}
                                                onChange={setSelectedJobId}
                                                options={[
                                                    { value: '', label: 'Banco de Talentos (Sem vaga)' },
                                                    ...jobs.map(job => ({ value: job.id, label: job.title }))
                                                ]}
                                                placeholder="Selecione uma vaga..."
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Processing Dashboard / Stats */}
                    {files.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm flex flex-col items-center justify-center text-center">
                                <span className="text-3xl font-black text-zinc-900 mb-1">{stats.total}</span>
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Total na Fila</span>
                            </div>
                            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm flex flex-col items-center justify-center text-center text-amber-500">
                                <Clock className="mb-2" size={24} />
                                <span className="text-2xl font-black mb-1">{stats.pending + stats.analyzing}</span>
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Em Processo</span>
                            </div>
                            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm flex flex-col items-center justify-center text-center text-blue-500">
                                <CheckCircle2 className="mb-2" size={24} />
                                <span className="text-2xl font-black mb-1">{stats.done}</span>
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Concluídos</span>
                            </div>
                            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm flex flex-col items-center justify-center text-center text-red-500">
                                <ShieldAlert className="mb-2" size={24} />
                                <span className="text-2xl font-black mb-1">{stats.error}</span>
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Falhas</span>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Email Sync Section */}
                        <div className="col-span-1 bg-white rounded-[2rem] border border-zinc-100 p-8 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                            <div>
                                <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mb-6">
                                    <Mail size={28} />
                                </div>
                                <h3 className="text-xl font-bold text-zinc-900 mb-2">Importar via Email</h3>
                                <p className="text-zinc-500 font-medium leading-relaxed">
                                    Conecte sua caixa de entrada para buscar currículos não lidos automaticamente.
                                </p>
                            </div>

                            <div className="mt-8">
                                <button
                                    onClick={handleSyncEmail}
                                    disabled={isSyncingEmail}
                                    className={`w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${isSyncingEmail
                                        ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                                        : 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-lg shadow-zinc-900/20'
                                        }`}
                                >
                                    <RefreshCw size={18} className={isSyncingEmail ? 'animate-spin' : ''} />
                                    {isSyncingEmail ? 'Sincronizando...' : 'Sincronizar Agora'}
                                </button>

                                {emailSyncResult && (
                                    <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-1 ${emailSyncResult.success
                                        ? 'bg-emerald-50 text-emerald-600'
                                        : 'bg-red-50 text-red-600'
                                        }`}>
                                        {emailSyncResult.success ? <CheckCircle2 size={14} /> : <X size={14} />}
                                        <span>{emailSyncResult.message}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Upload Dropzone */}
                        <label
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            className={`col-span-1 lg:col-span-2 h-full min-h-[300px] rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer relative overflow-hidden ${isDragging
                                ? 'border-emerald-500 bg-emerald-50/50'
                                : 'border-zinc-200 bg-white hover:border-emerald-500/30 hover:bg-zinc-50'
                                }`}
                        >
                            <input
                                type="file"
                                multiple
                                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                                className="hidden"
                                onChange={(e) => handleFilesAdded(Array.from(e.target.files || []))}
                            />

                            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 transition-all duration-300 ${isDragging ? 'bg-emerald-500 text-white scale-110' : 'bg-emerald-50 text-emerald-500'}`}>
                                <Upload size={32} />
                            </div>

                            <div className="text-center z-10">
                                <p className="font-bold text-zinc-900 text-xl mb-2">Arraste seus documentos aqui</p>
                                <p className="text-zinc-400 font-medium">ou clique para selecionar arquivos</p>
                            </div>

                            <div className="absolute bottom-6 flex gap-4 opacity-50">
                                <span className="px-3 py-1 bg-zinc-100 rounded-full text-[10px] font-bold text-zinc-400 uppercase tracking-wider">PDF</span>
                                <span className="px-3 py-1 bg-zinc-100 rounded-full text-[10px] font-bold text-zinc-400 uppercase tracking-wider">DOCX</span>
                                <span className="px-3 py-1 bg-zinc-100 rounded-full text-[10px] font-bold text-zinc-400 uppercase tracking-wider">JPG</span>
                            </div>
                        </label>
                    </div>

                    {/* File List & Action Bar */}
                    {files.length > 0 && (
                        <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-xl shadow-zinc-200/40 overflow-hidden">
                            <div className="p-6 border-b border-zinc-50 flex items-center justify-between bg-zinc-50/50">
                                <h3 className="font-bold text-zinc-900 flex items-center gap-2">
                                    <Clock size={16} className="text-emerald-500" />
                                    Fila de Processamento
                                </h3>
                                <div className="flex gap-4 items-center">
                                    <span className="text-xs font-bold px-3 py-1 bg-zinc-200 rounded-full text-zinc-500">
                                        {files.length} arquivos
                                    </span>

                                    <button
                                        onClick={handleClearQueue}
                                        className="text-zinc-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50"
                                        title="Limpar toda a fila"
                                    >
                                        <Trash2 size={18} />
                                    </button>

                                    {files.some(f => f.status === 'WAIT') && (
                                        <button
                                            onClick={processBatch}
                                            disabled={isProcessing}
                                            className="bg-zinc-900 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-zinc-800 transition-all flex items-center gap-2 shadow-lg shadow-zinc-900/10 disabled:opacity-50"
                                        >
                                            {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <BrainCircuit size={16} />}
                                            Processar Fila
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="divide-y divide-zinc-50 max-h-[500px] overflow-y-auto">
                                {files.map((f, idx) => (
                                    <div key={idx} className="p-4 sm:p-6 flex items-center gap-4 sm:gap-6 hover:bg-zinc-50/50 transition-colors">
                                        <div className="w-12 h-12 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0 text-zinc-400">
                                            {f.publicUrl ? (
                                                <button
                                                    onClick={() => setPreviewUrl(f.publicUrl || null)}
                                                    className="w-full h-full flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 rounded-2xl transition-colors"
                                                    title="Visualizar Arquivo"
                                                >
                                                    <Eye size={20} />
                                                </button>
                                            ) : (
                                                <FileText size={20} />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="font-bold text-zinc-900 truncate text-sm">{f.file.name}</p>
                                                <div className="flex items-center gap-2">
                                                    {f.error && (
                                                        <span className="text-xs text-red-500 max-w-[200px] truncate" title={f.error}>
                                                            {f.error}
                                                        </span>
                                                    )}
                                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md max-w-[200px] truncate ${f.status === 'ERROR' ? 'bg-red-50 text-red-500' :
                                                        (f.status === 'DONE' || f.status === 'EXTRACTED' || f.status === 'ANALYZING' || f.status === 'EXTRACTING') ? 'bg-emerald-50 text-emerald-500' :
                                                            'bg-zinc-100 text-zinc-500'
                                                        }`}>
                                                        {
                                                            // @ts-ignore
                                                            f.extractedData?.ai_explanation && f.status !== 'DONE' && f.status !== 'ERROR'
                                                                // @ts-ignore
                                                                ? f.extractedData.ai_explanation
                                                                : (
                                                                    f.status === 'EXTRACTING' ? 'EXTRAINDO TEXTO...' :
                                                                        (f.status === 'EXTRACTED' || f.status === 'QUEUED_N8N') ? 'AGUARDANDO ANÁLISE...' :
                                                                            f.status === 'ANALYZING' ? 'ANALISANDO...' :
                                                                                f.status === 'DONE' ? (
                                                                                    (f.extractedData?.criteria_evaluation?.classification === 'D' && f.extractedData?.ai_score < 20)
                                                                                        ? 'INVÁLIDO'
                                                                                        : 'CONCLUÍDO'
                                                                                ) :
                                                                                    f.status === 'WAIT' ? 'NA FILA' :
                                                                                        f.status === 'UPLOADING' ? 'ENVIANDO...' :
                                                                                            f.status.replace('_', ' ')
                                                                )
                                                        }
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-700 ease-out ${f.status === 'ERROR' || (f.status === 'DONE' && f.extractedData?.criteria_evaluation?.classification === 'D' && f.extractedData?.ai_score < 20) ? 'bg-red-500' :
                                                        f.status === 'DONE' ? 'bg-emerald-500' :
                                                            'bg-indigo-500'
                                                        }`}
                                                    style={{ width: `${f.progress}%` }}
                                                />
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setFiles(files.filter((_, i) => i !== idx))}
                                            className="text-zinc-300 hover:text-red-500 transition-colors"
                                            title="Remover da lista"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div >

            <PdfViewer
                isOpen={!!previewUrl}
                url={previewUrl}
                onClose={() => setPreviewUrl(null)}
            />


        </div >
    )
}
