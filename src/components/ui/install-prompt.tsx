import { Download, X } from 'lucide-react'
import { useInstallPrompt } from '@/hooks/use-install-prompt'

export function InstallPrompt() {
  const { canInstall, promptInstall, dismiss } = useInstallPrompt()
  if (!canInstall) return null
  return (
    <div className="mx-4 mb-2 bg-card border border-border rounded-xl p-3 flex items-center gap-3">
      <Download className="h-5 w-5 text-primary flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">Add to Home Screen</p>
        <p className="text-xs text-muted-foreground">For the best experience</p>
      </div>
      <button onClick={promptInstall} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
        Install
      </button>
      <button onClick={dismiss} className="p-1 text-muted-foreground hover:text-foreground">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
