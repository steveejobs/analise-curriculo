'use client'

import React from 'react'
import {
    CheckCircle2,
    XCircle,
    Clock,
    Briefcase,
    BrainCircuit,
    Users,
    TrendingUp,
    Calendar,
    MessageSquare,
    AlertTriangle,
    ShieldAlert,
    Target,
    Zap,
    Loader2,
    MapPin,
    Phone,
    Building2,
    Award,
    FileText,
    ExternalLink,
    Layout,
    CheckCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { calculateWeightedScore } from '@/lib/scoring'

interface DetailedCandidateViewProps {
    candidate: any
    analysis: any
}

export function DetailedCandidateView({ candidate, analysis }: DetailedCandidateViewProps) {
    const isV12 = analysis.schema_version === '1.2'
    const isV11 = analysis.schema_version === '1.1' || isV12

    const aderencia = calculateWeightedScore({ ...candidate, criteria_evaluation: analysis })
    const maturidade = analysis.professional_maturity || analysis.maturidade_profissional || analysis.estimated_seniority || analysis.senioridade_estimada || 'Não Detectada'

    // Fallback constants
    const senioridade = analysis.estimated_seniority || analysis.senioridade_estimada || 'Pleno'
    const pretensao = analysis.pretensao_salarial || 'A definir'
    const disponibilidade = analysis.disponibilidade || 'Imediata'
    const localizao = candidate.location || 'Brasil'
    const sugestoes = analysis.sugestoes_adicionais || analysis.interview_questions || analysis.perguntas_entrevista || []

    const baseScores = analysis.base_scores || {
        tecnica: analysis.technical_capacity?.score || analysis.capacidade_tecnica?.score || analysis.aderencia_geral || analysis.score || 0,
        cultura: analysis.score_cultural || analysis.score || 0,
        performance: analysis.performance_potencial?.score || analysis.aderencia_geral || 0
    }

    const detailedRationale = {
        tecnica: analysis.detailed_rationale?.tecnica || analysis.rationale || analysis.ai_explanation || '',
        cultura: analysis.detailed_rationale?.cultura || analysis.cultural_fit?.summary || analysis.behavioral_profile?.resumo || analysis.perfil_comportamental?.resumo || '',
        performance: analysis.detailed_rationale?.performance || analysis.performance_potencial?.justificativa || ''
    }

    const technicalLabel = archetype ? `Fit ${archetype.charAt(0).toUpperCase() + archetype.slice(1)}` : 'Fit Técnico'

    const confiancaDimensoes = analysis.confidence_by_dimension || analysis.confianca_por_dimensao || {
        tecnica: analysis.confianca_analise || 70,
        cultura: analysis.confianca_analise || 70,
        performance: analysis.confianca_analise || 70
    }

    const quality = {
        level: analysis.extraction_quality || 'medium'
    }

    const source = analysis.source_detected || 'Upload'
    const topSkills = analysis.top_skills || []
    const caps = analysis.caps_applied || []
    const archetype = analysis.role_archetype || ''

    const techAnalysis = analysis.technical_capacity || analysis.capacidade_tecnica || {}
    const culturalAnalysis = analysis.behavioral_profile || analysis.perfil_comportamental || analysis.cultural_analysis || {}

    const resume = analysis.consolidated_rationale || analysis.rationale_consolidado || analysis.professional_summary || analysis.resumo_profissional || analysis.rationale || analysis.ai_explanation || candidate.ai_explanation
    const experiencias = analysis.detailed_experience || analysis.experiencia_detalhada || analysis.experience || []

    const hardSkills = topSkills.length > 0 ? topSkills : (techAnalysis.evidencias_comprovadas || techAnalysis.evidencias || analysis.hard_skills_analysis?.skills_found || analysis.skills || [])
    const diferenciais = analysis.identified_differentials || analysis.diferenciais_identificados || analysis.differentials || []
    const gaps = analysis.real_gaps || analysis.lacunas_reais || analysis.technical_analysis?.gaps || analysis.gaps || []

    const culturalSignals = {
        comprovados: culturalAnalysis.comportamentos_comprovados || culturalAnalysis.comprovados || [],
        indiretos: culturalAnalysis.sinais_indiretos || culturalAnalysis.indiretos || [],
        autoafirmacoes: culturalAnalysis.autoafirmacoes || []
    }
    const riscos = analysis.identified_risks || analysis.riscos_identificados || []

    const [loading, setLoading] = React.useState<string | null>(null)

    const handleAction = async (type: 'generate-script') => {
        setLoading(type)
        try {
            const res = await fetch('/api/candidate/actions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: type,
                    candidateName: candidate.candidate_name,
                    detectedRole: analysis.senioridade_estimada ? `${analysis.senioridade_estimada} - ${analysis.cargos_compativeis?.[0] || 'Profissional'}` : 'Profissional',
                    gaps: gaps
                })
            })

            const data = await res.json()
            if (data.error) throw new Error(data.error)
            toast.success('Roteiro gerado com sucesso!')
        } catch (err: any) {
            toast.error('Erro: ' + err.message)
        } finally {
            setLoading(null)
        }
    }

    return (
        <div className="space-y-8 pb-12">
            {/* Métricas de Análise Profunda */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-xl border border-border shadow-premium relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform text-dark">
                        <BrainCircuit size={80} />
                    </div>
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-black text-muted uppercase tracking-widest block">Fit Técnico</span>
                        <div className="flex gap-1">
                            <span className="text-[10px] font-black px-2 py-0.5 bg-surface rounded text-muted uppercase tracking-tighter">Confiança {confiancaDimensoes.tecnica}%</span>
                        </div>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-4xl font-black leading-none text-dark">{baseScores.tecnica}%</span>
                        <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden mb-1">
                            <div
                                className="h-full bg-primary rounded-full transition-all duration-1000"
                                style={{ width: `${baseScores.tecnica}%` }}
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-border shadow-premium relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform text-dark">
                        <Users size={80} />
                    </div>
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-black text-muted uppercase tracking-widest block">Fit Cultural</span>
                        <span className="text-[10px] font-black px-2 py-0.5 bg-surface rounded text-muted uppercase tracking-tighter">Confiança {confiancaDimensoes.cultura}%</span>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-4xl font-black leading-none text-dark">{baseScores.cultura}%</span>
                        <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden mb-1">
                            <div
                                className="h-full bg-primary rounded-full transition-all duration-1000"
                                style={{ width: `${baseScores.cultura}%` }}
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-border shadow-premium relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform text-dark">
                        <TrendingUp size={80} />
                    </div>
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-black text-muted uppercase tracking-widest block">Performance</span>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter bg-success/10 text-success">
                            {baseScores.performance >= 70 ? 'Alta Probabilidade' : 'Compatível'}
                        </span>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-4xl font-black leading-none text-dark">{baseScores.performance}%</span>
                        <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden mb-1">
                            <div
                                className="h-full bg-primary rounded-full transition-all duration-1000"
                                style={{ width: `${baseScores.performance}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Header de Análise Rápida */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-xl border border-border shadow-premium">
                    <span className="text-[10px] font-black text-muted uppercase tracking-widest block mb-1.5">Match Global</span>
                    <div className="flex items-end gap-2">
                        <span className={`text-3xl font-black leading-none ${aderencia >= 70 ? 'text-success' : 'text-muted'}`}>
                            {aderencia}%
                        </span>
                        <span className="text-[9px] font-bold text-muted/40 uppercase mb-0.5">Aderência</span>
                    </div>
                </div>

                <div className="bg-dark p-6 rounded-xl shadow-hover flex items-center justify-between group cursor-pointer hover:bg-dark/90 transition-all" onClick={() => handleAction('generate-script')}>
                    <div>
                        <span className="text-[10px] font-black text-muted uppercase tracking-widest block mb-0.5">Ação Sugerida</span>
                        <span className="text-sm font-black text-white uppercase italic">Gerar Roteiro</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                        <Zap size={20} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Resumo & Parecer */}
                    <div className="space-y-6">
                        {analysis.professional_summary && (
                            <section className="bg-white rounded-xl p-8 border border-border shadow-premium relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none text-dark">
                                    <FileText size={100} />
                                </div>
                                <h3 className="font-black text-dark uppercase tracking-tight text-lg mb-4 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                        <Zap size={16} />
                                    </span>
                                    Resumo do Perfil
                                </h3>
                                <p className="text-zinc-600 text-base font-medium leading-relaxed">
                                    {analysis.professional_summary}
                                </p>
                            </section>
                        )}

                        {(analysis.consolidated_rationale || analysis.ai_explanation) && (
                            <section className="bg-white rounded-xl p-8 border border-border shadow-premium relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none text-dark">
                                    <MessageSquare size={100} />
                                </div>
                                <h3 className="font-black text-dark uppercase tracking-tight text-lg mb-4 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                                        <BrainCircuit size={16} />
                                    </span>
                                    Análise
                                </h3>
                                <p className="text-muted text-base font-medium leading-relaxed italic border-l-4 border-surface pl-6">
                                    "{analysis.consolidated_rationale || analysis.ai_explanation}"
                                </p>
                            </section>
                        )}
                    </div>

                    {/* Trajetória */}
                    <section className="bg-white rounded-xl p-8 border border-border shadow-premium">
                        <h3 className="font-black text-dark uppercase tracking-tight text-lg mb-8 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-muted"><Building2 size={16} /></span>
                            Trajetória Profissional
                        </h3>
                        <div className="space-y-10 relative before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-[2px] before:bg-surface">
                            {experiencias.length > 0 ? experiencias.map((exp: any, i: number) => (
                                <div key={i} className="relative pl-12 group">
                                    <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-white border-4 border-surface flex items-center justify-center z-10 group-hover:border-border transition-colors">
                                        <div className="w-2 h-2 rounded-full bg-border group-hover:bg-dark transition-colors" />
                                    </div>
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                                        <h4 className="font-black text-dark uppercase tracking-tight">{exp.cargo}</h4>
                                        <span className="text-[9px] font-black text-muted uppercase tracking-widest bg-surface px-2 py-0.5 rounded-full border border-border">
                                            {exp.periodo}
                                        </span>
                                    </div>
                                    <p className="text-[11px] font-bold text-muted/60 mb-3 flex items-center gap-2">
                                        <Building2 size={10} /> {exp.empresa}
                                    </p>
                                    <ul className="space-y-1.5">
                                        {exp.conquistas?.map((conq: string, j: number) => (
                                            <li key={j} className="flex gap-2.5 text-xs text-muted font-medium">
                                                <div className="mt-1.5 w-1 h-1 rounded-full bg-border shrink-0" />
                                                {conq}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )) : (
                                <p className="text-muted italic text-xs">Nenhuma experiência extraída.</p>
                            )}
                        </div>
                    </section>

                    <section className="bg-white rounded-xl p-8 border border-border shadow-premium">
                        <h4 className="font-black text-dark uppercase tracking-tight mb-8 flex items-center gap-3 text-lg">
                            <span className="w-8 h-8 rounded-lg bg-destructive/5 flex items-center justify-center text-destructive"><AlertTriangle size={16} /></span>
                            Riscos & Pontos de Atenção
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {riscos.length > 0 ? riscos.map((risco: any, i: number) => (
                                <div key={i} className="p-4 rounded-xl bg-destructive/5 border border-destructive/10 group">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-white rounded-lg shadow-sm text-destructive shrink-0">
                                            <ShieldAlert size={16} />
                                        </div>
                                        <div>
                                            <h5 className="font-black text-dark text-xs uppercase mb-1 tracking-tight">{risco.tipo || risco.risco}</h5>
                                            <p className="text-[11px] font-medium text-muted leading-tight">
                                                {risco.descricao || risco.justificativa}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="col-span-2 p-8 rounded-xl bg-success/5 border border-success/10 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-success shadow-sm shrink-0">
                                        <CheckCircle2 size={20} />
                                    </div>
                                    <div>
                                        <span className="font-black text-dark uppercase text-xs tracking-tight">Baixo Risco Detectado</span>
                                        <p className="text-[10px] text-muted mt-0.5">Perfil sólido sem sinais críticos de alerta.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                <div className="space-y-8">
                    {/* Ficha Lateral */}
                    <section className="bg-white rounded-xl border border-border shadow-premium overflow-hidden">
                        <div className="p-6 border-b border-border bg-surface/30 flex items-center justify-between">
                            <h3 className="font-black text-dark uppercase tracking-tight text-sm flex items-center gap-3">
                                <FileText size={16} className="text-primary" /> Qualificações
                            </h3>
                        </div>
                        <div className="p-6 divide-y divide-border">
                            <div className="py-3 flex justify-between items-center">
                                <span className="text-[9px] font-black text-muted uppercase tracking-widest">Senioridade</span>
                                <span className="text-xs font-black text-dark uppercase">{senioridade}</span>
                            </div>
                            <div className="py-3 flex justify-between items-center">
                                <span className="text-[9px] font-black text-muted uppercase tracking-widest">Pretensão</span>
                                <span className="text-xs font-black text-dark uppercase">{pretensao}</span>
                            </div>
                            <div className="py-3 flex justify-between items-center">
                                <span className="text-[9px] font-black text-muted uppercase tracking-widest">Local</span>
                                <span className="text-xs font-black text-dark uppercase italic">{localizao}</span>
                            </div>
                        </div>
                        <div className="p-6 bg-surface space-y-4">
                            <div className="flex items-center gap-2 text-[9px] font-black text-muted uppercase tracking-widest mb-2">
                                <Layout size={12} /> Sugestões
                            </div>
                            {sugestoes.map((sug: string, i: number) => (
                                <div key={i} className="text-[11px] text-muted font-medium bg-white p-3 rounded-lg border border-border/50">
                                    {sug}
                                </div>
                            ))}
                        </div>
                    </section>

                    <h4 className="text-[9px] font-black text-muted uppercase tracking-widest px-1">Análise</h4>
                    <div className="space-y-3">
                        <div className="p-4 bg-surface rounded-lg border border-border">
                            <span className="text-[8px] font-black text-primary uppercase block mb-1">{technicalLabel}</span>
                            <p className="text-[11px] text-dark leading-tight font-medium italic">"{detailedRationale.tecnica}"</p>
                        </div>
                        <div className="p-4 bg-surface rounded-lg border border-border">
                            <span className="text-[8px] font-black text-primary uppercase block mb-1">Fit Cultural</span>
                            <p className="text-[11px] text-dark leading-tight font-medium italic">"{detailedRationale.cultura}"</p>
                        </div>
                    </div>

                    {gaps.length > 0 && (
                        <div className="space-y-2">
                            <span className="text-[9px] font-black text-warning uppercase block mb-1 px-1">Lacunas de Conhecimento</span>
                            {gaps.map((gap: any, i: number) => (
                                <div key={i} className="p-3 bg-warning/5 rounded-lg border border-warning/10 flex gap-2 items-start">
                                    <div className="w-1 h-1 rounded-full bg-warning mt-1.5 shrink-0" />
                                    <p className="text-[10px] text-dark font-medium leading-tight">{gap.area || gap.gap || gap}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
