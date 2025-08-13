"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, MoreHorizontal, Edit, Trash2, Eye, RotateCcw } from "lucide-react"

// Mock data for returns
const returns = [
  {
    return_id: 1,
    return_no: "RET-2024-001",
    return_date: "2024-02-16",
    reference_type: "purchase",
    reference_no: "PO-2024-001",
    product_name: "Steel Rods - 12mm",
    return_quantity: 50,
    unit: "KG",
    reason: "Quality issues - surface defects",
    status: "Processed",
    returned_by: "Quality Inspector",
    warehouse: "Main Warehouse",
  },
  {
    return_id: 2,
    return_no: "RET-2024-002",
    return_date: "2024-02-15",
    reference_type: "stockout",
    reference_no: "ISS-2024-001",
    product_name: "Chemical Compound X",
    return_quantity: 5,
    unit: "LTR",
    reason: "Excess material from production",
    status: "Pending",
    returned_by: "Production Manager",
    warehouse: "Chemical Storage",
  },
  {
    return_id: 3,
    return_no: "RET-2024-003",
    return_date: "2024-02-14",
    reference_type: "invoice",
    reference_no: "INV-2024-001",
    product_name: "Electronic Components",
    return_quantity: 25,
    unit: "SET",
    reason: "Customer return - wrong specifications",
    status: "Processed",
    returned_by: "Sales Manager",
    warehouse: "Electronics Warehouse",
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "Processed":
      return "bg-green-100 text-green-800"
    case "Pending":
      return "bg-yellow-100 text-yellow-800"
    case "Rejected":
      return "bg-red-100 text-red-800"
    default:
      return "bg-slate-100 text-slate-800"
  }
}

const getReferenceTypeColor = (type: string) => {
  switch (type) {
    case "purchase":
      return "bg-blue-100 text-blue-800"
    case "stockout":
      return "bg-orange-100 text-orange-800"
    case "invoice":
      return "bg-purple-100 text-purple-800"
    default:
      return "bg-slate-100 text-slate-800"
  }
}

export function ReturnsTable() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredReturns, setFilteredReturns] = useState(returns)

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    const filtered = returns.filter(
      (returnItem) =>
        returnItem.product_name.toLowerCase().includes(value.toLowerCase()) ||
        returnItem.return_no.toLowerCase().includes(value.toLowerCase()) ||
        returnItem.reference_no.toLowerCase().includes(value.toLowerCase()),
    )
    setFilteredReturns(filtered)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Returns Processing</CardTitle>
        <CardDescription>Manage returns from purchases, sales, and stock issues</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search returns..."
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
                <TableHead>Return Details</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReturns.map((returnItem) => (
                <TableRow key={returnItem.return_id}>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-semibold text-slate-900">{returnItem.return_no}</div>
                      <div className="text-sm text-slate-500">{returnItem.return_date}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <Badge variant="secondary" className={getReferenceTypeColor(returnItem.reference_type)}>
                        {returnItem.reference_type}
                      </Badge>
                      <div className="text-sm text-slate-600 mt-1">{returnItem.reference_no}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                        <RotateCcw className="h-4 w-4 text-slate-600" />
                      </div>
                      <div className="font-medium text-slate-900">{returnItem.product_name}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">
                    <div>
                      <span className="font-semibold">{returnItem.return_quantity.toLocaleString()}</span>
                      <span className="text-slate-500 ml-1">{returnItem.unit}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-slate-900">{returnItem.warehouse}</div>
                      <div className="text-sm text-slate-500">By: {returnItem.returned_by}</div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate text-slate-600">{returnItem.reason}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={getStatusColor(returnItem.status)}>
                      {returnItem.status}
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
                          Edit Return
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Cancel Return
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredReturns.length === 0 && (
          <div className="text-center py-8">
            <p className="text-slate-500">No returns found matching your search.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
