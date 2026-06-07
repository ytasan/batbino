import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'

import { cn } from '@/lib/utils'

export const DropdownMenu = DropdownMenuPrimitive.Root
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger
export const DropdownMenuPortal = DropdownMenuPrimitive.Portal

export function DropdownMenuContent({
  className,
  sideOffset = 4,
  ...props
}: DropdownMenuPrimitive.DropdownMenuContentProps) {
  return (
    <DropdownMenuPortal>
      <DropdownMenuPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          'z-50 min-w-[200px] overflow-hidden rounded-lg border border-[#3c4043] bg-[#1e1f20] p-1 text-[#e3e3e3] shadow-lg',
          className,
        )}
        {...props}
      />
    </DropdownMenuPortal>
  )
}

export function DropdownMenuItem({
  className,
  ...props
}: DropdownMenuPrimitive.DropdownMenuItemProps) {
  return (
    <DropdownMenuPrimitive.Item
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-md px-3 py-2 text-sm outline-none transition-colors hover:bg-[#292a2d] focus:bg-[#292a2d] data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      )}
      {...props}
    />
  )
}
