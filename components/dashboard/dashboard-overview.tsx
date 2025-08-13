"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Users, Package, FileText, TrendingUp, IndianRupee, ShoppingCart, AlertCircle } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, PieChart, Pie, Cell } from "recharts"

const stats = [
  {
    title: "Total Customers",
    value: "248",
    change: "+12%",
    changeType: "positive" as const,
    icon: Users,
  },
  {
    title: "Active Products",
    value: "1,429",
    change: "+3%",
    changeType: "positive" as const,
    icon: Package,
  },
  {
    title: "Monthly Invoices",
    value: "89",
    change: "+18%",
    changeType: "positive" as const,
    icon: FileText,
  },
  {
    title: "Revenue (₹)",
    value: "₹12,48,500",
    change: "+25%",
    changeType: "positive" as const,
    icon: IndianRupee,
  },
]

const monthlyRevenueData = [
  { month: "Jan", revenue: 850000, invoices: 65 },
  { month: "Feb", revenue: 920000, invoices: 72 },
  { month: "Mar", revenue: 1100000, invoices: 89 },
  { month: "Apr", revenue: 1248500, invoices: 95 },
  { month: "May", revenue: 1350000, invoices: 102 },
  { month: "Jun", revenue: 1180000, invoices: 88 },
]

const gstBreakdownData = [
  { name: "CGST", value: 156000, color: "#3b82f6" },
  { name: "SGST", value: 156000, color: "#10b981" },
  { name: "IGST", value: 89000, color: "#f59e0b" },
  { name: "CESS", value: 23000, color: "#ef4444" },
]

const topCustomersData = [
  { name: "ABC Corp", revenue: 285000, invoices: 12 },
  { name: "XYZ Industries", revenue: 245000, invoices: 8 },
  { name: "Tech Solutions", revenue: 198000, invoices: 15 },
  { name: "Global Traders", revenue: 167000, invoices: 6 },
  { name: "Prime Manufacturing", revenue: 142000, invoices: 9 },
]

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "#3b82f6",
  },
  invoices: {
    label: "Invoices",
    color: "#10b981",
  },
}

const recentActivities = [
  {
    id: 1,
    type: "invoice",
    description: "Invoice INV-2024-001 generated for ABC Corp",
    time: "2 hours ago",
    icon: FileText,
  },
  {
    id: 2,
    type: "purchase",
    description: "Purchase order received from XYZ Suppliers",
    time: "4 hours ago",
    icon: ShoppingCart,
  },
  {
    id: 3,
    type: "customer",
    description: "New customer registration: Tech Solutions Ltd",
    time: "6 hours ago",
    icon: Users,
  },
  {
    id: 4,
    type: "alert",
    description: "Low stock alert for Product SKU-12345",
    time: "8 hours ago",
    icon: AlertCircle,
  },
]

export function DashboardOverview() {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                {stat.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue and invoice count</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <LineChart data={monthlyRevenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-revenue)"
                  strokeWidth={2}
                  name="Revenue (₹)"
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* GST Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>GST Collection Breakdown</CardTitle>
            <CardDescription>Current month GST distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <PieChart>
                <Pie
                  data={gstBreakdownData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {gstBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="bg-white p-3 border rounded-lg shadow-lg">
                          <p className="font-medium">{data.name}</p>
                          <p className="text-sm text-slate-600">₹{data.value.toLocaleString()}</p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Customers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Customers by Revenue</CardTitle>
            <CardDescription>Highest revenue generating customers</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <BarChart data={topCustomersData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="revenue" fill="var(--color-revenue)" name="Revenue (₹)" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Latest system activities and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                    <activity.icon className="h-4 w-4 text-slate-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-900">{activity.description}</p>
                    <p className="text-xs text-slate-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <button className="flex items-center justify-between p-3 text-left border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium">Create New Invoice</span>
              </div>
              <span className="text-xs text-slate-400">→</span>
            </button>

            <button className="flex items-center justify-between p-3 text-left border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">Add Customer</span>
              </div>
              <span className="text-xs text-slate-400">→</span>
            </button>

            <button className="flex items-center justify-between p-3 text-left border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="flex items-center space-x-3">
                <Package className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium">Manage Inventory</span>
              </div>
              <span className="text-xs text-slate-400">→</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
