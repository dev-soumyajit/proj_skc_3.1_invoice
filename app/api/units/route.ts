// app/api/units/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { executeQuery, executeInsert } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const units = await executeQuery(`
      SELECT 
        unit_id,
        unit_name
      FROM product_units
      ORDER BY unit_name ASC
    `)

    return NextResponse.json({ units })
  } catch (error) {
    console.error("Units API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { unit_name } = await request.json()

    if (!unit_name) {
      return NextResponse.json({ error: "Unit name is required" }, { status: 400 })
    }

    const result = await executeInsert(
      `
      INSERT INTO product_units (unit_name) 
      VALUES (?)
      `,
      [unit_name]
    )

    return NextResponse.json(
      {
        message: "Unit created successfully",
        unitId: result.insertId,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Create unit error:", error)
    return NextResponse.json({ error: "Failed to create unit" }, { status: 500 })
  }
}