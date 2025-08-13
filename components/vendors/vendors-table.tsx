"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, MoreHorizontal, Edit, Trash2, Eye, Loader2 } from "lucide-react"

interface Vendor {
  vendor_id: number
  vendor_name: string
  vendor_person_name: string
  vendor_contact_no: string
  vendor_state: string
  vendor_gst: string
  vendor_address: string
  created_at: string
}

export function VendorsTable() {
  const [searchTerm, setSearchTerm] = useState("")
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchVendors()
  }, [])

  const fetchVendors = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/vendors")
      if (!response.ok) {
        throw new Error("Failed to fetch vendors")
      }
      const data = await response.json()
      setVendors(data.vendors || [])
      setFilteredVendors(data.vendors || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load vendors")
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
        vendor.vendor_gst.toLowerCase().includes(value.toLowerCase()),
    )
    setFilteredVendors(filtered)
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
            <p className="text-red-600">Error: {error}</p>
            <Button onClick={fetchVendors} className="mt-4">
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
        <CardTitle>Vendor Directory</CardTitle>
        <CardDescription>Manage your suppliers and vendor relationships</CardDescription>
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

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor Name</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead>GST Number</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Address</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVendors.map((vendor) => (
                <TableRow key={vendor.vendor_id}>
                  <TableCell className="font-medium">
                    <div className="font-semibold text-slate-900">{vendor.vendor_name}</div>
                  </TableCell>
                  <TableCell>{vendor.vendor_person_name}</TableCell>
                  <TableCell className="font-mono text-sm">{vendor.vendor_gst}</TableCell>
                  <TableCell>{vendor.vendor_state}</TableCell>
                  <TableCell>{vendor.vendor_contact_no}</TableCell>
                  <TableCell className="max-w-xs truncate">{vendor.vendor_address}</TableCell>
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
                          Edit Vendor
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
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
  )
}
