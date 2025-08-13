import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    // First, try to get states from existing customer data
    const states = await executeQuery(`
      SELECT DISTINCT 
        customer_state_name as name, 
        customer_state_code as code
      FROM master_customer 
      WHERE customer_state_name IS NOT NULL 
        AND customer_state_name != '' 
        AND customer_state_code IS NOT NULL 
        AND customer_state_code != ''
      ORDER BY customer_state_name ASC
    `)

    // If no states found in customer data, return Indian states list
    if (!states || states.length === 0) {
      const indianStates = [
        { name: "Andhra Pradesh", code: "37" },
        { name: "Arunachal Pradesh", code: "12" },
        { name: "Assam", code: "18" },
        { name: "Bihar", code: "10" },
        { name: "Chandigarh", code: "04" },
        { name: "Chhattisgarh", code: "22" },
        { name: "Delhi", code: "07" },
        { name: "Goa", code: "30" },
        { name: "Gujarat", code: "24" },
        { name: "Haryana", code: "06" },
        { name: "Himachal Pradesh", code: "02" },
        { name: "Jharkhand", code: "20" },
        { name: "Karnataka", code: "29" },
        { name: "Kerala", code: "32" },
        { name: "Madhya Pradesh", code: "23" },
        { name: "Maharashtra", code: "27" },
        { name: "Manipur", code: "14" },
        { name: "Meghalaya", code: "17" },
        { name: "Mizoram", code: "15" },
        { name: "Nagaland", code: "13" },
        { name: "Odisha", code: "21" },
        { name: "Puducherry", code: "34" },
        { name: "Punjab", code: "03" },
        { name: "Rajasthan", code: "08" },
        { name: "Sikkim", code: "11" },
        { name: "Tamil Nadu", code: "33" },
        { name: "Telangana", code: "36" },
        { name: "Tripura", code: "16" },
        { name: "Uttar Pradesh", code: "09" },
        { name: "Uttarakhand", code: "05" },
        { name: "West Bengal", code: "19" },
      ]

      return NextResponse.json({ 
        states: indianStates,
        source: "default"
      })
    }

    return NextResponse.json({ 
      states: states,
      source: "database"
    })
  } catch (error) {
    console.error("States API error:", error)
    
    // Return default states list on error
    const indianStates = [
      { name: "Andhra Pradesh", code: "37" },
      { name: "Arunachal Pradesh", code: "12" },
      { name: "Assam", code: "18" },
      { name: "Bihar", code: "10" },
      { name: "Chandigarh", code: "04" },
      { name: "Chhattisgarh", code: "22" },
      { name: "Delhi", code: "07" },
      { name: "Goa", code: "30" },
      { name: "Gujarat", code: "24" },
      { name: "Haryana", code: "06" },
      { name: "Himachal Pradesh", code: "02" },
      { name: "Jharkhand", code: "20" },
      { name: "Karnataka", code: "29" },
      { name: "Kerala", code: "32" },
      { name: "Madhya Pradesh", code: "23" },
      { name: "Maharashtra", code: "27" },
      { name: "Manipur", code: "14" },
      { name: "Meghalaya", code: "17" },
      { name: "Mizoram", code: "15" },
      { name: "Nagaland", code: "13" },
      { name: "Odisha", code: "21" },
      { name: "Puducherry", code: "34" },
      { name: "Punjab", code: "03" },
      { name: "Rajasthan", code: "08" },
      { name: "Sikkim", code: "11" },
      { name: "Tamil Nadu", code: "33" },
      { name: "Telangana", code: "36" },
      { name: "Tripura", code: "16" },
      { name: "Uttar Pradesh", code: "09" },
      { name: "Uttarakhand", code: "05" },
      { name: "West Bengal", code: "19" },
    ]

    return NextResponse.json({ 
      states: indianStates,
      source: "fallback"
    })
  }
}