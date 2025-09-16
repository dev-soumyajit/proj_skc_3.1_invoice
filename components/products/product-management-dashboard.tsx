// components/products/product-management-dashboard.tsx
"use client"

import { useState , useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  Package, 
  Search, 
  Plus, 
  Upload, 
  Download, 
  Settings, 
  BarChart3,
  Tag,
  Filter,
  AlertCircle,
  RefreshCw,
    Database,
    CheckCircle
} from "lucide-react"

import { AdvancedProductSearch } from "./advanced-product-search"

export function ProductManagementDashboard() {
  const [activeTab, setActiveTab] = useState("search")

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Product Management</h1>
          <p className="text-muted-foreground">Manage your product catalog with advanced search and categorization</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
              </DialogHeader>
              <AddProductForm />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="search">
            <Search className="h-4 w-4 mr-2" />
            Search & Browse
          </TabsTrigger>
          <TabsTrigger value="categories">
            <Tag className="h-4 w-4 mr-2" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="import">
            <Upload className="h-4 w-4 mr-2" />
            Import/Export
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-4">
          <AdvancedProductSearch multiSelect={true} />
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <CategoryManagement />
        </TabsContent>

        <TabsContent value="import" className="space-y-4">
          <ImportExportManager />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <ProductAnalytics />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <ProductSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Add Product Form Component
function AddProductForm() {
  const [formData, setFormData] = useState({
    product_code: '',
    product_name: '',
    product_desc: '',
    product_category: '',
    product_subcategory: '',
    brand: '',
    manufacturer: '',
    model_number: '',
    hsn_sac_code: '',
    rate: '',
    unit_id: '',
    keywords: '',
    tags: []
  })
  
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState([])
  const [units, setUnits] = useState([])

  useEffect(() => {
    loadFormData()
  }, [])

  const loadFormData = async () => {
    try {
      const [categoriesRes, unitsRes] = await Promise.all([
        fetch('/api/products/categories'),
        fetch('/api/units')
      ])
      
      const categoriesData = await categoriesRes.json()
      const unitsData = await unitsRes.json()
      
      setCategories(categoriesData.categories || [])
      setUnits(unitsData.units || [])
    } catch (error) {
      console.error('Failed to load form data:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        // Reset form and show success
        setFormData({
          product_code: '',
          product_name: '',
          product_desc: '',
          product_category: '',
          product_subcategory: '',
          brand: '',
          manufacturer: '',
          model_number: '',
          hsn_sac_code: '',
          rate: '',
          unit_id: '',
          keywords: '',
          tags: []
        })
        alert('Product added successfully!')
      } else {
        const error = await response.json()
        alert(`Failed to add product: ${error.message}`)
      }
    } catch (error) {
      console.error('Add product error:', error)
      alert('Failed to add product')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="product_code">Product Code</Label>
          <Input
            id="product_code"
            value={formData.product_code}
            onChange={(e) => setFormData(prev => ({ ...prev, product_code: e.target.value }))}
            placeholder="Enter unique product code"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="product_name">Product Name *</Label>
          <Input
            id="product_name"
            value={formData.product_name}
            onChange={(e) => setFormData(prev => ({ ...prev, product_name: e.target.value }))}
            placeholder="Enter product name"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="product_desc">Description</Label>
        <Textarea
          id="product_desc"
          value={formData.product_desc}
          onChange={(e) => setFormData(prev => ({ ...prev, product_desc: e.target.value }))}
          placeholder="Enter product description"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="product_category">Category</Label>
          <Select
            value={formData.product_category}
            onValueChange={(value) => setFormData(prev => ({ ...prev, product_category: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category: any) => (
                <SelectItem key={category.category_id} value={category.category_name}>
                  {category.category_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="brand">Brand</Label>
          <Input
            id="brand"
            value={formData.brand}
            onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
            placeholder="Enter brand name"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="hsn_sac_code">HSN/SAC Code *</Label>
          <Input
            id="hsn_sac_code"
            value={formData.hsn_sac_code}
            onChange={(e) => setFormData(prev => ({ ...prev, hsn_sac_code: e.target.value }))}
            placeholder="Enter HSN/SAC code"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="rate">Rate</Label>
          <Input
            id="rate"
            type="number"
            step="0.01"
            value={formData.rate}
            onChange={(e) => setFormData(prev => ({ ...prev, rate: e.target.value }))}
            placeholder="Enter rate"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="unit_id">Unit</Label>
          <Select
            value={formData.unit_id}
            onValueChange={(value) => setFormData(prev => ({ ...prev, unit_id: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select unit" />
            </SelectTrigger>
            <SelectContent>
              {units.map((unit: any) => (
                <SelectItem key={unit.unit_id} value={unit.unit_id.toString()}>
                  {unit.unit_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="keywords">Keywords (comma-separated)</Label>
        <Input
          id="keywords"
          value={formData.keywords}
          onChange={(e) => setFormData(prev => ({ ...prev, keywords: e.target.value }))}
          placeholder="Enter search keywords separated by commas"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Add Product'}
        </Button>
      </div>
    </form>
  )
}

// Category Management Component
function CategoryManagement() {
  const [categories, setCategories] = useState([])
  const [newCategory, setNewCategory] = useState({ name: '', parent_id: '', description: '' })

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/products/categories')
      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Failed to load categories:', error)
    }
  }

  const addCategory = async () => {
    try {
      const response = await fetch('/api/products/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategory)
      })

      if (response.ok) {
        loadCategories()
        setNewCategory({ name: '', parent_id: '', description: '' })
      }
    } catch (error) {
      console.error('Failed to add category:', error)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Category Tree */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Product Categories</CardTitle>
            <CardDescription>Organize your products into categories and subcategories</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <CategoryTree categories={categories} />
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Add Category Form */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Add New Category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category_name">Category Name</Label>
              <Input
                id="category_name"
                value={newCategory.name}
                onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter category name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent_category">Parent Category</Label>
              <Select
                value={newCategory.parent_id}
                onValueChange={(value) => setNewCategory(prev => ({ ...prev, parent_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Root Category)</SelectItem>
                  {categories.filter((cat: any) => !cat.parent_category_id).map((category: any) => (
                    <SelectItem key={category.category_id} value={category.category_id.toString()}>
                      {category.category_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category_desc">Description</Label>
              <Textarea
                id="category_desc"
                value={newCategory.description}
                onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter category description"
                rows={3}
              />
            </div>

            <Button onClick={addCategory} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Category Tree Component
function CategoryTree({ categories }: { categories: any[] }) {
  const rootCategories = categories.filter(cat => !cat.parent_category_id)
  
  const renderCategory = (category: any, level = 0) => {
    const children = categories.filter(cat => cat.parent_category_id === category.category_id)
    
    return (
      <div key={category.category_id} className={`ml-${level * 4}`}>
        <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
          <div className="flex items-center space-x-2">
            <Tag className="h-4 w-4" />
            <span className="font-medium">{category.category_name}</span>
            <Badge variant="secondary" className="text-xs">
              {category.product_count}
            </Badge>
          </div>
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
        {children.map(child => renderCategory(child, level + 1))}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {rootCategories.map(category => renderCategory(category))}
    </div>
  )
}

// Import/Export Manager Component
function ImportExportManager() {
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      const response = await fetch('/api/products/export')
      const blob = await response.blob()
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `products_export_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Import Section */}
      <Card>
        <CardHeader>
          <CardTitle>Import Products</CardTitle>
          <CardDescription>Upload CSV or Excel files to add multiple products</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Make sure your file follows the correct format. Download the template to get started.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <Button variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
            
            <Button className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              Choose File to Import
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>Supported formats:</p>
            <ul className="list-disc list-inside mt-1">
              <li>CSV (.csv)</li>
              <li>Excel (.xlsx, .xls)</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle>Export Products</CardTitle>
          <CardDescription>Download your complete product catalog</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Export Format</Label>
            <Select defaultValue="csv">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV Format</SelectItem>
                <SelectItem value="xlsx">Excel Format</SelectItem>
                <SelectItem value="json">JSON Format</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Include Fields</Label>
            <div className="space-y-2">
              {['Basic Info', 'Pricing', 'Stock Levels', 'Categories', 'Metadata'].map((field) => (
                <div key={field} className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">{field}</span>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={handleExport} disabled={exporting} className="w-full">
            {exporting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export Products
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// Product Analytics Component
function ProductAnalytics() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Products</CardTitle>
          <CardDescription>Most frequently used in invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: "DRIVE COUPLING INSERT UCW 295", usage: 45, trend: "+12%" },
              { name: "GREASE PUMP AH4 TUNE UP KIT", usage: 38, trend: "+8%" },
              { name: "KIT 1\" V NRV REPLACE SS10 220", usage: 32, trend: "-2%" },
              { name: "1 1/2\"BSP 60 BALL VALVE", usage: 28, trend: "+15%" },
              { name: "AIR FILTER ASSEMBLY 30CFM", usage: 25, trend: "+5%" }
            ].map((product, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{product.name}</p>
                  <p className="text-xs text-muted-foreground">Used {product.usage} times</p>
                </div>
                <Badge variant={product.trend.startsWith('+') ? 'default' : 'secondary'}>
                  {product.trend}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Category Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Products by Category</CardTitle>
          <CardDescription>Distribution across product categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { category: "Valves", count: 1250, percentage: 35 },
              { category: "Filters", count: 890, percentage: 25 },
              { category: "Pumps", count: 620, percentage: 17 },
              { category: "Motors", count: 450, percentage: 13 },
              { category: "Accessories", count: 360, percentage: 10 }
            ].map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{item.category}</span>
                  <span className="text-muted-foreground">{item.count} products</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Recent Product Activity</CardTitle>
          <CardDescription>Latest updates and changes to your product catalog</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { action: "Added", product: "NEW COUPLING V100DA", user: "Admin", time: "2 hours ago", type: "create" },
              { action: "Updated", product: "AIR FILTER ASSY 95CFM HV21", user: "Manager", time: "4 hours ago", type: "update" },
              { action: "Imported", product: "50 new products from CSV", user: "Admin", time: "1 day ago", type: "import" },
              { action: "Updated", product: "SAFETY VALVE 1/4\"BSP 11.5 BAR", user: "Staff", time: "2 days ago", type: "update" },
              { action: "Added", product: "MOTOR 3 HP DCI 1000", user: "Manager", time: "3 days ago", type: "create" }
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-4 p-3 border rounded-lg">
                <div className={`p-2 rounded-full ${
                  activity.type === 'create' ? 'bg-green-100' :
                  activity.type === 'update' ? 'bg-blue-100' : 'bg-purple-100'
                }`}>
                  {activity.type === 'create' && <Plus className="h-4 w-4 text-green-600" />}
                  {activity.type === 'update' && <Settings className="h-4 w-4 text-blue-600" />}
                  {activity.type === 'import' && <Upload className="h-4 w-4 text-purple-600" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {activity.action} <span className="text-blue-600">{activity.product}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    by {activity.user} • {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Product Settings Component
function ProductSettings() {
  return (
    <div className="space-y-6">
      {/* Search Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Search Settings</CardTitle>
          <CardDescription>Configure how product search behaves</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Fuzzy Search</p>
              <p className="text-sm text-muted-foreground">Allow approximate matches in product names</p>
            </div>
            <input type="checkbox" defaultChecked className="rounded" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Search in Descriptions</p>
              <p className="text-sm text-muted-foreground">Include product descriptions in search</p>
            </div>
            <input type="checkbox" defaultChecked className="rounded" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Auto-suggestions</p>
              <p className="text-sm text-muted-foreground">Show search suggestions while typing</p>
            </div>
            <input type="checkbox" defaultChecked className="rounded" />
          </div>

          <div className="space-y-2">
            <Label>Search Results Per Page</Label>
            <Select defaultValue="20">
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Manage your product data and cache</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Clear Product Cache</p>
              <p className="text-sm text-muted-foreground">Clear cached product data to force refresh</p>
            </div>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Clear Cache
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Rebuild Search Index</p>
              <p className="text-sm text-muted-foreground">Rebuild the search index for better performance</p>
            </div>
            <Button variant="outline" size="sm">
              <Database className="h-4 w-4 mr-2" />
              Rebuild Index
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Backup Product Data</p>
              <p className="text-sm text-muted-foreground">Create a backup of all product information</p>
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Create Backup
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Integration Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Settings</CardTitle>
          <CardDescription>Configure product data integrations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Auto-update HSN Codes</p>
              <p className="text-sm text-muted-foreground">Automatically update HSN codes from government database</p>
            </div>
            <input type="checkbox" className="rounded" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Sync with Inventory</p>
              <p className="text-sm text-muted-foreground">Keep product data synchronized with inventory levels</p>
            </div>
            <input type="checkbox" defaultChecked className="rounded" />
          </div>

          <div className="space-y-2">
            <Label>Sync Frequency</Label>
            <Select defaultValue="hourly">
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="realtime">Real-time</SelectItem>
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button>
          <CheckCircle className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  )
}