import React from 'react';
import { Users, Check } from 'lucide-react';

interface Props {
    value: string[];
    onChange: (val: string[]) => void;
}

const SOFT_SKILLS_LIST = [
    'Criatividade', 'Flexibilidade', 'Iniciativa',
    'Negociação', 'Persuasão', 'Foco em Resultados',
    'Autoconfiança', 'Liderança', 'Inteligência Emocional',
    'Trabalho em Equipe', 'Resiliência', 'Comunicação Clara',
    'Pensamento Crítico', 'Resolução de Problemas', 'Adaptabilidade'
];

export function SoftSkillsSelector({ value, onChange }: Props) {
    const toggleSkill = (skill: string) => {
        if (value.includes(skill)) {
            onChange(value.filter(s => s !== skill));
        } else {
            onChange([...value, skill]);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-zinc-100 shadow-sm">
            <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2 mb-4">
                <Users className="text-purple-600" size={20} />
                3. Comportamental (Soft Skills)
            </h3>
            <p className="text-sm text-zinc-500 mb-4">Selecione as competências que a IA deve buscar evidências no currículo.</p>

            <div className="flex flex-wrap gap-3">
                {SOFT_SKILLS_LIST.map(skill => {
                    const selected = value.includes(skill);
                    return (
                        <button
                            key={skill}
                            type="button"
                            onClick={() => toggleSkill(skill)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all flex items-center gap-2
                                ${selected
                                    ? 'bg-purple-50 border-purple-200 text-purple-700 shadow-sm'
                                    : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                                }`}
                        >
                            {skill}
                            {selected && <Check size={14} />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
