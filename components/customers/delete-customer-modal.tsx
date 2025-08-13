// components/customers/delete-customer-modal.tsx
"use client"

import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Customer {
  customer_id: number
  customer_company_name: string
  customer_name: string
}

interface DeleteCustomerModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  customer: Customer | null
}

export function DeleteCustomerModal({ isOpen, onClose, onSuccess, customer }: DeleteCustomerModalProps) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!customer) return

    setLoading(true)

    try {
      const response = await fetch(`/api/customers/${customer.customer_id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Customer deleted successfully")
        onSuccess()
        onClose()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to delete customer")
      }
    } catch (error) {
      console.error("Error deleting customer:", error)
      toast.error("Failed to delete customer")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Customer</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{customer?.customer_company_name}</strong>?
            <br />
            <span className="text-sm text-muted-foreground">
              Contact Person: {customer?.customer_name}
            </span>
            <br />
            <br />
            This action cannot be undone. This will permanently remove the customer 
            and all associated data from the system.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Customer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}