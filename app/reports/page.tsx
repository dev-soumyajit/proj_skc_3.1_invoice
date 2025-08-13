import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ReportsOverview } from "@/components/reports/reports-overview"

export default function ReportsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Reports & Analytics</h1>
          <p className="text-slate-600 mt-2">Comprehensive business reports and insights</p>
        </div>
        <ReportsOverview />
      </div>
    </DashboardLayout>
  )
}
