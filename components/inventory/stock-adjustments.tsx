// components/inventory/stock-adjustments.tsx
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
import { Search, Plus, MoreHorizontal, Edit, Check, X, Eye } from "lucide-react"
import { toast } from "sonner"

interface StockAdjustment {
  adjustment_id: number
  adjustment_no: string
  adjustment_date: string
  adjustment_type: string
  reason: string
  status: string
  total_items: number
  godown_name: string
  created_by_name: string
  approved_by_name?: string
  created_at: string
  updated_at: string
}

interface AdjustmentItem {
  product_id: number
  product_name: string
  system_quantity: number
  physical_quantity: number
  unit_name: string
  unit_cost: number
  remarks: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "approved":
      return "bg-green-100 text-green-800"
    case "draft":
      return "bg-yellow-100 text-yellow-800"
    case "rejected":
      return "bg-red-100 text-red-800"
    default:
      return "bg-slate-100 text-slate-800"
  }
}

export function StockAdjustments() {
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([])
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
  const [formData, setFormData] = useState({
    adjustment_date: new Date().toISOString().split('T')[0],
    godown_id: "",
    adjustment_type: "recount",
    reason: "",
    remarks: ""
  })
  const [adjustmentItems, setAdjustmentItems] = useState<AdjustmentItem[]>([])

  useEffect(() => {
    fetchAdjustments()
    fetchGodowns()
  }, [pagination.page, statusFilter])

  useEffect(() => {
    if (productSearch.length >= 2) {
      searchProducts()
    } else {
      setProducts([])
    }
  }, [productSearch])

  const fetchAdjustments = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })

      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      const response = await fetch(`/api/stock/adjustments?${params}`)
      const data = await response.json()

      if (data.success) {
        setAdjustments(data.data)
        setPagination(data.pagination)
      } else {
        toast.error(data.error || 'Failed to fetch adjustments')
      }
    } catch (error) {
      console.error('Error fetching adjustments:', error)
      toast.error('Failed to fetch adjustments')
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
      } else {
        toast.error(data.error || 'Failed to fetch godowns')
      }
    } catch (error) {
      console.error('Error fetching godowns:', error)
      toast.error('Failed to fetch godowns')
    }
  }

  const searchProducts = async () => {
    try {
      const response = await fetch(`/api/products/search?search=${encodeURIComponent(productSearch)}&limit=10`)
      const data = await response.json()
      if (data.success) {
        setProducts(data.data)
      } else {
        toast.error(data.error || 'Failed to search products')
      }
    } catch (error) {
      console.error('Error searching products:', error)
      toast.error('Failed to search products')
    }
  }

  const addProductToAdjustment = (product: any) => {
    const existingItem = adjustmentItems.find(item => item.product_id === product.product_id)
    if (existingItem) {
      toast.error("Product already added")
      return
    }

    const newItem: AdjustmentItem = {
      product_id: product.product_id,
      product_name: product.product_name,
      system_quantity: product.quantity || 0,
      physical_quantity: product.quantity || 0,
      unit_name: product.unit_name || '',
      unit_cost: product.rate || 0,
      remarks: ""
    }

    setAdjustmentItems([...adjustmentItems, newItem])
    setProductSearch("")
    setProducts([])
  }

  const updateAdjustmentItem = (index: number, field: string, value: any) => {
    const updatedItems = [...adjustmentItems]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    setAdjustmentItems(updatedItems)
  }

  const removeAdjustmentItem = (index: number) => {
    setAdjustmentItems(adjustmentItems.filter((_, i) => i !== index))
  }

  const handleCreateAdjustment = async () => {
    try {
      if (!formData.godown_id || adjustmentItems.length === 0) {
        toast.error("Please select a warehouse and add at least one product")
        return
      }

      const response = await fetch('/api/stock/adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          items: adjustmentItems
        })
      })

      const data = await response.json()
      if (data.success) {
        toast.success("Stock adjustment created successfully")
        setShowCreateDialog(false)
        setFormData({
          adjustment_date: new Date().toISOString().split('T')[0],
          godown_id: "",
          adjustment_type: "recount",
          reason: "",
          remarks: ""
        })
        setAdjustmentItems([])
        fetchAdjustments()
      } else {
        toast.error(data.error || "Failed to create adjustment")
      }
    } catch (error) {
      console.error('Error creating adjustment:', error)
      toast.error("Failed to create adjustment")
    }
  }

  const handleApproveAdjustment = async (adjustmentId: number) => {
    try {
      const response = await fetch(`/api/stock/adjustments/${adjustmentId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved_by: 1 }) // Assuming a user ID for approval
      })

      const data = await response.json()
      if (data.success) {
        toast.success("Stock adjustment approved successfully")
        fetchAdjustments()
      } else {
        toast.error(data.error || "Failed to approve adjustment")
      }
    } catch (error) {
      console.error('Error approving adjustment:', error)
      toast.error("Failed to approve adjustment")
    }
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  if (loading && adjustments.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-slate-500">Loading adjustments...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters and Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <Select value={statusFilter || "all"} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Adjustment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Stock Adjustment</DialogTitle>
              <DialogDescription>
                Record physical stock counts and adjust system quantities
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Adjustment Date</Label>
                  <Input
                    type="date"
                    value={formData.adjustment_date}
                    onChange={(e) => setFormData({ ...formData, adjustment_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Warehouse</Label>
                  <Select
                    value={formData.godown_id}
                    onValueChange={(value) => setFormData({ ...formData, godown_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select warehouse" />
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
                  <Label>Adjustment Type</Label>
                  <Select
                    value={formData.adjustment_type}
                    onValueChange={(value) => setFormData({ ...formData, adjustment_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recount">Physical Recount</SelectItem>
                      <SelectItem value="increase">Increase Stock</SelectItem>
                      <SelectItem value="decrease">Decrease Stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Reason</Label>
                  <Input
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="Reason for adjustment"
                  />
                </div>
              </div>

              {/* Product Search */}
              <div className="space-y-2">
                <Label>Add Products</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search products to add..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-10"
                  />
                  {products.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {products.map((product) => (
                        <div
                          key={product.product_id}
                          className="p-3 hover:bg-slate-50 cursor-pointer border-b last:border-b-0"
                          onClick={() => addProductToAdjustment(product)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{product.product_name}</div>
                              <div className="text-sm text-slate-500">
                                {product.product_code && `${product.product_code} • `}
                                {product.hsn_sac_code || `ID: ${product.product_id}`}
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

              {/* Adjustment Items */}
              {adjustmentItems.length > 0 && (
                <div className="space-y-2">
                  <Label>Products to Adjust</Label>
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>System Qty</TableHead>
                          <TableHead>Physical Qty</TableHead>
                          <TableHead>Difference</TableHead>
                          <TableHead>Unit Cost</TableHead>
                          <TableHead>Remarks</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {adjustmentItems.map((item, index) => (
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
                                value={item.system_quantity}
                                onChange={(e) => updateAdjustmentItem(index, 'system_quantity', parseFloat(e.target.value) || 0)}
                                className="w-24"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.001"
                                value={item.physical_quantity}
                                onChange={(e) => updateAdjustmentItem(index, 'physical_quantity', parseFloat(e.target.value) || 0)}
                                className="w-24"
                              />
                            </TableCell>
                            <TableCell className="font-mono">
                              <span
                                className={
                                  (item.physical_quantity - item.system_quantity) > 0
                                    ? "text-green-600"
                                    : (item.physical_quantity - item.system_quantity) < 0
                                      ? "text-red-600"
                                      : "text-slate-600"
                                }
                              >
                                {(item.physical_quantity - item.system_quantity).toFixed(3)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.01"
                                value={item.unit_cost}
                                onChange={(e) => updateAdjustmentItem(index, 'unit_cost', parseFloat(e.target.value) || 0)}
                                className="w-24"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={item.remarks}
                                onChange={(e) => updateAdjustmentItem(index, 'remarks', e.target.value)}
                                placeholder="Notes"
                                className="w-32"
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeAdjustmentItem(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Remarks</Label>
                <Textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateAdjustment}
                  disabled={!formData.godown_id || adjustmentItems.length === 0}
                >
                  Create Adjustment
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Adjustments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Adjustments</CardTitle>
          <CardDescription>
            Physical stock counts and inventory adjustments ({pagination.total} records)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Adjustment Details</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adjustments.map((adjustment) => (
                  <TableRow key={adjustment.adjustment_id}>
                    <TableCell>
                      <div>
                        <div className="font-semibold text-slate-900">{adjustment.adjustment_no}</div>
                        <div className="text-sm text-slate-500">
                          {new Date(adjustment.adjustment_date).toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{adjustment.godown_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {adjustment.adjustment_type.charAt(0).toUpperCase() + adjustment.adjustment_type.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">{adjustment.total_items}</TableCell>
                    <TableCell className="max-w-xs truncate">{adjustment.reason}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getStatusColor(adjustment.status)}>
                        {adjustment.status.charAt(0).toUpperCase() + adjustment.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm">{new Date(adjustment.created_at).toLocaleDateString()}</div>
                        <div className="text-xs text-slate-500">by {adjustment.created_by_name}</div>
                      </div>
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
                          {adjustment.status === 'draft' && (
                            <>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleApproveAdjustment(adjustment.adjustment_id)}
                                className="text-green-600"
                              >
                                <Check className="mr-2 h-4 w-4" />
                                Approve
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {adjustments.length === 0 && (
            <div className="text-center py-8">
              <Plus className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <p className="text-slate-500">No adjustments found.</p>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-slate-500">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} adjustments
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