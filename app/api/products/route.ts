import { type NextRequest, NextResponse } from "next/server";
import { RedisService } from "@/lib/redis";
import { executeQuery, executeInsert } from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    let products = await RedisService.getCachedProducts();

    if (!products) {
      products = await executeQuery(`
        SELECT 
          p.product_id,
          p.product_code,
          p.product_name,
          p.product_desc,
          p.product_type,
          p.rate,
          h.hsn_sac_code,
          h.hsn_sac_id,
          u.unit_name,
          u.unit_id,
          h.gst_rate,
          p.created_at,
          p.updated_at
        FROM products p
        LEFT JOIN product_units u ON p.unit_id = u.unit_id
        LEFT JOIN hsn_sac_codes h ON p.hsn_sac_id = h.hsn_sac_id
        WHERE p.product_status = 1 AND p.is_active = 1
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
          (product.hsn_sac_code && product.hsn_sac_code.includes(search)) ||
          (product.product_code && product.product_code.toLowerCase().includes(search.toLowerCase()))
      );

      await RedisService.cacheSearchResults(`products:${search}`, filteredProducts);

      return NextResponse.json({ products: filteredProducts, cached: false });
    }

    return NextResponse.json({ products, cached: products !== null });
  } catch (error) {
    console.error("Products GET API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const productData = await request.json();
    console.log("Incoming POST payload:", JSON.stringify(productData, null, 2));

    // Required field validations
    if (!productData.product_name) {
      return NextResponse.json({ error: "product_name is required" }, { status: 400 });
    }
    if (!productData.product_desc) {
      return NextResponse.json({ error: "product_desc is required" }, { status: 400 });
    }
    if (!productData.product_type || !["raw", "finished"].includes(productData.product_type)) {
      console.error("Invalid product_type:", productData.product_type);
      return NextResponse.json({ error: 'product_type must be "raw" or "finished"' }, { status: 400 });
    }
    if (!productData.unit_id || isNaN(parseInt(productData.unit_id))) {
      return NextResponse.json({ error: "Valid unit_id is required" }, { status: 400 });
    }

    let hsn = null;
    let hsn_sac_id = productData.hsn_sac_id ? parseInt(productData.hsn_sac_id) : null;

    if (hsn_sac_id) {
      [hsn] = await executeQuery(
        `SELECT hsn_sac_id, gst_rate FROM hsn_sac_codes WHERE hsn_sac_id = ? AND is_active = 1`,
        [hsn_sac_id]
      );
      if (!hsn) {
        return NextResponse.json({ error: "Invalid or inactive HSN/SAC code" }, { status: 400 });
      }
    } else if (productData.hsn_sac_code && productData.gst_rate !== undefined) {
      [hsn] = await executeQuery(
        `SELECT hsn_sac_id, gst_rate FROM hsn_sac_codes WHERE hsn_sac_code = ? AND is_active = 1`,
        [productData.hsn_sac_code]
      );

      if (hsn) {
        hsn_sac_id = hsn.hsn_sac_id;
      } else {
        if (isNaN(parseFloat(productData.gst_rate))) {
          return NextResponse.json({ error: "Valid gst_rate is required for new HSN/SAC" }, { status: 400 });
        }
        const insertResult = await executeInsert(
          `
          INSERT INTO hsn_sac_codes (
            hsn_sac_code,
            gst_rate,
            is_active
          ) VALUES (?, ?, 1)
          `,
          [
            productData.hsn_sac_code,
            parseFloat(productData.gst_rate),
          ]
        );
        hsn_sac_id = insertResult.insertId;
        hsn = { hsn_sac_id, gst_rate: productData.gst_rate };
      }
    } else {
      return NextResponse.json(
        { error: "Either hsn_sac_id or both hsn_sac_code and gst_rate are required" },
        { status: 400 }
      );
    }

    const [unit] = await executeQuery(
      `SELECT unit_id FROM product_units WHERE unit_id = ? AND is_active = 1`,
      [parseInt(productData.unit_id)]
    );
    if (!unit) {
      return NextResponse.json({ error: "Invalid or inactive unit selection" }, { status: 400 });
    }

    let product_code = productData.product_code || null;
    if (!product_code) {
      const prefix = productData.product_type === "raw" ? "RM" : "FG";
      const [maxCode] = await executeQuery(
        `SELECT MAX(CAST(SUBSTRING(product_code, 3) AS UNSIGNED)) as max_num 
         FROM products 
         WHERE product_code LIKE '${prefix}%'`
      );
      const nextNum = (maxCode?.max_num || 0) + 1;
      product_code = `${prefix}${String(nextNum).padStart(4, "0")}`;
    } else {
      const [existingProduct] = await executeQuery(
        `SELECT product_id FROM products WHERE product_code = ?`,
        [product_code]
      );
      if (existingProduct) {
        return NextResponse.json({ error: "Product code already exists" }, { status: 400 });
      }
    }

    const result = await executeInsert(
      `
      INSERT INTO products (
        product_code,
        product_name,
        product_desc,
        product_type,
        hsn_sac_id,
        unit_id,
        rate,
        product_category,
        product_subcategory,
        brand,
        manufacturer,
        model_number,
        keywords,
        tags,
        product_status,
        is_active,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, NOW(), NOW())
      `,
      [
        product_code,
        productData.product_name,
        productData.product_desc,
        productData.product_type,
        hsn_sac_id,
        parseInt(productData.unit_id),
        parseFloat(productData.rate) || 0,
        productData.product_category || null,
        productData.product_subcategory || null,
        productData.brand || null,
        productData.manufacturer || null,
        productData.model_number || null,
        productData.keywords || null,
        productData.tags ? JSON.stringify(productData.tags) : null,
      ]
    );

    try {
      await RedisService.invalidateProductCache();
    } catch (redisError) {
      console.error("Redis cache invalidation failed:", redisError);
    }

    return NextResponse.json(
      {
        message: "Product created successfully",
        productId: result.insertId,
        product_code,
        gst: {
          rate: hsn.gst_rate,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Products POST API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}