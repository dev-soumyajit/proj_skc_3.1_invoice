"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, MoreHorizontal, Edit, Trash2, Eye, Loader2, Plus, Phone, Mail, MapPin , Users } from "lucide-react"
import { CustomerFormModal } from "./customer-form-modal"
import { DeleteCustomerModal } from "./delete-customer-modal"
import { toast } from "sonner"

interface Customer {
  customer_id: number
  customer_company_name: string
  customer_name: string
  customer_phone?: string
  customer_gst_in: string
  customer_state_name: string
  customer_type: string
  customer_email?: string
  customer_address: string
  customer_state_code: string
  customer_pin_code?: string
  is_sez: boolean
  is_export: boolean
  created_at: string
}

const customerTypeColors = {
  B2B: "bg-blue-100 text-blue-800",
  SEZ: "bg-green-100 text-green-800",
  Export: "bg-purple-100 text-purple-800",
}

interface CustomersTableProps {
  onAddCustomer?: () => void
}

export function CustomersTable({ onAddCustomer }: CustomersTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [modalMode, setModalMode] = useState<"add" | "edit">("add")

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
      toast.error("Failed to load customers")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (value: string) => {
    setSearchTerm(value)
    
    if (!value.trim()) {
      setFilteredCustomers(customers)
      return
    }

    // Use API search for better performance and caching
    try {
      const response = await fetch(`/api/customers?search=${encodeURIComponent(value)}`)
      if (response.ok) {
        const data = await response.json()
        setFilteredCustomers(data.customers || [])
      }
    } catch (error) {
      console.error("Search error:", error)
      // Fallback to client-side filtering
      const filtered = customers.filter(
        (customer) =>
          customer.customer_company_name.toLowerCase().includes(value.toLowerCase()) ||
          customer.customer_name.toLowerCase().includes(value.toLowerCase()) ||
          customer.customer_gst_in.toLowerCase().includes(value.toLowerCase()),
      )
      setFilteredCustomers(filtered)
    }
  }

  const handleAddCustomer = () => {
    setModalMode("add")
    setSelectedCustomer(null)
    setIsFormModalOpen(true)
    onAddCustomer?.()
  }

  const handleEditCustomer = (customer: Customer) => {
    setModalMode("edit")
    setSelectedCustomer(customer)
    setIsFormModalOpen(true)
  }

  const handleDeleteCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setIsDeleteModalOpen(true)
  }

  const handleModalSuccess = () => {
    fetchCustomers()
  }

  const handleViewDetails = (customer: Customer) => {
    // Show customer details in a toast or navigate to detail page
    toast.info(`Customer ID: ${customer.customer_id}\nGST: ${customer.customer_gst_in}\nState: ${customer.customer_state_name}`)
  }

  // Mobile Card Component
  const CustomerMobileCard = ({ customer }: { customer: Customer }) => (
    <Card className="mb-3 sm:hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 truncate text-sm">
              {customer.customer_company_name}
            </h3>
            <p className="text-sm text-slate-600 mt-1">{customer.customer_name}</p>
          </div>
          <div className="flex items-center space-x-2 ml-3">
            <Badge
              variant="secondary"
              className={`${customerTypeColors[customer.customer_type as keyof typeof customerTypeColors]} text-xs`}
            >
              {customer.customer_type}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleViewDetails(customer)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleEditCustomer(customer)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-red-600"
                  onClick={() => handleDeleteCustomer(customer)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center text-slate-600">
            <span className="font-medium min-w-0 flex-1">GST:</span>
            <span className="font-mono text-slate-800 ml-2">{customer.customer_gst_in}</span>
          </div>
          
          <div className="flex items-center text-slate-600">
            <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className="truncate">{customer.customer_state_name}</span>
          </div>

          {customer.customer_phone && (
            <div className="flex items-center text-slate-600">
              <Phone className="h-3 w-3 mr-1 flex-shrink-0" />
              <span>{customer.customer_phone}</span>
            </div>
          )}

          {customer.customer_email && (
            <div className="flex items-center text-slate-600">
              <Mail className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="truncate">{customer.customer_email}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="min-w-0">
              <CardTitle className="text-lg sm:text-xl">Customer Directory</CardTitle>
              <CardDescription className="text-sm mt-1">
                Complete list of registered customers with GST and contact information
              </CardDescription>
            </div>
            <Button disabled className="self-start sm:self-auto">
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Add Customer</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
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
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="min-w-0">
              <CardTitle className="text-lg sm:text-xl">Customer Directory</CardTitle>
              <CardDescription className="text-sm mt-1">
                Complete list of registered customers with GST and contact information
              </CardDescription>
            </div>
            <Button onClick={handleAddCustomer} className="self-start sm:self-auto">
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Add Customer</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 text-sm">Error: {error}</p>
            <Button onClick={fetchCustomers} className="mt-4" size="sm">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="min-w-0">
              <CardTitle className="text-lg sm:text-xl">Customer Directory</CardTitle>
              <CardDescription className="text-sm mt-1">
                Complete list of registered customers with GST and contact information
              </CardDescription>
            </div>
            <Button onClick={handleAddCustomer} className="self-start sm:self-auto">
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Add Customer</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Search */}
          <div className="flex items-center space-x-2 mb-4 sm:mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>
          </div>

          {/* Mobile Cards - Show on small screens */}
          <div className="sm:hidden">
            {filteredCustomers.map((customer) => (
              <CustomerMobileCard key={customer.customer_id} customer={customer} />
            ))}
          </div>

          {/* Desktop Table - Hide on small screens */}
          <div className="hidden sm:block">
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Company Name</TableHead>
                    <TableHead className="min-w-[150px]">Contact Person</TableHead>
                    <TableHead className="min-w-[120px]">GST Number</TableHead>
                    <TableHead className="min-w-[100px]">State</TableHead>
                    <TableHead className="min-w-[80px]">Type</TableHead>
                    <TableHead className="min-w-[120px]">Phone</TableHead>
                    <TableHead className="text-right min-w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.customer_id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold text-slate-900 truncate max-w-[180px]">
                            {customer.customer_company_name}
                          </div>
                          {customer.customer_email && (
                            <div className="text-sm text-slate-500 truncate max-w-[180px]">
                              {customer.customer_email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="truncate max-w-[130px]">
                        {customer.customer_name}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        <span className="bg-slate-50 px-2 py-1 rounded text-xs">
                          {customer.customer_gst_in}
                        </span>
                      </TableCell>
                      <TableCell className="truncate max-w-[90px]">
                        {customer.customer_state_name}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`${customerTypeColors[customer.customer_type as keyof typeof customerTypeColors]} text-xs`}
                        >
                          {customer.customer_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {customer.customer_phone || "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(customer)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditCustomer(customer)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Customer
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDeleteCustomer(customer)}
                            >
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
          </div>

          {/* Empty State */}
          {filteredCustomers.length === 0 && !loading && (
            <div className="text-center py-8 sm:py-12">
              <div className="mx-auto w-24 h-24 sm:w-32 sm:h-32 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 sm:w-12 sm:h-12 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                {searchTerm ? "No customers found" : "No customers yet"}
              </h3>
              <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
                {searchTerm
                  ? "Try adjusting your search terms or check the spelling."
                  : "Get started by adding your first customer to the directory."}
              </p>
              {!searchTerm && (
                <Button onClick={handleAddCustomer} className="touch-manipulation">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Customer
                </Button>
              )}
            </div>
          )}

          {/* Results count for mobile */}
          {filteredCustomers.length > 0 && (
            <div className="sm:hidden mt-4 text-center">
              <p className="text-xs text-slate-500">
                Showing {filteredCustomers.length} of {customers.length} customers
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Modal */}
      <CustomerFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={handleModalSuccess}
        customer={selectedCustomer}
        mode={modalMode}
      />

      {/* Delete Modal */}
      <DeleteCustomerModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={handleModalSuccess}
        customer={selectedCustomer}
      />
    </>
  )
}