"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, MoreHorizontal, Edit, Trash2, Eye, FileText, Download, Send } from "lucide-react"

// Mock data for invoices
const invoices = [
  {
    invoice_id: 1,
    invoice_no: "INV-2024-001",
    invoice_date: "2024-02-16",
    customer_company_name: "ABC Technologies Pvt Ltd",
    buyer_gstin: "27AABCU9603R1ZX",
    supply_type: "B2B",
    grand_total_qty: 500.0,
    grand_total_taxable_amt: 105932.2,
    grand_total_cgst_amt: 9534.9,
    grand_total_sgst_amt: 9534.9,
    grand_total_amt: 125000.0,
    status: "generated",
    irn: "1234567890123456789012345678901234567890123456789012345678901234",
    ack_no: "112010054812345",
    created_at: "2024-02-16T10:30:00Z",
  },
  {
    invoice_id: 2,
    invoice_no: "INV-2024-002",
    invoice_date: "2024-02-15",
    customer_company_name: "XYZ Exports Ltd",
    buyer_gstin: "06AABCU9603R1ZY",
    supply_type: "Export",
    grand_total_qty: 250.0,
    grand_total_taxable_amt: 67500.0,
    grand_total_cgst_amt: 0.0,
    grand_total_sgst_amt: 0.0,
    grand_total_amt: 67500.0,
    status: "draft",
    irn: null,
    ack_no: null,
    created_at: "2024-02-15T14:20:00Z",
  },
  {
    invoice_id: 3,
    invoice_no: "INV-2024-003",
    invoice_date: "2024-02-14",
    customer_company_name: "SEZ Manufacturing Co",
    buyer_gstin: "24AABCU9603R1ZZ",
    supply_type: "SEZWP",
    grand_total_qty: 750.0,
    grand_total_taxable_amt: 89200.0,
    grand_total_cgst_amt: 8028.0,
    grand_total_sgst_amt: 8028.0,
    grand_total_amt: 105256.0,
    status: "submitted",
    irn: "9876543210987654321098765432109876543210987654321098765432109876",
    ack_no: "112010054812346",
    created_at: "2024-02-14T09:15:00Z",
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "draft":
      return "bg-slate-100 text-slate-800"
    case "generated":
      return "bg-blue-100 text-blue-800"
    case "submitted":
      return "bg-green-100 text-green-800"
    case "cancelled":
      return "bg-red-100 text-red-800"
    default:
      return "bg-slate-100 text-slate-800"
  }
}

const getSupplyTypeColor = (type: string) => {
  switch (type) {
    case "B2B":
      return "bg-blue-100 text-blue-800"
    case "Export":
      return "bg-purple-100 text-purple-800"
    case "SEZWP":
      return "bg-green-100 text-green-800"
    case "SEZWOP":
      return "bg-yellow-100 text-yellow-800"
    default:
      return "bg-slate-100 text-slate-800"
  }
}

export function InvoicesTable() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredInvoices, setFilteredInvoices] = useState(invoices)

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    const filtered = invoices.filter(
      (invoice) =>
        invoice.invoice_no.toLowerCase().includes(value.toLowerCase()) ||
        invoice.customer_company_name.toLowerCase().includes(value.toLowerCase()) ||
        invoice.buyer_gstin.toLowerCase().includes(value.toLowerCase()),
    )
    setFilteredInvoices(filtered)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tax Invoices</CardTitle>
        <CardDescription>Manage GST compliant invoices and e-invoice submissions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search invoices..."
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
                <TableHead>Customer</TableHead>
                <TableHead>Supply Type</TableHead>
                <TableHead>Taxable Amount</TableHead>
                <TableHead>GST Amount</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.invoice_id}>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-semibold text-slate-900">{invoice.invoice_no}</div>
                      <div className="text-sm text-slate-500">{invoice.invoice_date}</div>
                      {invoice.irn && (
                        <div className="text-xs text-green-600 mt-1">IRN: {invoice.irn.substring(0, 20)}...</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-slate-900">{invoice.customer_company_name}</div>
                      <div className="text-sm text-slate-500 font-mono">{invoice.buyer_gstin}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={getSupplyTypeColor(invoice.supply_type)}>
                      {invoice.supply_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono">
                    ₹{invoice.grand_total_taxable_amt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="font-mono">
                    <div className="text-sm">
                      {invoice.grand_total_cgst_amt > 0 && (
                        <>
                          <div>
                            CGST: ₹{invoice.grand_total_cgst_amt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </div>
                          <div>
                            SGST: ₹{invoice.grand_total_sgst_amt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </div>
                        </>
                      )}
                      {invoice.grand_total_cgst_amt === 0 && <div className="text-slate-500">Export/Zero-rated</div>}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono font-semibold">
                    ₹{invoice.grand_total_amt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={getStatusColor(invoice.status)}>
                      {invoice.status}
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
                          View Invoice
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" />
                          Download PDF
                        </DropdownMenuItem>
                        {invoice.status === "draft" && (
                          <>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Invoice
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Send className="mr-2 h-4 w-4" />
                              Submit to GST
                            </DropdownMenuItem>
                          </>
                        )}
                        {invoice.status === "generated" && (
                          <DropdownMenuItem>
                            <Send className="mr-2 h-4 w-4" />
                            Submit to GST
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem>
                          <FileText className="mr-2 h-4 w-4" />
                          View GST Logs
                        </DropdownMenuItem>
                        {invoice.status !== "cancelled" && (
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Cancel Invoice
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredInvoices.length === 0 && (
          <div className="text-center py-8">
            <p className="text-slate-500">No invoices found matching your search.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
