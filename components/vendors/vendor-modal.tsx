"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, X } from "lucide-react"

interface VendorModalProps {
  isOpen: boolean
  onClose: () => void
  vendor?: any
  onVendorSaved?: () => void
}

const INDIAN_STATES = [
  { name: "Andhra Pradesh", code: "37" },
  { name: "Arunachal Pradesh", code: "12" },
  { name: "Assam", code: "18" },
  { name: "Bihar", code: "10" },
  { name: "Chhattisgarh", code: "22" },
  { name: "Goa", code: "30" },
  { name: "Gujarat", code: "24" },
  { name: "Haryana", code: "06" },
  { name: "Himachal Pradesh", code: "02" },
  { name: "Jharkhand", code: "20" },
  { name: "Karnataka", code: "29" },
  { name: "Kerala", code: "32" },
  { name: "Madhya Pradesh", code: "23" },
  { name: "Maharashtra", code: "27" },
  { name: "Manipur", code: "14" },
  { name: "Meghalaya", code: "17" },
  { name: "Mizoram", code: "15" },
  { name: "Nagaland", code: "13" },
  { name: "Odisha", code: "21" },
  { name: "Punjab", code: "03" },
  { name: "Rajasthan", code: "08" },
  { name: "Sikkim", code: "11" },
  { name: "Tamil Nadu", code: "33" },
  { name: "Telangana", code: "36" },
  { name: "Tripura", code: "16" },
  { name: "Uttar Pradesh", code: "09" },
  { name: "Uttarakhand", code: "05" },
  { name: "West Bengal", code: "19" },
  { name: "Andaman and Nicobar Islands", code: "35" },
  { name: "Chandigarh", code: "04" },
  { name: "Dadra and Nagar Haveli and Daman and Diu", code: "26" },
  { name: "Delhi", code: "07" },
  { name: "Jammu and Kashmir", code: "01" },
  { name: "Ladakh", code: "38" },
  { name: "Lakshadweep", code: "31" },
  { name: "Puducherry", code: "34" }
]

export function VendorModal({ isOpen, onClose, vendor, onVendorSaved }: VendorModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    vendor_name: "",
    vendor_person_name: "",
    vendor_contact_no: "",
    vendor_state: "",
    vendor_state_code: "",
    vendor_gst: "",
    vendor_address: ""
  })

  const isEditing = !!vendor

  useEffect(() => {
    if (vendor) {
      setFormData({
        vendor_name: vendor.vendor_name || "",
        vendor_person_name: vendor.vendor_person_name || "",
        vendor_contact_no: vendor.vendor_contact_no || "",
        vendor_state: vendor.vendor_state || "",
        vendor_state_code: vendor.vendor_state_code || "",
        vendor_gst: vendor.vendor_gst || "",
        vendor_address: vendor.vendor_address || ""
      })
    } else {
      setFormData({
        vendor_name: "",
        vendor_person_name: "",
        vendor_contact_no: "",
        vendor_state: "",
        vendor_state_code: "",
        vendor_gst: "",
        vendor_address: ""
      })
    }
  }, [vendor, isOpen])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleStateChange = (stateName: string) => {
    const selectedState = INDIAN_STATES.find(state => state.name === stateName)
    if (selectedState) {
      setFormData(prev => ({
        ...prev,
        vendor_state: selectedState.name,
        vendor_state_code: selectedState.code
      }))
    }
  }

  const validateForm = () => {
    const required = ["vendor_name", "vendor_person_name", "vendor_contact_no", "vendor_state", "vendor_gst", "vendor_address"]
    
    for (const field of required) {
      if (!formData[field as keyof typeof formData]?.trim()) {
        toast.error(`${field.replace('vendor_', '').replace('_', ' ')} is required`)
        return false
      }
    }

    // Validate GST number format (basic validation)
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
    if (!gstRegex.test(formData.vendor_gst)) {
      toast.error("Please enter a valid GST number")
      return false
    }

    // Validate phone number (basic validation)
    const phoneRegex = /^\d{10}$/
    if (!phoneRegex.test(formData.vendor_contact_no.replace(/\D/g, ''))) {
      toast.error("Please enter a valid 10-digit phone number")
      return false
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      const url = isEditing ? `/api/vendors/${vendor.vendor_id}` : "/api/vendors"
      const method = isEditing ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${isEditing ? 'update' : 'create'} vendor`)
      }
      
      toast.success(`Vendor ${isEditing ? 'updated' : 'created'} successfully`)
      onVendorSaved?.()
      onClose()
    } catch (error) {
      console.error("Vendor save error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to save vendor")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-lg sm:text-xl">
            {isEditing ? "Edit Vendor" : "Add New Vendor"}
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 sm:hidden"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Company/Vendor Name */}
          <div className="grid gap-2">
            <Label htmlFor="vendor_name" className="text-sm font-medium">
              Company/Vendor Name *
            </Label>
            <Input
              id="vendor_name"
              value={formData.vendor_name}
              onChange={(e) => handleInputChange("vendor_name", e.target.value)}
              placeholder="Enter company or vendor name"
              className="w-full"
            />
          </div>

          {/* Contact Person */}
          <div className="grid gap-2">
            <Label htmlFor="vendor_person_name" className="text-sm font-medium">
              Contact Person *
            </Label>
            <Input
              id="vendor_person_name"
              value={formData.vendor_person_name}
              onChange={(e) => handleInputChange("vendor_person_name", e.target.value)}
              placeholder="Enter contact person name"
              className="w-full"
            />
          </div>

          {/* Contact Number & GST in row for larger screens */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="vendor_contact_no" className="text-sm font-medium">
                Contact Number *
              </Label>
              <Input
                id="vendor_contact_no"
                value={formData.vendor_contact_no}
                onChange={(e) => handleInputChange("vendor_contact_no", e.target.value)}
                placeholder="Enter phone number"
                maxLength={10}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="vendor_gst" className="text-sm font-medium">
                GST Number *
              </Label>
              <Input
                id="vendor_gst"
                value={formData.vendor_gst}
                onChange={(e) => handleInputChange("vendor_gst", e.target.value.toUpperCase())}
                placeholder="Enter GST number"
                maxLength={15}
                className="font-mono text-sm"
              />
            </div>
          </div>

          {/* State Selection */}
          <div className="grid gap-2">
            <Label className="text-sm font-medium">State *</Label>
            <Select value={formData.vendor_state} onValueChange={handleStateChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {INDIAN_STATES.map((state) => (
                  <SelectItem key={state.code} value={state.name}>
                    {state.name} ({state.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Address */}
          <div className="grid gap-2">
            <Label htmlFor="vendor_address" className="text-sm font-medium">
              Address *
            </Label>
            <Textarea
              id="vendor_address"
              value={formData.vendor_address}
              onChange={(e) => handleInputChange("vendor_address", e.target.value)}
              placeholder="Enter complete address"
              rows={3}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Update Vendor" : "Create Vendor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}