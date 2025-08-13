import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { CustomersTable } from "@/components/customers/customers-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function CustomersPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Customers</h1>
            <p className="text-slate-600 mt-2">Manage your customer database and GST details</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        </div>
        <CustomersTable />
      </div>
    </DashboardLayout>
  )
}
