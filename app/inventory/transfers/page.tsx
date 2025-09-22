import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { StockTransfers } from "@/components/inventory/stock-transfers"

export default function TransfersPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Stock Transfers</h1>
          <p className="text-slate-600 mt-2">Transfer inventory between warehouses</p>
        </div>
        <StockTransfers />
      </div>
    </DashboardLayout>
  )
}