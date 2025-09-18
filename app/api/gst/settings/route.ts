import { type NextRequest, NextResponse } from "next/server"
import { eInvoiceService } from "@/lib/gst-service"

import { executeQuery, executeUpdate } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const settings = await executeQuery(`
      SELECT setting_key, setting_value, description
      FROM gst_settings 
      WHERE is_active = 1
      ORDER BY setting_key
    `)

    const settingsMap = settings.reduce((acc: any, setting: any) => {
      acc[setting.setting_key] = {
        value: setting.setting_value,
        description: setting.description
      }
      return acc
    }, {})

    return NextResponse.json({ settings: settingsMap })

  } catch (error) {
    console.error("Get GST settings error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { settings } = await request.json()

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: "Settings object is required" }, { status: 400 })
    }
    for (const [key, value] of Object.entries(settings)) {
      if (typeof value === 'string') {
        await executeUpdate(`
          INSERT INTO gst_settings (setting_key, setting_value, is_active, created_at, updated_at)
          VALUES (?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON DUPLICATE KEY UPDATE 
            setting_value = VALUES(setting_value),
            updated_at = CURRENT_TIMESTAMP
        `, [key, value])
      }
    }

    return NextResponse.json({ message: "GST settings updated successfully" })

  } catch (error) {
    console.error("Update GST settings error:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}