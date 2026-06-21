"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { logout } from "@/app/actions/auth"
import { LogOutIcon, ShieldCheckIcon, SunIcon, MoonIcon } from "lucide-react"

export default function LogoutCard() {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)
  const [theme, setTheme] = React.useState<"dark" | "light">("dark")

  React.useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "dark" | "light" | null
    if (savedTheme) {
      requestAnimationFrame(() => {
        setTheme(savedTheme)
      })
      if (savedTheme === "light") {
        document.documentElement.classList.add("light-mode")
      }
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark"
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
    if (newTheme === "light") {
      document.documentElement.classList.add("light-mode")
    } else {
      document.documentElement.classList.remove("light-mode")
    }
  }

  const handleLogout = async () => {
    if (loading) return
    setLoading(true)
    try {
      await logout()
      router.push("/login")
      router.refresh()
    } catch (err) {
      console.error("Logout failed:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card branding-small-card logout-card" style={{ position: "relative", overflow: "hidden" }}>
      <div 
        className="logout-glow-effect"
        style={{
          position: "absolute",
          top: "-50%",
          left: "-50%",
          width: "200%",
          height: "200%",
          background: "radial-gradient(circle, rgba(239, 68, 68, 0.08) 0%, transparent 60%)",
          pointerEvents: "none"
        }}
      />
      <ShieldCheckIcon className="branding-card-icon" style={{ color: "#10b981", zIndex: 1 }} />
      <div style={{ flex: 1, zIndex: 1 }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: "600", margin: 0, color: "var(--text-primary)" }}>
          Session Secure
        </h2>
        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: "2px 0 0 0" }}>
          Pincode authorized
        </p>
      </div>
      
      <button
        onClick={toggleTheme}
        className="theme-toggle-btn"
        title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "36px",
          height: "36px",
          borderRadius: "8px",
          background: "rgba(255, 255, 255, 0.05)",
          border: "1px solid var(--border-color)",
          color: "var(--text-primary)",
          cursor: "pointer",
          transition: "all 0.2s ease",
          zIndex: 1
        }}
      >
        {theme === "dark" ? (
          <SunIcon style={{ width: "16px", height: "16px" }} />
        ) : (
          <MoonIcon style={{ width: "16px", height: "16px" }} />
        )}
      </button>

      <button
        onClick={handleLogout}
        disabled={loading}
        className="logout-action-btn"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 16px",
          borderRadius: "8px",
          fontSize: "0.85rem",
          fontWeight: "500",
          background: "rgba(239, 68, 68, 0.1)",
          border: "1px solid rgba(239, 68, 68, 0.2)",
          color: "#ef4444",
          cursor: "pointer",
          transition: "all 0.2s ease",
          zIndex: 1
        }}
      >
        <LogOutIcon style={{ width: "14px", height: "14px" }} />
        <span>{loading ? "Logging out..." : "Logout"}</span>
      </button>
    </div>
  )
}
