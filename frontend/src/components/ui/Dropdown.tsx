import * as React from "react"
import { cn } from "@/utils/cn"

interface DropdownProps {
  trigger: React.ReactNode
  children: React.ReactNode
  align?: "left" | "right"
}

export function Dropdown({ trigger, children, align = "right" }: DropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      {isOpen && (
        <div
          className={cn(
            "absolute z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none",
            align === "right" ? "right-0" : "left-0"
          )}
          onClick={() => setIsOpen(false)}
        >
          <div className="py-1">{children}</div>
        </div>
      )}
    </div>
  )
}

export function DropdownItem({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "block w-full px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900",
        className
      )}
    >
      {children}
    </button>
  )
}
