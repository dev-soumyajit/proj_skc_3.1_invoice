"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Calculator, Save, Send } from "lucide-react"

// Mock data
const customers = [
  { id: 1, name: "ABC Technologies Pvt Ltd", gstin: "27AABCU9603R1ZX", state: "Maharashtra", type: "B2B" },
  { id: 2, name: "XYZ Exports Ltd", gstin: "06AABCU9603R1ZY", state: "Delhi", type: "Export" },
  { id: 3, name: "SEZ Manufacturing Co", gstin: "24AABCU9603R1ZZ", state: "Gujarat", type: "SEZ" },
]

const products = [
  { id: 1, name: "Steel Rods - 12mm", hsn: "7213", unit: "KG", rate: 85.5, gst_rate: 18 },
  { id: 2, name: "Chemical Compound X", hsn: "2804", unit: "LTR", rate: 450.0, gst_rate: 12 },
  { id: 3, name: "Electronic Components", hsn: "8532", unit: "SET", rate: 1250.0, gst_rate: 18 },
]

interface InvoiceItem {
  id: string
  product_id: number
  product_name: string
  hsn_sac_code: string
  qty: number
  rate: number
  unit: string
  taxable_amt: number
  cgst_rate: number
  cgst_amt: number
  sgst_rate: number
  sgst_amt: number
  igst_rate: number
  igst_amt: number
  total_amount: number
}

