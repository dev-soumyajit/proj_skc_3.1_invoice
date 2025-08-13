import { type NextRequest, NextResponse } from "next/server"
import { RedisService } from "@/lib/redis"

// GST API Configuration
const GST_API_BASE_URL = process.env.GST_API_BASE_URL || "https://einv-apisandbox.nic.in"
const GST_API_USERNAME = process.env.GST_API_USERNAME || ""
const GST_API_PASSWORD = process.env.GST_API_PASSWORD || ""
const GST_API_CLIENT_ID = process.env.GST_API_CLIENT_ID || ""
const GST_API_CLIENT_SECRET = process.env.GST_API_CLIENT_SECRET || ""

interface GSTInvoicePayload {
  Version: string
  TranDtls: {
    TaxSch: string
    SupTyp: string
    RegRev: string
    EcmGstin?: string
    IgstOnIntra?: string
  }
  DocDtls: {
    Typ: string
    No: string
    Dt: string
  }
  SellerDtls: {
    Gstin: string
    LglNm: string
    TrdNm?: string
    Addr1: string
    Addr2?: string
    Loc: string
    Pin: number
    Stcd: string
    Ph?: string
    Em?: string
  }
  BuyerDtls: {
    Gstin: string
    LglNm: string
    TrdNm?: string
    Pos: string
    Addr1: string
    Addr2?: string
    Loc: string
    Pin: number
    Stcd: string
    Ph?: string
    Em?: string
  }
  ItemList: Array<{
    SlNo: string
    PrdDesc: string
    IsServc: string
    HsnCd: string
    Qty: number
    Unit: string
    UnitPrice: number
    TotAmt: number
    Discount: number
    PreTaxVal: number
    AssAmt: number
    GstRt: number
    IgstAmt: number
    CgstAmt: number
    SgstAmt: number
    CesRt: number
    CesAmt: number
    CesNonAdvlAmt: number
    StateCesRt: number
    StateCesAmt: number
    StateCesNonAdvlAmt: number
    OthChrg: number
    TotItemVal: number
  }>
  ValDtls: {
    AssVal: number
    CgstVal: number
    SgstVal: number
    IgstVal: number
    CesVal: number
    StCesVal: number
    Discount: number
    OthChrg: number
    RndOffAmt: number
    TotInvVal: number
  }
}

// Mock GST settings - in production, fetch from database
const gstSettings = {
  seller_gstin: "27AABCU9603R1ZX",
  seller_legal_name: "Your Company Name Pvt Ltd",
  seller_trade_name: "Your Company",
  seller_address1: "123 Business Park",
  seller_address2: "Andheri East",
  seller_location: "Mumbai",
  seller_pincode: 400069,
  seller_state_code: "27",
  seller_phone: "+91 9876543210",
  seller_email: "gst@yourcompany.com",
}

