"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Search, Plus, MoreHorizontal, Eye, Check, Truck, ArrowRight } from "lucide-react"
import { toast } from "sonner"

interface StockTransfer {
  transfer_id: number
  transfer_no: string
  transfer_date: string
  status: string
  total_items: number
  from_godown: string
  to_godown: string
  transferred_by_name: string
  received_by_name?: string
  transfer_notes?: string
  received_notes?: string
  created_at: string
  updated_at: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800"
    case "in_transit":
      return "bg-blue-100 text-blue-800"
    case "draft":
      return "bg-yellow-100 text-yellow-800"
    case "cancelled":
      return "bg-red-100 text-red-800"
    default:
      return "bg-slate-100 text-slate-800"
  }
}

export function StockTransfers() {
  const [transfers, setTransfers] = useState<StockTransfer[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("")
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [godowns, setGodowns] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [productSearch, setProductSearch] = useState("")

  // Form state for new transfer
  const [formData, setFormData] = useState({
    transfer_date: new Date().toISOString().split('T')[0],
    from_godown_id: "",
    to_godown_id: "",
    transfer_notes: ""
  })
  const [transferItems, setTransferItems] = useState<any[]>([])

  useEffect(() => {
    fetchTransfers()
    fetchGodowns()
  }, [pagination.page, statusFilter])

  useEffect(() => {
    if (productSearch.length >= 2) {
      searchProducts()
    } else {
      setProducts([])
    }
  }, [productSearch])

  const fetchTransfers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })

      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      const response = await fetch(`/api/stock/transfers?${params}`)
      const data = await response.json()

      if (data.success) {
        setTransfers(data.data)
        setPagination(data.pagination)
      } else {
        toast.error(data.error || 'Failed to fetch transfers')
      }
    } catch (error) {
      console.error('Error fetching transfers:', error)
      toast.error('Failed to fetch transfers')
    } finally {
      setLoading(false)
    }
  }

  const fetchGodowns = async () => {
    try {
      const response = await fetch('/api/godowns')
      const data = await response.json()
      if (data.success) {
        setGodowns(data.data)
      }
    } catch (error) {
      console.error('Error fetching godowns:', error)
    }
  }

  const searchProducts = async () => {
    try {
      const response = await fetch(`/api/products/search?search=${encodeURIComponent(productSearch)}&limit=10`)
      const data = await response.json()
      if (data.success) {
        setProducts(data.data)
      }
    } catch (error) {
      console.error('Error searching products:', error)
    }
  }

  const addProductToTransfer = (product: any) => {
    // Check if product already exists
    const existingItem = transferItems.find(item => item.product_id === product.product_id)
    if (existingItem) {
      toast.error("Product already added")
      return
    }

    const newItem = {
      product_id: product.product_id,
      product_name: product.product_name,
      unit_name: product.unit_name,
      quantity: 1,
      unit_cost: product.rate || 0,
      remarks: ""
    }

    setTransferItems([...transferItems, newItem])
    setProductSearch("")
    setProducts([])
  }

  const updateTransferItem = (index: number, field: string, value: any) => {
    const updatedItems = [...transferItems]
    updatedItems[index][field] = value
    setTransferItems(updatedItems)
  }

  const removeTransferItem = (index: number) => {
    setTransferItems(transferItems.filter((_, i) => i !== index))
  }

  const handleCreateTransfer = async () => {
    try {
      if (!formData.from_godown_id || !formData.to_godown_id || transferItems.length === 0) {
        toast.error("Please select warehouses and add at least one product")
        return
      }

      if (formData.from_godown_id === formData.to_godown_id) {
        toast.error("Source and destination warehouses must be different")
        return
      }

      const response = await fetch('/api/stock/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          items: transferItems
        })
      })

      const data = await response.json()
      if (data.success) {
        toast.success("Stock transfer created successfully")
        setShowCreateDialog(false)
        resetForm()
        fetchTransfers()
      } else {
        toast.error(data.error || "Failed to create transfer")
      }
    } catch (error) {
      console.error('Error creating transfer:', error)
      toast.error("Failed to create transfer")
    }
  }

  const handleCompleteTransfer = async (transferId: number) => {
    try {
      const response = await fetch(`/api/stock/transfers/${transferId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          received_by: 1,
          received_notes: "Transfer completed"
        })
      })

      const data = await response.json()
      if (data.success) {
        toast.success("Stock transfer completed")
        fetchTransfers()
      } else {
        toast.error(data.error || "Failed to complete transfer")
      }
    } catch (error) {
      console.error('Error completing transfer:', error)
      toast.error("Failed to complete transfer")
    }
  }

  const resetForm = () => {
    setFormData({
      transfer_date: new Date().toISOString().split('T')[0],
      from_godown_id: "",
      to_godown_id: "",
      transfer_notes: ""
    })
    setTransferItems([])
    setProductSearch("")
  }

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  if (loading && transfers.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-slate-500">Loading transfers...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={statusFilter || "all"} onValueChange={handleStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="in_transit">In Transit</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Transfer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Stock Transfer</DialogTitle>
              <DialogDescription>
                Transfer inventory between warehouses
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Transfer Date</Label>
                  <Input
                    type="date"
                    value={formData.transfer_date}
                    onChange={(e) => setFormData({...formData, transfer_date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>From Warehouse</Label>
                  <Select
                    value={formData.from_godown_id}
                    onValueChange={(value) => setFormData({...formData, from_godown_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select source warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {godowns.map((godown) => (
                        <SelectItem key={godown.godown_id} value={godown.godown_id.toString()}>
                          {godown.godown_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>To Warehouse</Label>
                  <Select
                    value={formData.to_godown_id}
                    onValueChange={(value) => setFormData({...formData, to_godown_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select destination warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {godowns.filter(g => g.godown_id.toString() !== formData.from_godown_id).map((godown) => (
                        <SelectItem key={godown.godown_id} value={godown.godown_id.toString()}>
                          {godown.godown_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Transfer Notes</Label>
                  <Input
                    value={formData.transfer_notes}
                    onChange={(e) => setFormData({...formData, transfer_notes: e.target.value})}
                    placeholder="Transfer notes"
                  />
                </div>
              </div>

              {/* Product Search */}
              <div className="space-y-2">
                <Label>Add Products</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search products to transfer..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-10"
                  />
                  
                  {/* Search Results */}
                  {products.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {products.map((product) => (
                        <div
                          key={product.product_id}
                          className="p-3 hover:bg-slate-50 cursor-pointer border-b last:border-b-0"
                          onClick={() => addProductToTransfer(product)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{product.product_name}</div>
                              <div className="text-sm text-slate-500">
                                {product.product_code && `${product.product_code} • `}
                                {product.hsn_sac_code}
                              </div>
                            </div>
                            <div className="text-sm text-slate-500">{product.unit_name}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Transfer Items */}
              {transferItems.length > 0 && (
                <div className="space-y-2">
                  <Label>Products to Transfer</Label>
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit Cost</TableHead>
                          <TableHead>Remarks</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transferItems.map((item, index) => (
                          <TableRow key={item.product_id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{item.product_name}</div>
                                <div className="text-sm text-slate-500">{item.unit_name}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.001"
                                min="0.001"
                                value={item.quantity}
                                onChange={(e) => updateTransferItem(index, 'quantity', parseFloat(e.target.value) || 1)}
                                className="w-24"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.01"
                                value={item.unit_cost}
                                onChange={(e) => updateTransferItem(index, 'unit_cost', parseFloat(e.target.value) || 0)}
                                className="w-24"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={item.remarks}
                                onChange={(e) => updateTransferItem(index, 'remarks', e.target.value)}
                                placeholder="Notes"
                                className="w-32"
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeTransferItem(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                Remove
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTransfer}>
                  Create Transfer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Transfers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Transfers</CardTitle>
          <CardDescription>
            Inter-warehouse inventory transfers ({pagination.total} records)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transfer Details</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Transferred By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transfers.map((transfer) => (
                  <TableRow key={transfer.transfer_id}>
                    <TableCell>
                      <div>
                        <div className="font-semibold text-slate-900">{transfer.transfer_no}</div>
                        <div className="text-sm text-slate-500">
                          {new Date(transfer.transfer_date).toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{transfer.from_godown}</span>
                        <ArrowRight className="h-4 w-4 text-slate-400" />
                        <span className="text-sm font-medium">{transfer.to_godown}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{transfer.total_items}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getStatusColor(transfer.status)}>
                        {transfer.status === 'in_transit' && <Truck className="mr-1 h-3 w-3" />}
                        {transfer.status.charAt(0).toUpperCase() + transfer.status.slice(1).replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm font-medium">{transfer.transferred_by_name}</div>
                        {transfer.received_by_name && (
                          <div className="text-xs text-slate-500">Received by: {transfer.received_by_name}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{new Date(transfer.created_at).toLocaleDateString()}</div>
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
                          {(transfer.status === 'draft' || transfer.status === 'in_transit') && (
                            <DropdownMenuItem 
                              onClick={() => handleCompleteTransfer(transfer.transfer_id)}
                              className="text-green-600"
                            >
                              <Check className="mr-2 h-4 w-4" />
                              Mark Complete
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

          {transfers.length === 0 && (
            <div className="text-center py-8">
              <Truck className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <p className="text-slate-500">No stock transfers found.</p>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-slate-500">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} transfers
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