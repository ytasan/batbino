import { cn } from '@/lib/utils'

export function Input({
  className,
  type = 'text',
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-11 w-full min-w-0 rounded-lg border border-[#3c4043] bg-[#1e1f20] px-3 text-[15px] text-[#e3e3e3] outline-none placeholder:text-[#80868b] focus-visible:border-[#8ab4f8] disabled:opacity-60',
        className,
      )}
      {...props}
    />
  )
}
