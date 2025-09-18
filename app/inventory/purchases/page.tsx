import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PurchasesTable } from "@/components/inventory/purchases-table"
import { Button } from "@/components/ui/button"
import { Plus, Download } from "lucide-react"

export default function PurchasesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Purchase Orders</h1>
            <p className="text-slate-600 mt-2">Track and manage incoming inventory from vendors</p>
          </div>
          {/* <div className="flex items-center space-x-2">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Purchases
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Purchase
            </Button>
          </div> */}
        </div>
        <PurchasesTable />
      </div>
    </DashboardLayout>
  )
}