async function getGSTAuthToken(): Promise<string> {
  try {
    const response = await fetch(`${GST_API_BASE_URL}/eivital/v1.04/auth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        UserName: GST_API_USERNAME,
        Password: GST_API_PASSWORD,
        AppKey: GST_API_CLIENT_ID,
        ForceRefreshAccessToken: true,
      }),
    })

    const data = await response.json()

    if (data.Status === 1) {
      return data.Data.AuthToken
    } else {
      throw new Error(`GST Auth failed: ${data.ErrorDetails}`)
    }
  } catch (error) {
    console.error("GST Auth Error:", error)
    throw error
  }
}

async function submitToGSTAPI(payload: GSTInvoicePayload, authToken: string) {
  try {
    const response = await fetch(`${GST_API_BASE_URL}/eicore/v1.03/Invoice`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        user_name: GST_API_USERNAME,
        authtoken: authToken,
        gstin: gstSettings.seller_gstin,
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()
    return data
  } catch (error) {
    console.error("GST API Submission Error:", error)
    throw error
  }
}

function buildGSTPayload(invoiceData: any): GSTInvoicePayload {
  const isInterState = invoiceData.customer_state_code !== gstSettings.seller_state_code.substring(0, 2)

  return {
    Version: "1.1",
    TranDtls: {
      TaxSch: "GST",
      SupTyp: invoiceData.supply_type || "B2B",
      RegRev: "N",
    },
    DocDtls: {
      Typ: "INV",
      No: invoiceData.invoice_no,
      Dt: invoiceData.invoice_date.split("-").reverse().join("/"), // Convert to DD/MM/YYYY
    },
    SellerDtls: {
      Gstin: gstSettings.seller_gstin,
      LglNm: gstSettings.seller_legal_name,
      TrdNm: gstSettings.seller_trade_name,
      Addr1: gstSettings.seller_address1,
      Addr2: gstSettings.seller_address2,
      Loc: gstSettings.seller_location,
      Pin: gstSettings.seller_pincode,
      Stcd: gstSettings.seller_state_code,
      Ph: gstSettings.seller_phone,
      Em: gstSettings.seller_email,
    },
    BuyerDtls: {
      Gstin: invoiceData.buyer_gstin,
      LglNm: invoiceData.customer_company_name,
      TrdNm: invoiceData.customer_company_name,
      Pos: invoiceData.customer_state_code,
      Addr1: invoiceData.customer_address,
      Loc: invoiceData.customer_city || "Mumbai",
      Pin: invoiceData.customer_pincode || 400001,
      Stcd: invoiceData.customer_state_code,
      Ph: invoiceData.customer_phone,
      Em: invoiceData.customer_email,
    },
    ItemList: invoiceData.items.map((item: any, index: number) => ({
      SlNo: (index + 1).toString(),
      PrdDesc: item.product_name,
      IsServc: "N", // N for goods, Y for services
      HsnCd: item.hsn_sac_code,
      Qty: item.qty,
      Unit: item.unit || "NOS",
      UnitPrice: item.rate,
      TotAmt: item.taxable_amt,
      Discount: item.discount || 0,
      PreTaxVal: item.taxable_amt,
      AssAmt: item.taxable_amt,
      GstRt: isInterState ? item.igst_rate : item.cgst_rate + item.sgst_rate,
      IgstAmt: isInterState ? item.igst_amt : 0,
      CgstAmt: isInterState ? 0 : item.cgst_amt,
      SgstAmt: isInterState ? 0 : item.sgst_amt,
      CesRt: 0,
      CesAmt: 0,
      CesNonAdvlAmt: 0,
      StateCesRt: 0,
      StateCesAmt: 0,
      StateCesNonAdvlAmt: 0,
      OthChrg: 0,
      TotItemVal: item.total_amount,
    })),
    ValDtls: {
      AssVal: invoiceData.grand_total_taxable_amt,
      CgstVal: isInterState ? 0 : invoiceData.grand_total_cgst_amt,
      SgstVal: isInterState ? 0 : invoiceData.grand_total_sgst_amt,
      IgstVal: isInterState ? invoiceData.grand_total_igst_amt || 0 : 0,
      CesVal: 0,
      StCesVal: 0,
      Discount: 0,
      OthChrg: 0,
      RndOffAmt: 0,
      TotInvVal: invoiceData.grand_total_amt,
    },
  }
}

async function logGSTTransaction(
  invoiceId: number,
  transactionType: string,
  requestPayload: any,
  responsePayload: any,
  status: string,
  errorCode?: string,
  errorMessage?: string,
) {
  // In production, save to database
  console.log("GST Transaction Log:", {
    invoice_id: invoiceId,
    transaction_type: transactionType,
    request_payload: JSON.stringify(requestPayload),
    response_payload: JSON.stringify(responsePayload),
    status,
    error_code: errorCode,
    error_message: errorMessage,
    api_endpoint: `${GST_API_BASE_URL}/eicore/v1.03/Invoice`,
    created_at: new Date().toISOString(),
  })
}

export async function POST(request: NextRequest) {
  try {
    const { invoiceId, invoiceData } = await request.json()

    if (!invoiceId || !invoiceData) {
      return NextResponse.json({ message: "Invoice ID and data are required" }, { status: 400 })
    }

    // Added Redis rate limiting for GST API calls
    const canProceed = await RedisService.checkRateLimit("gst_api", 50, 3600) // 50 requests per hour

    if (!canProceed) {
      return NextResponse.json(
        {
          success: false,
          message: "GST API rate limit exceeded. Please try again later.",
        },
        { status: 429 },
      )
    }

    // Build GST payload
    const gstPayload = buildGSTPayload(invoiceData)

    // Get authentication token
    const authToken = await getGSTAuthToken()

    // Submit to GST API
    const gstResponse = await submitToGSTAPI(gstPayload, authToken)

    // Process response
    if (gstResponse.Status === 1) {
      // Success - extract IRN and other details
      const responseData = gstResponse.Data

      await logGSTTransaction(invoiceId, "generate", gstPayload, gstResponse, "success")

      // In production, update invoice in database with IRN, ACK details
      return NextResponse.json({
        success: true,
        message: "Invoice submitted to GST successfully",
        data: {
          irn: responseData.Irn,
          ackNo: responseData.AckNo,
          ackDate: responseData.AckDt,
          qrCodeUrl: responseData.QRCodeUrl,
          signedInvoice: responseData.SignedInvoice,
          signedQRCode: responseData.SignedQRCode,
        },
      })
    } else {
      // Error response
      const errorDetails = gstResponse.ErrorDetails || []
      const errorMessage = errorDetails.map((err: any) => `${err.ErrorCode}: ${err.ErrorMessage}`).join("; ")

      await logGSTTransaction(
        invoiceId,
        "generate",
        gstPayload,
        gstResponse,
        "failed",
        gstResponse.ErrorDetails?.[0]?.ErrorCode,
        errorMessage,
      )

      return NextResponse.json(
        {
          success: false,
          message: "GST submission failed",
          errors: errorDetails,
        },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("GST Integration Error:", error)

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error during GST submission",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
