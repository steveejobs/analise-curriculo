
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const getOpenAI = () => new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

export async function POST(req: Request) {
    try {
        const openai = getOpenAI();
        const { action, candidateName, gaps, detectedRole } = await req.json()

        if (action === 'generate-script') {
            const prompt = `Você é um Recrutador Técnico Sênior. Gere um roteiro de entrevista situacional para o candidato ${candidateName} para a vaga de ${detectedRole}.
            O roteiro deve focar nos seguintes GAPS identificados: ${gaps.join(', ')}.
            Gere 3 perguntas comportamentais/técnicas que desafiem esses pontos especificamente.
            Formate em JSON com um campo "script" contendo o texto formatado em markdown.`

            const completion = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [{ role: "system", content: prompt }],
                response_format: { type: "json_object" }
            })

            return NextResponse.json(JSON.parse(completion.choices[0].message.content || '{}'))
        }

        if (action === 'generate-rejection') {
            const prompt = `Você é um Recrutador Empático. Gere um email de feedback de reprovação para o candidato ${candidateName}.
            Agradeça a participação e explique de forma técnica e gentil que ele não avançou devido aos seguintes pontos que precisam de desenvolvimento: ${gaps.join(', ')}.
            Encoraje-o a continuar estudando esses pontos.
            Formate em JSON com um campo "email" contendo o texto sugerido.`

            const completion = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [{ role: "system", content: prompt }],
                response_format: { type: "json_object" }
            })

            return NextResponse.json(JSON.parse(completion.choices[0].message.content || '{}'))
        }

        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })

    } catch (error: any) {
        console.error('API Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
