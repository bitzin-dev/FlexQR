import React from "react"
import { createRoot } from "react-dom/client"
import { QRCode, type IProps as QRCodeLogoProps } from "react-qrcode-logo"

import { PUBLIC_APP_URL } from "@/lib/env"
import type { QRCodeDesign } from "@/types/api"


const DEFAULT_EXPORT_SIZE = 1200
const DEFAULT_FOREGROUND_COLOR = "#000000"
const DEFAULT_BACKGROUND_COLOR = "#FFFFFF"
const URL_PROTOCOL_PATTERN = /^[a-z][a-z\d+\-.]*:\/\//i


interface QRCodeImageOptions {
  value: string
  design: QRCodeDesign
  size?: number
}


interface QRCodeExportOptions extends QRCodeImageOptions {
  fileName: string
}


function normalizeBaseUrl(url: string) {
  return url.replace(/\/+$/, "")
}


function ensureUrlProtocol(url: string) {
  return URL_PROTOCOL_PATTERN.test(url) ? url : `https://${url}`
}


function resolvePublicAppBaseUrl() {
  return new URL(`${normalizeBaseUrl(ensureUrlProtocol(PUBLIC_APP_URL))}/`)
}


function waitForNextFrame() {
  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve())
  })
}


function wait(milliseconds: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, milliseconds)
  })
}


function getLogoSize(size: number) {
  return Math.max(10, Math.round(size * 0.22))
}


function sanitizeFileName(fileName: string) {
  const normalizedFileName = fileName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  return normalizedFileName || "qrcode"
}


async function withRenderedQRCodeCanvas<T>(
  options: QRCodeImageOptions,
  callback: (canvas: HTMLCanvasElement) => Promise<T> | T,
) {
  const container = document.createElement("div")
  container.style.position = "fixed"
  container.style.left = "-10000px"
  container.style.top = "0"
  container.style.width = "0"
  container.style.height = "0"
  container.style.opacity = "0"
  container.style.pointerEvents = "none"
  container.setAttribute("aria-hidden", "true")
  document.body.appendChild(container)

  const root = createRoot(container)
  let resolveLogoLoaded: (() => void) | null = null
  const logoLoadedPromise = options.design.logoImage
    ? new Promise<void>((resolve) => {
        resolveLogoLoaded = resolve
      })
    : null

  try {
    root.render(
      <QRCode
        {...getQRCodeLogoProps(options.value, options.design, options.size ?? DEFAULT_EXPORT_SIZE)}
        logoOnLoad={() => resolveLogoLoaded?.()}
      />,
    )

    await waitForNextFrame()
    await waitForNextFrame()

    if (logoLoadedPromise) {
      await Promise.race([logoLoadedPromise, wait(1500)])
      await waitForNextFrame()
    }

    const canvas = container.querySelector("canvas")
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("QR code image could not be rendered.")
    }

    return await callback(canvas)
  } finally {
    root.unmount()
    container.remove()
  }
}


export function buildQRCodeShortUrl(shortCode: string) {
  return new URL(`q/${shortCode}`, resolvePublicAppBaseUrl()).toString()
}


export function getQRCodeLogoProps(
  value: string,
  design: QRCodeDesign,
  size: number,
): QRCodeLogoProps {
  const foregroundColor = design.fgColor || DEFAULT_FOREGROUND_COLOR
  const backgroundColor = design.bgColor || DEFAULT_BACKGROUND_COLOR
  const logoSize = design.logoImage ? getLogoSize(size) : undefined

  return {
    value,
    size,
    ecLevel: "H",
    quietZone: Math.max(10, Math.round(size * 0.06)),
    fgColor: foregroundColor,
    bgColor: backgroundColor,
    qrStyle: design.qrStyle || "squares",
    eyeRadius: design.eyeRadius || 0,
    eyeColor: design.eyeColor || foregroundColor,
    logoImage: design.logoImage || undefined,
    logoWidth: logoSize,
    logoHeight: logoSize,
    removeQrCodeBehindLogo: Boolean(design.logoImage),
    enableCORS: Boolean(design.logoImage),
  }
}


export function supportsImageClipboard() {
  return Boolean(navigator.clipboard?.write && typeof ClipboardItem !== "undefined")
}


export async function renderQRCodePngBlob(options: QRCodeImageOptions) {
  return withRenderedQRCodeCanvas(options, async (canvas) => {
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((nextBlob) => resolve(nextBlob), "image/png")
    })

    if (!blob) {
      throw new Error("QR code image could not be exported.")
    }

    return blob
  })
}


export async function copyQRCodePngToClipboard(options: QRCodeImageOptions) {
  if (!supportsImageClipboard()) {
    throw new Error("Image clipboard is not supported by this browser.")
  }

  const blob = await renderQRCodePngBlob(options)
  await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
}


export async function downloadQRCodePng(options: QRCodeExportOptions) {
  const blob = await renderQRCodePngBlob(options)
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement("a")

  anchor.href = objectUrl
  anchor.download = `${sanitizeFileName(options.fileName)}.png`
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(objectUrl)
}
