import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { DashboardOverview } from "@/components/dashboard/dashboard-overview"

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-2">Welcome to your GST Invoice Management System</p>
        </div>
        <DashboardOverview />
      </div>
    </DashboardLayout>
  )
}
