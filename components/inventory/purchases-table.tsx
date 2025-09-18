"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, MoreHorizontal, Edit, Trash2, Eye, FileText, Plus, Filter } from "lucide-react"
import { useRouter } from "next/navigation"

interface Purchase {
  purchase_id: number
  vendor_name: string
  vendor_person_name: string
  invoice_no: string
  invoice_date: string
  invoice_amount: number
  taxable_amt: number
  cgst_amt: number
  sgst_amt: number
  igst_amt: number
  godown_name: string
  status: string
  items?: PurchaseItem[]
}

interface PurchaseItem {
  detail_id: number
  product_id: number
  product_name: string
  quantity: number
  unit_name: string
  hsn_sac_code: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "received":
      return "bg-green-100 text-green-800"
    case "pending":
      return "bg-yellow-100 text-yellow-800"
    case "cancelled":
      return "bg-red-100 text-red-800"
    default:
      return "bg-slate-100 text-slate-800"
  }
}

export function PurchasesTable() {
  const router = useRouter()
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })

  const fetchPurchases = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: searchTerm,
        status: statusFilter
      })

      const response = await fetch(`/api/purchases?${params}`)
      const data = await response.json()

      if (data.success) {
        setPurchases(data.data)
        setPagination(data.pagination)
      } else {
        console.error('Error fetching purchases:', data.error)
      }
    } catch (error) {
      console.error('Error fetching purchases:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPurchases()
  }, [pagination.page, searchTerm, statusFilter])

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value === "all" ? "" : value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const handleViewPurchase = (purchaseId: number) => {
    router.push(`/inventory/purchases/${purchaseId}`)
  }

  const handleCreatePurchase = () => {
    router.push('/inventory/purchases/create')
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-slate-500">Loading purchases...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search purchases..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter || "all"} onValueChange={handleStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="received">Received</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleCreatePurchase}>
          <Plus className="mr-2 h-4 w-4" />
          Create Purchase
        </Button>
      </div>

      {/* Purchases Table */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Orders</CardTitle>
          <CardDescription>
            Track all incoming inventory and vendor transactions ({pagination.total} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                {purchases.map((purchase) => (
                  <TableRow key={purchase.purchase_id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-semibold text-slate-900">{purchase.invoice_no}</div>
                        <div className="text-sm text-slate-500">
                          {new Date(purchase.invoice_date).toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-slate-900">{purchase.vendor_name}</div>
                        <div className="text-sm text-slate-500">{purchase.vendor_person_name}</div>
                      </div>
                    </TableCell>
                    <TableCell>{purchase.godown_name}</TableCell>
                    <TableCell className="font-mono">
                      ₹{purchase.taxable_amt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="font-mono">
                      <div className="text-sm">
                        {purchase.cgst_amt > 0 && (
                          <div>CGST: ₹{purchase.cgst_amt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
                        )}
                        {purchase.sgst_amt > 0 && (
                          <div>SGST: ₹{purchase.sgst_amt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
                        )}
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
                          <DropdownMenuItem onClick={() => handleViewPurchase(purchase.purchase_id)}>
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

          {purchases.length === 0 && (
            <div className="text-center py-8">
              <p className="text-slate-500">No purchases found matching your criteria.</p>
              <Button onClick={handleCreatePurchase} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Create First Purchase
              </Button>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-slate-500">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} purchases
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <div className="text-sm text-slate-500">
                  Page {pagination.page} of {pagination.pages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}