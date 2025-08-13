import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { InvoiceDetail } from "@/components/invoices/invoice-detail"

interface InvoiceDetailPageProps {
  params: {
    id: string
  }
}

export default function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  return (
    <DashboardLayout>
      <InvoiceDetail invoiceId={params.id} />
    </DashboardLayout>
  )
}
