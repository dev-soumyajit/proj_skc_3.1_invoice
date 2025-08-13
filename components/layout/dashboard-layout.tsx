"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  Settings,
  Menu,
  X,
  LogOut,
  Building2,
  Truck,
  Receipt,
  CreditCard,
  ShoppingCart,
  ArrowUpDown,
  RotateCcw,
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Vendors", href: "/vendors", icon: Building2 },
  { name: "Products", href: "/products", icon: Package },
  {
    name: "Inventory",
    href: "/inventory",
    icon: Truck,
    subItems: [
      { name: "Stock Overview", href: "/inventory", icon: Package },
      { name: "Purchases", href: "/inventory/purchases", icon: ShoppingCart },
      { name: "Stock Issues", href: "/inventory/stockouts", icon: ArrowUpDown },
      { name: "Returns", href: "/inventory/returns", icon: RotateCcw },
    ],
  },
  { name: "Invoices", href: "/invoices", icon: FileText },
  { name: "Payments", href: "/payments", icon: CreditCard },
  { name: "Reports", href: "/reports", icon: Receipt },
  { name: "Settings", href: "/settings", icon: Settings },
]

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      window.location.href = "/"
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const toggleExpanded = (itemName: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemName) ? prev.filter((name) => name !== itemName) : [...prev, itemName],
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-slate-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:static lg:inset-0`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200">
          <h1 className="text-xl font-bold text-slate-900">GST Invoice</h1>
          <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigation.map((item) => (
              <div key={item.name}>
                {item.subItems ? (
                  <>
                    <button
                      onClick={() => toggleExpanded(item.name)}
                      className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-slate-700 rounded-md hover:bg-slate-100 hover:text-slate-900 transition-colors"
                    >
                      <div className="flex items-center">
                        <item.icon className="mr-3 h-5 w-5" />
                        {item.name}
                      </div>
                      <span className={`transition-transform ${expandedItems.includes(item.name) ? "rotate-180" : ""}`}>
                        ▼
                      </span>
                    </button>
                    {expandedItems.includes(item.name) && (
                      <div className="ml-6 mt-1 space-y-1">
                        {item.subItems.map((subItem) => (
                          <a
                            key={subItem.name}
                            href={subItem.href}
                            className="flex items-center px-3 py-2 text-sm font-medium text-slate-600 rounded-md hover:bg-slate-100 hover:text-slate-900 transition-colors"
                          >
                            <subItem.icon className="mr-3 h-4 w-4" />
                            {subItem.name}
                          </a>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <a
                    href={item.href}
                    className="flex items-center px-3 py-2 text-sm font-medium text-slate-700 rounded-md hover:bg-slate-100 hover:text-slate-900 transition-colors"
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </a>
                )}
              </div>
            ))}
          </div>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200">
          <div className="flex items-center mb-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-blue-600">A</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-slate-900">Admin User</p>
              <p className="text-xs text-slate-500">admin@company.com</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-slate-600 hover:text-slate-900"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white shadow-sm border-b border-slate-200">
          <div className="flex items-center justify-between h-16 px-6">
            <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-500">
                {new Date().toLocaleDateString("en-IN", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
