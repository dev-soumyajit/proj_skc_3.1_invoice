"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, MoreHorizontal, Edit, Trash2, Eye, Package } from "lucide-react"

// Mock data for stock issues
const stockouts = [
  {
    issue_id: 1,
    issue_no: "ISS-2024-001",
    issue_date: "2024-02-16",
    product_name: "Steel Rods - 12mm",
    quantity: 500,
    unit: "KG",
    godown_name: "Main Warehouse",
    issued_to: "Production Department",
    purpose: "Manufacturing Order #MO-2024-045",
    status: "Completed",
    issued_by: "Warehouse Manager",
  },
  {
    issue_id: 2,
    issue_no: "ISS-2024-002",
    issue_date: "2024-02-15",
    product_name: "Chemical Compound X",
    quantity: 25,
    unit: "LTR",
    godown_name: "Chemical Storage",
    issued_to: "Quality Control",
    purpose: "Testing Batch #QC-2024-012",
    status: "Pending",
    issued_by: "Store Keeper",
  },
  {
    issue_id: 3,
    issue_no: "ISS-2024-003",
    issue_date: "2024-02-14",
    product_name: "Electronic Components",
    quantity: 100,
    unit: "SET",
    godown_name: "Electronics Warehouse",
    issued_to: "Assembly Line",
    purpose: "Production Order #PO-2024-089",
    status: "Completed",
    issued_by: "Inventory Supervisor",
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "Completed":
      return "bg-green-100 text-green-800"
    case "Pending":
      return "bg-yellow-100 text-yellow-800"
    case "Cancelled":
      return "bg-red-100 text-red-800"
    default:
      return "bg-slate-100 text-slate-800"
  }
}

export function StockoutsTable() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredStockouts, setFilteredStockouts] = useState(stockouts)

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    const filtered = stockouts.filter(
      (stockout) =>
        stockout.product_name.toLowerCase().includes(value.toLowerCase()) ||
        stockout.issue_no.toLowerCase().includes(value.toLowerCase()) ||
        stockout.issued_to.toLowerCase().includes(value.toLowerCase()),
    )
    setFilteredStockouts(filtered)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Issues</CardTitle>
        <CardDescription>Track all outgoing inventory and stock allocations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search stock issues..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Issue Details</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Issued To</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStockouts.map((stockout) => (
                <TableRow key={stockout.issue_id}>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-semibold text-slate-900">{stockout.issue_no}</div>
                      <div className="text-sm text-slate-500">{stockout.issue_date}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                        <Package className="h-4 w-4 text-slate-600" />
                      </div>
                      <div className="font-medium text-slate-900">{stockout.product_name}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">
                    <div>
                      <span className="font-semibold">{stockout.quantity.toLocaleString()}</span>
                      <span className="text-slate-500 ml-1">{stockout.unit}</span>
                    </div>
                  </TableCell>
                  <TableCell>{stockout.godown_name}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-slate-900">{stockout.issued_to}</div>
                      <div className="text-sm text-slate-500">By: {stockout.issued_by}</div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate text-slate-600">{stockout.purpose}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={getStatusColor(stockout.status)}>
                      {stockout.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Issue
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Cancel Issue
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredStockouts.length === 0 && (
          <div className="text-center py-8">
            <p className="text-slate-500">No stock issues found matching your search.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
