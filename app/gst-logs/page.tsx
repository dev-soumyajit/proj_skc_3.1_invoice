import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { GSTLogsTable } from "@/components/gst/gst-logs-table"
import { Button } from "@/components/ui/button"
import { Download, Filter, RefreshCw } from "lucide-react"

export default function GSTLogsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">GST API Logs</h1>
            <p className="text-slate-600 mt-2">Monitor GST e-invoicing API transactions and responses</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Logs
            </Button>
          </div>
        </div>
        <GSTLogsTable />
      </div>
    </DashboardLayout>
  )
}
