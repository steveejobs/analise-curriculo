import { NextResponse } from 'next/server'
import { testImapConnection } from '@/lib/imap-service'
import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { action, config } = body

        if (action === 'test') {
            const result = await testImapConnection(config)
            if (!result.success) {
                return NextResponse.json({ success: false, error: result.error }, { status: 400 })
            }
            return NextResponse.json({ success: true, message: 'Conexão bem sucedida!' })
        }

        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
