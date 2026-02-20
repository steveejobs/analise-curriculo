import React from 'react';
import { Award } from 'lucide-react';

interface Leadership {
    level: string;
    style: string;
}

interface Props {
    value: Leadership | null;
    onChange: (val: Leadership | null) => void;
}

export function LeadershipConfig({ value, onChange }: Props) {
    const enabled = !!value;

    const toggle = () => {
        if (enabled) onChange(null);
        else onChange({ level: 'Tático (Gerência)', style: 'Motivador' });
    };

    const update = (key: keyof Leadership, val: string) => {
        if (!value) return;
        onChange({ ...value, [key]: val });
    };

    return (
        <div className={`p-6 rounded-xl border transition-all ${enabled ? 'bg-white border-amber-200 shadow-sm' : 'bg-zinc-50 border-zinc-200 opacity-75'}`}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                    <Award className={enabled ? "text-amber-500" : "text-zinc-400"} size={20} />
                    4. Perfil de Liderança
                </h3>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={enabled} onChange={toggle} className="sr-only peer" />
                    <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
            </div>

            {enabled && value && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2">
                    <div>
                        <label className="block text-sm font-bold text-zinc-700 mb-2">Nível Hierárquico</label>
                        <select
                            value={value.level}
                            onChange={(e) => update('level', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm"
                        >
                            <option>Estratégico (C-Level/Diretoria)</option>
                            <option>Tático (Gerência)</option>
                            <option>Operacional (Supervisão)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-zinc-700 mb-2">Estilo de Liderança</label>
                        <select
                            value={value.style}
                            onChange={(e) => update('style', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm"
                        >
                            <option>Autocrata (Foco em Resultados Rápidos)</option>
                            <option>Democrata (Participativo)</option>
                            <option>Liberal (Foco em Inovação)</option>
                            <option>Motivador (Inspirador)</option>
                            <option>Técnico (Excelência Processual)</option>
                        </select>
                    </div>
                </div>
            )}
        </div>
    );
}
