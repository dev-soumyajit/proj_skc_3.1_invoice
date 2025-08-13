import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ReturnsTable } from "@/components/inventory/returns-table"
import { Button } from "@/components/ui/button"
import { Plus, Download } from "lucide-react"

export default function ReturnsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Returns Management</h1>
            <p className="text-slate-600 mt-2">Process returns from purchases, sales, and stock issues</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Returns
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Process Return
            </Button>
          </div>
        </div>
        <ReturnsTable />
      </div>
    </DashboardLayout>
  )
}
