// components/products/product-details-modal.tsx
"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Package, Tag, Hash, Scale, Percent, Calendar, IndianRupee } from "lucide-react"
import { format } from "date-fns"

interface Product {
  product_id: number
  product_name: string
  product_desc: string
  product_type: string
  hsn_sac_code: string
  unit_name: string
  gst_rate: number
  rate: number
  created_at: string
  updated_at?: string
}

interface ProductDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
}

const productTypeColors = {
  raw: "bg-orange-100 text-orange-800 border-orange-200",
  finished: "bg-green-100 text-green-800 border-green-200",
}

const productTypeLabels = {
  raw: "Raw Material",
  finished: "Finished Product",
}

export function ProductDetailsModal({ isOpen, onClose, product }: ProductDetailsModalProps) {
  if (!product) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Product Details</span>
          </DialogTitle>
          <DialogDescription>
            Detailed information about the selected product
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{product.product_name}</h3>
              <p className="text-slate-600 mt-1">{product.product_desc}</p>
            </div>

            <div className="flex items-center space-x-2">
              <Badge
                variant="secondary"
                className={productTypeColors[product.product_type as keyof typeof productTypeColors]}
              >
                {productTypeLabels[product.product_type as keyof typeof productTypeLabels]}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Technical Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-slate-500">
                <Hash className="h-4 w-4" />
                <span>HSN/SAC Code</span>
              </div>
              <p className="font-mono text-lg font-semibold">{product.hsn_sac_code}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-slate-500">
                <Scale className="h-4 w-4" />
                <span>Unit</span>
              </div>
              <p className="text-lg font-semibold">{product.unit_name}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-slate-500">
                <Percent className="h-4 w-4" />
                <span>GST Rate</span>
              </div>
              <div>
                <Badge variant="outline" className="text-lg px-3 py-1">
                  {product.gst_rate}%
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-slate-500">
                <IndianRupee className="h-4 w-4" />
                <span>Rate</span>
              </div>
              <p className="text-lg font-semibold font-mono">₹{product.rate?.toFixed(2) || '0.00'}</p>
            </div>
          </div>

          <Separator />

          {/* Timestamps */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2 text-slate-500">
                <Calendar className="h-4 w-4" />
                <span>Created</span>
              </div>
              <span className="font-medium">
                {format(new Date(product.created_at), "dd MMM yyyy, h:mm a")}
              </span>
            </div>

            {product.updated_at && product.updated_at !== product.created_at && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2 text-slate-500">
                  <Calendar className="h-4 w-4" />
                  <span>Last Updated</span>
                </div>
                <span className="font-medium">
                  {format(new Date(product.updated_at), "dd MMM yyyy, h:mm a")}
                </span>
              </div>
            )}
          </div>

          {/* Product ID for reference */}
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Product ID</span>
              <span className="font-mono font-medium">#{product.product_id}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}