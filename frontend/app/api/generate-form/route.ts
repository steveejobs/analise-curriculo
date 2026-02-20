import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    try {
        const { context } = await req.json()

        // Simulação de IA gerando perguntas baseadas no contexto da vaga
        // Em produção, isso seria uma chamada ao Gemini Pro 1.5
        await new Promise(resolve => setTimeout(resolve, 2000))

        const mockQuestions = [
            {
                id: 'q_' + Math.random().toString(36).substr(2, 9),
                text: 'Conte uma experiência onde você teve que resolver um problema técnico complexo sob pressão.',
                type: 'textarea',
                required: true
            },
            {
                id: 'q_' + Math.random().toString(36).substr(2, 9),
                text: 'Qual sua pretensão salarial e disponibilidade para início?',
                type: 'text',
                required: true
            },
            {
                id: 'q_' + Math.random().toString(36).substr(2, 9),
                text: 'Nível de proficiência em ferramentas de cloud (AWS/Azure/GCP)?',
                type: 'select',
                options: ['Iniciante', 'Intermediário', 'Avançado', 'Especialista'],
                required: true
            }
        ]

        // Se o contexto mencionar algo específico, poderíamos "personalizar" o mock
        if (context?.toLowerCase().includes('react')) {
            mockQuestions.unshift({
                id: 'q_react',
                text: 'Como você gerencia o estado global em aplicações React de grande escala?',
                type: 'textarea',
                required: true
            })
        }

        return NextResponse.json({
            success: true,
            questions: mockQuestions
        })

    } catch (err: any) {
        console.error('Falha ao gerar formulário:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
