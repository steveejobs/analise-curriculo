import React from 'react';
import { ShieldCheck, Brain, AlertTriangle, CheckCircle2, XCircle, TrendingUp, Award } from 'lucide-react';

interface Props {
    analysis: {
        score: number;
        classification: string;
        rationale: string;
        hard_skills_analysis?: {
            education_match: boolean;
            experience_years_match: boolean;
            skills_found: string[];
            missing_mandatory: string[];
        };
        soft_skills_analysis?: {
            detected: string[];
            evidence: string;
        };
        risk_flags?: {
            job_hopping: boolean;
            grammar_issues: boolean;
            career_stagnation: boolean;
            notes: string;
        };
        leadership_evaluation?: {
            level_match: boolean;
            style_detected: string;
            notes: string;
        };
    };
}

export function AdvancedCandidateView({ analysis }: Props) {
    if (!analysis) return null;

    const getScoreColor = (score: number) => {
        if (score >= 85) return 'text-emerald-400'; // A
        if (score >= 70) return 'text-blue-400';    // B
        if (score >= 50) return 'text-amber-400';   // C
        return 'text-red-400';                      // D
    };

    const getClassificationBadge = (cls: string) => {
        const styles: Record<string, string> = {
            'A': 'bg-emerald-500 text-white shadow-emerald-500/20',
            'B': 'bg-blue-500 text-white shadow-blue-500/20',
            'C': 'bg-amber-500 text-white shadow-amber-500/20',
            'D': 'bg-red-500 text-white shadow-red-500/20'
        };
        return styles[cls] || 'bg-zinc-500 text-white';
    };

    return (
        <section className="bg-white rounded-[3rem] border border-zinc-100 shadow-2xl shadow-zinc-200/50 overflow-hidden">
            {/* Header com Score */}
            <div className="p-10 bg-zinc-950 text-white flex items-center justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-10">
                    <Brain size={160} />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <ShieldCheck className="text-emerald-400" size={20} />
                        <h3 className="font-black text-xs uppercase tracking-[0.2em] text-zinc-400">Decision Intelligence</h3>
                    </div>
                    <div className="flex items-center gap-4">
                        <h3 className="text-2xl font-black tracking-tight">Análise de IA</h3>
                        <span className={`px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest shadow-lg ${getClassificationBadge(analysis.classification)}`}>
                            Classe {analysis.classification}
                        </span>
                    </div>
                </div>
                <div className="text-right flex flex-col items-end relative z-10">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Match Score</span>
                    <span className={`text-5xl font-black italic leading-none ${getScoreColor(analysis.score)}`}>
                        {analysis.score}%
                    </span>
                </div>
            </div>

            <div className="p-12 space-y-12">

                {/* Raciocínio */}
                <div>
                    <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                        <div className="w-4 h-[2px] bg-emerald-500" /> Raciocínio Lógico
                    </h4>
                    <p className="text-zinc-700 leading-relaxed font-bold text-lg italic bg-zinc-50 p-8 rounded-3xl border border-zinc-100">
                        "{analysis.rationale || "Análise processada."}"
                    </p>
                </div>

                {/* Hard Skills */}
                {analysis.hard_skills_analysis && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-zinc-100">
                        <div>
                            <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-6">Hard Skills (Encontradas)</h4>
                            <div className="flex flex-wrap gap-2">
                                {analysis.hard_skills_analysis.skills_found.map(s => (
                                    <span key={s} className="px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-100 flex items-center gap-1">
                                        <CheckCircle2 size={12} /> {s}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-6">Gaps (Faltantes)</h4>
                            <div className="flex flex-wrap gap-2">
                                {analysis.hard_skills_analysis.missing_mandatory.map(s => (
                                    <span key={s} className="px-3 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold border border-red-100 flex items-center gap-1">
                                        <XCircle size={12} /> {s}
                                    </span>
                                ))}
                                {analysis.hard_skills_analysis.missing_mandatory.length === 0 && (
                                    <span className="text-zinc-400 text-xs italic">Nenhum gap obrigatório.</span>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Soft Skills & Leadership */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-zinc-100">
                    {analysis.soft_skills_analysis && (
                        <div>
                            <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-6">Soft Skills</h4>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {analysis.soft_skills_analysis.detected.map(s => (
                                    <span key={s} className="px-3 py-2 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold border border-purple-100">
                                        {s}
                                    </span>
                                ))}
                            </div>
                            <p className="text-xs text-zinc-500 italic bg-zinc-50 p-3 rounded-lg border border-zinc-100">
                                "{analysis.soft_skills_analysis.evidence}"
                            </p>
                        </div>
                    )}

                    {analysis.leadership_evaluation && analysis.leadership_evaluation.style_detected && (
                        <div>
                            <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                <Award size={14} className="text-amber-500" /> Liderança
                            </h4>
                            <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl">
                                <p className="text-amber-900 text-sm font-bold mb-1">
                                    Estilo: {analysis.leadership_evaluation.style_detected}
                                </p>
                                <p className="text-amber-700 text-xs">
                                    {analysis.leadership_evaluation.notes}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Risk Flags */}
                {analysis.risk_flags && (
                    <div className="pt-8 border-t border-zinc-100">
                        <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <AlertTriangle size={14} className="text-orange-500" /> Análise de Riscos
                        </h4>
                        <div className="flex gap-4">
                            <RiskBadge label="Job Hopping" active={analysis.risk_flags.job_hopping} />
                            <RiskBadge label="Erros Gramaticais" active={analysis.risk_flags.grammar_issues} />
                            <RiskBadge label="Estagnação" active={analysis.risk_flags.career_stagnation} />
                        </div>
                        {analysis.risk_flags.notes && (
                            <p className="mt-4 text-xs text-orange-700 bg-orange-50 p-3 rounded-lg border border-orange-100">
                                ⚠️ <strong>Nota de Risco:</strong> {analysis.risk_flags.notes}
                            </p>
                        )}
                    </div>
                )}

            </div>
        </section>
    );
}

function RiskBadge({ label, active }: { label: string, active: boolean }) {
    if (!active) return (
        <span className="px-3 py-1 bg-zinc-100 text-zinc-400 rounded-full text-xs font-bold border border-zinc-200">
            {label}: OK
        </span>
    );
    return (
        <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs font-bold border border-red-200 flex items-center gap-1">
            <AlertTriangle size={12} /> {label}
        </span>
    );
}
