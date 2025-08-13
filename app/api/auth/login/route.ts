import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { DatabaseService } from "@/lib/database"
import { RedisService } from "@/lib/redis"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { message: "Username and password are required" },
        { status: 400 }
      )
    }

    const db = DatabaseService.getInstance()

    // Get user from database
    const userQuery = `
      SELECT user_id, user_name, user_email, password, status, role
      FROM master_user 
      WHERE user_name = ? AND status = 1
    `
    const [userRows] = await db.execute(userQuery, [username])
    const users = userRows as any[]

    if (users.length === 0) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
    }

    const user = users[0]

    // Directly compare plain text password
    if (password !== user.password) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.user_id,
        username: user.user_name,
        email: user.user_email,
        role: user.role,
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    )

    // Store session in Redis
    await RedisService.setWithExpiry(
      `session:${user.user_id}`,
      JSON.stringify({
        userId: user.user_id,
        username: user.user_name,
        email: user.user_email,
        role: user.role,
        loginTime: new Date().toISOString(),
      }),
      24 * 60 * 60 // 24 hours
    )

    // Set HTTP-only cookie
    const response = NextResponse.json({
      message: "Login successful",
      user: {
        id: user.user_id,
        username: user.user_name,
        email: user.user_email,
        role: user.role,
      },
    })

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    })

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
