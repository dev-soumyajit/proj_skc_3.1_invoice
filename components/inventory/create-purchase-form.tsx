"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Search, Save, ArrowLeft } from "lucide-react"
import { toast } from "sonner"

interface Vendor {
  vendor_id: number
  vendor_name: string
  vendor_person_name: string
  vendor_contact_no: string
  vendor_gst: string
}

interface Godown {
  godown_id: number
  godown_name: string
  godown_address: string
}

interface Product {
  product_id: number
  product_code: string
  product_name: string
  rate: number
  unit_name: string
  hsn_sac_code: string
  gst_rate: string
  current_stock: number
}

interface PurchaseItem {
  product_id: number
  product_name: string
  unit_name: string
  hsn_sac_code: string
  quantity: number
  rate: number
  amount: number
  gst_rate: number
  gst_amount: number
  total_amount: number
}

export function CreatePurchaseForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [godowns, setGodowns] = useState<Godown[]>([])
  const [productSearch, setProductSearch] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  
  // Form data
  const [formData, setFormData] = useState({
    vendor_id: "",
    godown_id: "",
    invoice_no: "",
    invoice_date: new Date().toISOString().split('T')[0],
    remarks: ""
  })
  
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([])
  
  // Totals
  const [totals, setTotals] = useState({
    subtotal: 0,
    total_gst: 0,
    grand_total: 0
  })

  useEffect(() => {
    fetchVendors()
    fetchGodowns()
  }, [])

  useEffect(() => {
    console.log('Vendors state:', vendors) // Debug vendors state
  }, [vendors])

  useEffect(() => {
    calculateTotals()
  }, [purchaseItems])

  useEffect(() => {
    if (productSearch.length >= 2) {
      searchProducts()
    } else {
      setProducts([])
    }
  }, [productSearch])

  const fetchVendors = async () => {
    try {
      const response = await fetch('/api/vendors')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      console.log('Vendor API response:', data) // Debug API response
      if (data.success) {
        setVendors(data.data)
      } else {
        console.error('API returned success: false', data.error)
        toast.error(data.error || "Failed to fetch vendors")
      }
    } catch (error) {
      console.error('Error fetching vendors:', error)
      toast.error("Failed to fetch vendors")
    }
  }

  const fetchGodowns = async () => {
    try {
      const response = await fetch('/api/godowns')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      console.log('Godown API response:', data) // Debug API response
      if (data.success) {
        setGodowns(data.data)
      } else {
        console.error('API returned success: false', data.error)
        toast.error(data.error || "Failed to fetch warehouses")
      }
    } catch (error) {
      console.error('Error fetching godowns:', error)
      toast.error("Failed to fetch warehouses")
    }
  }

  const searchProducts = async () => {
    try {
      const response = await fetch(`/api/products/search?search=${encodeURIComponent(productSearch)}&limit=10`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      console.log('Product search API response:', data) // Debug API response
      if (data.success) {
        setProducts(data.data)
      } else {
        console.error('API returned success: false', data.error)
        toast.error(data.error || "Failed to fetch products")
      }
    } catch (error) {
      console.error('Error searching products:', error)
      toast.error("Failed to fetch products")
    }
  }

  const addProductToList = (product: Product) => {
    // Check if product already exists
    const existingItem = purchaseItems.find(item => item.product_id === product.product_id)
    if (existingItem) {
      toast.error("Product already added to purchase")
      return
    }

    const gstRate = parseFloat(product.gst_rate) || 0
    const quantity = 1
    const rate = product.rate || 0
    const amount = quantity * rate
    const gstAmount = (amount * gstRate) / 100
    const totalAmount = amount + gstAmount

    const newItem: PurchaseItem = {
      product_id: product.product_id,
      product_name: product.product_name,
      unit_name: product.unit_name,
      hsn_sac_code: product.hsn_sac_code,
      quantity,
      rate,
      amount,
      gst_rate: gstRate,
      gst_amount: gstAmount,
      total_amount: totalAmount
    }

    setPurchaseItems([...purchaseItems, newItem])
    setProductSearch("")
    setProducts([])
  }

  const updateItemQuantity = (index: number, quantity: number) => {
    const updatedItems = [...purchaseItems]
    const item = updatedItems[index]
    
    item.quantity = quantity
    item.amount = quantity * item.rate
    item.gst_amount = (item.amount * item.gst_rate) / 100
    item.total_amount = item.amount + item.gst_amount
    
    setPurchaseItems(updatedItems)
  }

  const updateItemRate = (index: number, rate: number) => {
    const updatedItems = [...purchaseItems]
    const item = updatedItems[index]
    
    item.rate = rate
    item.amount = item.quantity * rate
    item.gst_amount = (item.amount * item.gst_rate) / 100
    item.total_amount = item.amount + item.gst_amount
    
    setPurchaseItems(updatedItems)
  }

  const removeItem = (index: number) => {
    setPurchaseItems(purchaseItems.filter((_, i) => i !== index))
  }

  const calculateTotals = () => {
    const subtotal = purchaseItems.reduce((sum, item) => sum + item.amount, 0)
    const totalGst = purchaseItems.reduce((sum, item) => sum + item.gst_amount, 0)
    const grandTotal = subtotal + totalGst

    setTotals({
      subtotal,
      total_gst: totalGst,
      grand_total: grandTotal
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.vendor_id || !formData.godown_id || !formData.invoice_no) {
      toast.error("Please fill in all required fields")
      return
    }

    if (purchaseItems.length === 0) {
      toast.error("Please add at least one product")
      return
    }

    setLoading(true)

    try {
      const purchaseData = {
        vendor_id: parseInt(formData.vendor_id),
        godown_id: parseInt(formData.godown_id),
        invoice_no: formData.invoice_no,
        invoice_date: formData.invoice_date,
        remarks: formData.remarks,
        items: purchaseItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          rate: item.rate,
          hsn_sac_code: item.hsn_sac_code
        }))
      }

      const response = await fetch('/api/purchases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(purchaseData)
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Purchase created successfully")
        router.push('/inventory/purchases')
      } else {
        toast.error(data.error || "Failed to create purchase")
      }
    } catch (error) {
      console.error('Error creating purchase:', error)
      toast.error("Failed to create purchase")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Create Purchase Order</h1>
            <p className="text-slate-600">Add new inventory purchase from vendor</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Purchase Information</CardTitle>
            <CardDescription>Basic details about the purchase order</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vendor_id">Vendor *</Label>
                <Select
                  value={formData.vendor_id}
                  onValueChange={(value) => setFormData({...formData, vendor_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.length === 0 && (
                      <div className="p-2 text-slate-500">No vendors found</div>
                    )}
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor.vendor_id} value={vendor.vendor_id.toString()}>
                        <div>
                          <div className="font-medium">{vendor.vendor_name}</div>
                          <div className="text-sm text-slate-500">{vendor.vendor_person_name}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="godown_id">Warehouse *</Label>
                <Select
                  value={formData.godown_id}
                  onValueChange={(value) => setFormData({...formData, godown_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {godowns.length === 0 && (
                      <div className="p-2 text-slate-500">No warehouses found</div>
                    )}
                    {godowns.map((godown) => (
                      <SelectItem key={godown.godown_id} value={godown.godown_id.toString()}>
                        {godown.godown_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoice_no">Invoice Number *</Label>
                <Input
                  id="invoice_no"
                  value={formData.invoice_no}
                  onChange={(e) => setFormData({...formData, invoice_no: e.target.value})}
                  placeholder="Enter invoice number"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoice_date">Invoice Date *</Label>
                <Input
                  id="invoice_date"
                  type="date"
                  value={formData.invoice_date}
                  onChange={(e) => setFormData({...formData, invoice_date: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                value={formData.remarks}
                onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                placeholder="Additional notes about this purchase..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Products Section */}
        <Card>
          <CardHeader>
            <CardTitle>Products</CardTitle>
            <CardDescription>Add products to this purchase order</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Product Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search products to add..."
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
                      onClick={() => addProductToList(product)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{product.product_name}</div>
                          <div className="text-sm text-slate-500">
                            {product.product_code} • {product.hsn_sac_code} • {product.unit_name}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">₹{product.rate.toLocaleString()}</div>
                          <div className="text-sm text-slate-500">Stock: {product.current_stock}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Purchase Items Table */}
            {purchaseItems.length > 0 && (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>HSN/SAC</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>GST</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseItems.map((item, index) => (
                      <TableRow key={item.product_id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.product_name}</div>
                            <div className="text-sm text-slate-500">{item.unit_name}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{item.hsn_sac_code}</Badge>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) => updateItemQuantity(index, parseFloat(e.target.value) || 0)}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.rate}
                            onChange={(e) => updateItemRate(index, parseFloat(e.target.value) || 0)}
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell className="font-mono">
                          ₹{item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="font-mono">
                          <div className="text-sm">
                            <div>{item.gst_rate}%</div>
                            <div>₹{item.gst_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono font-semibold">
                          ₹{item.total_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    
                    {/* Totals Row */}
                    <TableRow className="bg-slate-50">
                      <TableCell colSpan={4} className="font-semibold text-right">
                        Totals:
                      </TableCell>
                      <TableCell className="font-mono font-semibold">
                        ₹{totals.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="font-mono font-semibold">
                        ₹{totals.total_gst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="font-mono font-bold text-lg">
                        ₹{totals.grand_total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}

            {purchaseItems.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <p>No products added yet. Search and add products above.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex items-center justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || purchaseItems.length === 0}>
            {loading ? (
              "Creating..."
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Create Purchase
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}