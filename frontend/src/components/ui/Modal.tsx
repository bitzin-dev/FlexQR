import * as React from "react"
import { cn } from "@/utils/cn"
import { X } from "lucide-react"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-zinc-100 transition-colors"
          >
            <X className="h-5 w-5 text-zinc-500" />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  )
}
