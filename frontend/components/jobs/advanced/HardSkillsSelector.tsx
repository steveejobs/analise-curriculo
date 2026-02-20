import React, { useState } from 'react';
import { BookOpen, Plus, X, Award } from 'lucide-react';

interface HardSkills {
    education: { level: string; area: string; mandatory: boolean };
    experience: { years: string; mandatory: boolean };
    languages: { language: string; level: string; mandatory: boolean }[];
    tools: { name: string; mandatory: boolean }[];
}

interface Props {
    value: HardSkills;
    onChange: (val: HardSkills) => void;
}

export function HardSkillsSelector({ value, onChange }: Props) {
    const [newTool, setNewTool] = useState('');
    const [newLang, setNewLang] = useState({ language: '', level: 'Básico' });

    const update = (key: keyof HardSkills, val: any) => onChange({ ...value, [key]: val });

    const addTool = () => {
        if (!newTool) return;
        update('tools', [...value.tools, { name: newTool, mandatory: true }]);
        setNewTool('');
    };

    const removeTool = (idx: number) => {
        update('tools', value.tools.filter((_, i) => i !== idx));
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-zinc-100 shadow-sm">
            <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2 mb-6">
                <BookOpen className="text-blue-600" size={20} />
                2. Triagem Técnica (Hard Skills)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Education */}
                <div className="space-y-3">
                    <label className="text-sm font-bold text-zinc-700">Escolaridade Mínima</label>
                    <div className="flex gap-2">
                        <select
                            value={value.education.level}
                            onChange={(e) => update('education', { ...value.education, level: e.target.value })}
                            className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 w-full text-sm"
                        >
                            <option>Médio</option>
                            <option>Técnico</option>
                            <option>Graduação</option>
                            <option>Pós/MBA</option>
                            <option>Mestrado/Doutorado</option>
                        </select>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={value.education.mandatory}
                                onChange={(e) => update('education', { ...value.education, mandatory: e.target.checked })}
                            />
                            <span className="text-xs text-red-500 font-bold">Obrigatório</span>
                        </div>
                    </div>
                    <input
                        placeholder="Área (ex: Engenharia, Direito)"
                        value={value.education.area}
                        onChange={(e) => update('education', { ...value.education, area: e.target.value })}
                        className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 w-full text-sm"
                    />
                </div>

                {/* Experience */}
                <div className="space-y-3">
                    <label className="text-sm font-bold text-zinc-700">Tempo de Experiência</label>
                    <div className="flex gap-2">
                        <select
                            value={value.experience.years}
                            onChange={(e) => update('experience', { ...value.experience, years: e.target.value })}
                            className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 w-full text-sm"
                        >
                            <option>Sem experiência</option>
                            <option>0-2 anos</option>
                            <option>3-5 anos</option>
                            <option>+5 anos</option>
                            <option>+10 anos</option>
                        </select>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={value.experience.mandatory}
                                onChange={(e) => update('experience', { ...value.experience, mandatory: e.target.checked })}
                            />
                            <span className="text-xs text-red-500 font-bold">Obrigatório</span>
                        </div>
                    </div>
                </div>

                {/* Tools */}
                <div className="col-span-2 space-y-3">
                    <label className="text-sm font-bold text-zinc-700">Ferramentas & Tecnologias</label>
                    <div className="flex gap-2">
                        <input
                            value={newTool}
                            onChange={(e) => setNewTool(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTool())}
                            placeholder="Ex: Python, SAP, Excel Avançado"
                            className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 w-full text-sm"
                        />
                        <button type="button" onClick={addTool} className="bg-zinc-900 text-white p-2 rounded-lg">
                            <Plus size={16} />
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {value.tools.map((t, i) => (
                            <div key={i} className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${t.mandatory ? 'bg-red-50 border-red-200 text-red-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                                {t.name}
                                <button onClick={() => removeTool(i)}><X size={12} /></button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
