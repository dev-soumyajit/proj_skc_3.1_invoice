import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { RedisService } from "@/lib/redis"
import { executeQuery } from "@/lib/database"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function POST(request: NextRequest) {
  try {
    const { username, otp } = await request.json()

    if (!username || !otp) {
      return NextResponse.json({ message: "Username and OTP are required" }, { status: 400 })
    }

    const users = await executeQuery(
      `
      SELECT 
        user_id,
        user_name,
        user_email,
        name_display,
        role,
        status
      FROM master_user 
      WHERE user_name = ? AND status = 1
    `,
      [username],
    )

    if (!users || users.length === 0) {
      return NextResponse.json({ message: "Invalid user" }, { status: 401 })
    }

    const user = users[0]

    // Verify OTP format
    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      return NextResponse.json({ message: "Invalid OTP format" }, { status: 400 })
    }

    const storedOtp = await RedisService.getOTP(user.user_email)

    if (!storedOtp) {
      return NextResponse.json({ message: "OTP expired or not found" }, { status: 400 })
    }

    if (storedOtp !== otp) {
      return NextResponse.json({ message: "Invalid OTP" }, { status: 400 })
    }

    await RedisService.deleteOTP(user.user_email)

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.user_id,
        username: user.user_name,
        email: user.user_email,
        role: user.role,
        displayName: user.name_display,
      },
      JWT_SECRET,
      { expiresIn: "24h" },
    )

    const sessionId = `${user.user_id}_${Date.now()}`
    await RedisService.storeSession(
      sessionId,
      {
        userId: user.user_id,
        username: user.user_name,
        email: user.user_email,
        role: user.role,
        displayName: user.name_display,
      },
      24,
    )

    // Create response with cookie
    const response = NextResponse.json({
      message: "Login successful",
      user: {
        id: user.user_id,
        username: user.user_name,
        email: user.user_email,
        displayName: user.name_display,
        role: user.role,
      },
    })

    // Set HTTP-only cookie
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60, // 24 hours
    })

    response.cookies.set("session-id", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60, // 24 hours
    })

    return response
  } catch (error) {
    console.error("OTP verification error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
