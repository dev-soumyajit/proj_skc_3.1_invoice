"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, MoreHorizontal, Edit, Trash2, Eye, FileText } from "lucide-react"

// Mock data
const purchases = [
  {
    purchase_id: 1,
    vendor_name: "Steel Industries Ltd",
    invoice_no: "SI-2024-001",
    invoice_date: "2024-02-15",
    invoice_amount: 125000.0,
    taxable_amt: 105932.2,
    cgst_amt: 9534.9,
    sgst_amt: 9534.9,
    igst_amt: 0.0,
    godown_name: "Main Warehouse",
    entry_date: "2024-02-15",
    status: "Received",
  },
  {
    purchase_id: 2,
    vendor_name: "Chemical Suppliers Co",
    invoice_no: "CS-2024-045",
    invoice_date: "2024-02-14",
    invoice_amount: 67500.0,
    taxable_amt: 60267.86,
    cgst_amt: 3616.07,
    sgst_amt: 3616.07,
    igst_amt: 0.0,
    godown_name: "Chemical Storage",
    entry_date: "2024-02-14",
    status: "Pending",
  },
  {
    purchase_id: 3,
    vendor_name: "Electronics Hub Pvt Ltd",
    invoice_no: "EH-2024-078",
    invoice_date: "2024-02-13",
    invoice_amount: 89200.0,
    taxable_amt: 75593.22,
    cgst_amt: 6803.39,
    sgst_amt: 6803.39,
    igst_amt: 0.0,
    godown_name: "Electronics Warehouse",
    entry_date: "2024-02-13",
    status: "Received",
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "Received":
      return "bg-green-100 text-green-800"
    case "Pending":
      return "bg-yellow-100 text-yellow-800"
    case "Cancelled":
      return "bg-red-100 text-red-800"
    default:
      return "bg-slate-100 text-slate-800"
  }
}

export function PurchasesTable() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredPurchases, setFilteredPurchases] = useState(purchases)

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    const filtered = purchases.filter(
      (purchase) =>
        purchase.vendor_name.toLowerCase().includes(value.toLowerCase()) ||
        purchase.invoice_no.toLowerCase().includes(value.toLowerCase()),
    )
    setFilteredPurchases(filtered)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Purchase Orders</CardTitle>
        <CardDescription>Track all incoming inventory and vendor transactions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search purchases..."
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
                <TableHead>Invoice Details</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Taxable Amount</TableHead>
                <TableHead>GST Amount</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPurchases.map((purchase) => (
                <TableRow key={purchase.purchase_id}>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-semibold text-slate-900">{purchase.invoice_no}</div>
                      <div className="text-sm text-slate-500">{purchase.invoice_date}</div>
                    </div>
                  </TableCell>
                  <TableCell>{purchase.vendor_name}</TableCell>
                  <TableCell>{purchase.godown_name}</TableCell>
                  <TableCell className="font-mono">
                    ₹{purchase.taxable_amt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="font-mono">
                    <div className="text-sm">
                      <div>CGST: ₹{purchase.cgst_amt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
                      <div>SGST: ₹{purchase.sgst_amt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
                      {purchase.igst_amt > 0 && (
                        <div>IGST: ₹{purchase.igst_amt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono font-semibold">
                    ₹{purchase.invoice_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={getStatusColor(purchase.status)}>
                      {purchase.status}
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
                          <FileText className="mr-2 h-4 w-4" />
                          View Invoice
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Purchase
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Cancel Purchase
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredPurchases.length === 0 && (
          <div className="text-center py-8">
            <p className="text-slate-500">No purchases found matching your search.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
