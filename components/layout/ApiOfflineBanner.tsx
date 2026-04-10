import { AlertTriangle } from 'lucide-react'

export function ApiOfflineBanner() {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-400">
      <AlertTriangle className="w-4 h-4 shrink-0" />
      <span>
        API offline ou sem resposta. Os dados exibidos podem estar desatualizados.
      </span>
    </div>
  )
}
