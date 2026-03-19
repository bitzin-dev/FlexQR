/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { Toaster } from "sonner"

import { AuthProvider, useAuth } from "@/context/AuthContext"
import { QRCodeProvider } from "@/context/QRCodeContext"
import { AuthLayout } from "@/layouts/AuthLayout"
import { DashboardLayout } from "@/layouts/DashboardLayout"
import { Dashboard } from "@/pages/Dashboard"
import { EditQRCode } from "@/pages/EditQRCode"
import { Login } from "@/pages/Login"
import { Notifications } from "@/pages/Notifications"
import { Plans } from "@/pages/Plans"
import { Redirect } from "@/pages/Redirect"
import { Register } from "@/pages/Register"
import { Settings } from "@/pages/Settings"
import "@/i18n/config"


function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-zinc-900 border-t-transparent" />
        <p className="text-sm text-zinc-600">Loading FlexQR...</p>
      </div>
    </div>
  )
}


function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth()

  if (isLoading) {
    return <FullScreenLoader />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}


function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth()

  if (isLoading) {
    return <FullScreenLoader />
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}


function DefaultRoute() {
  const { isLoading, isAuthenticated } = useAuth()

  if (isLoading) {
    return <FullScreenLoader />
  }

  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
}


export default function App() {
  return (
    <AuthProvider>
      <QRCodeProvider>
        <BrowserRouter>
          <Toaster position="top-right" richColors />
          <Routes>
            <Route
              element={
                <PublicOnlyRoute>
                  <AuthLayout />
                </PublicOnlyRoute>
              }
            >
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="home" element={<Dashboard />} />
              <Route path="create" element={<EditQRCode />} />
              <Route path="edit/:id" element={<EditQRCode />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="plans" element={<Plans />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            <Route path="/q/:shortCode" element={<Redirect />} />
            <Route path="/" element={<DefaultRoute />} />
            <Route path="*" element={<DefaultRoute />} />
          </Routes>
        </BrowserRouter>
      </QRCodeProvider>
    </AuthProvider>
  )
}
