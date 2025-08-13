import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { InvoicesTable } from "@/components/invoices/invoices-table"
import { Button } from "@/components/ui/button"
import { Plus, Download, Filter } from "lucide-react"

export default function InvoicesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Tax Invoices</h1>
            <p className="text-slate-600 mt-2">Generate and manage GST compliant invoices</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
          </div>
        </div>
        <InvoicesTable />
      </div>
    </DashboardLayout>
  )
}
