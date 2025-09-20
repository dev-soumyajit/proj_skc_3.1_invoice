// lib/complete-einvoice-service.ts
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
  retry_attempts?: string 
  request_timeout?: string 
  auto_submit_invoices?: string 
  rate_limit_requests?: string 
  webhook_url?: string 
  custom_headers?: string 
}

export interface EInvoiceResponse {
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

export interface InvoiceData {
  invoice_id: number
  invoice_no: string
  invoice_date: string
  customer_id: number
  supply_type: string
  place_supply: string
  grand_total_qty: number
  grand_total_taxable_amt: number
  grand_total_cgst_amt: number
  grand_total_sgst_amt: number
  grand_total_igst_amt: number
  grand_total_amt: number
  amount_chargeable_word: string
  remarks?: string
  customer_company_name: string
  customer_address: string
  customer_state_name: string
  customer_state_code: string
  customer_pin_code: string
  customer_phone?: string
  customer_email?: string
  buyer_gstin: string
  items: InvoiceItem[]
  irn?: string
  ack_no?: string
  ack_date?: string
  qr_code_data?: string
  status: string
}

export interface InvoiceItem {
  product_name: string
  product_description?: string
  hsn_sac_code: string
  qty: number
  rate: number
  unit: string
  taxable_amt: number
  discount: number
  cgst_rate: number
  cgst_amt: number
  sgst_rate: number
  sgst_amt: number
  igst_rate: number
  igst_amt: number
  total_amount: number
}

export class CompleteEInvoiceService {
  private static instance: CompleteEInvoiceService
  private authToken: string | null = null
  private tokenExpiry: Date | null = null

  private constructor() {}

