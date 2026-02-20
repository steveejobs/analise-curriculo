'use client'

import React, { useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { supabase } from '@/lib/supabase'
import {
    Users,
    Briefcase,
    TrendingUp,
    Activity,
    ArrowUpRight,
    Brain,
    Clock,
    CheckCircle2,
    Zap
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    LineChart,
    Line,
    PieChart,
    Pie
} from 'recharts'
import { JobStatistics, Candidate, StatCardProps } from '@/lib/types'

export default function DashboardPage() {
    const router = useRouter()
    const [stats, setStats] = useState<JobStatistics[]>([])
    const [recentCandidates, setRecentCandidates] = useState<Candidate[]>([])
    const [loading, setLoading] = useState(true)
    const [distributionFilter, setDistributionFilter] = useState<'7d' | '30d' | 'all'>('7d')
    const [dailyVolume, setDailyVolume] = useState<{ date: string, count: number }[]>([])
    const [inAnalysisCount, setInAnalysisCount] = useState(0)

    async function loadDashboard(isInitial = false) {
        if (isInitial) setLoading(true)

        // 1. Fetch All Jobs
        const { data: jobs } = await supabase.from('jobs').select('id, title')

        // 2. Fetch All Applications (Optimized select)
        const { data: allApps } = await supabase
            .from('job_applications')
            .select('job_id, ai_score, created_at, ai_status')

        // 3. Process Stats in Frontend
        const calculatedStats: JobStatistics[] = []

        if (jobs) {
            jobs.forEach(job => {
                const jobApps = (allApps || []).filter(app => app.job_id === job.id)
                const total = jobApps.length
                const qualified = jobApps.filter(app => (app.ai_score || 0) >= 80).length
                const avg = total > 0
                    ? Math.round(jobApps.reduce((acc, curr) => acc + (curr.ai_score || 0), 0) / total)
                    : 0

                calculatedStats.push({
                    job_id: job.id,
                    job_title: job.title,
                    total_candidates: total,
                    qualified_candidates: qualified,
                    avg_score: avg
                })
            })
        }

        const unassignedApps = (allApps || []).filter(app => !app.job_id)
        if (unassignedApps.length > 0) {
            const total = unassignedApps.length
            const qualified = unassignedApps.filter(app => (app.ai_score || 0) >= 80).length
            const avg = total > 0
                ? Math.round(unassignedApps.reduce((acc, curr) => acc + (curr.ai_score || 0), 0) / total)
                : 0

            calculatedStats.push({
                job_id: 'unassigned',
                job_title: 'Sem Vaga Vinculada',
                total_candidates: total,
                qualified_candidates: qualified,
                avg_score: avg
            })
        }

        setStats(calculatedStats)

        // 4. Calculate Daily Volume based on filter
        let daysToCalculate = 7
        if (distributionFilter === '30d') daysToCalculate = 30
        if (distributionFilter === 'all') {
            // Find the oldest application date
            const oldestDate = allApps && allApps.length > 0
                ? new Date(Math.min(...allApps.map(a => new Date(a.created_at).getTime())))
                : new Date()
            const now = new Date()
            daysToCalculate = Math.ceil((now.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
            if (daysToCalculate < 7) daysToCalculate = 7
        }

        const dates = Array.from({ length: daysToCalculate }, (_, i) => {
            const d = new Date()
            d.setDate(d.getDate() - (daysToCalculate - 1 - i))
            return d.toISOString().split('T')[0]
        })

        const volume = dates.map(date => ({
            date: date.split('-').slice(1).reverse().join('/'), // DD/MM
            count: (allApps || []).filter(app => app.created_at.startsWith(date)).length
        }))
        setDailyVolume(volume)

        // 5. Update In Analysis Count
        const inAnalysis = (allApps || []).filter(app => ['EXTRACTED', 'ANALYZING'].includes(app.ai_status)).length
        setInAnalysisCount(inAnalysis)

        // 6. Fetch Recent Candidates (Increased limit to 10 for sidebar)
        const { data: recent } = await supabase
            .from('job_applications')
            .select('id, candidate_name, ai_score, ai_status, created_at, jobs(title)')
            .order('created_at', { ascending: false })
            .limit(10)

        if (recent) setRecentCandidates(recent as any[])

        if (isInitial) setLoading(false)
    }

    useEffect(() => {
        loadDashboard(false)
    }, [distributionFilter])

    useEffect(() => {
        loadDashboard(true)

        // 🟢 Realtime Subscription
        const channel = supabase
            .channel('dashboard_changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'job_applications' },
                () => {
                    console.log('Realtime update for Dashboard stats...')
                    loadDashboard(false) // Update in background without loading state
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    // Aggregated Metrics (Calculate from allApps directly for robustness)
    const totalCandidates = stats.reduce((acc, curr) => acc + (curr.total_candidates || 0), 0)
    const activeJobs = stats.filter(s => s.job_id !== 'unassigned').length
    const qualifiedCandidates = stats.reduce((acc, curr) => acc + (curr.qualified_candidates || 0), 0)
    const avgScore = stats.length > 0
        ? Math.round(stats.reduce((acc, curr) => acc + (curr.avg_score || 0), 0) / stats.length)
        : 0

    const chartData = stats.map(s => ({
        name: s.job_title?.split(' ')[0], // Short name
        full_name: s.job_title,
        candidates: s.total_candidates,
        qualified: s.qualified_candidates
    }))

    const COLORS = ['#10B981', '#6366F1', '#F59E0B', '#EF4444'];

    return (
        <div className="flex flex-col h-full bg-[#F8FAFC]">
            <Header title="Visão Geral" description="Métricas e indicadores de performance do recrutamento." />

            <div className="flex-1 overflow-auto p-4 md:p-8">
                {loading ? (
                    /* Dashboard Skeleton */
                    <div className="max-w-7xl mx-auto space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="bg-white p-6 rounded-xl border border-zinc-100 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="skeleton w-10 h-10 rounded-xl" />
                                        <div className="skeleton h-4 w-12 rounded-full" />
                                    </div>
                                    <div className="skeleton h-3 w-20 mb-2" />
                                    <div className="skeleton h-9 w-16" />
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 bg-white p-8 rounded-xl border border-zinc-100">
                                <div className="skeleton h-6 w-48 mb-2" />
                                <div className="skeleton h-3 w-32 mb-8" />
                                <div className="skeleton h-[350px] w-full rounded-lg" />
                            </div>
                            <div className="bg-white p-8 rounded-xl border border-zinc-100">
                                <div className="skeleton h-6 w-40 mb-2" />
                                <div className="skeleton h-3 w-28 mb-8" />
                                <div className="space-y-4">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <div key={i} className="flex items-center gap-4">
                                            <div className="skeleton w-10 h-10 rounded-lg shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className="skeleton h-3 w-24 mb-1" />
                                                <div className="skeleton h-2 w-16" />
                                            </div>
                                            <div className="skeleton h-5 w-10 rounded-full" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-7xl mx-auto space-y-8">

                        {/* KPI Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            <StatCard
                                title="Candidatos Totais"
                                value={totalCandidates.toString()}
                                icon={<Users className="w-5 h-5" />}
                                trend="+12%"
                                chart={
                                    <div className="h-10 w-full mt-2">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={dailyVolume}>
                                                <Line type="monotone" dataKey="count" stroke="#6366F1" strokeWidth={2} dot={false} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                }
                                gradient="from-indigo-50/50 to-white"
                                borderColor="border-t-indigo-500"
                            />
                            <StatCard
                                title="Em Análise"
                                value={inAnalysisCount.toString()}
                                icon={<Clock className="w-5 h-5" />}
                                gradient="from-amber-50/50 to-white"
                                borderColor="border-t-amber-500"
                            />
                            <StatCard
                                title="Alta Aderência"
                                value={qualifiedCandidates.toString()}
                                icon={<CheckCircle2 className="w-5 h-5" />}
                                trend="+5%"
                                onClick={() => router.push('/candidates?status=DONE&minScore=80')}
                                className="cursor-pointer hover:shadow-indigo-100 transition-all"
                                gradient="from-emerald-50/50 to-white"
                                borderColor="border-t-emerald-500"
                            />
                            <StatCard
                                title="Vagas Ativas"
                                value={activeJobs.toString()}
                                icon={<Briefcase className="w-5 h-5" />}
                                gradient="from-blue-50/50 to-white"
                                borderColor="border-t-blue-500"
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Distribution Chart */}
                            <div className="lg:col-span-2 bg-white p-8 rounded-xl border border-border shadow-premium">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="font-black text-dark uppercase tracking-tight text-lg">Distribuição de Candidatos</h3>
                                        <p className="text-xs font-bold text-muted/50 uppercase tracking-widest mt-1">Volume de novos cadastros</p>
                                    </div>
                                    <div className="flex bg-zinc-100 p-1 rounded-xl">
                                        <button
                                            onClick={() => setDistributionFilter('7d')}
                                            className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${distributionFilter === '7d' ? 'bg-white shadow-sm text-indigo-600' : 'text-zinc-500 hover:text-zinc-700'}`}
                                        >
                                            7 DIAS
                                        </button>
                                        <button
                                            onClick={() => setDistributionFilter('30d')}
                                            className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${distributionFilter === '30d' ? 'bg-white shadow-sm text-indigo-600' : 'text-zinc-500 hover:text-zinc-700'}`}
                                        >
                                            30 DIAS
                                        </button>
                                        <button
                                            onClick={() => setDistributionFilter('all')}
                                            className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${distributionFilter === 'all' ? 'bg-white shadow-sm text-indigo-600' : 'text-zinc-500 hover:text-zinc-700'}`}
                                        >
                                            TOTAL
                                        </button>
                                    </div>
                                </div>
                                <div className="h-[350px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={dailyVolume} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} allowDecimals={false} />
                                            <Tooltip
                                                cursor={{ fill: '#f9fafb' }}
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                            />
                                            <Bar dataKey="count" name="Candidatos" radius={[4, 4, 0, 0]} barSize={distributionFilter === 'all' ? 10 : 30}>
                                                {dailyVolume.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[0]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Recent Candidates (Vertical Sidebar) */}
                            <div className="bg-white p-8 rounded-xl border border-border shadow-premium overflow-hidden">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="font-black text-dark uppercase tracking-tight text-lg">Candidatos Recentes</h3>
                                        <p className="text-xs font-bold text-muted/50 uppercase tracking-widest mt-1">Últimas entradas</p>
                                    </div>
                                </div>

                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {recentCandidates.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12 text-center opacity-50">
                                            <Activity className="w-8 h-8 text-muted mb-4" />
                                            <p className="text-sm font-bold text-muted uppercase tracking-widest">Nenhuma atividade</p>
                                        </div>
                                    ) : (
                                        recentCandidates.map((c, idx) => {
                                            const avatarColors = ['bg-indigo-100 text-indigo-600', 'bg-emerald-100 text-emerald-600', 'bg-amber-100 text-amber-600', 'bg-rose-100 text-rose-600', 'bg-blue-100 text-blue-600']
                                            const name = c.candidate_name || 'Novo Candidato'
                                            const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'
                                            return (
                                                <div
                                                    key={c.id}
                                                    className="flex items-center gap-4 group cursor-pointer hover:bg-zinc-50 p-2 rounded-xl transition-all"
                                                    onClick={() => router.push(`/candidates?id=${c.id}`)}
                                                >
                                                    <div className={`w-10 h-10 shrink-0 rounded-lg ${avatarColors[idx % 5]} flex items-center justify-center text-xs font-black shadow-sm`}>
                                                        {initials}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs font-black text-dark uppercase tracking-tight truncate" title={name}>{name}</p>
                                                        <p className="text-[9px] font-bold text-muted/50 uppercase truncate">{c.jobs?.title || 'Análise Geral'}</p>
                                                    </div>
                                                    <div className="shrink-0 text-right">
                                                        {c.ai_status === 'DONE' ? (
                                                            <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                                                {c.ai_score}%
                                                            </span>
                                                        ) : (
                                                            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse ml-auto" />
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })
                                    )}
                                </div>
                                <button
                                    onClick={() => router.push('/candidates')}
                                    className="w-full mt-6 py-3 border border-zinc-100 rounded-xl text-[10px] font-black text-muted uppercase tracking-widest hover:bg-zinc-50 transition-all"
                                >
                                    Ver Todos os Candidatos
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function StatCard({
    title,
    value,
    icon,
    trend,
    chart,
    gradient,
    borderColor,
    onClick,
    className = ''
}: {
    title: string,
    value: string,
    icon: React.ReactNode,
    trend?: string,
    chart?: React.ReactNode,
    gradient?: string,
    borderColor?: string,
    onClick?: () => void,
    className?: string
}) {
    return (
        <div
            onClick={onClick}
            className={`bg-white p-6 rounded-xl border border-border shadow-premium hover-lift transition-all duration-300 relative overflow-hidden ${borderColor ? `border-t-4 ${borderColor}` : ''} ${className}`}
        >
            {gradient && (
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-50 pointer-events-none`} />
            )}

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-dark/70">
                        {icon}
                    </div>
                    {trend && (
                        <span className="text-[10px] font-black text-success bg-success/5 px-2 py-0.5 rounded-full border border-success/10">
                            {trend}
                        </span>
                    )}
                </div>
                <h4 className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">{title}</h4>
                <div className="text-3xl font-black text-dark flex items-baseline gap-1">
                    {value}
                    <span className="text-[10px] font-bold text-muted/30">un</span>
                </div>

                {chart && (
                    <div className="mt-2">
                        {chart}
                    </div>
                )}
            </div>
        </div>
    )
}
