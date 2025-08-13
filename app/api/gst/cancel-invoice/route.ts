import { type NextRequest, NextResponse } from "next/server"

const GST_API_BASE_URL = process.env.GST_API_BASE_URL || "https://einv-apisandbox.nic.in"
const GST_API_USERNAME = process.env.GST_API_USERNAME || ""

interface CancelInvoicePayload {
  Irn: string
  CnlRsn: string
  CnlRem: string
}

async function getGSTAuthToken(): Promise<string> {
  // Reuse the auth logic from submit-invoice
  // In production, implement token caching
  return "mock-auth-token"
}

export async function POST(request: NextRequest) {
  try {
    const { invoiceId, irn, reason, remarks } = await request.json()

    if (!invoiceId || !irn || !reason) {
      return NextResponse.json({ message: "Invoice ID, IRN, and reason are required" }, { status: 400 })
    }

    const authToken = await getGSTAuthToken()

    const cancelPayload: CancelInvoicePayload = {
      Irn: irn,
      CnlRsn: reason,
      CnlRem: remarks || "",
    }

    const response = await fetch(`${GST_API_BASE_URL}/eicore/v1.03/Invoice/Cancel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        user_name: GST_API_USERNAME,
        authtoken: authToken,
        gstin: "27AABCU9603R1ZX", // From settings
      },
      body: JSON.stringify(cancelPayload),
    })

    const data = await response.json()

    if (data.Status === 1) {
      // Log successful cancellation
      console.log("GST Cancellation Log:", {
        invoice_id: invoiceId,
        transaction_type: "cancel",
        request_payload: JSON.stringify(cancelPayload),
        response_payload: JSON.stringify(data),
        status: "success",
        created_at: new Date().toISOString(),
      })

      return NextResponse.json({
        success: true,
        message: "Invoice cancelled successfully",
        data: {
          cancelDate: data.Data.CancelDate,
        },
      })
    } else {
      // Log failed cancellation
      const errorMessage = data.ErrorDetails?.map((err: any) => `${err.ErrorCode}: ${err.ErrorMessage}`).join("; ")

      console.log("GST Cancellation Error Log:", {
        invoice_id: invoiceId,
        transaction_type: "cancel",
        request_payload: JSON.stringify(cancelPayload),
        response_payload: JSON.stringify(data),
        status: "failed",
        error_message: errorMessage,
        created_at: new Date().toISOString(),
      })

      return NextResponse.json(
        {
          success: false,
          message: "Invoice cancellation failed",
          errors: data.ErrorDetails,
        },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("GST Cancellation Error:", error)

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error during invoice cancellation",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
