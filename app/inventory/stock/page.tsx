import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { StockLevels } from "@/components/inventory/stock-levels"

export default function StockPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Stock Levels</h1>
          <p className="text-slate-600 mt-2">Monitor current inventory levels across all warehouses</p>
        </div>
        <StockLevels />
      </div>
    </DashboardLayout>
  )
}