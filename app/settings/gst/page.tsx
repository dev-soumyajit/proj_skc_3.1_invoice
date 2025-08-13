import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { GSTSettingsForm } from "@/components/settings/gst-settings-form"

export default function GSTSettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">GST Settings</h1>
          <p className="text-slate-600 mt-2">Configure GST API integration and company details</p>
        </div>
        <GSTSettingsForm />
      </div>
    </DashboardLayout>
  )
}
