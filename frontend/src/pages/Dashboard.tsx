import React, { useDeferredValue, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { format } from "date-fns"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { ClipboardPaste, Copy, Download, Edit2, Folder, Link, MoreVertical, Plus, QrCode, Search, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/Button"
import { Dropdown, DropdownItem } from "@/components/ui/Dropdown"
import { Input } from "@/components/ui/Input"
import { useQRCodes } from "@/context/QRCodeContext"
import { buildQRCodeShortUrl, copyQRCodePngToClipboard, downloadQRCodePng, supportsImageClipboard } from "@/lib/qrcode"
import type { QRCodeData } from "@/types/api"


function getQRCodeFileName(qrCode: QRCodeData) {
  return qrCode.name || qrCode.shortCode || "qrcode"
}


export function Dashboard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { qrCodes, isLoading, deleteQRCode, pasteQRCode } = useQRCodes()
  const [searchQuery, setSearchQuery] = useState("")
  const deferredSearchQuery = useDeferredValue(searchQuery)

  const filteredQRCodes = useMemo(() => {
    if (!deferredSearchQuery) {
      return qrCodes
    }

    const normalizedQuery = deferredSearchQuery.toLowerCase()
    return qrCodes.filter(
      (qrCode) =>
        qrCode.name.toLowerCase().includes(normalizedQuery) ||
        qrCode.shortCode.toLowerCase().includes(normalizedQuery),
    )
  }, [deferredSearchQuery, qrCodes])

  const handleCopyLink = async (shortCode: string) => {
    try {
      const shortUrl = buildQRCodeShortUrl(shortCode)
      await navigator.clipboard.writeText(shortUrl)
      toast.success(t("dashboard.linkCopied"))
    } catch {
      toast.error(t("dashboard.failedToCopyLink"))
    }
  }

  const handleCopyQRImage = async (qrCode: QRCodeData) => {
    if (!supportsImageClipboard()) {
      toast.error(t("dashboard.qrImageCopyUnsupported"))
      return
    }

    try {
      await copyQRCodePngToClipboard({
        value: buildQRCodeShortUrl(qrCode.shortCode),
        design: qrCode.design,
      })
      toast.success(t("dashboard.qrImageCopied"))
    } catch {
      toast.error(t("dashboard.failedToCopyQr"))
    }
  }

  const handleDownloadQRImage = async (qrCode: QRCodeData) => {
    try {
      await downloadQRCodePng({
        value: buildQRCodeShortUrl(qrCode.shortCode),
        design: qrCode.design,
        fileName: getQRCodeFileName(qrCode),
      })
      toast.success(t("dashboard.qrImageDownloaded"))
    } catch {
      toast.error(t("dashboard.failedToDownloadQr"))
    }
  }

  const handlePaste = async () => {
    try {
      const rawClipboardText = await navigator.clipboard.readText()
      const clipboardData = JSON.parse(rawClipboardText)
      await pasteQRCode(clipboardData)
      toast.success(t("dashboard.qrPasted"))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("dashboard.failedToPaste"))
    }
  }

  const handleCopyData = (qrCodeId: string) => {
    const qrCode = qrCodes.find((item) => item.id === qrCodeId)
    if (!qrCode) {
      toast.error(t("edit.notFound"))
      return
    }

    const clipboardPayload = {
      name: qrCode.name,
      type: qrCode.type,
      content: qrCode.content,
      design: qrCode.design,
    }
    navigator.clipboard.writeText(JSON.stringify(clipboardPayload))
    toast.success(t("dashboard.qrDataCopied"))
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteQRCode(id)
      toast.success(t("dashboard.qrDeleted"))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("edit.error"))
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-zinc-900">{t("dashboard.title")}</h1>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => void handlePaste()} className="gap-2">
            <ClipboardPaste className="w-4 h-4" />
            {t("common.paste")}
          </Button>
          <Button onClick={() => navigate("/dashboard/create")} className="gap-2">
            <Plus className="w-4 h-4" />
            {t("dashboard.newQr")}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            type="text"
            placeholder={t("common.search")}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-zinc-900 border-t-transparent" />
          <p className="text-sm text-zinc-500">Loading QR codes...</p>
        </div>
      ) : filteredQRCodes.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-zinc-200 rounded-xl">
          <div className="mx-auto w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
            <Folder className="w-6 h-6 text-zinc-400" />
          </div>
          <h3 className="text-lg font-medium text-zinc-900 mb-1">{t("dashboard.noFiles")}</h3>
          <p className="text-sm text-zinc-500 mb-6 max-w-sm mx-auto">
            {searchQuery ? t("dashboard.noFilesDesc") : t("dashboard.noFilesDescEmpty")}
          </p>
          <div className="flex items-center justify-center gap-3">
            {searchQuery ? (
              <Button variant="outline" onClick={() => setSearchQuery("")}>
                {t("dashboard.clearSearch")}
              </Button>
            ) : null}
            <Button onClick={() => navigate("/dashboard/create")}>
              <Plus className="w-4 h-4 mr-2" />
              {t("dashboard.newQr")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-xl">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead className="bg-zinc-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  {t("dashboard.name")}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  {t("dashboard.type")}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  {t("dashboard.shortCode")}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  {t("dashboard.clicks")}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  {t("dashboard.lastModified")}
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-zinc-200">
              {filteredQRCodes.map((qrCode) => (
                <tr key={qrCode.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-zinc-950 text-white flex items-center justify-center shadow-sm">
                        <QrCode className="h-5 w-5" strokeWidth={1.75} />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-zinc-900">{qrCode.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-zinc-100 text-zinc-800 capitalize">
                      {qrCode.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-zinc-100 text-zinc-800">
                      /{qrCode.shortCode}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">{qrCode.clicks}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                    {format(new Date(qrCode.lastModified), "MMM d, yyyy")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Dropdown
                      trigger={
                        <button className="text-zinc-400 hover:text-zinc-600 p-1 rounded-md hover:bg-zinc-100">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      }
                    >
                      <DropdownItem onClick={() => void handleDownloadQRImage(qrCode)} className="flex items-center gap-2">
                        <Download className="w-4 h-4" /> {t("dashboard.downloadQr")}
                      </DropdownItem>
                      <DropdownItem onClick={() => void handleCopyQRImage(qrCode)} className="flex items-center gap-2">
                        <Copy className="w-4 h-4" /> {t("dashboard.copyQr")}
                      </DropdownItem>
                      <DropdownItem onClick={() => void handleCopyLink(qrCode.shortCode)} className="flex items-center gap-2">
                        <Link className="w-4 h-4" /> {t("dashboard.copyLink")}
                      </DropdownItem>
                      <DropdownItem onClick={() => handleCopyData(qrCode.id)} className="flex items-center gap-2">
                        <ClipboardPaste className="w-4 h-4" /> {t("dashboard.copyData")}
                      </DropdownItem>
                      <DropdownItem
                        onClick={() => navigate(`/dashboard/edit/${qrCode.id}`)}
                        className="flex items-center gap-2"
                      >
                        <Edit2 className="w-4 h-4" /> {t("dashboard.editQr")}
                      </DropdownItem>
                      <DropdownItem
                        onClick={() => void handleDelete(qrCode.id)}
                        className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border border-dashed border-red-200 mx-1 mb-1 w-[calc(100%-0.5rem)] rounded-md"
                      >
                        <Trash2 className="w-4 h-4" /> {t("dashboard.deleteQr")}
                      </DropdownItem>
                    </Dropdown>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
