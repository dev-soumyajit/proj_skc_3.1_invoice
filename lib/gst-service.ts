// lib/gst-service.ts - FIXED VERSION with proper error handling
import { executeQuery, executeInsert, executeUpdate } from "@/lib/database"
import { RedisService } from "@/lib/redis"

export interface GSTSettings {
  api_base_url: string
  api_username: string
  api_password: string
  client_id: string
  client_secret: string
  environment: 'sandbox' | 'production'
  company_gstin: string
  legal_name: string
  trade_name?: string
  address_line1: string
  address_line2?: string
  city: string
  state: string
  state_code: string
  pincode: string
  phone?: string
  email?: string
}

export interface GSTResponse {
  Status: number
  Data?: {
    Irn?: string
    AckNo?: string
    AckDt?: string
    QRCodeUrl?: string
    SignedInvoice?: string
    SignedQRCode?: string
    EwbNo?: string
    EwbDt?: string
    EwbValidTill?: string
    CancelDate?: string
    AuthToken?: string
  }
  ErrorDetails?: Array<{
    ErrorCode: string
    ErrorMessage: string
    ErrorSource?: string
  }>
}

export class GSTService {
  private static instance: GSTService
  private authToken: string | null = null
  private tokenExpiry: Date | null = null

  private constructor() {}

  static getInstance(): GSTService {
    if (!GSTService.instance) {
      GSTService.instance = new GSTService()
    }
    return GSTService.instance
  }

  async getGSTSettings(): Promise<GSTSettings> {
    try {
      const settings = await executeQuery(`
        SELECT setting_key, setting_value 
        FROM gst_settings 
        WHERE is_active = 1
      `)

      const settingsMap = settings.reduce((acc: any, setting: any) => {
        acc[setting.setting_key] = setting.setting_value
        return acc
      }, {})

      return {
        api_base_url: settingsMap.api_base_url || process.env.GST_API_BASE_URL || "https://einv-apisandbox.nic.in",
        api_username: settingsMap.api_username || process.env.GST_API_USERNAME || "",
        api_password: settingsMap.api_password || process.env.GST_API_PASSWORD || "",
        client_id: settingsMap.client_id || process.env.GST_API_CLIENT_ID || "",
        client_secret: settingsMap.client_secret || process.env.GST_API_CLIENT_SECRET || "",
        environment: settingsMap.environment || 'sandbox',
        company_gstin: settingsMap.company_gstin || "27AABCU9603R1ZX",
        legal_name: settingsMap.company_legal_name || "Your Company Name Pvt Ltd",
        trade_name: settingsMap.company_trade_name,
        address_line1: settingsMap.company_address1 || "123 Business Park",
        address_line2: settingsMap.company_address2,
        city: settingsMap.company_city || "Mumbai",
        state: settingsMap.company_state || "Maharashtra",
        state_code: settingsMap.company_state_code || "27",
        pincode: settingsMap.company_pincode || "400069",
        phone: settingsMap.company_phone,
        email: settingsMap.company_email
      }
    } catch (error) {
      console.error("Error fetching GST settings:", error)
      // Return default settings if database fails
      return {
        api_base_url: process.env.GST_API_BASE_URL || "https://einv-apisandbox.nic.in",
        api_username: process.env.GST_API_USERNAME || "",
        api_password: process.env.GST_API_PASSWORD || "",
        client_id: process.env.GST_API_CLIENT_ID || "",
        client_secret: process.env.GST_API_CLIENT_SECRET || "",
        environment: 'sandbox',
        company_gstin: "27AABCU9603R1ZX",
        legal_name: "Your Company Name Pvt Ltd",
        address_line1: "123 Business Park",
        city: "Mumbai",
        state: "Maharashtra",
        state_code: "27",
        pincode: "400069"
      }
    }
  }

