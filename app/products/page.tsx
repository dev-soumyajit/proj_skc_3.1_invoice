// app/products/page.tsx (Updated)
// app/products/page.tsx
"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProductManagementDashboard } from "@/components/products/product-management-dashboard"

export default function ProductsPage() {
  return (
    <DashboardLayout>
      <ProductManagementDashboard />
    </DashboardLayout>
  )
}