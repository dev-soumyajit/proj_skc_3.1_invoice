import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { InventoryOverview } from "@/components/inventory/inventory-overview"
import { Button } from "@/components/ui/button"
import { Plus, Download } from "lucide-react"

export default function InventoryPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Inventory Management</h1>
            <p className="text-slate-600 mt-2">Track stock levels, purchases, and warehouse operations</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Stock Entry
            </Button>
          </div>
        </div>
        <InventoryOverview />
      </div>
    </DashboardLayout>
  )
}
