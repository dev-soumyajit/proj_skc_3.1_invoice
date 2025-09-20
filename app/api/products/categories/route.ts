import { type NextRequest, NextResponse } from "next/server"
import { executeQuery , executeUpdate , executeInsert } from "@/lib/database"
import { RedisService } from "@/lib/redis"

interface CategoryRequestBody {
  name: string
  parent_id?: string
  description?: string
  sort_order?: number
}


// Input validation function
function validateCategoryInput(data: CategoryRequestBody) {
  const errors: string[] = []

  if (!data.name || data.name.trim() === "") {
    errors.push("Category name is required")
  }

  if (data.name && data.name.length > 100) {
    errors.push("Category name cannot exceed 100 characters")
  }

  if (data.description && data.description.length > 1000) {
    errors.push("Description cannot exceed 1000 characters")
  }

  if (data.sort_order && (isNaN(data.sort_order) || data.sort_order < 0)) {
    errors.push("Sort order must be a non-negative number")
  }

  return errors
}

export async function POST(request: NextRequest) {
  try {
    const body: CategoryRequestBody = await request.json()

    // Validate input
    const validationErrors = validateCategoryInput(body)
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: "Validation failed", details: validationErrors },
        { status: 400 }
      )
    }

    // Check if category name already exists
    const existingCategory = await executeQuery(
      `SELECT category_id FROM product_categories WHERE category_name = ?`,
      [body.name]
    )

    if (existingCategory.length > 0) {
      return NextResponse.json(
        { error: "Category name already exists" },
        { status: 400 }
      )
    }

    // Validate parent_id if provided
    let parentCategoryId: number | null = null
    if (body.parent_id && body.parent_id !== "none") {
      const parentCategory = await executeQuery(
        `SELECT category_id FROM product_categories WHERE category_id = ? AND is_active = 1`,
        [body.parent_id]
      )

      if (parentCategory.length === 0) {
        return NextResponse.json(
          { error: "Invalid parent category ID" },
          { status: 400 }
        )
      }
      parentCategoryId = parseInt(body.parent_id)
    }

    // Prepare data for insertion
    const insertData = {
      category_name: body.name,
      parent_category_id: parentCategoryId,
      category_description: body.description || null,
      sort_order: body.sort_order || 0,
      is_active: 1,
    }

    // Insert new category
    const result = await executeInsert(
      `INSERT INTO product_categories (
        category_name,
        parent_category_id,
        category_description,
        sort_order,
        is_active,
        created_at
      ) VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        insertData.category_name,
        insertData.parent_category_id,
        insertData.category_description,
        insertData.sort_order,
        insertData.is_active,
      ]
    )

    // Clear Redis cache if used
    try {
      await RedisService.client.del("product_categories")
      console.log("Cleared product_categories cache")
    } catch (redisError) {
      console.warn("Failed to clear Redis cache:", redisError)
  
    }

    // Fetch the newly created category
    const newCategory = await executeQuery(
      `SELECT 
        category_id,
        category_name,
        parent_category_id,
        category_description,
        sort_order,
        is_active,
        created_at,
        (SELECT COUNT(*) FROM products WHERE product_category = ?) as product_count
      FROM product_categories 
      WHERE category_id = ?`,
      [body.name, result.insertId]
    )

    return NextResponse.json(
      { 
        message: "Category added successfully",
        category: newCategory[0]
      },
      { status: 201 }
    )

  } catch (error) {
    console.error("Add category API error:", error)
    return NextResponse.json(
      { error: "Failed to add category" },
      { status: 500 }
    )
  }
}


export async function GET(request: NextRequest) {
  try {
    const categories = await executeQuery(`
      SELECT 
        c1.category_id,
        c1.category_name,
        c1.parent_category_id,
        c2.category_name as parent_category_name,
        c1.category_description,
        c1.sort_order,
        COUNT(p.product_id) as product_count
      FROM product_categories c1
      LEFT JOIN product_categories c2 ON c1.parent_category_id = c2.category_id
      LEFT JOIN products p ON c1.category_name = p.product_category
      WHERE c1.is_active = 1
      GROUP BY c1.category_id
      ORDER BY c1.sort_order ASC, c1.category_name ASC
    `)

    return NextResponse.json({ categories })

  } catch (error) {
    console.error("Categories API error:", error)
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
  }
}