export function CreateInvoiceForm() {
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null)
  const [invoiceData, setInvoiceData] = useState({
    invoice_date: new Date().toISOString().split("T")[0],
    supply_type: "B2B",
    place_supply: "",
    remarks: "",
  })
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [totals, setTotals] = useState({
    total_qty: 0,
    total_taxable: 0,
    total_cgst: 0,
    total_sgst: 0,
    total_igst: 0,
    grand_total: 0,
  })

  const customer = customers.find((c) => c.id === selectedCustomer)
  const isInterState = customer?.state !== "Maharashtra" // Assuming company is in Maharashtra

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      product_id: 0,
      product_name: "",
      hsn_sac_code: "",
      qty: 1,
      rate: 0,
      unit: "",
      taxable_amt: 0,
      cgst_rate: 0,
      cgst_amt: 0,
      sgst_rate: 0,
      sgst_amt: 0,
      igst_rate: 0,
      igst_amt: 0,
      total_amount: 0,
    }
    setItems([...items, newItem])
  }

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id))
    calculateTotals(items.filter((item) => item.id !== id))
  }

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    const updatedItems = items.map((item) => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value }

        // Auto-populate product details
        if (field === "product_id") {
          const product = products.find((p) => p.id === value)
          if (product) {
            updatedItem.product_name = product.name
            updatedItem.hsn_sac_code = product.hsn
            updatedItem.unit = product.unit
            updatedItem.rate = product.rate
            updatedItem.cgst_rate = isInterState ? 0 : product.gst_rate / 2
            updatedItem.sgst_rate = isInterState ? 0 : product.gst_rate / 2
            updatedItem.igst_rate = isInterState ? product.gst_rate : 0
          }
        }

        // Recalculate amounts
        if (field === "qty" || field === "rate" || field === "product_id") {
          updatedItem.taxable_amt = updatedItem.qty * updatedItem.rate
          updatedItem.cgst_amt = (updatedItem.taxable_amt * updatedItem.cgst_rate) / 100
          updatedItem.sgst_amt = (updatedItem.taxable_amt * updatedItem.sgst_rate) / 100
          updatedItem.igst_amt = (updatedItem.taxable_amt * updatedItem.igst_rate) / 100
          updatedItem.total_amount =
            updatedItem.taxable_amt + updatedItem.cgst_amt + updatedItem.sgst_amt + updatedItem.igst_amt
        }

        return updatedItem
      }
      return item
    })

    setItems(updatedItems)
    calculateTotals(updatedItems)
  }

  const calculateTotals = (itemsList: InvoiceItem[]) => {
    const newTotals = itemsList.reduce(
      (acc, item) => ({
        total_qty: acc.total_qty + item.qty,
        total_taxable: acc.total_taxable + item.taxable_amt,
        total_cgst: acc.total_cgst + item.cgst_amt,
        total_sgst: acc.total_sgst + item.sgst_amt,
        total_igst: acc.total_igst + item.igst_amt,
        grand_total: acc.grand_total + item.total_amount,
      }),
      { total_qty: 0, total_taxable: 0, total_cgst: 0, total_sgst: 0, total_igst: 0, grand_total: 0 },
    )
    setTotals(newTotals)
  }

  const handleSaveDraft = () => {
    console.log("Saving draft invoice...", { customer, invoiceData, items, totals })
    // API call to save draft
  }

  const handleSubmit = () => {
    console.log("Submitting invoice...", { customer, invoiceData, items, totals })
    // API call to create and submit invoice
  }

  return (
    <div className="space-y-6">
      {/* Invoice Header */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
          <CardDescription>Enter customer and invoice information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer">Customer *</Label>
              <Select
                value={selectedCustomer?.toString() || ""}
                onValueChange={(value) => setSelectedCustomer(Number.parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id.toString()}>
                      <div>
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-slate-500">{customer.gstin}</div>
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
                value={invoiceData.invoice_date}
                onChange={(e) => setInvoiceData({ ...invoiceData, invoice_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supply_type">Supply Type *</Label>
              <Select
                value={invoiceData.supply_type}
                onValueChange={(value) => setInvoiceData({ ...invoiceData, supply_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="B2B">B2B</SelectItem>
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
                value={invoiceData.place_supply}
                onChange={(e) => setInvoiceData({ ...invoiceData, place_supply: e.target.value })}
                placeholder="Enter place of supply"
              />
            </div>
          </div>

          {customer && (
            <div className="p-4 bg-slate-50 rounded-lg">
              <h4 className="font-medium text-slate-900 mb-2">Customer Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Company:</span>
                  <div className="font-medium">{customer.name}</div>
                </div>
                <div>
                  <span className="text-slate-500">GSTIN:</span>
                  <div className="font-mono">{customer.gstin}</div>
                </div>
                <div>
                  <span className="text-slate-500">State:</span>
                  <div>{customer.state}</div>
                  {isInterState && (
                    <Badge variant="outline" className="mt-1">
                      Inter-State (IGST)
                    </Badge>
                  )}
                  {!isInterState && (
                    <Badge variant="outline" className="mt-1">
                      Intra-State (CGST+SGST)
                    </Badge>
                  )}
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
          {items.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p>No items added yet. Click "Add Item" to get started.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>HSN/SAC</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Taxable Amt</TableHead>
                    <TableHead>GST</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Select
                          value={item.product_id.toString()}
                          onValueChange={(value) => updateItem(item.id, "product_id", Number.parseInt(value))}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id.toString()}>
                                {product.name}
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
                          onChange={(e) => updateItem(item.id, "qty", Number.parseFloat(e.target.value) || 0)}
                          className="w-20"
                          min="0"
                          step="0.01"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.rate}
                          onChange={(e) => updateItem(item.id, "rate", Number.parseFloat(e.target.value) || 0)}
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
                              <div>CGST: ₹{item.cgst_amt.toFixed(2)}</div>
                              <div>SGST: ₹{item.sgst_amt.toFixed(2)}</div>
                            </>
                          )}
                          {isInterState && <div>IGST: ₹{item.igst_amt.toFixed(2)}</div>}
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
      {items.length > 0 && (
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
                  <span className="font-mono">{totals.total_qty.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Taxable Amount:</span>
                  <span className="font-mono">₹{totals.total_taxable.toFixed(2)}</span>
                </div>
                {!isInterState && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-600">CGST:</span>
                      <span className="font-mono">₹{totals.total_cgst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">SGST:</span>
                      <span className="font-mono">₹{totals.total_sgst.toFixed(2)}</span>
                    </div>
                  </>
                )}
                {isInterState && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">IGST:</span>
                    <span className="font-mono">₹{totals.total_igst.toFixed(2)}</span>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-lg font-semibold border-t pt-3">
                  <span>Grand Total:</span>
                  <span className="font-mono">₹{totals.grand_total.toFixed(2)}</span>
                </div>
                <div className="text-sm text-slate-600">
                  Amount in words: {/* Add number to words conversion */}
                  <span className="italic">
                    Rupees {Math.floor(totals.grand_total).toLocaleString("en-IN")} and{" "}
                    {Math.round((totals.grand_total % 1) * 100)} Paise Only
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                value={invoiceData.remarks}
                onChange={(e) => setInvoiceData({ ...invoiceData, remarks: e.target.value })}
                placeholder="Enter any additional remarks or terms"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-4">
        <Button variant="outline" onClick={handleSaveDraft}>
          <Save className="mr-2 h-4 w-4" />
          Save as Draft
        </Button>
        <Button onClick={handleSubmit} disabled={items.length === 0 || !selectedCustomer}>
          <Send className="mr-2 h-4 w-4" />
          Generate Invoice
        </Button>
      </div>
    </div>
  )
}
