import React, { useState, useEffect } from 'react';
import { Target, Shield, Users, AlertTriangle, EyeOff } from 'lucide-react';
import { HardSkillsSelector } from './HardSkillsSelector';
import { SoftSkillsSelector } from './SoftSkillsSelector';
import { LeadershipConfig } from './LeadershipConfig';
import { RiskSettings } from './RiskSettings';

export type AnalysisConfig = {
    match_threshold: number;
    hard_skills: {
        education: { level: string; area: string; mandatory: boolean };
        experience: { years: string; mandatory: boolean };
        languages: { language: string; level: string; mandatory: boolean }[];
        tools: { name: string; mandatory: boolean }[];
    };
    soft_skills: string[];
    leadership: { level: string; style: string } | null;
    risk_analysis: { grammar: boolean; job_hopping: boolean; career_stagnation: boolean };
    blind_screening: boolean;
};

interface Props {
    value: AnalysisConfig;
    onChange: (config: AnalysisConfig) => void;
}

export function AdvancedJobConfig({ value, onChange }: Props) {
    const update = (key: keyof AnalysisConfig, val: any) => {
        onChange({ ...value, [key]: val });
    };

    return (
        <div className="space-y-8">
            {/* 1. Algoritmo de Match */}
            <div className="bg-white p-6 rounded-xl border border-zinc-100 shadow-sm transition-all hover:shadow-md">
                <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2 mb-4">
                    <Target className="text-indigo-600" size={20} />
                    1. Algoritmo de Match
                </h3>
                <div className="space-y-4">
                    <div className="flex justify-between">
                        <label className="text-sm font-semibold text-zinc-700">Índice de Aderência Mínimo</label>
                        <span className="text-indigo-600 font-bold">{value.match_threshold}%</span>
                    </div>
                    <input
                        type="range"
                        min="50" max="95" step="5"
                        value={value.match_threshold}
                        onChange={(e) => update('match_threshold', Number(e.target.value))}
                        className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <p className="text-xs text-zinc-500">Candidatos abaixo deste valor serão classificados como "D - Rejeitado".</p>
                </div>
            </div>

            {/* 2. Hard Skills */}
            <HardSkillsSelector
                value={value.hard_skills}
                onChange={(val) => update('hard_skills', val)}
            />

            {/* 3. Soft Skills */}
            <SoftSkillsSelector
                value={value.soft_skills}
                onChange={(val) => update('soft_skills', val)}
            />

            {/* 4. Liderança */}
            <LeadershipConfig
                value={value.leadership}
                onChange={(val) => update('leadership', val)}
            />

            {/* 5. Risco & Qualidade */}
            <RiskSettings
                value={value.risk_analysis}
                onChange={(val) => update('risk_analysis', val)}
            />

            {/* 6. Blind Screening */}
            <div className="bg-zinc-900 text-white p-6 rounded-xl shadow-lg flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <EyeOff className="text-emerald-400" size={20} />
                        Blind Screening (Anti-Viés)
                    </h3>
                    <p className="text-sm text-zinc-400 mt-1">
                        Oculta nome, gênero e dados pessoais durante a análise da IA.
                    </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={value.blind_screening}
                        onChange={(e) => update('blind_screening', e.target.checked)}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
            </div>
        </div>
    );
}
