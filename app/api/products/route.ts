import { type NextRequest, NextResponse } from "next/server"
import { RedisService } from "@/lib/redis"
import { executeQuery, executeInsert } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    let products = await RedisService.getCachedProducts();

    if (!products) {
      products = await executeQuery(`
        SELECT 
          p.product_id,
          p.product_name,
          p.product_desc,
          p.product_type,
          h.hsn_sac_code,
          u.unit_name,
          h.gst_rate,
          p.created_at
        FROM products p
        LEFT JOIN product_units u ON p.unit_id = u.unit_id
        LEFT JOIN hsn_sac_codes h ON p.hsn_sac_id = h.hsn_sac_id
        ORDER BY p.product_name ASC
      `);

      await RedisService.cacheProducts(products);
    }

    if (search) {
      const cachedSearchResults = await RedisService.getCachedSearchResults(`products:${search}`);

      if (cachedSearchResults) {
        return NextResponse.json({ products: cachedSearchResults, cached: true });
      }

      const filteredProducts = products.filter(
        (product: any) =>
          product.product_name.toLowerCase().includes(search.toLowerCase()) ||
          product.product_desc.toLowerCase().includes(search.toLowerCase()) ||
          product.hsn_sac_code.includes(search)
      );

      await RedisService.cacheSearchResults(`products:${search}`, filteredProducts);

      return NextResponse.json({ products: filteredProducts, cached: false });
    }

    return NextResponse.json({ products, cached: products !== null });
  } catch (error) {
    console.error("Products API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const productData = await request.json();

    const result = await executeInsert(
      `
      INSERT INTO products (
        product_name,
        product_desc,
        product_type,
        hsn_sac_id,
        unit_id,
        created_at
      ) VALUES (?, ?, ?, ?, ?, NOW())
    `,
      [
        productData.product_name,
        productData.product_desc,
        productData.product_type,
        productData.hsn_sac_id,
        productData.unit_id,
      ]
    );

    await RedisService.invalidateProductCache();

    return NextResponse.json(
      {
        message: "Product created successfully",
        productId: result.insertId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create product error:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
