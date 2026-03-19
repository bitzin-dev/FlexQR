import { API_BASE_URL } from "@/lib/env"
import { getStoredAccessToken } from "@/lib/session"
import type {
  ApiErrorPayload,
  AuthResponse,
  QRCodeAccessResult,
  QRCodeData,
  QRCodePayload,
  QRCodePublicData,
  QRCodeUpdatePayload,
  User,
} from "@/types/api"


type RequestOptions = Omit<RequestInit, "body"> & {
  auth?: boolean
  token?: string | null
  body?: unknown
}


export class ApiError extends Error {
  status: number
  code?: string
  extra?: unknown

  constructor(message: string, status = 500, code?: string, extra?: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
    this.extra = extra
  }
}


function buildHeaders(headers?: HeadersInit, hasJsonBody?: boolean) {
  const requestHeaders = new Headers(headers)
  if (hasJsonBody) {
    requestHeaders.set("Content-Type", "application/json")
  }
  return requestHeaders
}


async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T
  }

  const contentType = response.headers.get("content-type") || ""
  if (contentType.includes("application/json")) {
    return (await response.json()) as T
  }

  return (await response.text()) as T
}


function normalizeApiError(status: number, payload: unknown): ApiError {
  if (payload && typeof payload === "object") {
    const { detail, code, extra } = payload as ApiErrorPayload
    return new ApiError(detail || "The request failed.", status, code, extra)
  }

  if (typeof payload === "string" && payload.trim()) {
    return new ApiError(payload, status)
  }

  return new ApiError("The request failed.", status)
}


async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = true, token, body, headers, ...requestInit } = options
  const shouldSerializeJson = body !== undefined && !(body instanceof FormData)
  const requestHeaders = buildHeaders(headers, shouldSerializeJson)

  if (auth) {
    const accessToken = token ?? getStoredAccessToken()
    if (!accessToken) {
      throw new ApiError("Authentication required.", 401, "missing_access_token")
    }
    requestHeaders.set("Authorization", `Bearer ${accessToken}`)
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...requestInit,
      headers: requestHeaders,
      body: shouldSerializeJson ? JSON.stringify(body) : (body as BodyInit | null | undefined),
    })
  } catch {
    throw new ApiError(
      "Could not connect to the FlexQR API. Check whether the backend is running.",
      0,
      "network_error",
    )
  }

  const payload = await parseResponse<unknown>(response)
  if (!response.ok) {
    throw normalizeApiError(response.status, payload)
  }

  return payload as T
}


export const authApi = {
  register: (payload: { name: string; email: string; password: string }) =>
    request<AuthResponse>("/auth/register", {
      method: "POST",
      auth: false,
      body: payload,
    }),

  login: (payload: { email: string; password: string }) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      auth: false,
      body: payload,
    }),

  google: (idToken: string) =>
    request<AuthResponse>("/auth/google", {
      method: "POST",
      auth: false,
      body: { idToken },
    }),
}


export const userApi = {
  me: (token?: string | null) =>
    request<User>("/users/me", {
      method: "GET",
      token,
    }),
}


export const qrCodeApi = {
  list: () =>
    request<QRCodeData[]>("/qrcodes", {
      method: "GET",
    }),

  getById: (id: string) =>
    request<QRCodeData>(`/qrcodes/${id}`, {
      method: "GET",
    }),

  create: (payload: QRCodePayload) =>
    request<QRCodeData>("/qrcodes", {
      method: "POST",
      body: payload,
    }),

  update: (id: string, payload: QRCodeUpdatePayload) =>
    request<QRCodeData>(`/qrcodes/${id}`, {
      method: "PUT",
      body: payload,
    }),

  remove: (id: string) =>
    request<void>(`/qrcodes/${id}`, {
      method: "DELETE",
    }),

  getByShortCode: (shortCode: string) =>
    request<QRCodePublicData>(`/qrcodes/shortcodes/${shortCode}`, {
      method: "GET",
      auth: false,
    }),

  registerAccess: (shortCode: string) =>
    request<QRCodeAccessResult>(`/qrcodes/shortcodes/${shortCode}/access`, {
      method: "POST",
      auth: false,
    }),
}
