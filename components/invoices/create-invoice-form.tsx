// components/invoices/enhanced-invoice-form-with-search.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { debounce } from "lodash"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Plus, 
  Trash2, 
  Calculator, 
  Save, 
  Send, 
  Search,
  Package,
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Loader2,
  ShoppingCart
} from "lucide-react"

import { AdvancedProductSearch } from "../products/advanced-product-search"

interface Product {
  product_id: number
  product_code: string
  product_name: string
  product_desc: string
  product_category: string
  brand: string
  rate: number
  hsn_sac_code: string
  gst_rate: number
  unit_name: string
}

interface InvoiceItem {
  id: string
  product_id: number
  product_code: string
  product_name: string
  product_description: string
  hsn_sac_code: string
  qty: number
  rate: number
  unit: string
  discount: number
  taxable_amt: number
  cgst_rate: number
  cgst_amt: number
  sgst_rate: number
  sgst_amt: number
  igst_rate: number
  igst_amt: number
  total_amount: number
}

interface InvoiceFormData {
  customer_id: number | null
  invoice_date: string
  supply_type: string
  place_supply: string
  remarks: string
  items: InvoiceItem[]
}

export function CreateInvoiceForm() {
  const [formData, setFormData] = useState<InvoiceFormData>({
    customer_id: null,
    invoice_date: new Date().toISOString().split("T")[0],
    supply_type: "B2B",
    place_supply: "",
    remarks: "",
    items: []
  })

  const [customers, setCustomers] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [showProductDialog, setShowProductDialog] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)

  // Quick search states
  const [quickSearch, setQuickSearch] = useState("")
  const [quickSearchResults, setQuickSearchResults] = useState<Product[]>([])
  const [showQuickResults, setShowQuickResults] = useState(false)
  const [quickSearchLoading, setQuickSearchLoading] = useState(false)

  const [totals, setTotals] = useState({
    totalQty: 0,
    totalTaxable: 0,
    totalCgst: 0,
    totalSgst: 0,
    totalIgst: 0,
    grandTotal: 0
  })

  const selectedCustomer = customers.find(c => c.customer_id === formData.customer_id)
  const isInterState = selectedCustomer?.customer_state_code !== "27" // Assuming company is in Maharashtra

  useEffect(() => {
    fetchCustomers()
  }, [])

  useEffect(() => {
    calculateTotals()
  }, [formData.items, selectedCustomer])

  // Debounced quick search
  const debouncedQuickSearch = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) {
        setQuickSearchResults([])
        setShowQuickResults(false)
        return
      }

      setQuickSearchLoading(true)
      try {
        const response = await fetch(`/api/products/suggest?q=${encodeURIComponent(query)}&limit=10`)
        const data = await response.json()
        setQuickSearchResults(data.suggestions || [])
        setShowQuickResults(true)
      } catch (error) {
        console.error('Quick search failed:', error)
      } finally {
        setQuickSearchLoading(false)
      }
    }, 300),
    []
  )

  useEffect(() => {
    if (quickSearch) {
      debouncedQuickSearch(quickSearch)
    } else {
      setShowQuickResults(false)
    }
  }, [quickSearch, debouncedQuickSearch])

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customers")
      const data = await response.json()
      setCustomers(data.customers || [])
    } catch (error) {
      console.error("Failed to fetch customers:", error)
    }
  }

  const calculateTotals = () => {
    const newTotals = formData.items.reduce(
      (acc, item) => ({
        totalQty: acc.totalQty + item.qty,
        totalTaxable: acc.totalTaxable + item.taxable_amt,
        totalCgst: acc.totalCgst + item.cgst_amt,
        totalSgst: acc.totalSgst + item.sgst_amt,
        totalIgst: acc.totalIgst + item.igst_amt,
        grandTotal: acc.grandTotal + item.total_amount
      }),
      { totalQty: 0, totalTaxable: 0, totalCgst: 0, totalSgst: 0, totalIgst: 0, grandTotal: 0 }
    )
    setTotals(newTotals)
  }

  const addProductsToInvoice = (products: Product[]) => {
    const newItems: InvoiceItem[] = products.map(product => ({
      id: `${product.product_id}_${Date.now()}_${Math.random()}`,
      product_id: product.product_id,
      product_code: product.product_code,
      product_name: product.product_name,
      product_description: product.product_desc,
      hsn_sac_code: product.hsn_sac_code,
      qty: 1,
      rate: product.rate || 0,
      unit: product.unit_name,
      discount: 0,
      taxable_amt: product.rate || 0,
      cgst_rate: isInterState ? 0 : (product.gst_rate || 0) / 2,
      cgst_amt: isInterState ? 0 : ((product.rate || 0) * (product.gst_rate || 0)) / 200,
      sgst_rate: isInterState ? 0 : (product.gst_rate || 0) / 2,
      sgst_amt: isInterState ? 0 : ((product.rate || 0) * (product.gst_rate || 0)) / 200,
      igst_rate: isInterState ? (product.gst_rate || 0) : 0,
      igst_amt: isInterState ? ((product.rate || 0) * (product.gst_rate || 0)) / 100 : 0,
      total_amount: (product.rate || 0) + ((product.rate || 0) * (product.gst_rate || 0)) / 100
    }))

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, ...newItems]
    }))

    setShowProductDialog(false)
  }

  const addQuickSearchProduct = (product: Product) => {
    addProductsToInvoice([product])
    setQuickSearch("")
    setShowQuickResults(false)
  }

  const removeItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }))
  }

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id !== id) return item

        const updatedItem = { ...item, [field]: value }

        // Recalculate amounts when qty, rate, or discount changes
        if (field === "qty" || field === "rate" || field === "discount") {
          const baseAmount = updatedItem.qty * updatedItem.rate
          updatedItem.taxable_amt = baseAmount - (updatedItem.discount || 0)
          
          if (isInterState) {
            updatedItem.cgst_amt = 0
            updatedItem.sgst_amt = 0
            updatedItem.igst_amt = (updatedItem.taxable_amt * updatedItem.igst_rate) / 100
          } else {
            updatedItem.cgst_amt = (updatedItem.taxable_amt * updatedItem.cgst_rate) / 100
            updatedItem.sgst_amt = (updatedItem.taxable_amt * updatedItem.sgst_rate) / 100
            updatedItem.igst_amt = 0
          }
          
          updatedItem.total_amount = updatedItem.taxable_amt + updatedItem.cgst_amt + updatedItem.sgst_amt + updatedItem.igst_amt
        }

        return updatedItem
      })
    }))
  }

  const validateForm = async (): Promise<boolean> => {
    const errors: string[] = []

    if (!formData.customer_id) {
      errors.push("Please select a customer")
    }

    if (!formData.invoice_date) {
      errors.push("Invoice date is required")
    }

    if (formData.items.length === 0) {
      errors.push("Please add at least one item to the invoice")
    }

    // Validate each item
    formData.items.forEach((item, index) => {
      if (!item.product_name) {
        errors.push(`Item ${index + 1}: Product name is required`)
      }
      if (!item.hsn_sac_code) {
        errors.push(`Item ${index + 1}: HSN/SAC code is required`)
      }
      if (item.qty <= 0) {
        errors.push(`Item ${index + 1}: Quantity must be greater than 0`)
      }
      if (item.rate < 0) {
        errors.push(`Item ${index + 1}: Rate cannot be negative`)
      }
    })

    setValidationErrors(errors)
    return errors.length === 0
  }

  const handleSubmit = async (isDraft: boolean = false) => {
    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      if (!isDraft && !(await validateForm())) {
        setIsSubmitting(false)
        return
      }

      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          status: isDraft ? 'draft' : 'generated'
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSubmitStatus('success')
        
        // Optionally submit to GST immediately if not draft
        if (!isDraft && data.invoiceId) {
          await submitToGST(data.invoiceId)
        }
        
        // Reset form
        setTimeout(() => {
          setFormData({
            customer_id: null,
            invoice_date: new Date().toISOString().split("T")[0],
            supply_type: "B2B",
            place_supply: "",
            remarks: "",
            items: []
          })
          setSubmitStatus('idle')
        }, 2000)
      } else {
        setSubmitStatus('error')
        setValidationErrors([data.error || 'Failed to create invoice'])
      }
    } catch (error) {
      console.error("Submit error:", error)
      setSubmitStatus('error')
      setValidationErrors(['Network error occurred'])
    } finally {
      setIsSubmitting(false)
    }
  }

  const submitToGST = async (invoiceId: number) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/submit-gst`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })

      const data = await response.json()
      
      if (data.success) {
        console.log("GST submission successful:", data.data)
      } else {
        console.error("GST submission failed:", data.errors)
      }
    } catch (error) {
      console.error("GST submission error:", error)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Create Invoice</h1>
          <p className="text-muted-foreground">Generate GST-compliant invoices with advanced product search</p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {isInterState ? "Inter-State (IGST)" : "Intra-State (CGST+SGST)"}
        </Badge>
      </div>

      {/* Status Messages */}
      {validationErrors.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription>
            <ul className="list-disc list-inside">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-red-800">{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {submitStatus === 'success' && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Invoice created successfully!
          </AlertDescription>
        </Alert>
      )}

      {/* Invoice Header Form */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
          <CardDescription>Customer and invoice information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer">Customer *</Label>
              <Select
                value={formData.customer_id?.toString() || ""}
                onValueChange={(value) => setFormData(prev => ({
                  ...prev, 
                  customer_id: parseInt(value),
                  place_supply: customers.find(c => c.customer_id === parseInt(value))?.customer_state_name || ""
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.customer_id} value={customer.customer_id.toString()}>
                      <div>
                        <div className="font-medium">{customer.customer_company_name}</div>
                        <div className="text-sm text-slate-500">{customer.customer_gst_in}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoice_date">Invoice Date *</Label>
              <Input
                id="invoice_date"
                type="date"
                value={formData.invoice_date}
                onChange={(e) => setFormData(prev => ({ ...prev, invoice_date: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supply_type">Supply Type *</Label>
              <Select
                value={formData.supply_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, supply_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="B2B">B2B - Business to Business</SelectItem>
                  <SelectItem value="SEZWP">SEZ with Payment</SelectItem>
                  <SelectItem value="SEZWOP">SEZ without Payment</SelectItem>
                  <SelectItem value="EXPWP">Export with Payment</SelectItem>
                  <SelectItem value="EXPWOP">Export without Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="place_supply">Place of Supply</Label>
              <Input
                id="place_supply"
                value={formData.place_supply}
                onChange={(e) => setFormData(prev => ({ ...prev, place_supply: e.target.value }))}
                placeholder="Enter place of supply"
              />
            </div>
          </div>

          {selectedCustomer && (
            <div className="p-4 bg-slate-50 rounded-lg">
              <h4 className="font-medium text-slate-900 mb-2">Customer Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Company:</span>
                  <div className="font-medium">{selectedCustomer.customer_company_name}</div>
                </div>
                <div>
                  <span className="text-slate-500">GSTIN:</span>
                  <div className="font-mono">{selectedCustomer.customer_gst_in}</div>
                </div>
                <div>
                  <span className="text-slate-500">State:</span>
                  <div>{selectedCustomer.customer_state_name}</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Search and Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Invoice Items</CardTitle>
              <CardDescription>Add products to your invoice with advanced search</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Package className="mr-2 h-4 w-4" />
                    Browse Products
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-6xl max-h-[90vh]">
                  <DialogHeader>
                    <DialogTitle>Select Products</DialogTitle>
                  </DialogHeader>
                  <AdvancedProductSearch 
                    multiSelect={true}
                    onProductSelect={addProductsToInvoice}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Search Bar */}
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Quick search products by name, code, or brand..."
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                className="pl-10"
              />
              {quickSearchLoading && (
                <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            
            {/* Quick Search Results */}
            {showQuickResults && quickSearchResults.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-64 overflow-y-auto">
                {quickSearchResults.map((product) => (
                  <div
                    key={product.product_id}
                    className="p-3 hover:bg-gray-100 cursor-pointer border-b flex items-center justify-between"
                    onClick={() => addQuickSearchProduct(product)}
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">{product.product_name}</div>
                      <div className="text-xs text-gray-500">
                        Code: {product.product_code} | Brand: {product.brand} | HSN: {product.hsn_sac_code}
                      </div>
                      <div className="text-xs text-blue-600">₹{product.rate} | GST: {product.gst_rate}%</div>
                    </div>
                    <Button size="sm" variant="outline">
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Invoice Items Table */}
          {formData.items.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
              <ShoppingCart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 mb-4">No items added yet</p>
              <p className="text-sm text-gray-400">Use quick search above or browse products to add items</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Details</TableHead>
                    <TableHead>HSN/SAC</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Taxable Amt</TableHead>
                    <TableHead>GST</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formData.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="min-w-[200px]">
                        <div>
                          <div className="font-medium">{item.product_name}</div>
                          <div className="text-xs text-gray-500 mt-1">{item.product_code}</div>
                          {item.product_description && (
                            <div className="text-xs text-gray-400 mt-1 line-clamp-2">
                              {item.product_description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{item.hsn_sac_code}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.qty}
                          onChange={(e) => updateItem(item.id, "qty", parseFloat(e.target.value) || 0)}
                          className="w-20"
                          min="0"
                          step="0.01"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.rate}
                          onChange={(e) => updateItem(item.id, "rate", parseFloat(e.target.value) || 0)}
                          className="w-24"
                          min="0"
                          step="0.01"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.discount}
                          onChange={(e) => updateItem(item.id, "discount", parseFloat(e.target.value) || 0)}
                          className="w-20"
                          min="0"
                          step="0.01"
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">₹{item.taxable_amt.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="text-xs">
                          {!isInterState && (
                            <>
                              <div>CGST ({item.cgst_rate}%): ₹{item.cgst_amt.toFixed(2)}</div>
                              <div>SGST ({item.sgst_rate}%): ₹{item.sgst_amt.toFixed(2)}</div>
                            </>
                          )}
                          {isInterState && (
                            <div>IGST ({item.igst_rate}%): ₹{item.igst_amt.toFixed(2)}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono font-semibold">₹{item.total_amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Summary */}
      {formData.items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calculator className="mr-2 h-5 w-5" />
              Invoice Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Quantity:</span>
                  <span className="font-mono">{totals.totalQty.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Taxable Amount:</span>
                  <span className="font-mono">₹{totals.totalTaxable.toFixed(2)}</span>
                </div>
                {!isInterState && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-600">CGST:</span>
                      <span className="font-mono">₹{totals.totalCgst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">SGST:</span>
                      <span className="font-mono">₹{totals.totalSgst.toFixed(2)}</span>
                    </div>
                  </>
                )}
                {isInterState && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">IGST:</span>
                    <span className="font-mono">₹{totals.totalIgst.toFixed(2)}</span>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-lg font-semibold border-t pt-3">
                  <span>Grand Total:</span>
                  <span className="font-mono text-blue-600">₹{totals.grandTotal.toFixed(2)}</span>
                </div>
                <div className="text-sm text-slate-600">
                  <span className="italic">
                    Rupees {Math.floor(totals.grandTotal).toLocaleString("en-IN")} and{" "}
                    {Math.round((totals.grandTotal % 1) * 100)} Paise Only
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                value={formData.remarks}
                onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                placeholder="Enter any additional remarks, terms and conditions"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-4">
        <Button 
          variant="outline" 
          onClick={() => handleSubmit(true)}
          disabled={isSubmitting || formData.items.length === 0 || !formData.customer_id}
        >
          <Save className="mr-2 h-4 w-4" />
          Save as Draft
        </Button>
        <Button 
          onClick={() => handleSubmit(false)}
          disabled={isSubmitting || formData.items.length === 0 || !formData.customer_id}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Generate & Submit to GST
            </>
          )}
        </Button>
      </div>

      {/* Help Section */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 mb-1">Invoice Creation Tips:</p>
              <ul className="text-blue-800 space-y-1">
                <li>• Use the quick search bar to rapidly find products by name, code, or brand</li>
                <li>• Click "Browse Products" for advanced filtering and batch selection</li>
                <li>• GST rates are automatically calculated based on customer location</li>
                <li>• Save as draft to continue editing later, or generate to submit to GST immediately</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}