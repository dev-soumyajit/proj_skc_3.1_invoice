import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { VendorsTable } from "@/components/vendors/vendors-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function VendorsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Vendors</h1>
            <p className="text-slate-600 mt-2">Manage your supplier and vendor information</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Vendor
          </Button>
        </div>
        <VendorsTable />
      </div>
    </DashboardLayout>
  )
}
