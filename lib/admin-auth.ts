// Simple admin authentication using environment variable
import { cookies } from "next/headers"

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123"
const SESSION_TOKEN = "admin_session_token"
const SESSION_EXPIRY = 24 * 60 * 60 * 1000 // 24 hours

export async function verifyAdminPassword(password: string): Promise<boolean> {
  return password === ADMIN_PASSWORD
}

export async function createAdminSession() {
  const token = Buffer.from(Math.random().toString()).toString("base64")
  const cookieStore = await cookies()

  cookieStore.set(SESSION_TOKEN, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_EXPIRY,
  })

  return token
}

export async function getAdminSession(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(SESSION_TOKEN)?.value || null
}

export async function clearAdminSession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_TOKEN)
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const session = await getAdminSession()
  return !!session
}
