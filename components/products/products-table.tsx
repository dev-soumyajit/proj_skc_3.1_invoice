"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, MoreHorizontal, Edit, Trash2, Eye, Package, Loader2 } from "lucide-react"

interface Product {
  product_id: number
  product_name: string
  product_desc: string
  product_type: string
  hsn_sac_code: string
  unit_name: string
  gst_rate: number
  rate: number
  created_at: string
}

const productTypeColors = {
  raw: "bg-orange-100 text-orange-800",
  finished: "bg-green-100 text-green-800",
}

export function ProductsTable() {
  const [searchTerm, setSearchTerm] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/products")
      if (!response.ok) {
        throw new Error("Failed to fetch products")
      }
      const data = await response.json()
      setProducts(data.products || [])
      setFilteredProducts(data.products || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    const filtered = products.filter(
      (product) =>
        product.product_name.toLowerCase().includes(value.toLowerCase()) ||
        product.product_desc.toLowerCase().includes(value.toLowerCase()) ||
        product.hsn_sac_code.includes(value),
    )
    setFilteredProducts(filtered)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Product Catalog</CardTitle>
          <CardDescription>Manage your product inventory with HSN/SAC codes and tax information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            <span className="ml-2 text-slate-600">Loading products...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Product Catalog</CardTitle>
          <CardDescription>Manage your product inventory with HSN/SAC codes and tax information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600">Error: {error}</p>
            <Button onClick={fetchProducts} className="mt-4">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Catalog</CardTitle>
        <CardDescription>Manage your product inventory with HSN/SAC codes and tax information</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search products..."
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
                <TableHead>Product Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>HSN/SAC Code</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>GST Rate</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.product_id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                        <Package className="h-4 w-4 text-slate-600" />
                      </div>
                      <div className="font-semibold text-slate-900">{product.product_name}</div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate text-slate-600">{product.product_desc}</div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={productTypeColors[product.product_type as keyof typeof productTypeColors]}
                    >
                      {product.product_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{product.hsn_sac_code}</TableCell>
                  <TableCell>{product.unit_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{product.gst_rate}%</Badge>
                  </TableCell>
                  <TableCell className="font-mono">₹{product.rate?.toFixed(2)}</TableCell>
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
                          Edit Product
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Product
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredProducts.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-slate-500">
              {searchTerm
                ? "No products found matching your search."
                : "No products found. Add your first product to get started."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
