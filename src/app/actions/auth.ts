"use server"

import { cookies } from "next/headers"

/**
 * Validates the security pincode and issues a secure httpOnly cookie session.
 */
export async function verifyPasscode(code: string): Promise<{ success: boolean; error?: string }> {
  if (code === "70861GA") {
    const cookieStore = await cookies()
    cookieStore.set("jg_session", "70861GA_verified", {
      httpOnly: true,
      secure: false, // Changed to false to allow session cookie storage on plain HTTP deployments (e.g. http://<server-ip>:3110)
      sameSite: "lax", // Changed from strict to lax for better cross-navigation compatibility
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/"
    })
    return { success: true }
  }
  return { success: false, error: "Incorrect passcode." }
}

/**
 * Validates if the current session cookie is valid.
 */
export async function checkSession(): Promise<boolean> {
  const cookieStore = await cookies()
  const session = cookieStore.get("jg_session")?.value
  return session === "70861GA_verified"
}

/**
 * Clears the session cookie to logout the user.
 */
export async function logout(): Promise<{ success: boolean }> {
  const cookieStore = await cookies()
  cookieStore.delete("jg_session")
  return { success: true }
}

