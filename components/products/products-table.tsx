// components/products/products-table.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Search, MoreHorizontal, Edit, Trash2, Package, Loader2, Plus, RefreshCw } from "lucide-react";
import { ProductModal } from "./product-modal";

export interface Product {
  product_id: number;
  product_name: string;
  product_desc: string;
  product_type: "raw" | "finished";
  hsn_sac_id: number;
  hsn_sac_code: string;
  unit_id: number;
  unit_name: string;
  gst_rate: number;
  rate: number;
  created_at: string;
  product_status: number;
}
const productTypeColors = {
  raw: "bg-orange-100 text-orange-800 border-orange-200",
  finished: "bg-green-100 text-green-800 border-green-200",
};

interface ProductsTableProps {
  onAddProduct?: () => void;
}

export function ProductsTable({ onAddProduct }: ProductsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/products");
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      const data = await response.json();
      setProducts(data.products || []);
      setFilteredProducts(data.products || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    const filtered = products.filter(
      (product) =>
        product.product_name.toLowerCase().includes(value.toLowerCase()) ||
        product.product_desc.toLowerCase().includes(value.toLowerCase()) ||
        product.hsn_sac_code.includes(value)
    );
    setFilteredProducts(filtered);
  };

  const handleAddProduct = () => {
    setModalMode("create");
    setSelectedProduct(null);
    setModalOpen(true);
    onAddProduct?.();
  };

  const handleEditProduct = (product: Product) => {
    setModalMode("edit");
    setSelectedProduct(product);
    setModalOpen(true);
  };

  const handleDeleteProduct = (product: Product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/products/${productToDelete.product_id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete product");
      }

      await fetchProducts();
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch (error) {
      console.error("Delete product error:", error);
      alert(error instanceof Error ? error.message : "Failed to delete product");
    } finally {
      setDeleting(false);
    }
  };

  const handleModalSuccess = () => {
    fetchProducts();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Product Catalog</CardTitle>
              <CardDescription>Manage your product inventory with HSN/SAC codes and tax information</CardDescription>
            </div>
            <Button disabled>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            <span className="ml-2 text-slate-600">Loading products...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Product Catalog</CardTitle>
              <CardDescription>Manage your product inventory with HSN/SAC codes and tax information</CardDescription>
            </div>
            <Button onClick={handleAddProduct}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">Error: {error}</p>
            <Button onClick={fetchProducts} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Product Catalog</CardTitle>
              <CardDescription>Manage your product inventory with HSN/SAC codes and tax information</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={fetchProducts} variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button onClick={handleAddProduct}>
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="secondary" className="hidden sm:flex">
              {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Product Name</TableHead>
                    <TableHead className="min-w-[150px] hidden md:table-cell">Description</TableHead>
                    <TableHead className="min-w-[100px]">Type</TableHead>
                    <TableHead className="min-w-[120px]">HSN/SAC Code</TableHead>
                    <TableHead className="min-w-[80px] hidden sm:table-cell">Unit</TableHead>
                    <TableHead className="min-w-[80px] hidden sm:table-cell">GST Rate</TableHead>
                    <TableHead className="min-w-[100px]">Rate</TableHead>
                    <TableHead className="text-right min-w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.product_id} className="hover:bg-slate-50">
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Package className="h-4 w-4 text-slate-600" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 truncate">{product.product_name}</div>
                            <div className="text-sm text-slate-500 truncate md:hidden">{product.product_desc}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs hidden md:table-cell">
                        <div className="truncate text-slate-600">{product.product_desc}</div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={productTypeColors[product.product_type as keyof typeof productTypeColors]}
                        >
                          {product.product_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{product.hsn_sac_code}</TableCell>
                      <TableCell className="hidden sm:table-cell">{product.unit_name}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline">{product.gst_rate}%</Badge>
                      </TableCell>
                      <TableCell className="font-mono font-medium">
                        ₹{typeof product.rate === 'number' ? product.rate.toFixed(2) : '0.00'}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditProduct(product)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Product
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDeleteProduct(product)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Product
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

          {filteredProducts.length === 0 && !loading && (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                {searchTerm ? "No products found" : "No products yet"}
              </h3>
              <p className="text-slate-500 mb-4">
                {searchTerm
                  ? "No products found matching your search criteria."
                  : "Add your first product to get started with inventory management."}
              </p>
              {!searchTerm && (
                <Button onClick={handleAddProduct}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Product
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Modal */}
      <ProductModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleModalSuccess}
        mode={modalMode}
        product={selectedProduct}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "<strong>{productToDelete?.product_name}</strong>"? 
              {productToDelete && (
                <span className="block mt-2 text-sm">
                  This action cannot be undone. If this product is used in any invoices, it will be marked as inactive instead of being permanently deleted.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Product"
              )}
            </AlertDialogAction>
          
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}