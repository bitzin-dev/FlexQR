import { Outlet, NavLink, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/context/AuthContext"
import {
  Home,
  Folder,
  Bell,
  CreditCard,
  Settings,
  LogOut,
  Globe,
  Github
} from "lucide-react"
import { getNextLanguage, normalizeLanguage } from "@/i18n/language"
import { cn } from "@/utils/cn"

export function DashboardLayout() {
  const { t, i18n } = useTranslation()
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const currentLanguage = normalizeLanguage(i18n.resolvedLanguage || i18n.language)

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const toggleLanguage = () => {
    void i18n.changeLanguage(getNextLanguage(currentLanguage))
  }

  const navigation = [
    { name: t("sidebar.home"), href: "/dashboard/home", icon: Home },
    { name: t("sidebar.allFiles"), href: "/dashboard", icon: Folder },
  ]

  const secondaryNavigation = [
    { name: t("sidebar.notifications"), href: "/dashboard/notifications", icon: Bell },
    { name: t("sidebar.plans"), href: "/dashboard/plans", icon: CreditCard },
    { name: t("sidebar.settings"), href: "/dashboard/settings", icon: Settings },
    { name: "GitHub", href: "https://github.com/bitzin-dev/FlexQR", icon: Github, external: true },
  ]

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 border-r border-zinc-200 bg-zinc-50/50 flex flex-col">
        <div className="h-16 flex items-center px-6">
          <div className="flex items-center">
            <img src="/logo.svg" alt="FlexQR Logo" className="h-12 w-auto object-contain" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-8">
          <nav className="space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === "/dashboard"}
                className={({ isActive }) =>
                  cn(
                    "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-zinc-100 text-zinc-900"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                  )
                }
              >
                <item.icon
                  className="mr-3 flex-shrink-0 h-5 w-5 text-zinc-400 group-hover:text-zinc-500"
                  aria-hidden="true"
                />
                {item.name}
              </NavLink>
            ))}
          </nav>

          <nav className="space-y-1">
            {secondaryNavigation.map((item) => (
              item.external ? (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                >
                  <item.icon
                    className="mr-3 flex-shrink-0 h-5 w-5 text-zinc-400 group-hover:text-zinc-500"
                    aria-hidden="true"
                  />
                  {item.name}
                </a>
              ) : (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                      "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      isActive
                        ? "bg-zinc-100 text-zinc-900"
                        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                    )
                  }
                >
                  <item.icon
                    className="mr-3 flex-shrink-0 h-5 w-5 text-zinc-400 group-hover:text-zinc-500"
                    aria-hidden="true"
                  />
                  {item.name}
                </NavLink>
              )
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-zinc-200 space-y-2">
          <button
            onClick={toggleLanguage}
            className="w-full group flex items-center px-3 py-2 text-sm font-medium rounded-md text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
          >
            <Globe className="mr-3 flex-shrink-0 h-5 w-5 text-zinc-400 group-hover:text-zinc-500" />
            {currentLanguage === "en" ? t("common.portuguese") : t("common.english")}
          </button>
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-3 truncate">
              <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center text-sm font-medium text-zinc-600">
                {user?.name.charAt(0)}
              </div>
              <div className="truncate">
                <p className="text-sm font-medium text-zinc-900 truncate">{user?.name}</p>
                <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1 text-zinc-400 hover:text-zinc-600 rounded-md hover:bg-zinc-100 transition-colors"
              title={t("common.logout")}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-y-auto bg-white p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
