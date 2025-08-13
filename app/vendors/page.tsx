"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { VendorsTable } from "@/components/vendors/vendors-table"
import { VendorModal } from "@/components/vendors/vendor-modal"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function VendorsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingVendor, setEditingVendor] = useState(null)

  const handleAddVendor = () => {
    setEditingVendor(null)
    setIsModalOpen(true)
  }

  const handleEditVendor = (vendor: any) => {
    setEditingVendor(vendor)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingVendor(null)
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Vendors</h1>
            <p className="text-slate-600 mt-1 sm:mt-2 text-sm sm:text-base">
              Manage your supplier and vendor information
            </p>
          </div>
          <Button onClick={handleAddVendor} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Vendor
          </Button>
        </div>
        
        <VendorsTable onEditVendor={handleEditVendor} />
        
        <VendorModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          vendor={editingVendor}
        />
      </div>
    </DashboardLayout>
  )
}