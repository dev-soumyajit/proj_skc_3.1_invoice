"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Send, Edit, Trash2, FileText, QrCode } from "lucide-react"

interface InvoiceDetailProps {
  invoiceId: string
}

// Mock invoice data
const invoiceData = {
  invoice_id: 1,
  invoice_no: "INV-2024-001",
  invoice_date: "2024-02-16",
  customer_company_name: "ABC Technologies Pvt Ltd",
  customer_address: "123 Business Park, Andheri East, Mumbai, Maharashtra - 400069",
  buyer_gstin: "27AABCU9603R1ZX",
  supply_type: "B2B",
  place_supply: "Maharashtra",
  grand_total_qty: 500.0,
  grand_total_taxable_amt: 105932.2,
  grand_total_cgst_amt: 9534.9,
  grand_total_sgst_amt: 9534.9,
  grand_total_amt: 125000.0,
  amount_chargeable_word: "Rupees One Lakh Twenty Five Thousand Only",
  status: "generated",
  irn: "1234567890123456789012345678901234567890123456789012345678901234",
  ack_no: "112010054812345",
  ack_date: "2024-02-16T10:30:00Z",
  qr_code_url:
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  remarks: "Payment terms: 30 days from invoice date",
  items: [
    {
      product_name: "Steel Rods - 12mm",
      hsn_sac_code: "7213",
      qty: 500,
      rate: 85.5,
      unit: "KG",
      taxable_amt: 42750.0,
      cgst_rate: 9,
      cgst_amt: 3847.5,
      sgst_rate: 9,
      sgst_amt: 3847.5,
      total_amount: 50445.0,
    },
    {
      product_name: "Chemical Compound X",
      qty: 140,
      rate: 450.0,
      unit: "LTR",
      hsn_sac_code: "2804",
      taxable_amt: 63000.0,
      cgst_rate: 6,
      cgst_amt: 3780.0,
      sgst_rate: 6,
      sgst_amt: 3780.0,
      total_amount: 70560.0,
    },
  ],
}

export function InvoiceDetail({ invoiceId }: InvoiceDetailProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-slate-100 text-slate-800"
      case "generated":
        return "bg-blue-100 text-blue-800"
      case "submitted":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-slate-100 text-slate-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Invoice {invoiceData.invoice_no}</h1>
          <p className="text-slate-600 mt-2">Tax Invoice Details and GST Information</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          {invoiceData.status === "draft" && (
            <Button>
              <Send className="mr-2 h-4 w-4" />
              Submit to GST
            </Button>
          )}
        </div>
      </div>

      {/* Invoice Status */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className={getStatusColor(invoiceData.status)}>
                {invoiceData.status.toUpperCase()}
              </Badge>
              <span className="text-slate-600">Supply Type: {invoiceData.supply_type}</span>
            </div>
            {invoiceData.irn && (
              <div className="text-right">
                <div className="text-sm text-slate-600">IRN Generated</div>
                <div className="text-xs text-green-600">ACK: {invoiceData.ack_no}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-slate-900">{invoiceData.customer_company_name}</h4>
                <p className="text-slate-600 mt-1">{invoiceData.customer_address}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-slate-500">GSTIN:</span>
                  <div className="font-mono">{invoiceData.buyer_gstin}</div>
                </div>
                <div>
                  <span className="text-sm text-slate-500">Place of Supply:</span>
                  <div>{invoiceData.place_supply}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Items */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Description</TableHead>
                      <TableHead>HSN/SAC</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Taxable Amount</TableHead>
                      <TableHead>CGST</TableHead>
                      <TableHead>SGST</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoiceData.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.product_name}</TableCell>
                        <TableCell className="font-mono text-sm">{item.hsn_sac_code}</TableCell>
                        <TableCell>
                          {item.qty} {item.unit}
                        </TableCell>
                        <TableCell className="font-mono">₹{item.rate.toFixed(2)}</TableCell>
                        <TableCell className="font-mono">₹{item.taxable_amt.toFixed(2)}</TableCell>
                        <TableCell className="font-mono">
                          <div className="text-xs">
                            <div>{item.cgst_rate}%</div>
                            <div>₹{item.cgst_amt.toFixed(2)}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">
                          <div className="text-xs">
                            <div>{item.sgst_rate}%</div>
                            <div>₹{item.sgst_amt.toFixed(2)}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono font-semibold">₹{item.total_amount.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Invoice Totals */}
              <div className="mt-6 border-t pt-4">
                <div className="flex justify-end">
                  <div className="w-80 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Total Quantity:</span>
                      <span className="font-mono">{invoiceData.grand_total_qty}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Taxable Amount:</span>
                      <span className="font-mono">₹{invoiceData.grand_total_taxable_amt.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">CGST:</span>
                      <span className="font-mono">₹{invoiceData.grand_total_cgst_amt.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">SGST:</span>
                      <span className="font-mono">₹{invoiceData.grand_total_sgst_amt.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold border-t pt-2">
                      <span>Grand Total:</span>
                      <span className="font-mono">₹{invoiceData.grand_total_amt.toFixed(2)}</span>
                    </div>
                    <div className="text-sm text-slate-600 italic">{invoiceData.amount_chargeable_word}</div>
                  </div>
                </div>
              </div>

              {invoiceData.remarks && (
                <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-medium text-slate-900 mb-2">Remarks</h4>
                  <p className="text-slate-600">{invoiceData.remarks}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* GST Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                GST Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-sm text-slate-500">Invoice Date:</span>
                <div className="font-medium">{invoiceData.invoice_date}</div>
              </div>
              {invoiceData.irn && (
                <>
                  <div>
                    <span className="text-sm text-slate-500">IRN:</span>
                    <div className="font-mono text-xs break-all">{invoiceData.irn}</div>
                  </div>
                  <div>
                    <span className="text-sm text-slate-500">Acknowledgment No:</span>
                    <div className="font-mono">{invoiceData.ack_no}</div>
                  </div>
                  <div>
                    <span className="text-sm text-slate-500">Acknowledgment Date:</span>
                    <div>{new Date(invoiceData.ack_date).toLocaleString()}</div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* QR Code */}
          {invoiceData.qr_code_url && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <QrCode className="mr-2 h-5 w-5" />
                  GST QR Code
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="w-32 h-32 bg-slate-100 rounded-lg mx-auto flex items-center justify-center">
                  <QrCode className="h-16 w-16 text-slate-400" />
                </div>
                <p className="text-xs text-slate-500 mt-2">Scan for GST verification</p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full bg-transparent">
                <FileText className="mr-2 h-4 w-4" />
                View GST Logs
              </Button>
              <Button variant="outline" className="w-full bg-transparent">
                <Download className="mr-2 h-4 w-4" />
                Download JSON
              </Button>
              {invoiceData.status !== "cancelled" && (
                <Button variant="outline" className="w-full text-red-600 hover:text-red-700 bg-transparent">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Cancel Invoice
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
