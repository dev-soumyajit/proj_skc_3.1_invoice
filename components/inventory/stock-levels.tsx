// components/inventory/stock-levels.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, MoreHorizontal, Edit, AlertTriangle, Package } from "lucide-react"
import { toast } from "sonner"

interface StockLevel {
  product_id: number
  godown_id: number
  product_name: string
  product_code: string
  godown_name: string
  quantity: number
  reserved_quantity: number
  available_quantity: number
  minimum_level: number
  maximum_level: number
  reorder_point: number
  unit_name: string
  stock_status: string
  last_cost: number
  last_updated: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "in_stock":
      return "bg-green-100 text-green-800"
    case "low_stock":
      return "bg-yellow-100 text-yellow-800"
    case "out_of_stock":
      return "bg-red-100 text-red-800"
    case "overstock":
      return "bg-blue-100 text-blue-800"
    default:
      return "bg-slate-100 text-slate-800"
  }
}

const formatStatusText = (status: string) => {
  return status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())
}

export function StockLevels() {
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [godownFilter, setGodownFilter] = useState("")
  const [godowns, setGodowns] = useState<any[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  })

  useEffect(() => {
    fetchGodowns()
    fetchStockLevels()
  }, [pagination.page, searchTerm, statusFilter, godownFilter])

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

  const fetchStockLevels = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })

      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter && statusFilter !== 'all') {
        if (statusFilter === 'low_stock') params.append('lowStock', 'true')
        if (statusFilter === 'out_of_stock') params.append('outOfStock', 'true')
      }
      if (godownFilter && godownFilter !== 'all') {
        params.append('godownId', godownFilter)
      }

      const response = await fetch(`/api/stock/levels?${params}`)
      const data = await response.json()

      if (data.success) {
        // Deduplicate stock levels based on product_id and godown_id
        const uniqueStockLevels = Array.from(
          new Map(
            data.data.map((item: StockLevel) => [`${item.product_id}-${item.godown_id}`, item])
          ).values()
        ) as StockLevel[]
        setStockLevels(uniqueStockLevels)
        setPagination(data.pagination)
      } else {
        toast.error(data.error || 'Failed to fetch stock levels')
      }
    } catch (error) {
      console.error('Error fetching stock levels:', error)
      toast.error('Failed to fetch stock levels')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleGodownFilter = (value: string) => {
    setGodownFilter(value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  if (loading && stockLevels.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-slate-500">Loading stock levels...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter || "all"} onValueChange={handleStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Stock Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="in_stock">In Stock</SelectItem>
              <SelectItem value="low_stock">Low Stock</SelectItem>
              <SelectItem value="out_of_stock">Out of Stock</SelectItem>
              <SelectItem value="overstock">Overstock</SelectItem>
            </SelectContent>
          </Select>

          <Select value={godownFilter || "all"} onValueChange={handleGodownFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Warehouse" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Warehouses</SelectItem>
              {godowns.map((godown) => (
                <SelectItem key={godown.godown_id} value={godown.godown_id.toString()}>
                  {godown.godown_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={fetchStockLevels} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      {/* Stock Levels Table */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Levels</CardTitle>
          <CardDescription>
            Current inventory levels across all warehouses ({pagination.total} items)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Reserved</TableHead>
                  <TableHead>Min Level</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Cost</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockLevels.map((stock, index) => (
                  <TableRow key={`${stock.product_id}-${stock.godown_id}-${index}`}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-slate-900">{stock.product_name}</div>
                        <div className="text-sm text-slate-500">
                          {stock.product_code && `${stock.product_code} • `}ID: {stock.product_id}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{stock.godown_name}</TableCell>
                    <TableCell className="font-mono">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-slate-400" />
                        <span className="font-semibold">
                          {stock.quantity.toLocaleString()} {stock.unit_name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">
                      {stock.available_quantity.toLocaleString()} {stock.unit_name}
                    </TableCell>
                    <TableCell className="font-mono">
                      {stock.reserved_quantity > 0 ? (
                        <span className="text-orange-600">
                          {stock.reserved_quantity.toLocaleString()} {stock.unit_name}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono">
                      {stock.minimum_level > 0 ? (
                        <span>
                          {stock.minimum_level.toLocaleString()} {stock.unit_name}
                        </span>
                      ) : (
                        <span className="text-slate-400">Not set</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getStatusColor(stock.stock_status)}>
                        {stock.stock_status === 'out_of_stock' && <AlertTriangle className="mr-1 h-3 w-3" />}
                        {formatStatusText(stock.stock_status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">
                      {stock.last_cost > 0 ? (
                        `₹${stock.last_cost.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {new Date(stock.last_updated).toLocaleDateString()}
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
                            <Edit className="mr-2 h-4 w-4" />
                            Adjust Stock
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Package className="mr-2 h-4 w-4" />
                            Set Levels
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            View History
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {stockLevels.length === 0 && (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <p className="text-slate-500">No stock data found matching your criteria.</p>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-slate-500">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} items
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