  static getInstance(): CompleteEInvoiceService {
    if (!CompleteEInvoiceService.instance) {
      CompleteEInvoiceService.instance = new CompleteEInvoiceService()
    }
    return CompleteEInvoiceService.instance
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
        company_gstin: settingsMap.company_gstin || "",
        legal_name: settingsMap.company_legal_name || "",
        trade_name: settingsMap.company_trade_name,
        address_line1: settingsMap.company_address1 || "",
        address_line2: settingsMap.company_address2,
        city: settingsMap.company_city || "",
        state: settingsMap.company_state || "",
        state_code: settingsMap.company_state_code || "",
        pincode: settingsMap.company_pincode || "",
        phone: settingsMap.company_phone,
        email: settingsMap.company_email,
        retry_attempts: settingsMap.retry_attempts || "3",
        request_timeout: settingsMap.request_timeout || "30",
        auto_submit_invoices: settingsMap.auto_submit_invoices || "0",
        rate_limit_requests: settingsMap.rate_limit_requests || "50",
        webhook_url: settingsMap.webhook_url || "",
        custom_headers: settingsMap.custom_headers || '{"X-Custom-Header": "value"}',
      }
    } catch (error) {
      console.error("Error fetching GST settings:", error)
      throw new Error("Failed to load GST settings from database")
    }
  }

  async getAuthToken(forceRefresh: boolean = false): Promise<string> {
    if (!forceRefresh && this.authToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.authToken
    }

    const settings = await this.getGSTSettings()

    if (!settings.api_username || !settings.api_password || !settings.client_id) {
      throw new Error("GST API credentials not configured. Please update GST settings.")
    }

    try {
      console.log("Authenticating with GST API...")
      
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

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`GST API HTTP Error: ${response.status} - ${errorText}`)
      }

      const data: EInvoiceResponse = await response.json()

      if (data.Status === 1 && data.Data?.AuthToken) {
        this.authToken = data.Data.AuthToken
        this.tokenExpiry = new Date(Date.now() + 5 * 60 * 60 * 1000) // 5 hours
        return this.authToken
      } else {
        const errorMessage = data.ErrorDetails?.map(err => `${err.ErrorCode}: ${err.ErrorMessage}`).join("; ") || "Authentication failed"
        throw new Error(`GST Authentication failed: ${errorMessage}`)
      }
    } catch (error) {
      console.error("GST Authentication Error:", error)
      throw error
    }
  }

  async getInvoiceData(invoiceId: number): Promise<InvoiceData> {
    const invoiceQuery = `
      SELECT 
        ti.invoice_id, ti.invoice_no, ti.invoice_date, ti.customer_id,
        ti.supply_type, ti.place_supply, ti.grand_total_qty,
        ti.grand_total_taxable_amt, ti.grand_total_cgst_amt, 
        ti.grand_total_sgst_amt, ti.grand_total_igst_amt, ti.grand_total_amt,
        ti.amount_chargeable_word, ti.remarks, ti.status,
        ti.irn, ti.ack_no, ti.ack_date,
        mc.customer_company_name, mc.customer_address, mc.customer_state_name,
        mc.customer_state_code, mc.customer_pin_code, mc.customer_phone, 
        mc.customer_email, mc.customer_gst_in as buyer_gstin
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
        COALESCE(p.product_name, id.product_description) as product_name,
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
      LEFT JOIN products p ON id.product_id = p.product_id
      LEFT JOIN product_units pu ON id.unit_id = pu.unit_id
      WHERE id.invoice_id = ?
    `

    const items = await executeQuery(itemsQuery, [invoiceId])

    return {
      ...invoice,
      items
    }
  }

  buildGSTPayload(invoiceData: InvoiceData, settings: GSTSettings): any {
    const isInterState = invoiceData.customer_state_code !== settings.state_code
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
        Dt: invoiceDate.toLocaleDateString('en-GB').split('/').reverse().join('/')
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
        Loc: invoiceData.customer_state_name,
        Pin: parseInt(invoiceData.customer_pin_code?.toString() || "400001"),
        Stcd: invoiceData.customer_state_code,
        Ph: invoiceData.customer_phone || "",
        Em: invoiceData.customer_email || ""
      },
      ItemList: invoiceData.items.map((item, index) => ({
        SlNo: (index + 1).toString(),
        PrdDesc: (item.product_name || "").substring(0, 300),
        IsServc: "N",
        HsnCd: item.hsn_sac_code,
        Qty: parseFloat(item.qty.toString()) || 1,
        Unit: (item.unit || "NOS").toUpperCase().substring(0, 8),
        UnitPrice: parseFloat(item.rate.toString()) || 0,
        TotAmt: parseFloat(item.taxable_amt.toString()) || 0,
        Discount: parseFloat(item.discount.toString()) || 0,
        PreTaxVal: parseFloat(item.taxable_amt.toString()) || 0,
        AssAmt: parseFloat(item.taxable_amt.toString()) || 0,
        GstRt: isInterState ? (parseFloat(item.igst_rate.toString()) || 0) : ((parseFloat(item.cgst_rate.toString()) || 0) + (parseFloat(item.sgst_rate.toString()) || 0)),
        IgstAmt: isInterState ? (parseFloat(item.igst_amt.toString()) || 0) : 0,
        CgstAmt: isInterState ? 0 : (parseFloat(item.cgst_amt.toString()) || 0),
        SgstAmt: isInterState ? 0 : (parseFloat(item.sgst_amt.toString()) || 0),
        CesRt: 0,
        CesAmt: 0,
        CesNonAdvlAmt: 0,
        StateCesRt: 0,
        StateCesAmt: 0,
        StateCesNonAdvlAmt: 0,
        OthChrg: 0,
        TotItemVal: parseFloat(item.total_amount.toString()) || 0
      })),
      ValDtls: {
        AssVal: parseFloat(invoiceData.grand_total_taxable_amt.toString()) || 0,
        CgstVal: isInterState ? 0 : (parseFloat(invoiceData.grand_total_cgst_amt.toString()) || 0),
        SgstVal: isInterState ? 0 : (parseFloat(invoiceData.grand_total_sgst_amt.toString()) || 0),
        IgstVal: isInterState ? (parseFloat(invoiceData.grand_total_igst_amt.toString()) || 0) : 0,
        CesVal: 0,
        StCesVal: 0,
        Discount: 0,
        OthChrg: 0,
        RndOffAmt: 0,
        TotInvVal: parseFloat(invoiceData.grand_total_amt.toString()) || 0
      }
    }
  }

  async submitInvoiceToGST(invoiceId: number): Promise<EInvoiceResponse> {
    try {
      console.log(`Starting GST submission for invoice ${invoiceId}`)

      // Validate invoice before submission
      await this.validateInvoiceForGST(invoiceId)

      // Check rate limit
      const canProceed = await RedisService.checkRateLimit("gst_api", 50, 3600)
      if (!canProceed) {
        throw new Error("GST API rate limit exceeded. Please try again after an hour.")
      }

      const settings = await this.getGSTSettings()
      const invoiceData = await this.getInvoiceData(invoiceId)
      const gstPayload = this.buildGSTPayload(invoiceData, settings)

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

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`GST API HTTP Error: ${response.status} - ${errorText}`)
      }

      const gstResponse: EInvoiceResponse = await response.json()

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

      // Update invoice based on response
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
            error_code = NULL,
            error_message = NULL,
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
      } else {
        // Update invoice with error
        const errorMessage = gstResponse.ErrorDetails?.map(err => `${err.ErrorCode}: ${err.ErrorMessage}`).join("; ") || "Unknown GST error"
        await executeUpdate(`
          UPDATE tax_invoices 
          SET 
            status = 'draft',
            error_code = ?,
            error_message = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE invoice_id = ?
        `, [
          gstResponse.ErrorDetails?.[0]?.ErrorCode || "GST_ERROR",
          errorMessage,
          invoiceId
        ])
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
        error instanceof Error ? error.message : "System error occurred"
      )
      
      throw error
    }
  }

  async retryFailedInvoice(invoiceId: number): Promise<EInvoiceResponse> {
    // Check if invoice is in failed state
    const invoice = await this.getInvoiceData(invoiceId)
    if (invoice.status === 'submitted') {
      throw new Error("Invoice is already submitted successfully")
    }

    return this.submitInvoiceToGST(invoiceId)
  }

  async cancelInvoice(invoiceId: number, reason: string, remarks?: string): Promise<EInvoiceResponse> {
    try {
      const settings = await this.getGSTSettings()
      const invoiceData = await this.getInvoiceData(invoiceId)

      if (!invoiceData.irn) {
        throw new Error("Cannot cancel invoice: IRN not found")
      }

      if (invoiceData.status === 'cancelled') {
        throw new Error("Invoice is already cancelled")
      }

      // Check if cancellation is allowed (within 24 hours)
      const invoiceDate = new Date(invoiceData.invoice_date)
      const now = new Date()
      const hoursDiff = (now.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60)

      if (hoursDiff > 24) {
        throw new Error("Invoice can only be cancelled within 24 hours of generation")
      }

      const authToken = await this.getAuthToken()

      const cancelPayload = {
        Irn: invoiceData.irn,
        CnlRsn: reason,
        CnlRem: remarks || reason
      }

      const response = await fetch(`${settings.api_base_url}/eicore/v1.03/Invoice/Cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "user_name": settings.api_username,
          "authtoken": authToken,
          "gstin": settings.company_gstin,
        },
        body: JSON.stringify(cancelPayload)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`GST Cancel API Error: ${response.status} - ${errorText}`)
      }

      const cancelResponse: EInvoiceResponse = await response.json()

      // Log cancellation transaction
      await this.logGSTTransaction(
        invoiceId,
        "cancel",
        cancelPayload,
        cancelResponse,
        cancelResponse.Status === 1 ? "success" : "failed",
        cancelResponse.ErrorDetails?.[0]?.ErrorCode,
        cancelResponse.ErrorDetails?.map(err => `${err.ErrorCode}: ${err.ErrorMessage}`).join("; ")
      )

      // Update invoice if cancellation successful
      if (cancelResponse.Status === 1) {
        await executeUpdate(`
          UPDATE tax_invoices 
          SET 
            status = 'cancelled',
            cancelled_date = CURRENT_TIMESTAMP,
            cancel_reason = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE invoice_id = ?
        `, [reason, invoiceId])
      }

      return cancelResponse

    } catch (error) {
      console.error("Invoice cancellation error:", error)
      throw error
    }
  }

  async getInvoiceLogs(invoiceId: number) {
    return executeQuery(`
      SELECT 
        log_id, transaction_type, status, error_code, error_message,
        irn, ack_no, ack_date, api_endpoint, created_at, updated_at
      FROM e_invoice_logs
      WHERE invoice_id = ?
      ORDER BY created_at DESC
    `, [invoiceId])
  }

  private async validateInvoiceForGST(invoiceId: number): Promise<void> {
    const result = await executeQuery(`
      CALL ValidateInvoiceForGST(?, @is_valid, @validation_errors)
    `, [invoiceId])

    const validation = await executeQuery(`
      SELECT @is_valid as is_valid, @validation_errors as validation_errors
    `)

    if (!validation[0]?.is_valid) {
      throw new Error(`Invoice validation failed: ${validation[0]?.validation_errors || 'Unknown validation error'}`)
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
      await this.getAuthToken(true)
      return {
        success: true,
        message: "GST API connection successful! Authentication token received."
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Connection test failed"
      }
    }
  }

  // Generate Invoice Number
  async generateInvoiceNumber(): Promise<string> {
    const currentDate = new Date()
    const financialYear = currentDate.getMonth() >= 3 ? 
      `${currentDate.getFullYear()}-${(currentDate.getFullYear() + 1).toString().slice(-2)}` :
      `${currentDate.getFullYear() - 1}-${currentDate.getFullYear().toString().slice(-2)}`

    const result = await executeQuery(`
      CALL GetNextInvoiceNumber(?, 'INV', @next_number)
    `, [financialYear])

    const nextNumber = await executeQuery(`
      SELECT @next_number as next_number
    `)

    const invoiceSequence = nextNumber[0]?.next_number || 1
    return `INV/${financialYear}/${invoiceSequence.toString().padStart(3, '0')}`
  }
}

// Export singleton instance
export const eInvoiceService = CompleteEInvoiceService.getInstance()