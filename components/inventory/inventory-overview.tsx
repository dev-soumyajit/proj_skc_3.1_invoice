"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Package, Warehouse, TrendingDown, AlertTriangle } from "lucide-react"

// Mock data
const stockSummary = [
  {
    title: "Total Products",
    value: "1,429",
    change: "+12 this month",
    icon: Package,
  },
  {
    title: "Active Warehouses",
    value: "8",
    change: "All operational",
    icon: Warehouse,
  },
  {
    title: "Low Stock Items",
    value: "23",
    change: "Requires attention",
    icon: AlertTriangle,
  },
  {
    title: "Out of Stock",
    value: "5",
    change: "Critical items",
    icon: TrendingDown,
  },
]

const stockData = [
  {
    product_id: 1,
    product_name: "Steel Rods - 12mm",
    godown_name: "Main Warehouse",
    quantity: 2500,
    unit: "KG",
    status: "In Stock",
    last_updated: "2024-02-15",
  },
  {
    product_id: 2,
    product_name: "Chemical Compound X",
    godown_name: "Chemical Storage",
    quantity: 150,
    unit: "LTR",
    status: "Low Stock",
    last_updated: "2024-02-14",
  },
  {
    product_id: 3,
    product_name: "Electronic Components",
    godown_name: "Electronics Warehouse",
    quantity: 0,
    unit: "SET",
    status: "Out of Stock",
    last_updated: "2024-02-10",
  },
  {
    product_id: 4,
    product_name: "Finished Steel Pipes",
    godown_name: "Main Warehouse",
    quantity: 850,
    unit: "PCS",
    status: "In Stock",
    last_updated: "2024-02-16",
  },
]

const recentTransactions = [
  {
    id: 1,
    type: "Purchase",
    product: "Steel Rods - 12mm",
    quantity: "+500 KG",
    warehouse: "Main Warehouse",
    date: "2024-02-15",
    reference: "PO-2024-001",
  },
  {
    id: 2,
    type: "Issue",
    product: "Chemical Compound X",
    quantity: "-50 LTR",
    warehouse: "Chemical Storage",
    date: "2024-02-14",
    reference: "ISS-2024-045",
  },
  {
    id: 3,
    type: "Return",
    product: "Electronic Components",
    quantity: "+25 SET",
    warehouse: "Electronics Warehouse",
    date: "2024-02-13",
    reference: "RET-2024-012",
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "In Stock":
      return "bg-green-100 text-green-800"
    case "Low Stock":
      return "bg-yellow-100 text-yellow-800"
    case "Out of Stock":
      return "bg-red-100 text-red-800"
    default:
      return "bg-slate-100 text-slate-800"
  }
}

const getTransactionColor = (type: string) => {
  switch (type) {
    case "Purchase":
      return "bg-blue-100 text-blue-800"
    case "Issue":
      return "bg-orange-100 text-orange-800"
    case "Return":
      return "bg-green-100 text-green-800"
    default:
      return "bg-slate-100 text-slate-800"
  }
}

export function InventoryOverview() {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stockSummary.map((item) => (
          <Card key={item.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">{item.title}</CardTitle>
              <item.icon className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{item.value}</div>
              <p className="text-xs text-slate-500 mt-1">{item.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Inventory Tabs */}
      <Tabs defaultValue="stock" className="space-y-4">
        <TabsList>
          <TabsTrigger value="stock">Current Stock</TabsTrigger>
          <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
          <TabsTrigger value="warehouses">Warehouses</TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stock Levels</CardTitle>
              <CardDescription>Current inventory across all warehouses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Warehouse</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockData.map((item) => (
                      <TableRow key={item.product_id}>
                        <TableCell className="font-medium">{item.product_name}</TableCell>
                        <TableCell>{item.godown_name}</TableCell>
                        <TableCell className="font-mono">{item.quantity.toLocaleString()}</TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={getStatusColor(item.status)}>
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.last_updated}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            Update Stock
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest inventory movements and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Badge variant="secondary" className={getTransactionColor(transaction.type)}>
                        {transaction.type}
                      </Badge>
                      <div>
                        <div className="font-medium text-slate-900">{transaction.product}</div>
                        <div className="text-sm text-slate-500">
                          {transaction.warehouse} • {transaction.reference}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-slate-900">{transaction.quantity}</div>
                      <div className="text-sm text-slate-500">{transaction.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="warehouses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Warehouse Locations</CardTitle>
              <CardDescription>Manage your storage facilities and locations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Warehouse className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">Main Warehouse</div>
                      <div className="text-sm text-slate-500">Primary Storage</div>
                    </div>
                  </div>
                  <div className="text-sm text-slate-600">
                    <p>Industrial Area, Phase 1</p>
                    <p>Contact: +91 9876543210</p>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Warehouse className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">Chemical Storage</div>
                      <div className="text-sm text-slate-500">Specialized Storage</div>
                    </div>
                  </div>
                  <div className="text-sm text-slate-600">
                    <p>Chemical Complex, Sector 5</p>
                    <p>Contact: +91 9876543211</p>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Warehouse className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">Electronics Warehouse</div>
                      <div className="text-sm text-slate-500">Electronics Storage</div>
                    </div>
                  </div>
                  <div className="text-sm text-slate-600">
                    <p>Tech Park, Building A</p>
                    <p>Contact: +91 9876543212</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
