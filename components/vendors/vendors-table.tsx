"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Search, MoreHorizontal, Edit, Trash2, Eye, Loader2, Phone, MapPin } from "lucide-react"
import { toast } from "sonner"

interface Vendor {
  vendor_id: number
  vendor_name: string
  vendor_person_name: string
  vendor_contact_no: string
  vendor_state: string
  vendor_state_code: string
  vendor_gst: string
  vendor_address: string
  created_at: string
}

interface VendorsTableProps {
  onEditVendor: (vendor: Vendor) => void
}

export function VendorsTable({ onEditVendor }: VendorsTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; vendor: Vendor | null }>({
    open: false,
    vendor: null
  })
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchVendors()
  }, [])

  const fetchVendors = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/vendors")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      console.log('Vendor API response:', data) // Debug the response
      if (data.success) {
        setVendors(data.data || [])
        setFilteredVendors(data.data || [])
      } else {
        throw new Error(data.error || "Failed to fetch vendors")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load vendors")
      toast.error(err instanceof Error ? err.message : "Failed to load vendors")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    const filtered = vendors.filter(
      (vendor) =>
        vendor.vendor_name.toLowerCase().includes(value.toLowerCase()) ||
        vendor.vendor_person_name.toLowerCase().includes(value.toLowerCase()) ||
        vendor.vendor_gst.toLowerCase().includes(value.toLowerCase()) ||
        vendor.vendor_state.toLowerCase().includes(value.toLowerCase())
    )
    setFilteredVendors(filtered)
  }

  const handleDeleteVendor = async (vendor: Vendor) => {
    setDeleteDialog({ open: true, vendor })
  }

  const confirmDelete = async () => {
    if (!deleteDialog.vendor) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/vendors/${deleteDialog.vendor.vendor_id}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        throw new Error("Failed to delete vendor")
      }

      toast.success("Vendor deleted successfully")
      setDeleteDialog({ open: false, vendor: null })
      fetchVendors() // Refresh the list
    } catch (error) {
      console.error("Delete vendor error:", error)
      toast.error("Failed to delete vendor")
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN")
  }

  const formatGST = (gst: string) => {
    if (gst.length === 15) {
      return `${gst.substring(0, 2)}-${gst.substring(2, 7)}-${gst.substring(7, 11)}-${gst.substring(11, 12)}-${gst.substring(12, 13)}-${gst.substring(13, 14)}-${gst.substring(14, 15)}`
    }
    return gst
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vendor Directory</CardTitle>
          <CardDescription>Manage your suppliers and vendor relationships</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            <span className="ml-2 text-slate-600">Loading vendors...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vendor Directory</CardTitle>
          <CardDescription>Manage your suppliers and vendor relationships</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">Error: {error}</p>
            <Button onClick={fetchVendors} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Vendor Directory</CardTitle>
              <CardDescription>Manage your suppliers and vendor relationships</CardDescription>
            </div>
            <div className="text-sm text-slate-500">
              Total: {filteredVendors.length} vendor{filteredVendors.length !== 1 ? 's' : ''}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search vendors..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="block sm:hidden space-y-4">
            {filteredVendors.map((vendor) => (
              <Card key={vendor.vendor_id} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900">{vendor.vendor_name}</h3>
                      <p className="text-sm text-slate-600">{vendor.vendor_person_name}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEditVendor(vendor)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Vendor
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => handleDeleteVendor(vendor)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Vendor
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <span>{vendor.vendor_contact_no}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      <span>{vendor.vendor_state}</span>
                    </div>
                    
                    <div className="text-xs font-mono bg-slate-50 p-2 rounded">
                      GST: {formatGST(vendor.vendor_gst)}
                    </div>
                    
                    <div className="text-xs text-slate-500 pt-1">
                      Added on {formatDate(vendor.created_at)}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor Details</TableHead>
                  <TableHead>Contact Info</TableHead>
                  <TableHead>GST & State</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVendors.map((vendor) => (
                  <TableRow key={vendor.vendor_id}>
                    <TableCell>
                      <div>
                        <div className="font-semibold text-slate-900">{vendor.vendor_name}</div>
                        <div className="text-sm text-slate-600">{vendor.vendor_person_name}</div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-slate-400" />
                        <span>{vendor.vendor_contact_no}</span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-mono text-sm bg-slate-50 px-2 py-1 rounded">
                          {formatGST(vendor.vendor_gst)}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {vendor.vendor_state} ({vendor.vendor_state_code})
                        </Badge>
                      </div>
                    </TableCell>
                    
                    <TableCell className="max-w-xs">
                      <div className="truncate text-sm" title={vendor.vendor_address}>
                        {vendor.vendor_address}
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-sm text-slate-500">
                      {formatDate(vendor.created_at)}
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEditVendor(vendor)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Vendor
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleDeleteVendor(vendor)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Vendor
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredVendors.length === 0 && !loading && (
            <div className="text-center py-8">
              <p className="text-slate-500">
                {searchTerm
                  ? "No vendors found matching your search."
                  : "No vendors found. Add your first vendor to get started."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !deleting && setDeleteDialog({ open, vendor: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vendor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteDialog.vendor?.vendor_name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 