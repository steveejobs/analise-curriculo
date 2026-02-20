'use client'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
    const supabase = createClient()

    return (
        <div className="auth-container">
            <Auth
                supabaseClient={supabase}
                appearance={{
                    theme: ThemeSupa,
                    variables: {
                        default: {
                            colors: {
                                brand: '#4f46e5',
                                brandAccent: '#4338ca',
                                inputBackground: '#27272a', // zinc-800
                                inputText: 'white',
                                inputBorder: '#3f3f46', // zinc-700
                                inputLabelText: '#a1a1aa', // zinc-400
                            },
                            radii: {
                                borderRadiusButton: '12px',
                                buttonBorderRadius: '12px',
                                inputBorderRadius: '12px',
                            },
                        },
                    },
                    className: {
                        container: 'w-full',
                        button: 'w-full px-4 py-3 font-bold text-sm !h-auto',
                        input: '!bg-zinc-800/50',
                    }
                }}
                theme="dark"
                providers={['google', 'github']}
                redirectTo={`${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`}
                localization={{
                    variables: {
                        sign_in: {
                            email_label: 'Email Corporativo',
                            password_label: 'Senha',
                            button_label: 'Entrar na Plataforma',
                        }
                    }
                }}
                showLinks={true}
            />
        </div>
    )
}
