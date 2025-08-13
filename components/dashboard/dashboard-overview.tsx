"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Users, Package, FileText, TrendingUp, IndianRupee, ShoppingCart, AlertCircle } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer } from "recharts"

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
    <div className="space-y-4 sm:space-y-6">
      {/* Stats Grid - Responsive layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="min-w-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 truncate pr-2">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-slate-400 flex-shrink-0" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl sm:text-2xl font-bold text-slate-900 truncate">
                {stat.value}
              </div>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1 flex-shrink-0" />
                <span className="truncate">{stat.change} from last month</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section - Stack on mobile, side by side on desktop */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Revenue Trend Chart */}
        <Card className="col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Revenue Trend</CardTitle>
            <CardDescription className="text-sm">Monthly revenue and invoice count</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[250px] sm:h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyRevenueData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="month" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`}
                  />
                  <ChartTooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-3 border rounded-lg shadow-lg">
                            <p className="font-medium text-sm">{label}</p>
                            <p className="text-sm text-slate-600">
                              Revenue: ₹{payload[0].value?.toLocaleString()}
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* GST Breakdown */}
        <Card className="col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">GST Collection Breakdown</CardTitle>
            <CardDescription className="text-sm">Current month GST distribution</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[250px] sm:h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gstBreakdownData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
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
                            <p className="font-medium text-sm">{data.name}</p>
                            <p className="text-sm text-slate-600">₹{data.value.toLocaleString()}</p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legend for mobile */}
            <div className="grid grid-cols-2 gap-2 mt-4 sm:hidden">
              {gstBreakdownData.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-slate-600 truncate">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Top Customers */}
        <Card className="col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Top Customers by Revenue</CardTitle>
            <CardDescription className="text-sm">Highest revenue generating customers</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[250px] sm:h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={topCustomersData} 
                  layout="horizontal"
                  margin={{ top: 5, right: 10, left: 5, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    type="number" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={80}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <ChartTooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-3 border rounded-lg shadow-lg">
                            <p className="font-medium text-sm">{label}</p>
                            <p className="text-sm text-slate-600">
                              Revenue: ₹{payload[0].value?.toLocaleString()}
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Recent Activities</CardTitle>
            <CardDescription className="text-sm">Latest system activities and updates</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3 sm:space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <activity.icon className="h-4 w-4 text-slate-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-900 leading-relaxed">
                      {activity.description}
                    </p>
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
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
          <CardDescription className="text-sm">Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <button className="flex items-center justify-between p-3 sm:p-4 text-left border border-slate-200 rounded-lg hover:bg-slate-50 active:bg-slate-100 transition-colors touch-manipulation">
              <div className="flex items-center space-x-3 min-w-0">
                <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <span className="text-sm font-medium truncate">Create New Invoice</span>
              </div>
              <span className="text-xs text-slate-400 flex-shrink-0 ml-2">→</span>
            </button>

            <button className="flex items-center justify-between p-3 sm:p-4 text-left border border-slate-200 rounded-lg hover:bg-slate-50 active:bg-slate-100 transition-colors touch-manipulation">
              <div className="flex items-center space-x-3 min-w-0">
                <Users className="h-5 w-5 text-green-600 flex-shrink-0" />
                <span className="text-sm font-medium truncate">Add Customer</span>
              </div>
              <span className="text-xs text-slate-400 flex-shrink-0 ml-2">→</span>
            </button>

            <button className="flex items-center justify-between p-3 sm:p-4 text-left border border-slate-200 rounded-lg hover:bg-slate-50 active:bg-slate-100 transition-colors touch-manipulation sm:col-span-2 lg:col-span-1">
              <div className="flex items-center space-x-3 min-w-0">
                <Package className="h-5 w-5 text-purple-600 flex-shrink-0" />
                <span className="text-sm font-medium truncate">Manage Inventory</span>
              </div>
              <span className="text-xs text-slate-400 flex-shrink-0 ml-2">→</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}