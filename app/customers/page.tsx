// app/customers/page.tsx
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { CustomersTable } from "@/components/customers/customers-table"

export default function CustomersPage() {
  return (
    <DashboardLayout>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Customers</h1>
            <p className="text-slate-600 mt-1">Manage your customer database and GST details</p>
          </div>
        </div>
        <CustomersTable />
      </div>
    </DashboardLayout>
  )
}