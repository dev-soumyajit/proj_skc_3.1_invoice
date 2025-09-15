// components/invoices/enhanced-invoice-form.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Trash2, Calculator, Save, Send, CheckCircle, XCircle, AlertCircle } from "lucide-react"

interface ValidationError {
  field: string
  message: string
}

interface InvoiceFormData {
  customer_id: number | null
  invoice_date: string
  supply_type: string
  place_supply: string
  remarks: string
  items: InvoiceItem[]
}

interface InvoiceItem {
  id: string
  product_id: number
  product_name: string
  hsn_sac_code: string
  qty: number
  rate: number
  unit: string
  unit_id: number
  taxable_amt: number
  discount: number
  cgst_rate: number
  cgst_amt: number
  sgst_rate: number
  sgst_amt: number
  igst_rate: number
  igst_amt: number
  total_amount: number
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
  const [products, setProducts] = useState<any[]>([])
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [isValidating, setIsValidating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
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
    fetchProducts()
  }, [])

  useEffect(() => {
    calculateTotals()
  }, [formData.items, selectedCustomer])

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customers")
      const data = await response.json()
      setCustomers(data.customers || [])
    } catch (error) {
      console.error("Failed to fetch customers:", error)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products")
      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error("Failed to fetch products:", error)
    }
  }

  const validateForm = async (): Promise<boolean> => {
    setIsValidating(true)
    setValidationErrors([])

    try {
      const response = await fetch("/api/invoices/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      const data = await response.json()
      
      if (!data.valid) {
        setValidationErrors(data.errors.map((error: string) => ({ 
          field: 'general', 
          message: error 
        })))
        return false
      }

      return true
    } catch (error) {
      console.error("Validation error:", error)
      setValidationErrors([{ field: 'general', message: 'Validation failed' }])
      return false
    } finally {
      setIsValidating(false)
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

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      product_id: 0,
      product_name: "",
      hsn_sac_code: "",
      qty: 1,
      rate: 0,
      unit: "",
      unit_id: 0,
      taxable_amt: 0,
      discount: 0,
      cgst_rate: 0,
      cgst_amt: 0,
      sgst_rate: 0,
      sgst_amt: 0,
      igst_rate: 0,
      igst_amt: 0,
      total_amount: 0
    }
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }))
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

        // Auto-populate product details
        if (field === "product_id") {
          const product = products.find(p => p.product_id === value)
          if (product) {
            updatedItem.product_name = product.product_name
            updatedItem.hsn_sac_code = product.hsn_sac_code
            updatedItem.unit = product.unit_name
            updatedItem.unit_id = product.unit_id
            updatedItem.rate = product.rate || 0
            
            // Set GST rates based on inter-state or intra-state
            if (isInterState) {
              updatedItem.cgst_rate = 0
              updatedItem.sgst_rate = 0
              updatedItem.igst_rate = product.gst_rate || 0
            } else {
              updatedItem.cgst_rate = (product.gst_rate || 0) / 2
              updatedItem.sgst_rate = (product.gst_rate || 0) / 2
              updatedItem.igst_rate = 0
            }
          }
        }

        // Recalculate amounts when qty or rate changes
        if (field === "qty" || field === "rate" || field === "product_id") {
          updatedItem.taxable_amt = updatedItem.qty * updatedItem.rate - (updatedItem.discount || 0)
          
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
        setValidationErrors([{ field: 'general', message: data.error || 'Failed to create invoice' }])
      }
    } catch (error) {
      console.error("Submit error:", error)
      setSubmitStatus('error')
      setValidationErrors([{ field: 'general', message: 'Network error occurred' }])
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
    <div className="space-y-6">
      {/* Status Messages */}
      {validationErrors.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription>
            <ul className="list-disc list-inside">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-red-800">{error.message}</li>
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

      {/* Invoice Header */}
      <Card>
        <CardHeader>
          <CardTitle>Create Tax Invoice</CardTitle>
          <CardDescription>Enter customer and invoice information for GST e-invoice generation</CardDescription>
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
                  <Badge variant="outline" className="mt-1">
                    {isInterState ? "Inter-State (IGST)" : "Intra-State (CGST+SGST)"}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Invoice Items</CardTitle>
              <CardDescription>Add products and services to the invoice</CardDescription>
            </div>
            <Button onClick={addItem}>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {formData.items.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <AlertCircle className="mx-auto h-12 w-12 text-slate-300 mb-4" />
              <p>No items added yet. Click "Add Item" to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>HSN/SAC</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Taxable Amount</TableHead>
                      <TableHead>GST</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Select
                            value={item.product_id.toString() || ""}
                            onValueChange={(value) => updateItem(item.id, "product_id", parseInt(value))}
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem key={product.product_id} value={product.product_id.toString()}>
                                  <div>
                                    <div className="font-medium">{product.product_name}</div>
                                    <div className="text-xs text-slate-500">HSN: {product.hsn_sac_code}</div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                        <TableCell className="font-mono">₹{item.taxable_amt.toFixed(2)}</TableCell>
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
                  <span className="font-mono">₹{totals.grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                value={formData.remarks}
                onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                placeholder="Enter any additional remarks or terms"
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
        >
          <Send className="mr-2 h-4 w-4" />
          {isSubmitting ? 'Generating...' : 'Generate & Submit to GST'}
        </Button>
      </div>
    </div>
  )
}