// components/products/product-modal.tsx
"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"

// Form validation schema
const productSchema = z.object({
  product_name: z.string().min(1, "Product name is required").max(200, "Name too long"),
  product_desc: z.string().min(1, "Description is required"),
  product_type: z.enum(["raw", "finished"], {
    required_error: "Please select a product type",
  }),
  hsn_sac_id: z.string().min(1, "HSN/SAC code is required"),
  unit_id: z.string().min(1, "Unit is required"),
  rate: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "Rate must be a valid number",
  }),
})

type ProductFormData = z.infer<typeof productSchema>

interface Product {
  product_id: number
  product_name: string
  product_desc: string
  product_type: string
  hsn_sac_id: number
  unit_id: number
  rate: number
}

interface HSNCode {
  hsn_sac_id: number
  hsn_sac_code: string
  gst_rate: string
}

interface Unit {
  unit_id: number
  unit_name: string
}

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  mode: "create" | "edit"
  product?: Product | null
}

export function ProductModal({ isOpen, onClose, onSuccess, mode, product }: ProductModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hsnCodes, setHsnCodes] = useState<HSNCode[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  })

  // Load HSN codes and units
  useEffect(() => {
    if (isOpen) {
      loadMasterData()
    }
  }, [isOpen])

  // Reset form when product changes
  useEffect(() => {
    if (mode === "edit" && product) {
      reset({
        product_name: product.product_name,
        product_desc: product.product_desc,
        product_type: product.product_type as "raw" | "finished",
        hsn_sac_id: product.hsn_sac_id.toString(),
        unit_id: product.unit_id.toString(),
        rate: product.rate.toString(),
      })
    } else if (mode === "create") {
      reset({
        product_name: "",
        product_desc: "",
        product_type: "finished",
        hsn_sac_id: "",
        unit_id: "",
        rate: "0",
      })
    }
  }, [mode, product, reset])

  const loadMasterData = async () => {
    setIsLoading(true)
    try {
      const [hsnResponse, unitsResponse] = await Promise.all([
        fetch("/api/hsn-codes"),
        fetch("/api/units"),
      ])

      if (hsnResponse.ok) {
        const hsnData = await hsnResponse.json()
        setHsnCodes(hsnData.hsnCodes || [])
      }

      if (unitsResponse.ok) {
        const unitsData = await unitsResponse.json()
        setUnits(unitsData.units || [])
      }
    } catch (error) {
      console.error("Failed to load master data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true)
    try {
      const url = mode === "create" ? "/api/products" : `/api/products/${product?.product_id}`
      const method = mode === "create" ? "POST" : "PUT"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          hsn_sac_id: parseInt(data.hsn_sac_id),
          unit_id: parseInt(data.unit_id),
          rate: parseFloat(data.rate),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save product")
      }

      onSuccess()
      onClose()
      reset()
    } catch (error) {
      console.error("Product save error:", error)
      alert(error instanceof Error ? error.message : "Failed to save product")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
      reset()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add New Product" : "Edit Product"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a new product with HSN/SAC code and pricing details."
              : "Update the product information and pricing details."}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading master data...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Product Name */}
              <div className="md:col-span-2">
                <Label htmlFor="product_name">Product Name *</Label>
                <Input
                  id="product_name"
                  {...register("product_name")}
                  placeholder="Enter product name"
                  className="mt-1"
                />
                {errors.product_name && (
                  <p className="text-red-500 text-sm mt-1">{errors.product_name.message}</p>
                )}
              </div>

              {/* Product Description */}
              <div className="md:col-span-2">
                <Label htmlFor="product_desc">Description *</Label>
                <Textarea
                  id="product_desc"
                  {...register("product_desc")}
                  placeholder="Enter product description"
                  className="mt-1"
                  rows={3}
                />
                {errors.product_desc && (
                  <p className="text-red-500 text-sm mt-1">{errors.product_desc.message}</p>
                )}
              </div>

              {/* Product Type */}
              <div>
                <Label htmlFor="product_type">Product Type *</Label>
                <Select
                  value={watch("product_type")}
                  onValueChange={(value) => setValue("product_type", value as "raw" | "finished")}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="finished">Finished</SelectItem>
                    <SelectItem value="raw">Raw Material</SelectItem>
                  </SelectContent>
                </Select>
                {errors.product_type && (
                  <p className="text-red-500 text-sm mt-1">{errors.product_type.message}</p>
                )}
              </div>

              {/* HSN/SAC Code */}
              <div>
                <Label htmlFor="hsn_sac_id">HSN/SAC Code *</Label>
                <Select
                  value={watch("hsn_sac_id")}
                  onValueChange={(value) => setValue("hsn_sac_id", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select HSN/SAC" />
                  </SelectTrigger>
                  <SelectContent>
                    {hsnCodes.map((hsn) => (
                      <SelectItem key={hsn.hsn_sac_id} value={hsn.hsn_sac_id.toString()}>
                        {hsn.hsn_sac_code} - {hsn.gst_rate}% GST
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.hsn_sac_id && (
                  <p className="text-red-500 text-sm mt-1">{errors.hsn_sac_id.message}</p>
                )}
              </div>

              {/* Unit */}
              <div>
                <Label htmlFor="unit_id">Unit *</Label>
                <Select
                  value={watch("unit_id")}
                  onValueChange={(value) => setValue("unit_id", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit.unit_id} value={unit.unit_id.toString()}>
                        {unit.unit_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.unit_id && (
                  <p className="text-red-500 text-sm mt-1">{errors.unit_id.message}</p>
                )}
              </div>

              {/* Rate */}
              <div>
                <Label htmlFor="rate">Rate (₹)</Label>
                <Input
                  id="rate"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("rate")}
                  placeholder="0.00"
                  className="mt-1"
                />
                {errors.rate && (
                  <p className="text-red-500 text-sm mt-1">{errors.rate.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {mode === "create" ? "Creating..." : "Updating..."}
                  </>
                ) : (
                  <>{mode === "create" ? "Create Product" : "Update Product"}</>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}