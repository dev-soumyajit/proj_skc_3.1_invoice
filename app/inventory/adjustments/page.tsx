import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { StockAdjustments } from "@/components/inventory/stock-adjustments"

export default function AdjustmentsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Stock Adjustments</h1>
          <p className="text-slate-600 mt-2">Record physical counts and adjust inventory levels</p>
        </div>
        <StockAdjustments />
      </div>
    </DashboardLayout>
  )
}