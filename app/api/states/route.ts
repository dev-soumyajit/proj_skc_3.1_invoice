import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
	try {
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

		return NextResponse.json({ states: indianStates, source: "static" })
	} catch (error) {
		console.error("States API error:", error)
		return NextResponse.json({ states: [], source: "error" }, { status: 500 })
	}
}