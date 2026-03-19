import React, { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"
import { QRCode } from "react-qrcode-logo"
import { toast } from "sonner"
import { ArrowLeft, Download, Globe, Hash, MessageCircle, Save, Smartphone } from "lucide-react"

import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { useQRCodes, type QRCodeDesign, type QRCodeType } from "@/context/QRCodeContext"
import { ApiError } from "@/lib/api"
import { buildQRCodeShortUrl, downloadQRCodePng, getQRCodeLogoProps } from "@/lib/qrcode"
import type { QRCodePayload } from "@/types/api"


const defaultDesign: QRCodeDesign = {
  fgColor: "#000000",
  bgColor: "#FFFFFF",
  qrStyle: "squares",
  eyeRadius: 0,
}


function getErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof ApiError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return fallbackMessage
}


export function EditQRCode() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { qrCodes, isLoading, addQRCode, updateQRCode } = useQRCodes()

  const isEditMode = Boolean(id)
  const currentQRCode = useMemo(() => qrCodes.find((qrCode) => qrCode.id === id), [id, qrCodes])

  const [name, setName] = useState("")
  const [type, setType] = useState<QRCodeType>("url")
  const [content, setContent] = useState("")
  const [whatsappPhone, setWhatsappPhone] = useState("")
  const [whatsappMessage, setWhatsappMessage] = useState("")
  const [design, setDesign] = useState<QRCodeDesign>(defaultDesign)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (isEditMode) {
      return
    }

    setName("")
    setType("url")
    setContent("")
    setWhatsappPhone("")
    setWhatsappMessage("")
    setDesign(defaultDesign)
  }, [isEditMode])

  useEffect(() => {
    if (!isEditMode) {
      return
    }

    if (isLoading) {
      return
    }

    if (!currentQRCode) {
      toast.error(t("edit.notFound"))
      navigate("/dashboard")
      return
    }

    setName(currentQRCode.name)
    setType(currentQRCode.type)
    setDesign(currentQRCode.design || defaultDesign)

    if (currentQRCode.type === "whatsapp" && typeof currentQRCode.content === "object") {
      setContent("")
      setWhatsappPhone(currentQRCode.content.phone || "")
      setWhatsappMessage(currentQRCode.content.message || "")
      return
    }

    setWhatsappPhone("")
    setWhatsappMessage("")
    setContent(typeof currentQRCode.content === "string" ? currentQRCode.content : "")
  }, [currentQRCode, isEditMode, isLoading, navigate, t])

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error(t("edit.enterName"))
      return
    }

    let payload: QRCodePayload
    if (type === "whatsapp") {
      if (!whatsappPhone.trim()) {
        toast.error(t("edit.enterWhatsapp"))
        return
      }

      payload = {
        name,
        type,
        content: {
          phone: whatsappPhone.trim(),
          message: whatsappMessage,
        },
        design,
      }
    } else {
      if (!content.trim()) {
        toast.error(t("edit.enterDest"))
        return
      }

      payload = {
        name,
        type,
        content: content.trim(),
        design,
      }
    }

    setIsSaving(true)
    try {
      if (isEditMode && id) {
        await updateQRCode(id, payload)
        toast.success(t("edit.updated"))
      } else {
        await addQRCode(payload)
        toast.success(t("edit.created"))
        navigate("/dashboard")
      }
    } catch (error) {
      toast.error(getErrorMessage(error, t("edit.error")))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDownload = async (format: "png" | "svg") => {
    if (format === "svg") {
      toast.error("SVG download is not supported with the current QR code style.")
      return
    }

    try {
      await downloadQRCodePng({
        value: previewValue,
        design,
        fileName: name || currentQRCode?.shortCode || "qrcode",
      })
    } catch (error) {
      toast.error(getErrorMessage(error, t("edit.error")))
    }
  }

  const previewValue = currentQRCode
    ? buildQRCodeShortUrl(currentQRCode.shortCode)
    : buildQRCodeShortUrl("preview")
  const previewQRCodeProps = useMemo(() => getQRCodeLogoProps(previewValue, design, 200), [design, previewValue])

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-semibold text-zinc-900">
            {isEditMode ? t("edit.titleEdit") : t("edit.titleCreate")}
          </h1>
        </div>
        <Button onClick={() => void handleSave()} className="gap-2" disabled={isSaving || isLoading}>
          <Save className="w-4 h-4" />
          {isSaving ? "Saving..." : isEditMode ? t("edit.saveChanges") : t("edit.createQr")}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-6 rounded-xl border border-zinc-200 space-y-4">
            <h2 className="text-lg font-medium text-zinc-900">{t("edit.basicInfo")}</h2>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">{t("edit.qrNameLabel")}</label>
              <Input
                value={name}
                disabled={isSaving}
                onChange={(event) => setName(event.target.value)}
                placeholder={t("edit.qrNamePlaceholder")}
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-zinc-200 space-y-4">
            <h2 className="text-lg font-medium text-zinc-900">{t("edit.actionType")}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setType("url")}
                className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-colors ${
                  type === "url" ? "border-zinc-900 bg-zinc-50" : "border-zinc-200 hover:border-zinc-300"
                }`}
              >
                <Globe className={`w-6 h-6 mb-2 ${type === "url" ? "text-zinc-900" : "text-zinc-500"}`} />
                <span className={`text-sm font-medium ${type === "url" ? "text-zinc-900" : "text-zinc-600"}`}>
                  {t("edit.websiteUrl")}
                </span>
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setType("whatsapp")}
                className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-colors ${
                  type === "whatsapp" ? "border-green-600 bg-green-50" : "border-zinc-200 hover:border-zinc-300"
                }`}
              >
                <MessageCircle className={`w-6 h-6 mb-2 ${type === "whatsapp" ? "text-green-600" : "text-zinc-500"}`} />
                <span className={`text-sm font-medium ${type === "whatsapp" ? "text-green-700" : "text-zinc-600"}`}>
                  {t("edit.whatsapp")}
                </span>
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setType("pix")}
                className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-colors ${
                  type === "pix" ? "border-teal-600 bg-teal-50" : "border-zinc-200 hover:border-zinc-300"
                }`}
              >
                <Hash className={`w-6 h-6 mb-2 ${type === "pix" ? "text-teal-600" : "text-zinc-500"}`} />
                <span className={`text-sm font-medium ${type === "pix" ? "text-teal-700" : "text-zinc-600"}`}>
                  {t("edit.pix")}
                </span>
              </button>
            </div>

            <div className="pt-4 border-t border-zinc-100">
              {type === "url" ? (
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">{t("edit.destUrl")}</label>
                  <Input
                    type="url"
                    disabled={isSaving}
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    placeholder={t("edit.destUrlPlaceholder")}
                  />
                </div>
              ) : null}

              {type === "whatsapp" ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">{t("edit.whatsappNumber")}</label>
                    <Input
                      type="tel"
                      disabled={isSaving}
                      value={whatsappPhone}
                      onChange={(event) => setWhatsappPhone(event.target.value)}
                      placeholder={t("edit.whatsappNumberPlaceholder")}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">{t("edit.prefilledMessage")}</label>
                    <Input
                      disabled={isSaving}
                      value={whatsappMessage}
                      onChange={(event) => setWhatsappMessage(event.target.value)}
                      placeholder={t("edit.prefilledMessagePlaceholder")}
                    />
                  </div>
                </div>
              ) : null}

              {type === "pix" ? (
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">{t("edit.pixCode")}</label>
                  <Input
                    disabled={isSaving}
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    placeholder={t("edit.pixCodePlaceholder")}
                  />
                  <p className="text-xs text-zinc-500 mt-2">{t("edit.pixDesc")}</p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-zinc-200 space-y-4">
            <h2 className="text-lg font-medium text-zinc-900">{t("edit.designColors")}</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">{t("edit.fgColor")}</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    disabled={isSaving}
                    value={design.fgColor}
                    onChange={(event) => setDesign({ ...design, fgColor: event.target.value })}
                    className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                  />
                  <Input
                    value={design.fgColor}
                    disabled={isSaving}
                    onChange={(event) => setDesign({ ...design, fgColor: event.target.value })}
                    className="font-mono uppercase"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">{t("edit.bgColor")}</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    disabled={isSaving}
                    value={design.bgColor}
                    onChange={(event) => setDesign({ ...design, bgColor: event.target.value })}
                    className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                  />
                  <Input
                    value={design.bgColor}
                    disabled={isSaving}
                    onChange={(event) => setDesign({ ...design, bgColor: event.target.value })}
                    className="font-mono uppercase"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Eye Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    disabled={isSaving}
                    value={design.eyeColor || design.fgColor}
                    onChange={(event) => setDesign({ ...design, eyeColor: event.target.value })}
                    className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                  />
                  <Input
                    value={design.eyeColor || design.fgColor}
                    disabled={isSaving}
                    onChange={(event) => setDesign({ ...design, eyeColor: event.target.value })}
                    className="font-mono uppercase"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Eye Radius</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="50"
                    disabled={isSaving}
                    value={design.eyeRadius || 0}
                    onChange={(event) => setDesign({ ...design, eyeRadius: Number.parseInt(event.target.value, 10) })}
                    className="w-full"
                  />
                  <span className="text-sm text-zinc-500 w-8">{design.eyeRadius || 0}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-zinc-100">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">QR Style</label>
                <select
                  value={design.qrStyle || "squares"}
                  disabled={isSaving}
                  onChange={(event) =>
                    setDesign({ ...design, qrStyle: event.target.value as QRCodeDesign["qrStyle"] })
                  }
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                >
                  <option value="squares">Squares</option>
                  <option value="dots">Dots</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Logo URL (Optional)</label>
                <Input
                  type="url"
                  disabled={isSaving}
                  value={design.logoImage || ""}
                  onChange={(event) => setDesign({ ...design, logoImage: event.target.value })}
                  placeholder="https://example.com/logo.png"
                />
              </div>
            </div>

            <div className="pt-4">
              <label className="block text-sm font-medium text-zinc-700 mb-2">{t("edit.presetStyles")}</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setDesign({ fgColor: "#000000", bgColor: "#FFFFFF" })}
                  className="w-8 h-8 rounded-full border border-zinc-200 bg-white flex items-center justify-center overflow-hidden"
                  title={t("edit.classic")}
                >
                  <div className="w-4 h-4 bg-black rounded-sm" />
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setDesign({ fgColor: "#FFFFFF", bgColor: "#000000" })}
                  className="w-8 h-8 rounded-full border border-zinc-200 bg-black flex items-center justify-center overflow-hidden"
                  title={t("edit.inverted")}
                >
                  <div className="w-4 h-4 bg-white rounded-sm" />
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setDesign({ fgColor: "#1D4ED8", bgColor: "#EFF6FF" })}
                  className="w-8 h-8 rounded-full border border-blue-200 bg-blue-50 flex items-center justify-center overflow-hidden"
                  title={t("edit.blue")}
                >
                  <div className="w-4 h-4 bg-blue-700 rounded-sm" />
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setDesign({ fgColor: "#B91C1C", bgColor: "#FEF2F2" })}
                  className="w-8 h-8 rounded-full border border-red-200 bg-red-50 flex items-center justify-center overflow-hidden"
                  title={t("edit.red")}
                >
                  <div className="w-4 h-4 bg-red-700 rounded-sm" />
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setDesign({ fgColor: "#047857", bgColor: "#ECFDF5" })}
                  className="w-8 h-8 rounded-full border border-emerald-200 bg-emerald-50 flex items-center justify-center overflow-hidden"
                  title={t("edit.emerald")}
                >
                  <div className="w-4 h-4 bg-emerald-700 rounded-sm" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-zinc-200 sticky top-8">
            <h2 className="text-lg font-medium text-zinc-900 mb-6 text-center">{t("edit.livePreview")}</h2>

            <div className="flex justify-center mb-8">
              <div className="p-4 rounded-xl border border-zinc-100 shadow-sm bg-white">
                <QRCode
                  id="qr-preview"
                  {...previewQRCodeProps}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Button variant="outline" className="w-full gap-2" onClick={() => void handleDownload("png")}>
                <Download className="w-4 h-4" />
                {t("edit.downloadPng")}
              </Button>
              <Button variant="outline" className="w-full gap-2" onClick={() => void handleDownload("svg")}>
                <Download className="w-4 h-4" />
                {t("edit.downloadSvg")}
              </Button>
            </div>

            <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-left">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                {t("edit.generatedShortLink")}
              </p>
              <p className="mt-2 break-all text-sm text-zinc-700">{previewValue}</p>
            </div>

            <div className="mt-6 pt-6 border-t border-zinc-100">
              <div className="flex items-center justify-center gap-2 text-sm text-zinc-500">
                <Smartphone className="w-4 h-4" />
                <span>{t("edit.scanTest")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
