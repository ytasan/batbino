import { CheckSquare, ChevronLeft, ChevronRight, MapPin, NotebookPen, Plus, UserRound } from 'lucide-react'
import type { ReactNode } from 'react'

type RightSidebarProps = {
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
}

export function RightSidebar({ collapsed, onCollapsedChange }: RightSidebarProps) {
  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => onCollapsedChange(false)}
        className="absolute right-0 top-[120px] flex h-10 w-6 items-center justify-center rounded-l-md border border-r-0 border-[#3c4043] bg-[#1e1f20] text-[#bdc1c6] transition-colors hover:bg-[#292a2d] hover:text-[#8ab4f8]"
        aria-label="Expand sidebar"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
    )
  }

  return (
    <aside className="absolute right-6 top-[120px] flex w-[56px] flex-col items-center gap-10 px-3 text-[#bdc1c6]">
      <NavIcon ariaLabel="Notebook">
        <NotebookPen className="h-[28px] w-[28px]" strokeWidth={1.5} />
      </NavIcon>
      <NavIcon ariaLabel="Tasks">
        <CheckSquare className="h-[28px] w-[28px]" strokeWidth={1.5} />
      </NavIcon>
      <NavIcon ariaLabel="Contacts">
        <UserRound className="h-[28px] w-[28px]" strokeWidth={1.5} />
      </NavIcon>
      <NavIcon ariaLabel="Maps">
        <MapPin className="h-[28px] w-[28px]" strokeWidth={1.5} />
      </NavIcon>
      <button
        type="button"
        className="mt-3 flex h-[52px] w-[52px] items-center justify-center rounded-full border border-dashed border-[#5f6368] text-[#bdc1c6] transition-colors hover:border-[#8ab4f8] hover:text-[#8ab4f8]"
        aria-label="Add shortcut"
      >
        <Plus className="h-8 w-8" strokeWidth={1.5} />
      </button>
      <button
        type="button"
        onClick={() => onCollapsedChange(true)}
        className="mt-2 flex h-8 w-8 items-center justify-center rounded-full text-[#80868b] transition-colors hover:bg-[#292a2d] hover:text-[#bdc1c6]"
        aria-label="Collapse sidebar"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </aside>
  )
}

function NavIcon({ children, ariaLabel }: { children: ReactNode; ariaLabel: string }) {
  return (
    <button
      type="button"
      className="flex h-12 w-12 items-center justify-center rounded-[10px] text-[#bdc1c6] hover:bg-[#292a2d]"
      aria-label={ariaLabel}
    >
      {children}
    </button>
  )
}
