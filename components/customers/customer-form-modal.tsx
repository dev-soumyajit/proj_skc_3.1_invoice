// components/customers/customer-form-modal.tsx
"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Customer {
  customer_id?: number
  customer_name: string
  customer_company_name: string
  customer_gst_in: string
  customer_phone?: string
  customer_email?: string
  customer_address: string
  customer_state_name: string
  customer_state_code: string
  customer_pin_code?: string
  customer_type: "B2B" | "SEZ" | "Export"
  is_sez: boolean
  is_export: boolean
}

interface CustomerFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  customer?: Customer | null
  mode: "add" | "edit"
}

interface State {
  name: string
  code: string
}

export function CustomerFormModal({ isOpen, onClose, onSuccess, customer, mode }: CustomerFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [statesLoading, setStatesLoading] = useState(false)
  const [states, setStates] = useState<State[]>([])
  const [formData, setFormData] = useState<Customer>({
    customer_name: "",
    customer_company_name: "",
    customer_gst_in: "",
    customer_phone: "",
    customer_email: "",
    customer_address: "",
    customer_state_name: "",
    customer_state_code: "",
    customer_pin_code: "",
    customer_type: "B2B",
    is_sez: false,
    is_export: false,
  })

  // Fetch states from API
  const fetchStates = async () => {
    setStatesLoading(true)
    try {
      const response = await fetch("/api/states")
      if (response.ok) {
        const data = await response.json()
        setStates(data.states || [])
      }
    } catch (error) {
      console.error("Error fetching states:", error)
      toast.error("Failed to load states")
    } finally {
      setStatesLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchStates()
    }
  }, [isOpen])

  useEffect(() => {
    if (customer && mode === "edit") {
      setFormData({
        customer_id: customer.customer_id,
        customer_name: customer.customer_name || "",
        customer_company_name: customer.customer_company_name || "",
        customer_gst_in: customer.customer_gst_in || "",
        customer_phone: customer.customer_phone || "",
        customer_email: customer.customer_email || "",
        customer_address: customer.customer_address || "",
        customer_state_name: customer.customer_state_name || "",
        customer_state_code: customer.customer_state_code || "",
        customer_pin_code: customer.customer_pin_code || "",
        customer_type: customer.customer_type || "B2B",
        is_sez: customer.is_sez || false,
        is_export: customer.is_export || false,
      })
    } else {
      setFormData({
        customer_name: "",
        customer_company_name: "",
        customer_gst_in: "",
        customer_phone: "",
        customer_email: "",
        customer_address: "",
        customer_state_name: "",
        customer_state_code: "",
        customer_pin_code: "",
        customer_type: "B2B",
        is_sez: false,
        is_export: false,
      })
    }
  }, [customer, mode, isOpen])

  const handleStateChange = (stateName: string) => {
    const state = states.find(s => s.name === stateName)
    setFormData(prev => ({
      ...prev,
      customer_state_name: stateName,
      customer_state_code: state?.code || "",
    }))
  }

  const validateForm = () => {
    if (!formData.customer_name.trim()) {
      toast.error("Customer name is required")
      return false
    }
    if (!formData.customer_company_name.trim()) {
      toast.error("Company name is required")
      return false
    }
    if (!formData.customer_gst_in.trim()) {
      toast.error("GST number is required")
      return false
    }
    if (!formData.customer_address.trim()) {
      toast.error("Address is required")
      return false
    }
    if (!formData.customer_state_name) {
      toast.error("State is required")
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)

    try {
      const url = mode === "edit" ? `/api/customers/${formData.customer_id}` : "/api/customers"
      const method = mode === "edit" ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success(`Customer ${mode === "edit" ? "updated" : "created"} successfully`)
        onSuccess()
        onClose()
      } else {
        const error = await response.json()
        toast.error(error.error || `Failed to ${mode} customer`)
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error(`Failed to ${mode} customer`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit Customer" : "Add New Customer"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit" 
              ? "Update customer information and GST details."
              : "Enter customer information and GST details to add a new customer."
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer_name">Contact Person Name *</Label>
              <Input
                id="customer_name"
                value={formData.customer_name}
                onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                placeholder="Enter contact person name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer_company_name">Company Name *</Label>
              <Input
                id="customer_company_name"
                value={formData.customer_company_name}
                onChange={(e) => setFormData(prev => ({ ...prev, customer_company_name: e.target.value }))}
                placeholder="Enter company name"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer_gst_in">GST Number *</Label>
              <Input
                id="customer_gst_in"
                value={formData.customer_gst_in}
                onChange={(e) => setFormData(prev => ({ ...prev, customer_gst_in: e.target.value.toUpperCase() }))}
                placeholder="Enter GST number"
                className="font-mono"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer_phone">Phone Number</Label>
              <Input
                id="customer_phone"
                value={formData.customer_phone}
                onChange={(e) => setFormData(prev => ({ ...prev, customer_phone: e.target.value }))}
                placeholder="Enter phone number"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer_email">Email Address</Label>
            <Input
              id="customer_email"
              type="email"
              value={formData.customer_email}
              onChange={(e) => setFormData(prev => ({ ...prev, customer_email: e.target.value }))}
              placeholder="Enter email address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer_address">Address *</Label>
            <Textarea
              id="customer_address"
              value={formData.customer_address}
              onChange={(e) => setFormData(prev => ({ ...prev, customer_address: e.target.value }))}
              placeholder="Enter complete address"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer_state_name">State *</Label>
              <Select 
                value={formData.customer_state_name} 
                onValueChange={handleStateChange}
                disabled={statesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={statesLoading ? "Loading states..." : "Select state"} />
                </SelectTrigger>
                <SelectContent>
                  {states.map((state) => (
                    <SelectItem key={state.code} value={state.name}>
                      {state.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer_pin_code">PIN Code</Label>
              <Input
                id="customer_pin_code"
                value={formData.customer_pin_code}
                onChange={(e) => setFormData(prev => ({ ...prev, customer_pin_code: e.target.value }))}
                placeholder="Enter PIN code"
                maxLength={6}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer_type">Customer Type</Label>
            <Select
              value={formData.customer_type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, customer_type: value as "B2B" | "SEZ" | "Export" }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="B2B">B2B</SelectItem>
                <SelectItem value="SEZ">SEZ</SelectItem>
                <SelectItem value="Export">Export</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_sez"
                checked={formData.is_sez}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_sez: checked as boolean }))}
              />
              <Label htmlFor="is_sez">SEZ Customer</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_export"
                checked={formData.is_export}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_export: checked as boolean }))}
              />
              <Label htmlFor="is_export">Export Customer</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "edit" ? "Update Customer" : "Add Customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}