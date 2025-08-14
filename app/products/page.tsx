// app/products/page.tsx (Updated)
"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProductsTable } from "@/components/products/products-table"

export default function ProductsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Products</h1>
            <p className="text-slate-600 mt-2">Manage your product catalog with HSN codes and pricing</p>
          </div>
        </div>
        <ProductsTable />
      </div>
    </DashboardLayout>
  )
}