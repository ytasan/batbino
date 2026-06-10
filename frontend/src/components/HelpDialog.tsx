import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

type HelpDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type ShortcutRow = {
  keys: string[]
  description: string
}

type FeatureRow = {
  title: string
  description: string
}

const SHORTCUTS: ShortcutRow[] = [
  { keys: ['←'], description: 'Go to previous month' },
  { keys: ['→'], description: 'Go to next month' },
  { keys: ['Esc'], description: 'Close context menu or dialog' },
]

const FEATURES: FeatureRow[] = [
  {
    title: 'Create task',
    description: 'Use Create in the header or click a day in the month grid.',
  },
  {
    title: 'Calendar slash command',
    description: 'In the title field, type / to pick a calendar with autocomplete (e.g. /work Buy milk).',
  },
  {
    title: 'Today',
    description: 'Jump back to the current date and month.',
  },
  {
    title: 'Task details',
    description: 'Click a task to view and edit it.',
  },
  {
    title: 'Drag and drop',
    description: 'Drag a task onto another day to reschedule it.',
  },
  {
    title: 'Context menu',
    description: 'Right-click a task to move, mark done, edit, or delete it.',
  },
  {
    title: 'More tasks',
    description: 'Click "+N more" on a day to see tasks that do not fit in the cell.',
  },
  {
    title: 'Search',
    description: 'Use the sidebar search box to find tasks by title or description.',
  },
  {
    title: 'Calendars',
    description: 'Toggle calendars in the sidebar to show or hide their tasks. Your choices are saved.',
  },
  {
    title: 'Mini calendar',
    description: 'Use the sidebar mini calendar to jump to a specific day or month.',
  },
  {
    title: 'Export / import',
    description: 'Open Settings (gear icon) to export or import tasks as JSON.',
  },
  {
    title: 'Sidebars',
    description: 'Collapse or expand the left and right sidebars with the arrow buttons.',
  },
]

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="inline-flex min-w-[1.75rem] items-center justify-center rounded border border-[#5f6368] bg-[#131314] px-1.5 py-0.5 font-mono text-[12px] text-[#e3e3e3]">
      {children}
    </kbd>
  )
}

export function HelpDialog({ open, onOpenChange }: HelpDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogTitle>Help</DialogTitle>

        <section>
          <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-[#bdc1c6]">
            Keyboard shortcuts
          </h2>
          <ul className="space-y-2">
            {SHORTCUTS.map((row) => (
              <li key={row.description} className="flex items-center justify-between gap-4 text-[14px]">
                <span className="text-[#e3e3e3]">{row.description}</span>
                <span className="flex shrink-0 items-center gap-1">
                  {row.keys.map((key) => (
                    <Kbd key={key}>{key}</Kbd>
                  ))}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[12px] text-[#80868b]">
            Arrow keys work when no dialog is open and you are not typing in a field.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-[#bdc1c6]">
            Features
          </h2>
          <ul className="space-y-3">
            {FEATURES.map((row) => (
              <li key={row.title}>
                <div className="text-[14px] font-medium text-[#e3e3e3]">{row.title}</div>
                <div className="text-[13px] text-[#bdc1c6]">{row.description}</div>
              </li>
            ))}
          </ul>
        </section>
      </DialogContent>
    </Dialog>
  )
}