  async getAuthToken(forceRefresh: boolean = false): Promise<string> {
    if (!forceRefresh && this.authToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.authToken
    }

    const settings = await this.getGSTSettings()

    // Validate required settings
    if (!settings.api_username || !settings.api_password || !settings.client_id) {
      throw new Error("GST API credentials not configured. Please check your settings.")
    }

    try {
      console.log("Attempting GST authentication...")
      console.log("API URL:", `${settings.api_base_url}/eivital/v1.04/auth`)
      
      const response = await fetch(`${settings.api_base_url}/eivital/v1.04/auth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          UserName: settings.api_username,
          Password: settings.api_password,
          AppKey: settings.client_id,
          ForceRefreshAccessToken: forceRefresh,
        })
      })

      console.log("GST Auth Response Status:", response.status)
      console.log("GST Auth Response Headers:", Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error("GST Auth HTTP Error:", response.status, errorText)
        throw new Error(`GST API HTTP Error: ${response.status} - ${errorText}`)
      }

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text()
        console.error("GST Auth Non-JSON Response:", responseText.substring(0, 500))
        throw new Error(`GST API returned non-JSON response. Content-Type: ${contentType}`)
      }

      const data: GSTResponse = await response.json()
      console.log("GST Auth Response:", data)

      if (data.Status === 1 && data.Data?.AuthToken) {
        this.authToken = data.Data.AuthToken
        this.tokenExpiry = new Date(Date.now() + 5 * 60 * 60 * 1000) // 5 hours
        console.log("GST Authentication successful")
        return this.authToken
      } else {
        const errorMessage = data.ErrorDetails?.map(err => `${err.ErrorCode}: ${err.ErrorMessage}`).join("; ") || "Unknown auth error"
        console.error("GST Auth API Error:", errorMessage)
        throw new Error(`GST Auth failed: ${errorMessage}`)
      }
    } catch (error) {
      console.error("GST Authentication Error:", error)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error("Network error: Unable to connect to GST API. Please check your internet connection and API URL.")
      }
      throw error
    }
  }

  async getInvoiceData(invoiceId: number) {
    const invoiceQuery = `
      SELECT 
        ti.invoice_id, ti.invoice_no, ti.invoice_date, ti.customer_id,
        ti.supply_type, ti.place_supply, ti.grand_total_qty,
        ti.grand_total_taxable_amt, ti.grand_total_cgst_amt, 
        ti.grand_total_sgst_amt, ti.grand_total_amt, ti.remarks,
        mc.customer_company_name, mc.customer_address, mc.customer_state_name as customer_state,
        mc.customer_state_code, mc.customer_pin_code as customer_pincode,
        mc.customer_phone, mc.customer_email, mc.customer_gst_in as buyer_gstin,
        mc.customer_address as customer_city
      FROM tax_invoices ti
      JOIN master_customer mc ON ti.customer_id = mc.customer_id
      WHERE ti.invoice_id = ?
    `

    const invoices = await executeQuery(invoiceQuery, [invoiceId])
    if (invoices.length === 0) {
      throw new Error(`Invoice not found: ${invoiceId}`)
    }

    const invoice = invoices[0]

    const itemsQuery = `
      SELECT 
        p.product_name,
        id.product_description,
        id.hsn_sac_code,
        id.qty,
        id.rate,
        pu.unit_name as unit,
        id.taxable_amt,
        COALESCE(id.discount, 0) as discount,
        id.cgst_rate,
        id.cgst_amt,
        id.sgst_rate,
        id.sgst_amt,
        COALESCE(id.igst_rate, 0) as igst_rate,
        COALESCE(id.igst_amount, 0) as igst_amt,
        id.total_amount
      FROM invoice_details id
      JOIN products p ON id.product_id = p.product_id
      JOIN product_units pu ON id.unit_id = pu.unit_id
      WHERE id.invoice_id = ?
    `

    const items = await executeQuery(itemsQuery, [invoiceId])

    return {
      ...invoice,
      grand_total_igst_amt: items.reduce((sum: number, item: any) => sum + (item.igst_amt || 0), 0),
      items
    }
  }

  buildGSTPayload(invoiceData: any, settings: GSTSettings): any {
    const isInterState = invoiceData.customer_state_code !== settings.state_code.substring(0, 2)
    const invoiceDate = new Date(invoiceData.invoice_date)

    return {
      Version: "1.1",
      TranDtls: {
        TaxSch: "GST",
        SupTyp: invoiceData.supply_type || "B2B",
        RegRev: "N"
      },
      DocDtls: {
        Typ: "INV",
        No: invoiceData.invoice_no,
        Dt: invoiceDate.toLocaleDateString('en-GB') // DD/MM/YYYY format
      },
      SellerDtls: {
        Gstin: settings.company_gstin,
        LglNm: settings.legal_name,
        TrdNm: settings.trade_name || settings.legal_name,
        Addr1: settings.address_line1,
        Addr2: settings.address_line2 || "",
        Loc: settings.city,
        Pin: parseInt(settings.pincode),
        Stcd: settings.state_code,
        Ph: settings.phone || "",
        Em: settings.email || ""
      },
      BuyerDtls: {
        Gstin: invoiceData.buyer_gstin,
        LglNm: invoiceData.customer_company_name,
        TrdNm: invoiceData.customer_company_name,
        Pos: invoiceData.customer_state_code,
        Addr1: invoiceData.customer_address,
        Addr2: "",
        Loc: invoiceData.customer_city,
        Pin: parseInt(invoiceData.customer_pincode) || 400001,
        Stcd: invoiceData.customer_state_code,
        Ph: invoiceData.customer_phone || "",
        Em: invoiceData.customer_email || ""
      },
      ItemList: invoiceData.items.map((item: any, index: number) => ({
        SlNo: (index + 1).toString(),
        PrdDesc: (item.product_name || "").substring(0, 300),
        IsServc: "N",
        HsnCd: item.hsn_sac_code,
        Qty: parseFloat(item.qty) || 1,
        Unit: (item.unit || "NOS").toUpperCase().substring(0, 3),
        UnitPrice: parseFloat(item.rate) || 0,
        TotAmt: parseFloat(item.taxable_amt) || 0,
        Discount: parseFloat(item.discount) || 0,
        PreTaxVal: parseFloat(item.taxable_amt) || 0,
        AssAmt: parseFloat(item.taxable_amt) || 0,
        GstRt: isInterState ? (parseFloat(item.igst_rate) || 0) : ((parseFloat(item.cgst_rate) || 0) + (parseFloat(item.sgst_rate) || 0)),
        IgstAmt: isInterState ? (parseFloat(item.igst_amt) || 0) : 0,
        CgstAmt: isInterState ? 0 : (parseFloat(item.cgst_amt) || 0),
        SgstAmt: isInterState ? 0 : (parseFloat(item.sgst_amt) || 0),
        CesRt: 0,
        CesAmt: 0,
        CesNonAdvlAmt: 0,
        StateCesRt: 0,
        StateCesAmt: 0,
        StateCesNonAdvlAmt: 0,
        OthChrg: 0,
        TotItemVal: parseFloat(item.total_amount) || 0
      })),
      ValDtls: {
        AssVal: parseFloat(invoiceData.grand_total_taxable_amt) || 0,
        CgstVal: isInterState ? 0 : (parseFloat(invoiceData.grand_total_cgst_amt) || 0),
        SgstVal: isInterState ? 0 : (parseFloat(invoiceData.grand_total_sgst_amt) || 0),
        IgstVal: isInterState ? (parseFloat(invoiceData.grand_total_igst_amt) || 0) : 0,
        CesVal: 0,
        StCesVal: 0,
        Discount: 0,
        OthChrg: 0,
        RndOffAmt: 0,
        TotInvVal: parseFloat(invoiceData.grand_total_amt) || 0
      }
    }
  }

  async submitInvoiceToGST(invoiceId: number): Promise<GSTResponse> {
    try {
      console.log(`Submitting invoice ${invoiceId} to GST...`)

      // Check rate limit
      const canProceed = await RedisService.checkRateLimit("gst_api", 50, 3600)
      if (!canProceed) {
        throw new Error("GST API rate limit exceeded. Please try again later.")
      }

      const settings = await this.getGSTSettings()
      const invoiceData = await this.getInvoiceData(invoiceId)
      const gstPayload = this.buildGSTPayload(invoiceData, settings)

      console.log("GST Payload:", JSON.stringify(gstPayload, null, 2))

      // Get auth token
      const authToken = await this.getAuthToken()

      // Submit to GST API
      const response = await fetch(`${settings.api_base_url}/eicore/v1.03/Invoice`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "user_name": settings.api_username,
          "authtoken": authToken,
          "gstin": settings.company_gstin,
        },
        body: JSON.stringify(gstPayload)
      })

      console.log("GST Submission Response Status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("GST Submission HTTP Error:", response.status, errorText)
        throw new Error(`GST API HTTP Error: ${response.status} - ${errorText}`)
      }

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text()
        console.error("GST Submission Non-JSON Response:", responseText.substring(0, 500))
        throw new Error(`GST API returned non-JSON response. Content-Type: ${contentType}`)
      }

      const gstResponse: GSTResponse = await response.json()
      console.log("GST Submission Response:", gstResponse)

      // Log transaction
      await this.logGSTTransaction(
        invoiceId,
        "generate",
        gstPayload,
        gstResponse,
        gstResponse.Status === 1 ? "success" : "failed",
        gstResponse.ErrorDetails?.[0]?.ErrorCode,
        gstResponse.ErrorDetails?.map(err => `${err.ErrorCode}: ${err.ErrorMessage}`).join("; ")
      )

      // Update invoice if successful
      if (gstResponse.Status === 1 && gstResponse.Data?.Irn) {
        await executeUpdate(`
          UPDATE tax_invoices 
          SET 
            irn = ?,
            ack_no = ?,
            ack_date = ?,
            qr_code_url = ?,
            signed_invoice = ?,
            signed_qr_code = ?,
            status = 'submitted',
            updated_at = CURRENT_TIMESTAMP
          WHERE invoice_id = ?
        `, [
          gstResponse.Data.Irn,
          gstResponse.Data.AckNo || null,
          gstResponse.Data.AckDt || null,
          gstResponse.Data.QRCodeUrl || null,
          gstResponse.Data.SignedInvoice || null,
          gstResponse.Data.SignedQRCode || null,
          invoiceId
        ])
        console.log("Invoice updated with GST details")
      } else if (gstResponse.Status !== 1) {
        // Update invoice with error
        const errorMessage = gstResponse.ErrorDetails?.map(err => `${err.ErrorCode}: ${err.ErrorMessage}`).join("; ") || "Unknown error"
        await executeUpdate(`
          UPDATE tax_invoices 
          SET 
            status = 'draft',
            error_code = ?,
            error_message = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE invoice_id = ?
        `, [
          gstResponse.ErrorDetails?.[0]?.ErrorCode || null,
          errorMessage,
          invoiceId
        ])
        console.log("Invoice updated with error details")
      }

      return gstResponse

    } catch (error) {
      console.error("GST submission error:", error)
      
      // Log error transaction
      await this.logGSTTransaction(
        invoiceId,
        "generate",
        null,
        { error: error instanceof Error ? error.message : "Unknown error" },
        "failed",
        "SYSTEM_ERROR",
        error instanceof Error ? error.message : "Unknown error"
      )
      
      throw error
    }
  }

  private async logGSTTransaction(
    invoiceId: number,
    transactionType: string,
    requestPayload: any,
    responsePayload: any,
    status: string,
    errorCode?: string,
    errorMessage?: string
  ): Promise<void> {
    try {
      await executeInsert(`
        INSERT INTO e_invoice_logs (
          invoice_id, transaction_type, request_payload, response_payload,
          status, error_code, error_message, api_endpoint, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [
        invoiceId,
        transactionType,
        JSON.stringify(requestPayload),
        JSON.stringify(responsePayload),
        status,
        errorCode || null,
        errorMessage || null,
        transactionType === "cancel" ? "/eicore/v1.03/Invoice/Cancel" : "/eicore/v1.03/Invoice"
      ])
    } catch (logError) {
      console.error("Failed to log GST transaction:", logError)
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      console.log("Testing GST API connection...")
      await this.getAuthToken(true) // Force refresh to test
      return {
        success: true,
        message: "GST API connection successful! Authentication token received."
      }
    } catch (error) {
      console.error("GST connection test failed:", error)
      return {
        success: false,
        message: error instanceof Error ? error.message : "Connection test failed"
      }
    }
  }
}