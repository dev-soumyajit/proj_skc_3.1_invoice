import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { StockoutsTable } from "@/components/inventory/stockouts-table"
import { Button } from "@/components/ui/button"
import { Plus, Download } from "lucide-react"

export default function StockoutsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Stock Issues</h1>
            <p className="text-slate-600 mt-2">Track outgoing inventory and stock allocations</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Issues
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Issue Stock
            </Button>
          </div>
        </div>
        <StockoutsTable />
      </div>
    </DashboardLayout>
  )
}
