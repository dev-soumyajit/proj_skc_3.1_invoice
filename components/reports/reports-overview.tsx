"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, TrendingUp, Users, Package, IndianRupee } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, PieChart, Pie, Cell } from "recharts"

// Mock data for reports
const salesReportData = [
  { month: "Jan", sales: 850000, profit: 127500, orders: 65 },
  { month: "Feb", sales: 920000, profit: 138000, orders: 72 },
  { month: "Mar", sales: 1100000, profit: 165000, orders: 89 },
  { month: "Apr", sales: 1248500, profit: 187275, orders: 95 },
  { month: "May", sales: 1350000, profit: 202500, orders: 102 },
  { month: "Jun", sales: 1180000, profit: 177000, orders: 88 },
]

const gstReportData = [
  { month: "Jan", cgst: 42500, sgst: 42500, igst: 25500, total: 110500 },
  { month: "Feb", cgst: 46000, sgst: 46000, igst: 27600, total: 119600 },
  { month: "Mar", cgst: 55000, sgst: 55000, igst: 33000, total: 143000 },
  { month: "Apr", cgst: 62425, sgst: 62425, igst: 37455, total: 162305 },
  { month: "May", cgst: 67500, sgst: 67500, igst: 40500, total: 175500 },
  { month: "Jun", cgst: 59000, sgst: 59000, igst: 35400, total: 153400 },
]

const inventoryReportData = [
  { category: "Raw Materials", value: 2850000, percentage: 45 },
  { category: "Finished Goods", value: 1900000, percentage: 30 },
  { category: "Work in Progress", value: 950000, percentage: 15 },
  { category: "Consumables", value: 633000, percentage: 10 },
]

const topProductsData = [
  { product: "Steel Rods - 12mm", revenue: 485000, quantity: 2500, profit: 72750 },
  { product: "Chemical Compound X", revenue: 320000, quantity: 800, profit: 48000 },
  { product: "Electronic Components", revenue: 275000, quantity: 150, profit: 41250 },
  { product: "Finished Steel Pipes", revenue: 198000, quantity: 850, profit: 29700 },
  { product: "Industrial Chemicals", revenue: 167000, quantity: 450, profit: 25050 },
]

const customerAnalyticsData = [
  { segment: "Enterprise", customers: 45, revenue: 5200000, avgOrder: 115556 },
  { segment: "SME", customers: 128, revenue: 3800000, avgOrder: 29688 },
  { segment: "Retail", customers: 75, revenue: 1200000, avgOrder: 16000 },
]

const chartConfig = {
  sales: { label: "Sales", color: "#3b82f6" },
  profit: { label: "Profit", color: "#10b981" },
  cgst: { label: "CGST", color: "#3b82f6" },
  sgst: { label: "SGST", color: "#10b981" },
  igst: { label: "IGST", color: "#f59e0b" },
}

export function ReportsOverview() {
  return (
    <div className="space-y-6">
      {/* Report Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Sales</CardTitle>
            <IndianRupee className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">₹64.48L</div>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +18.2% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">GST Collected</CardTitle>
            <FileText className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">₹8.64L</div>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +15.7% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">248</div>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +12 new this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Inventory Value</CardTitle>
            <Package className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">₹63.33L</div>
            <p className="text-xs text-slate-500 mt-1">Across all warehouses</p>
          </CardContent>
        </Card>
      </div>

      {/* Reports Tabs */}
      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="sales">Sales Report</TabsTrigger>
          <TabsTrigger value="gst">GST Report</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Report</TabsTrigger>
          <TabsTrigger value="products">Product Analysis</TabsTrigger>
          <TabsTrigger value="customers">Customer Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Sales Performance</CardTitle>
                  <CardDescription>Monthly sales and profit trends</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <LineChart data={salesReportData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="sales"
                      stroke="var(--color-sales)"
                      strokeWidth={2}
                      name="Sales (₹)"
                    />
                    <Line
                      type="monotone"
                      dataKey="profit"
                      stroke="var(--color-profit)"
                      strokeWidth={2}
                      name="Profit (₹)"
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sales Summary</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm font-medium">Total Revenue</span>
                    <span className="text-lg font-bold text-slate-900">₹64,48,500</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm font-medium">Total Profit</span>
                    <span className="text-lg font-bold text-green-600">₹9,67,275</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm font-medium">Profit Margin</span>
                    <span className="text-lg font-bold text-blue-600">15.0%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm font-medium">Total Orders</span>
                    <span className="text-lg font-bold text-slate-900">511</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="gst" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>GST Collection Report</CardTitle>
                <CardDescription>Monthly GST breakdown and compliance</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export GST Report
              </Button>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[400px]">
                <BarChart data={gstReportData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="cgst" fill="var(--color-cgst)" name="CGST" />
                  <Bar dataKey="sgst" fill="var(--color-sgst)" name="SGST" />
                  <Bar dataKey="igst" fill="var(--color-igst)" name="IGST" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Distribution</CardTitle>
                <CardDescription>Value distribution by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <PieChart>
                    <Pie
                      data={inventoryReportData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                    >
                      {inventoryReportData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${index * 90}, 70%, 50%)`} />
                      ))}
                    </Pie>
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="bg-white p-3 border rounded-lg shadow-lg">
                              <p className="font-medium">{data.category}</p>
                              <p className="text-sm text-slate-600">₹{data.value.toLocaleString()}</p>
                              <p className="text-sm text-slate-600">{data.percentage}%</p>
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

            <Card>
              <CardHeader>
                <CardTitle>Inventory Summary</CardTitle>
                <CardDescription>Current stock valuation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {inventoryReportData.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <span className="font-medium">{item.category}</span>
                        <p className="text-sm text-slate-500">{item.percentage}% of total</p>
                      </div>
                      <span className="font-bold text-slate-900">₹{item.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Top Performing Products</CardTitle>
                <CardDescription>Revenue and profitability analysis</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Quantity Sold</TableHead>
                    <TableHead>Profit</TableHead>
                    <TableHead>Margin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProductsData.map((product, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{product.product}</TableCell>
                      <TableCell>₹{product.revenue.toLocaleString()}</TableCell>
                      <TableCell>{product.quantity.toLocaleString()}</TableCell>
                      <TableCell className="text-green-600">₹{product.profit.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          {((product.profit / product.revenue) * 100).toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Customer Segmentation Analysis</CardTitle>
                <CardDescription>Revenue distribution by customer segments</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Segment</TableHead>
                    <TableHead>Customers</TableHead>
                    <TableHead>Total Revenue</TableHead>
                    <TableHead>Avg Order Value</TableHead>
                    <TableHead>Contribution</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerAnalyticsData.map((segment, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{segment.segment}</TableCell>
                      <TableCell>{segment.customers}</TableCell>
                      <TableCell>₹{segment.revenue.toLocaleString()}</TableCell>
                      <TableCell>₹{segment.avgOrder.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          {((segment.revenue / 10200000) * 100).toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
