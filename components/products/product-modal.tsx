"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";

interface Product {
  product_id?: number;
  product_code?: string;
  product_name: string;
  product_desc: string;
  product_type: "raw" | "finished";
  hsn_sac_id: number;
  unit_id: number;
  rate: number;
  product_category?: string;
  product_subcategory?: string;
  brand?: string;
  manufacturer?: string;
  model_number?: string;
  keywords?: string;
  tags?: string[];
}

interface HSNCode {
  hsn_sac_id: number;
  hsn_sac_code: string;
  gst_rate: string;
}

interface Unit {
  unit_id: number;
  unit_name: string;
}

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: "create" | "edit";
  product?: Product | null;
}

export function ProductModal({ isOpen, onClose, onSuccess, mode, product }: ProductModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hsnCodes, setHsnCodes] = useState<HSNCode[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNewHsn, setIsNewHsn] = useState(false);

  const [formData, setFormData] = useState({
    product_code: "",
    product_name: "",
    product_desc: "",
    product_type: "finished" as "raw" | "finished",
    hsn_sac_code: "",
    gst_rate: "",
    unit_id: "",
    rate: "0",
    product_category: "",
    product_subcategory: "",
    brand: "",
    manufacturer: "",
    model_number: "",
    keywords: "",
    tags: [] as string[],
  });

  useEffect(() => {
    if (isOpen) {
      loadMasterData();
      if (mode === "edit" && product) {
        setFormData({
          product_code: product.product_code || "",
          product_name: product.product_name || "",
          product_desc: product.product_desc || "",
          product_type: (product.product_type as "raw" | "finished") || "finished",
          hsn_sac_code: "",
          gst_rate: "",
          unit_id: product.unit_id?.toString() || "",
          rate: product.rate?.toString() || "0",
          product_category: product.product_category || "",
          product_subcategory: product.product_subcategory || "",
          brand: product.brand || "",
          manufacturer: product.manufacturer || "",
          model_number: product.model_number || "",
          keywords: product.keywords || "",
          tags: product.tags || [],
        });
        setIsNewHsn(false);
      } else {
        setFormData({
          product_code: "",
          product_name: "",
          product_desc: "",
          product_type: "finished",
          hsn_sac_code: "",
          gst_rate: "",
          unit_id: "",
          rate: "0",
          product_category: "",
          product_subcategory: "",
          brand: "",
          manufacturer: "",
          model_number: "",
          keywords: "",
          tags: [],
        });
        setIsNewHsn(false);
      }
    }
  }, [isOpen, mode, product]);

  const loadMasterData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [hsnResponse, unitsResponse] = await Promise.all([
        fetch("/api/hsn-codes"),
        fetch("/api/units"),
      ]);

      if (!hsnResponse.ok) throw new Error(`Failed to fetch HSN codes: ${hsnResponse.status}`);
      const hsnData = await hsnResponse.json();
      if (!hsnData.hsnCodes?.length) throw new Error("No HSN/SAC codes available");
      console.log("HSN Codes:", hsnData.hsnCodes);
      setHsnCodes(hsnData.hsnCodes);

      if (!unitsResponse.ok) throw new Error(`Failed to fetch units: ${unitsResponse.status}`);
      const unitsData = await unitsResponse.json();
      if (!unitsData.units?.length) throw new Error("No units available");
      console.log("Units:", unitsData.units);
      setUnits(unitsData.units);

      if (mode === "edit" && product) {
        const hsn = hsnData.hsnCodes.find((h: HSNCode) => h.hsn_sac_id === product.hsn_sac_id);
        if (hsn) {
          setFormData((prev) => ({ ...prev, hsn_sac_code: hsn.hsn_sac_code }));
        }
      }
    } catch (error) {
      console.error("Failed to load master data:", error);
      setError(error instanceof Error ? error.message : "Failed to load required data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    console.log(`Updating ${field}:`, value);
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleHsnChange = (value: string) => {
    console.log("HSN Change:", value);
    if (value === "new") {
      setIsNewHsn(true);
      setFormData((prev) => ({ ...prev, hsn_sac_code: "", gst_rate: "" }));
    } else {
      setIsNewHsn(false);
      setFormData((prev) => ({ ...prev, hsn_sac_code: value, gst_rate: "" }));
    }
  };

  const validateForm = () => {
    console.log("Validating form:", formData);
    if (!formData.product_name.trim()) return "Product name is required";
    if (!formData.product_desc.trim()) return "Product description is required";
    if (!formData.product_type || !["raw", "finished"].includes(formData.product_type)) {
      return "Product type must be 'Raw' or 'Finished'";
    }
    if (isNewHsn) {
      if (!formData.hsn_sac_code.trim()) return "HSN/SAC code is required for new entry";
      if (!formData.gst_rate || isNaN(parseFloat(formData.gst_rate))) return "Valid GST rate is required for new HSN";
    } else {
      if (!formData.hsn_sac_code) return "HSN/SAC code is required";
    }
    if (!formData.unit_id) return "Unit is required";
    if (formData.rate && parseFloat(formData.rate) < 0) return "Rate must be a positive number";
    return null;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      console.error("Validation error:", validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let hsn_sac_id = null;
      if (!isNewHsn) {
        const selectedHsn = hsnCodes.find((hsn) => hsn.hsn_sac_code === formData.hsn_sac_code);
        if (!selectedHsn) throw new Error("Invalid HSN/SAC code selected");
        hsn_sac_id = selectedHsn.hsn_sac_id;
      }

      const requestData = {
        product_code: formData.product_code || undefined,
        product_name: formData.product_name,
        product_desc: formData.product_desc,
        product_type: formData.product_type,
        hsn_sac_id: isNewHsn ? undefined : hsn_sac_id,
        hsn_sac_code: isNewHsn ? formData.hsn_sac_code : undefined,
        gst_rate: isNewHsn ? parseFloat(formData.gst_rate) : undefined,
        unit_id: parseInt(formData.unit_id),
        rate: parseFloat(formData.rate) || 0,
        product_category: formData.product_category || undefined,
        product_subcategory: formData.product_subcategory || undefined,
        brand: formData.brand || undefined,
        manufacturer: formData.manufacturer || undefined,
        model_number: formData.model_number || undefined,
        keywords: formData.keywords || undefined,
        tags: formData.tags.length ? formData.tags : undefined,
      };

      console.log("Submitting payload:", JSON.stringify(requestData, null, 2));

      const url = mode === "create" ? "/api/products" : `/api/products/${product?.product_id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      const responseData = await response.json();
      console.log("API response:", responseData);

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to save product");
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Product save error:", error);
      setError(error instanceof Error ? error.message : "Failed to save product");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add New Product" : "Edit Product"}</DialogTitle>
          <DialogDescription>Fill in the product details below. * indicates required fields.</DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading...</span>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="product_code">Product Code</Label>
                <Input
                  id="product_code"
                  value={formData.product_code}
                  onChange={(e) => handleInputChange("product_code", e.target.value)}
                  placeholder="Auto-generated if empty"
                />
              </div>
              <div>
                <Label htmlFor="product_type">Product Type *</Label>
                <Select
                  value={formData.product_type}
                  onValueChange={(value) => handleInputChange("product_type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="finished">Finished</SelectItem>
                    <SelectItem value="raw">Raw</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="product_name">Product Name *</Label>
                <Input
                  id="product_name"
                  value={formData.product_name}
                  onChange={(e) => handleInputChange("product_name", e.target.value)}
                  placeholder="Enter product name"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="product_desc">Description *</Label>
                <Textarea
                  id="product_desc"
                  value={formData.product_desc}
                  onChange={(e) => handleInputChange("product_desc", e.target.value)}
                  placeholder="Enter product description"
                  rows={3}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="hsn_sac_code">HSN/SAC Code *</Label>
                <Select
                  value={isNewHsn ? "new" : formData.hsn_sac_code}
                  onValueChange={handleHsnChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select or add new HSN/SAC" />
                  </SelectTrigger>
                  <SelectContent>
                    {hsnCodes.map((hsn) => (
                      <SelectItem key={hsn.hsn_sac_id} value={hsn.hsn_sac_code}>
                        {hsn.hsn_sac_code} - {hsn.gst_rate}% GST
                      </SelectItem>
                    ))}
                    <SelectItem value="new">Add New HSN/SAC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {isNewHsn && (
                <div className="md:col-span-2 grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="new_hsn_sac_code">New HSN/SAC Code *</Label>
                    <Input
                      id="new_hsn_sac_code"
                      value={formData.hsn_sac_code}
                      onChange={(e) => handleInputChange("hsn_sac_code", e.target.value)}
                      placeholder="Enter new HSN/SAC code"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="gst_rate">GST Rate (%) *</Label>
                    <Input
                      id="gst_rate"
                      type="number"
                      step="0.01"
                      value={formData.gst_rate}
                      onChange={(e) => handleInputChange("gst_rate", e.target.value)}
                      placeholder="Enter GST rate (e.g., 18)"
                      required
                    />
                  </div>
                </div>
              )}
              <div>
                <Label htmlFor="unit_id">Unit *</Label>
                <Select
                  value={formData.unit_id}
                  onValueChange={(value) => handleInputChange("unit_id", value)}
                >
                  <SelectTrigger>
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
              </div>
              <div>
                <Label htmlFor="product_category">Category</Label>
                <Input
                  id="product_category"
                  value={formData.product_category}
                  onChange={(e) => handleInputChange("product_category", e.target.value)}
                  placeholder="Enter category"
                />
              </div>
              <div>
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => handleInputChange("brand", e.target.value)}
                  placeholder="Enter brand"
                />
              </div>
              <div>
                <Label htmlFor="manufacturer">Manufacturer</Label>
                <Input
                  id="manufacturer"
                  value={formData.manufacturer}
                  onChange={(e) => handleInputChange("manufacturer", e.target.value)}
                  placeholder="Enter manufacturer"
                />
              </div>
              <div>
                <Label htmlFor="model_number">Model Number</Label>
                <Input
                  id="model_number"
                  value={formData.model_number}
                  onChange={(e) => handleInputChange("model_number", e.target.value)}
                  placeholder="Enter model number"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="keywords">Keywords</Label>
                <Input
                  id="keywords"
                  value={formData.keywords}
                  onChange={(e) => handleInputChange("keywords", e.target.value)}
                  placeholder="Enter keywords, separated by commas"
                />
              </div>
              <div>
                <Label htmlFor="rate">Rate</Label>
                <Input
                  id="rate"
                  type="number"
                  step="0.01"
                  value={formData.rate}
                  onChange={(e) => handleInputChange("rate", e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
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
  );
}