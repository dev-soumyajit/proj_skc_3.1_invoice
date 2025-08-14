// app/api/hsn-codes/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { RedisService } from "@/lib/redis"
import { executeQuery, executeInsert } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    let hsnCodes = await RedisService.getCachedHSNRates()

    if (!hsnCodes) {
      hsnCodes = await executeQuery(`
        SELECT 
          hsn_sac_id,
          hsn_sac_code,
          gst_rate
        FROM hsn_sac_codes
        ORDER BY hsn_sac_code ASC
      `)

      await RedisService.cacheHSNRates(hsnCodes)
    }

    return NextResponse.json({ hsnCodes, cached: hsnCodes !== null })
  } catch (error) {
    console.error("HSN codes API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { hsn_sac_code, gst_rate } = await request.json()

    if (!hsn_sac_code || !gst_rate) {
      return NextResponse.json({ error: "HSN/SAC code and GST rate are required" }, { status: 400 })
    }

    const result = await executeInsert(
      `
      INSERT INTO hsn_sac_codes (hsn_sac_code, gst_rate) 
      VALUES (?, ?)
      `,
      [hsn_sac_code, gst_rate]
    )

    // Invalidate cache
    await RedisService.invalidateCache("master:hsn_rates")

    return NextResponse.json(
      {
        message: "HSN/SAC code created successfully",
        hsnId: result.insertId,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Create HSN code error:", error)
    return NextResponse.json({ error: "Failed to create HSN/SAC code" }, { status: 500 })
  }
}