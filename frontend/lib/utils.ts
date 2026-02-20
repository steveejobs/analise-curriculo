import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatDistanceToNow(date: Date | string) {
    const d = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const diff = now.getTime() - d.getTime()

    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `Criada há ${days} ${days === 1 ? 'dia' : 'dias'}`
    if (hours > 0) return `Criada há ${hours} ${hours === 1 ? 'hora' : 'horas'}`
    if (minutes > 0) return `Criada há ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`
    return 'Criada agora pouco'
}
