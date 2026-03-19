export type AuthProvider = "local" | "google"
export type QRCodeType = "url" | "whatsapp" | "pix"
export type QRCodeStyle = "squares" | "dots"
export type QRCodeActionType = "redirect" | "copy"

export interface User {
  id: string
  name: string
  email: string
  providers: AuthProvider[]
  isActive: boolean
  createdAt: string
  lastLoginAt: string | null
}

export interface AuthToken {
  accessToken: string
  tokenType: string
  expiresAt: string
}

export interface AuthResponse {
  user: User
  token: AuthToken
  authProvider: AuthProvider
}

export interface WhatsAppContent {
  phone: string
  message: string
}

export interface QRCodeDesign {
  fgColor: string
  bgColor: string
  qrStyle?: QRCodeStyle
  eyeRadius?: number
  eyeColor?: string | null
  logoImage?: string | null
}

export type QRCodeContent = string | WhatsAppContent

export interface QRCodeData {
  id: string
  ownerId: string
  name: string
  type: QRCodeType
  content: QRCodeContent
  shortCode: string
  clicks: number
  design: QRCodeDesign
  editTimestamps: string[]
  createdAt: string
  updatedAt: string
  lastModified: string
  lastAccessedAt?: string | null
}

export interface QRCodePublicData {
  id: string
  name: string
  type: QRCodeType
  shortCode: string
  clicks: number
  design: QRCodeDesign
  createdAt: string
  updatedAt: string
  lastModified: string
}

export interface QRCodeAccessResult {
  qrCode: QRCodePublicData
  actionType: QRCodeActionType
  targetUrl?: string | null
  copyValue?: string | null
}

export interface QRCodePayload {
  name: string
  type: QRCodeType
  content: QRCodeContent
  design: QRCodeDesign
}

export type QRCodeUpdatePayload = Partial<QRCodePayload>

export interface ApiErrorPayload {
  detail?: string
  code?: string
  extra?: unknown
}
