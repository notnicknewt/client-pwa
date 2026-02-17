import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: { label: string; onClick: () => void }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <Icon className="h-12 w-12 text-muted-foreground/40 mb-4" />
      <h3 className="font-semibold text-lg mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
