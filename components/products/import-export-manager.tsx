"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, Download, RefreshCw, AlertCircle } from "lucide-react"

export function ImportExportManager() {
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportFormat, setExportFormat] = useState("csv")
  const [status, setStatus] = useState<{ successCount?: number; errorCount?: number; error?: string } | null>(null)

  // Handle file selection for import
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      setStatus({ error: "No file selected" })
      return
    }

    // Validate file type
    const allowedTypes = [".csv", ".xlsx", ".xls"]
    const fileExtension = `.${file.name.split(".").pop()?.toLowerCase()}`
    if (!allowedTypes.includes(fileExtension)) {
      setStatus({ error: "Please select a CSV or Excel file (.csv, .xlsx, .xls)" })
      event.target.value = ""
      return
    }

    setImporting(true)
    setStatus(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/products/import", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Import failed: ${response.status}`)
      }

      const result = await response.json()
      setStatus({
        successCount: result.successCount || 0,
        errorCount: result.errorCount || 0,
      })
      event.target.value = "" // Clear input after success
    } catch (error) {
      console.error("Import error:", error)
      setStatus({ error: "Import failed. Please check the file format and try again." })
      event.target.value = "" // Clear input on error
    } finally {
      setImporting(false)
    }
  }

  // Handle export
  const handleExport = async () => {
    setExporting(true)
    setStatus(null)

    try {
      const response = await fetch(`/api/products/export?format=${exportFormat}`)
      if (!response.ok) {
        throw new Error(`Export failed: ${response.status}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `products_export_${new Date().toISOString().split("T")[0]}.${exportFormat}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Export error:", error)
      setStatus({ error: "Export failed. Please try again." })
    } finally {
      setExporting(false)
    }
  }

  // Handle template download
  const downloadTemplate = () => {
    const csvContent = `product_code,product_name,product_desc,product_type,product_category,product_subcategory,brand,manufacturer,model_number,hsn_sac_code,unit_name,rate,keywords
K0206092,KIT 1" V NRV REPLACE SS10 220,Valve replacement kit,finished,Valves,NRV,ELGI,ELGI,K0206092,84149019,Piece,3404,valve replacement kit
B313806,1 1/2"BSP 60 BALL VALVE,Ball valve 1.5 inch,finished,Valves,Ball Valve,ELGI,ELGI,B313806,84818030,Piece,8080,ball valve 1.5 inch`

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "product_import_template.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
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
              Ensure your file matches the template format. Download the template to get started.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={downloadTemplate}
              disabled={importing}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>

            <label htmlFor="file-upload" className="w-full">
              <Button
                variant="default"
                className="w-full justify-center"
                disabled={importing}
                asChild
              >
                <div>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileSelect}
                    disabled={importing}
                    className="sr-only"
                  />
                  {importing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Choose File to Import
                    </>
                  )}
                </div>
              </Button>
            </label>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>Supported formats:</p>
            <ul className="list-disc list-inside mt-1">
              <li>CSV (.csv)</li>
              <li>Excel (.xlsx, .xls)</li>
            </ul>
          </div>

          {status && (
            <Alert variant={status.error ? "destructive" : "default"}>
              <AlertDescription>
                {status.error ? (
                  <span>{status.error}</span>
                ) : (
                  <span>
                    Imported {status.successCount} products successfully
                    {status.errorCount ? `, ${status.errorCount} failed` : ""}
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle>Export Products</CardTitle>
          <CardDescription>Download your product catalog</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="export-format">Export Format</Label>
            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectTrigger id="export-format">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="xlsx">Excel</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Include Fields</Label>
            <div className="space-y-2">
              {["Basic Info", "Pricing", "Stock Levels", "Categories", "Metadata"].map(
                (field) => (
                  <div key={field} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{field}</span>
                  </div>
                )
              )}
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