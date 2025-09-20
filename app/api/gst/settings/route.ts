import { type NextRequest, NextResponse } from "next/server"
import { eInvoiceService, GSTSettings } from "@/lib/gst-service"
import { executeUpdate } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    // Placeholder for auth: const session = await getServerSession()
    // if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const settings = await eInvoiceService.getGSTSettings()
    return NextResponse.json({ settings })
  } catch (error) {
    console.error("Get GST settings error:", error)
    return NextResponse.json({ error: "Failed to fetch GST settings" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Placeholder for auth
    // if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { settings }: { settings: GSTSettings } = await request.json()

    if (!settings || typeof settings !== "object") {
      return NextResponse.json({ error: "Settings object is required" }, { status: 400 })
    }

    // Validation
    if (!settings.company_gstin.match(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)) {
      return NextResponse.json({ error: "Invalid GSTIN format" }, { status: 400 })
    }
    if (!settings.api_base_url || !settings.client_id || !settings.api_username) {
      return NextResponse.json({ error: "API Base URL, Client ID, and Username are required" }, { status: 400 })
    }
    if (!settings.legal_name || !settings.address_line1 || !settings.city || !settings.state || !settings.state_code || !settings.pincode) {
      return NextResponse.json({ error: "All required company details must be filled" }, { status: 400 })
    }

    // Save settings
    const settingsToSave: { [key: string]: string } = {
      api_base_url: settings.api_base_url,
      api_username: settings.api_username,
      api_password: settings.api_password || "",
      client_id: settings.client_id,
      client_secret: settings.client_secret || "",
      environment: settings.environment,
      company_gstin: settings.company_gstin,
      company_legal_name: settings.legal_name,
      company_trade_name: settings.trade_name || "",
      company_address1: settings.address_line1,
      company_address2: settings.address_line2 || "",
      company_city: settings.city,
      company_state: settings.state,
      company_state_code: settings.state_code,
      company_pincode: settings.pincode,
      company_phone: settings.phone || "",
      company_email: settings.email || "",
      retry_attempts: settings.retry_attempts || "3",
      request_timeout: settings.request_timeout || "30",
      auto_submit_invoices: settings.auto_submit_invoices || "0",
      rate_limit_requests: settings.rate_limit_requests || "50",
      webhook_url: settings.webhook_url || "",
      custom_headers: settings.custom_headers || '{"X-Custom-Header": "value"}'
    }

    for (const [key, value] of Object.entries(settingsToSave)) {
      await executeUpdate(`
        INSERT INTO gst_settings (setting_key, setting_value, is_active, created_at, updated_at)
        VALUES (?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON DUPLICATE KEY UPDATE 
          setting_value = VALUES(setting_value),
          updated_at = CURRENT_TIMESTAMP
      `, [key, value])
    }

    return NextResponse.json({ message: "GST settings updated successfully" })
  } catch (error) {
    console.error("Update GST settings error:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { settings }: { settings: GSTSettings } = await request.json()
    if (!settings) {
      return NextResponse.json({ error: "Settings object is required" }, { status: 400 })
    }

    // Temporarily update settings for testing
    const originalSettings = await eInvoiceService.getGSTSettings()
    const tempSettings: GSTSettings = { ...originalSettings, ...settings }

    // Test connection using eInvoiceService
    const result = await eInvoiceService.testConnection()
    return NextResponse.json(result)
  } catch (error) {
    console.error("Test GST connection error:", error)
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "Connection test failed",
    }, { status: 500 })
  }
}