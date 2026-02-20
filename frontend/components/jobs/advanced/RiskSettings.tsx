import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface Risks {
    grammar: boolean;
    job_hopping: boolean;
    career_stagnation: boolean;
}

interface Props {
    value: Risks;
    onChange: (val: Risks) => void;
}

export function RiskSettings({ value, onChange }: Props) {
    const toggle = (key: keyof Risks) => onChange({ ...value, [key]: !value[key] });

    return (
        <div className="bg-white p-6 rounded-xl border border-zinc-100 shadow-sm">
            <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2 mb-4">
                <AlertTriangle className="text-orange-500" size={20} />
                5. Análise de Risco (Pente Fino)
            </h3>
            <div className="space-y-3">
                <RiskToggle
                    label="Job Hopping (Mudanças Frequentes)"
                    desc="Alertar se o candidato troca de emprego em menos de 1 ano frequentemente."
                    checked={value.job_hopping}
                    onChange={() => toggle('job_hopping')}
                />
                <RiskToggle
                    label="Erros Gramaticais & Clareza"
                    desc="Penalizar currículos com erros de português ou formatação confusa."
                    checked={value.grammar}
                    onChange={() => toggle('grammar')}
                />
                <RiskToggle
                    label="Estagnação de Carreira"
                    desc="Alertar se não houver evolução de cargo em longos períodos."
                    checked={value.career_stagnation}
                    onChange={() => toggle('career_stagnation')}
                />
            </div>
        </div>
    );
}

function RiskToggle({ label, desc, checked, onChange }: { label: string, desc: string, checked: boolean, onChange: () => void }) {
    return (
        <div className="flex items-start gap-3 p-3 rounded-lg border border-transparent hover:bg-zinc-50 transition-colors">
            <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
                className="mt-1 h-4 w-4 rounded border-zinc-300 text-orange-600 focus:ring-orange-500"
            />
            <div>
                <span className="block text-sm font-bold text-zinc-700">{label}</span>
                <span className="text-xs text-zinc-500">{desc}</span>
            </div>
        </div>
    );
}
