import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { CreateInvoiceForm } from "@/components/invoices/create-invoice-form"

export default function CreateInvoicePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Create Tax Invoice</h1>
          <p className="text-slate-600 mt-2">Generate a new GST compliant invoice</p>
        </div>
        <CreateInvoiceForm />
      </div>
    </DashboardLayout>
  )
}
