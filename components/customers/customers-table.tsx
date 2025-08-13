"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, MoreHorizontal, Edit, Trash2, Eye, Loader2 } from "lucide-react"

interface Customer {
  customer_id: number
  customer_company_name: string
  customer_name: string
  customer_mob: string
  customer_gst_in: string
  customer_state_name: string
  customer_type: string
  customer_email: string
  created_at: string
}

const customerTypeColors = {
  B2B: "bg-blue-100 text-blue-800",
  SEZ: "bg-green-100 text-green-800",
  Export: "bg-purple-100 text-purple-800",
}

export function CustomersTable() {
  const [searchTerm, setSearchTerm] = useState("")
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/customers")
      if (!response.ok) {
        throw new Error("Failed to fetch customers")
      }
      const data = await response.json()
      setCustomers(data.customers || [])
      setFilteredCustomers(data.customers || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load customers")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    const filtered = customers.filter(
      (customer) =>
        customer.customer_company_name.toLowerCase().includes(value.toLowerCase()) ||
        customer.customer_name.toLowerCase().includes(value.toLowerCase()) ||
        customer.customer_gst_in.toLowerCase().includes(value.toLowerCase()),
    )
    setFilteredCustomers(filtered)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Customer Directory</CardTitle>
          <CardDescription>Complete list of registered customers with GST and contact information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            <span className="ml-2 text-slate-600">Loading customers...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Customer Directory</CardTitle>
          <CardDescription>Complete list of registered customers with GST and contact information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600">Error: {error}</p>
            <Button onClick={fetchCustomers} className="mt-4">
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
        <CardTitle>Customer Directory</CardTitle>
        <CardDescription>Complete list of registered customers with GST and contact information</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search customers..."
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
                <TableHead>Company Name</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead>GST Number</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.customer_id}>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-semibold text-slate-900">{customer.customer_company_name}</div>
                      <div className="text-sm text-slate-500">{customer.customer_email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{customer.customer_name}</TableCell>
                  <TableCell className="font-mono text-sm">{customer.customer_gst_in}</TableCell>
                  <TableCell>{customer.customer_state_name}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={customerTypeColors[customer.customer_type as keyof typeof customerTypeColors]}
                    >
                      {customer.customer_type}
                    </Badge>
                  </TableCell>
                  <TableCell>{customer.customer_mob}</TableCell>
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
                          Edit Customer
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Customer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredCustomers.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-slate-500">
              {searchTerm
                ? "No customers found matching your search."
                : "No customers found. Add your first customer to get started."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
