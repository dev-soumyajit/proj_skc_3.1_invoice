"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { debounce } from "lodash"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, Filter, Download, Upload, Plus, Grid, List, ArrowUpDown, Package } from "lucide-react"

interface Product {
  product_id: number
  product_code: string
  product_name: string
  product_desc: string
  product_category: string
  product_subcategory: string
  brand: string
  manufacturer: string
  model_number: string
  rate: number
  hsn_sac_code: string
  gst_rate: number
  unit_name: string
  keywords: string
  tags: string[]
}

interface SearchFilters {
  search: string
  category: string | 'all'
  subcategory: string
  brand: string | 'all'
  sortBy: string
  sortOrder: 'ASC' | 'DESC'
}

export function AdvancedProductSearch({
  onProductSelect,
  multiSelect = false,
  selectedProducts = []
}: {
  onProductSelect?: (products: Product[]) => void
  multiSelect?: boolean
  selectedProducts?: Product[]
}) {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [brands, setBrands] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table')
  const [selectedItems, setSelectedItems] = useState<Product[]>(selectedProducts)

  const [filters, setFilters] = useState<SearchFilters>({
    search: '',
    category: 'all',
    subcategory: '',
    brand: 'all',
    sortBy: 'product_name',
    sortOrder: 'ASC'
  })

  const [pagination, setPagination] = useState({
    limit: 20,
    offset: 0,
    total: 0
  })

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchFilters: SearchFilters) => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          search: searchFilters.search,
          category: searchFilters.category === 'all' ? '' : searchFilters.category,
          subcategory: searchFilters.subcategory,
          brand: searchFilters.brand === 'all' ? '' : searchFilters.brand,
          sortBy: searchFilters.sortBy,
          sortOrder: searchFilters.sortOrder,
          limit: pagination.limit.toString(),
          offset: pagination.offset.toString()
        })

        const response = await fetch(`/api/products/search?${params}`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()

        // Ensure products and total are valid, and normalize rate
        const productsArray = Array.isArray(data.products) ? data.products.map((product: any) => ({
          ...product,
          rate: Number(product.rate) || 0,
          gst_rate: Number(product.gst_rate) || 0
        })) : []
        setProducts(productsArray)
        setPagination(prev => ({ ...prev, total: Number(data.total) || 0 }))
      } catch (error) {
        console.error('Search failed:', error)
        setProducts([])
        setPagination(prev => ({ ...prev, total: 0 }))
      } finally {
        setLoading(false)
      }
    }, 300),
    [pagination.limit, pagination.offset]
  )

  // Auto-suggestions for search
  const [suggestions, setSuggestions] = useState<Product[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const debouncedSuggestions = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) {
        setSuggestions([])
        return
      }

      try {
        const response = await fetch(`/api/products/suggest?q=${encodeURIComponent(query)}&limit=8`)
        const data = await response.json()
        const suggestionsArray = Array.isArray(data.suggestions) ? data.suggestions.map((sugg: any) => ({
          ...sugg,
          rate: Number(sugg.rate) || 0,
          gst_rate: Number(sugg.gst_rate) || 0
        })) : []
        setSuggestions(suggestionsArray)
      } catch (error) {
        console.error('Suggestions failed:', error)
        setSuggestions([])
      }
    }, 200),
    []
  )

  useEffect(() => {
    debouncedSearch(filters)
  }, [filters, debouncedSearch])

  useEffect(() => {
    if (filters.search) {
      debouncedSuggestions(filters.search)
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
    }
  }, [filters.search, debouncedSuggestions])

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch('/api/products/categories')
        const data = await response.json()
        setCategories(Array.isArray(data.categories) ? data.categories : [])
      } catch (error) {
        console.error('Failed to load categories:', error)
        setCategories([])
      }
    }
    loadCategories()
  }, [])

  // Load brands
  useEffect(() => {
    const loadBrands = async () => {
      try {
        const response = await fetch('/api/products/brands')
        const data = await response.json()
        setBrands(Array.isArray(data.brands) ? data.brands : [])
      } catch (error) {
        console.error('Failed to load brands:', error)
        setBrands([])
      }
    }
    loadBrands()
  }, [])

  // Group categories by parent
  const categoriesByParent = useMemo(() => {
    return categories.reduce((acc, category) => {
      const parentId = category.parent_category_id || 'root'
      if (!acc[parentId]) acc[parentId] = []
      acc[parentId].push(category)
      return acc
    }, {} as Record<string, any[]>)
  }, [categories])

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, offset: 0 }))
  }

  const handleProductToggle = (product: Product) => {
    if (multiSelect) {
      const isSelected = selectedItems.some(p => p.product_id === product.product_id)
      const newSelection = isSelected
        ? selectedItems.filter(p => p.product_id !== product.product_id)
        : [...selectedItems, product]

      setSelectedItems(newSelection)
      onProductSelect?.(newSelection)
    } else {
      onProductSelect?.([product])
    }
  }

  const handleSuggestionClick = (suggestion: Product) => {
    setFilters(prev => ({ ...prev, search: suggestion.product_name }))
    setShowSuggestions(false)
    handleProductToggle(suggestion)
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      category: 'all',
      subcategory: '',
      brand: 'all',
      sortBy: 'product_name',
      sortOrder: 'ASC'
    })
  }

  const nextPage = () => {
    setPagination(prev => ({
      ...prev,
      offset: prev.offset + prev.limit
    }))
  }

  const prevPage = () => {
    setPagination(prev => ({
      ...prev,
      offset: Math.max(0, prev.offset - prev.limit)
    }))
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Product Search & Selection</CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search Input with Suggestions */}
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products, codes, brands..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Auto-suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-64 overflow-y-auto">
                {suggestions.map((suggestion) => (
                  <div
                    key={suggestion.product_id}
                    className="p-2 hover:bg-gray-100 cursor-pointer border-b"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <div className="font-medium text-sm">{suggestion.product_name}</div>
                    <div className="text-xs text-gray-500">
                      Code: {suggestion.product_code} | Brand: {suggestion.brand}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Category Filter */}
          <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categoriesByParent.root?.map((category: any) => (
                <SelectItem key={category.category_id} value={category.category_name}>
                  {category.category_name} ({category.product_count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Brand Filter */}
          <Select value={filters.brand} onValueChange={(value) => handleFilterChange('brand', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select brand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              {brands.map((brand) => (
                <SelectItem key={brand} value={brand}>
                  {brand}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort Options */}
          <Select value={`${filters.sortBy}_${filters.sortOrder}`} onValueChange={(value) => {
            const [sortBy, sortOrder] = value.split('_')
            setFilters(prev => ({ ...prev, sortBy, sortOrder: sortOrder as 'ASC' | 'DESC' }))
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="product_name_ASC">Name (A-Z)</SelectItem>
              <SelectItem value="product_name_DESC">Name (Z-A)</SelectItem>
              <SelectItem value="product_code_ASC">Code (A-Z)</SelectItem>
              <SelectItem value="rate_ASC">Price (Low to High)</SelectItem>
              <SelectItem value="rate_DESC">Price (High to Low)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
            {multiSelect && selectedItems.length > 0 && (
              <Badge variant="secondary">
                {selectedItems.length} selected
              </Badge>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import Products</DialogTitle>
                </DialogHeader>
                <BulkProductImport />
              </DialogContent>
            </Dialog>

            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-8">Loading products...</div>
        ) : !Array.isArray(products) || products.length === 0 ? (
          <div className="text-center py-8">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <>
            {viewMode === 'table' ? (
              <ProductTable
                products={products}
                selectedProducts={selectedItems}
                onProductToggle={handleProductToggle}
                multiSelect={multiSelect}
              />
            ) : (
              <ProductGrid
                products={products}
                selectedProducts={selectedItems}
                onProductToggle={handleProductToggle}
                multiSelect={multiSelect}
              />
            )}

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} products
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevPage}
                  disabled={pagination.offset === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextPage}
                  disabled={pagination.offset + pagination.limit >= pagination.total}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// Product Table Component
function ProductTable({
  products,
  selectedProducts,
  onProductToggle,
  multiSelect
}: {
  products: Product[]
  selectedProducts: Product[]
  onProductToggle: (product: Product) => void
  multiSelect: boolean
}) {
  if (!Array.isArray(products)) {
    return <div>No products available</div>
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {multiSelect && <TableHead className="w-12">Select</TableHead>}
            <TableHead>Code</TableHead>
            <TableHead>Product Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Brand</TableHead>
            <TableHead>HSN</TableHead>
            <TableHead>Rate</TableHead>
            <TableHead>GST%</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={multiSelect ? 8 : 7} className="text-center">
                No products found
              </TableCell>
            </TableRow>
          ) : (
            products.map((product) => {
              const isSelected = selectedProducts.some(p => p.product_id === product.product_id)
              const rate = Number(product.rate) || 0
              return (
                <TableRow
                  key={product.product_id}
                  className={isSelected ? "bg-blue-50" : "cursor-pointer hover:bg-gray-50"}
                  onClick={() => onProductToggle(product)}
                >
                  {multiSelect && (
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onChange={() => onProductToggle(product)}
                      />
                    </TableCell>
                  )}
                  <TableCell className="font-mono text-sm">{product.product_code}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{product.product_name}</div>
                      <div className="text-xs text-gray-500 truncate max-w-xs">
                        {product.product_desc}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{product.product_category}</div>
                      {product.product_subcategory && (
                        <div className="text-xs text-gray-500">{product.product_subcategory}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{product.brand}</TableCell>
                  <TableCell className="font-mono">{product.hsn_sac_code}</TableCell>
                  <TableCell className="font-mono">₹{rate.toFixed(2)}</TableCell>
                  <TableCell>{product.gst_rate}%</TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}

// Product Grid Component
function ProductGrid({
  products,
  selectedProducts,
  onProductToggle,
  multiSelect
}: {
  products: Product[]
  selectedProducts: Product[]
  onProductToggle: (product: Product) => void
  multiSelect: boolean
}) {
  if (!Array.isArray(products)) {
    return <div>No products available</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.length === 0 ? (
        <div className="col-span-full text-center py-8">No products found</div>
      ) : (
        products.map((product) => {
          const isSelected = selectedProducts.some(p => p.product_id === product.product_id)
          const rate = Number(product.rate) || 0
          return (
            <Card
              key={product.product_id}
              className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'}`}
              onClick={() => onProductToggle(product)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="outline" className="text-xs">
                    {product.product_code}
                  </Badge>
                  {multiSelect && (
                    <Checkbox
                      checked={isSelected}
                      onChange={() => onProductToggle(product)}
                    />
                  )}
                </div>
                <h3 className="font-medium text-sm mb-2 line-clamp-2">
                  {product.product_name}
                </h3>
                <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                  {product.product_desc}
                </p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Category:</span>
                    <span>{product.product_category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Brand:</span>
                    <span>{product.brand}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">HSN:</span>
                    <span className="font-mono">{product.hsn_sac_code}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-gray-500">Rate:</span>
                    <span>₹{rate.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })
      )}
    </div>
  )
}

// Bulk Product Import Component
function BulkProductImport() {
  const [importing, setImporting] = useState(false)
  const [importStatus, setImportStatus] = useState<any>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImporting(true)
    try {
      // Parse CSV/Excel file (you'll need a library like papa-parse for CSV)
      const text = await file.text()
      const lines = text.split('\n')
      const headers = lines[0].split(',')

      const products = lines.slice(1).map(line => {
        const values = line.split(',')
        return headers.reduce((obj, header, index) => {
          obj[header.trim()] = values[index]?.trim()
          return obj
        }, {} as any)
      }).filter(product => product.product_name) // Filter out empty rows

      // Send to API
      const response = await fetch('/api/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products })
      })

      const result = await response.json()
      setImportStatus(result)
    } catch (error) {
      console.error('Import failed:', error)
      setImportStatus({ error: 'Import failed' })
    } finally {
      setImporting(false)
    }
  }

  const downloadTemplate = () => {
    const csvContent = `product_code,product_name,product_desc,product_category,product_subcategory,brand,manufacturer,model_number,hsn_sac_code,rate,unit_name,keywords
K0206092,KIT 1" V NRV REPLACE SS10 220,Valve replacement kit,Valves,NRV,ELGI,ELGI,K0206092,84149019,3404,PCS,valve replacement kit
B313806,1 1/2"BSP 60 BALL VALVE,Ball valve 1.5 inch,Valves,Ball Valve,ELGI,ELGI,B313806,84818030,8080,PCS,ball valve 1.5 inch`

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'product_import_template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600">
        Upload a CSV file with product data to import multiple products at once.
      </div>

      <Button onClick={downloadTemplate} variant="outline" className="w-full">
        <Download className="h-4 w-4 mr-2" />
        Download Template
      </Button>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileUpload}
          disabled={importing}
          className="w-full"
        />
        <p className="text-xs text-gray-500 mt-2">
          Supported formats: CSV, Excel (.xlsx, .xls)
        </p>
      </div>

      {importing && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Importing products...</p>
        </div>
      )}

      {importStatus && (
        <div className={`p-4 rounded-lg ${importStatus.error ? 'bg-red-50' : 'bg-green-50'}`}>
          {importStatus.error ? (
            <div className="text-red-800">
              <h4 className="font-medium">Import Failed</h4>
              <p className="text-sm">{importStatus.error}</p>
            </div>
          ) : (
            <div className="text-green-800">
              <h4 className="font-medium">Import Completed</h4>
              <p className="text-sm">
                Successfully imported: {importStatus.successCount} products
              </p>
              {importStatus.errorCount > 0 && (
                <p className="text-sm text-red-600">
                  Failed: {importStatus.errorCount} products
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}