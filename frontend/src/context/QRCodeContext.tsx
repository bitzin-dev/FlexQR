import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

import { qrCodeApi } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import type { QRCodeContent, QRCodeData, QRCodeDesign, QRCodePayload, QRCodeType, QRCodeUpdatePayload } from "@/types/api"


const defaultQRCodeDesign: QRCodeDesign = {
  fgColor: "#000000",
  bgColor: "#FFFFFF",
  qrStyle: "squares",
  eyeRadius: 0,
}


export type { QRCodeData, QRCodeDesign, QRCodeType }


interface ClipboardQRCodeData {
  name?: unknown
  type?: unknown
  content?: unknown
  design?: unknown
}


interface QRCodeContextType {
  qrCodes: QRCodeData[]
  isLoading: boolean
  refreshQRCodes: () => Promise<void>
  addQRCode: (payload: QRCodePayload) => Promise<QRCodeData>
  updateQRCode: (id: string, payload: QRCodeUpdatePayload) => Promise<QRCodeData>
  deleteQRCode: (id: string) => Promise<void>
  pasteQRCode: (clipboardData: ClipboardQRCodeData) => Promise<QRCodeData>
}


const QRCodeContext = createContext<QRCodeContextType | undefined>(undefined)


function normalizeDesign(design?: Partial<QRCodeDesign> | null): QRCodeDesign {
  return {
    ...defaultQRCodeDesign,
    ...design,
    bgColor: design?.bgColor || defaultQRCodeDesign.bgColor,
    fgColor: design?.fgColor || defaultQRCodeDesign.fgColor,
  }
}


function isQRCodeType(value: unknown): value is QRCodeType {
  return value === "url" || value === "whatsapp" || value === "pix"
}


function isWhatsAppContent(value: unknown): value is { phone: string; message?: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { phone?: unknown }).phone === "string"
  )
}


function normalizeClipboardPayload(data: ClipboardQRCodeData): QRCodePayload {
  if (typeof data.name !== "string" || !data.name.trim()) {
    throw new Error("Clipboard data does not contain a valid QR code name.")
  }

  if (!isQRCodeType(data.type)) {
    throw new Error("Clipboard data does not contain a valid QR code type.")
  }

  if (data.type === "whatsapp") {
    if (!isWhatsAppContent(data.content)) {
      throw new Error("Clipboard data does not contain a valid WhatsApp payload.")
    }

    return {
      name: data.name.trim(),
      type: data.type,
      content: {
        phone: data.content.phone,
        message: data.content.message || "",
      },
      design: normalizeDesign(data.design as Partial<QRCodeDesign> | null | undefined),
    }
  }

  if (typeof data.content !== "string" || !data.content.trim()) {
    throw new Error("Clipboard data does not contain valid destination content.")
  }

  return {
    name: data.name.trim(),
    type: data.type,
    content: data.content.trim(),
    design: normalizeDesign(data.design as Partial<QRCodeDesign> | null | undefined),
  }
}


function normalizeQRCodePayload(payload: QRCodePayload | QRCodeUpdatePayload): QRCodePayload | QRCodeUpdatePayload {
  if (!payload.design) {
    return payload
  }

  return {
    ...payload,
    design: normalizeDesign(payload.design),
  }
}


export function QRCodeProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: isAuthLoading } = useAuth()
  const [qrCodes, setQrCodes] = useState<QRCodeData[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const refreshQRCodes = useCallback(async () => {
    if (!user) {
      setQrCodes([])
      return
    }

    setIsLoading(true)
    try {
      const nextQRCodes = await qrCodeApi.list()
      setQrCodes(nextQRCodes)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (isAuthLoading) {
      return
    }

    if (!user) {
      setQrCodes([])
      setIsLoading(false)
      return
    }

    void refreshQRCodes().catch(() => undefined)
  }, [isAuthLoading, refreshQRCodes, user])

  const addQRCode = async (payload: QRCodePayload) => {
    const createdQRCode = await qrCodeApi.create(normalizeQRCodePayload(payload) as QRCodePayload)
    setQrCodes((currentQRCodes) => [createdQRCode, ...currentQRCodes])
    return createdQRCode
  }

  const updateQRCode = async (id: string, payload: QRCodeUpdatePayload) => {
    const updatedQRCode = await qrCodeApi.update(id, normalizeQRCodePayload(payload))
    setQrCodes((currentQRCodes) =>
      currentQRCodes.map((qrCode) => (qrCode.id === id ? updatedQRCode : qrCode)),
    )
    return updatedQRCode
  }

  const deleteQRCode = async (id: string) => {
    await qrCodeApi.remove(id)
    setQrCodes((currentQRCodes) => currentQRCodes.filter((qrCode) => qrCode.id !== id))
  }

  const pasteQRCode = async (clipboardData: ClipboardQRCodeData) => {
    const normalizedPayload = normalizeClipboardPayload(clipboardData)
    return addQRCode(normalizedPayload)
  }

  const value = useMemo<QRCodeContextType>(
    () => ({
      qrCodes,
      isLoading,
      refreshQRCodes,
      addQRCode,
      updateQRCode,
      deleteQRCode,
      pasteQRCode,
    }),
    [isLoading, qrCodes, refreshQRCodes],
  )

  return <QRCodeContext.Provider value={value}>{children}</QRCodeContext.Provider>
}


export function useQRCodes() {
  const context = useContext(QRCodeContext)
  if (context === undefined) {
    throw new Error("useQRCodes must be used within a QRCodeProvider")
  }
  return context
}
