"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { verifyPasscode } from "@/app/actions/auth"
import { ArrowRightIcon, Loader2Icon } from "lucide-react"

export default function LoginPage() {
  const [code, setCode] = React.useState("")
  const [error, setError] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const router = useRouter()

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const handleContainerClick = () => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const handleSubmit = async (valueToSubmit = code) => {
    if (!valueToSubmit || loading) return
    setLoading(true)
    setError(false)

    try {
      const res = await verifyPasscode(valueToSubmit)
      if (res.success) {
        router.push("/")
      } else {
        setError(true)
        setCode("")
        // Shake feedback
        setTimeout(() => setError(false), 600)
      }
    } catch {
      setError(true)
      setCode("")
    } finally {
      setLoading(false)
    }
  }

  const handleKeypadPress = (val: string) => {
    if (code.length >= 7 || loading) return
    const newCode = code + val
    setCode(newCode)
    if (newCode === "70861GA") {
      handleSubmit(newCode)
    }
  }

  const handleBackspace = () => {
    if (loading) return
    setCode(prev => prev.slice(0, -1))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().slice(0, 7)
    setCode(val)
    if (val === "70861GA") {
      handleSubmit(val)
    }
  }

  return (
    <div 
      className="lockscreen-overlay" 
      onClick={handleContainerClick}
    >
      <div 
        className={`confirm-modal ${error ? "shake-anim" : ""}`}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "380px", opacity: 1, animation: "none" }}
      >
        <div className="confirm-header" style={{ color: "#f59e0b" }}>
          <h4 style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: 0, fontSize: "1.1rem", fontWeight: 600 }}>
            ⚠️ Security Passcode Required
          </h4>
        </div>

        <div className="confirm-body" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem" }}>
          <p style={{ margin: 0, textAlign: "center", color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: "1.5" }}>
            This platform is secure. Please enter the security PIN code to continue.
          </p>

          {/* Hidden input to capture keyboard type (including G and A) */}
          <input
            ref={inputRef}
            type="text"
            value={code}
            onChange={handleInputChange}
            className="hidden-auth-input"
            autoFocus
            maxLength={7}
            disabled={loading}
          />

          {/* Passcode boxes (7 boxes) */}
          <div className="passcode-boxes-row" onClick={handleContainerClick} style={{ margin: "0.5rem 0" }}>
            {Array.from({ length: 7 }).map((_, i) => {
              const char = code[i] || ""
              const isCurrent = i === code.length && !loading
              return (
                <div 
                  key={i} 
                  className={`passcode-box ${isCurrent ? "focused" : ""} ${char ? "filled" : ""}`}
                  style={{
                    width: "36px",
                    height: "46px",
                    border: char ? "1px solid #f59e0b" : "1px solid var(--border-color)",
                    background: char ? "rgba(245, 158, 11, 0.05)" : "rgba(255, 255, 255, 0.02)",
                    borderRadius: "6px"
                  }}
                >
                  {char ? "•" : ""}
                </div>
              )
            })}
          </div>

          {/* Onscreen Keypad: Dialer layout where * is G and # is A */}
          <div className="lockscreen-keypad" style={{ width: "100%", maxWidth: "260px" }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                className="keypad-btn"
                onClick={() => handleKeypadPress(String(num))}
                disabled={loading}
                style={{
                  border: "1px solid var(--border-color)",
                  background: "rgba(255,255,255,0.02)"
                }}
              >
                {num}
              </button>
            ))}
            {/* * inputs G */}
            <button
              type="button"
              className="keypad-btn"
              onClick={() => handleKeypadPress("G")}
              disabled={loading}
              style={{
                border: "1px solid var(--border-color)",
                background: "rgba(255,255,255,0.02)"
              }}
            >
              *
            </button>
            <button
              type="button"
              className="keypad-btn"
              onClick={() => handleKeypadPress("0")}
              disabled={loading}
              style={{
                border: "1px solid var(--border-color)",
                background: "rgba(255,255,255,0.02)"
              }}
            >
              0
            </button>
            {/* # inputs A */}
            <button
              type="button"
              className="keypad-btn"
              onClick={() => handleKeypadPress("A")}
              disabled={loading}
              style={{
                border: "1px solid var(--border-color)",
                background: "rgba(255,255,255,0.02)"
              }}
            >
              #
            </button>
          </div>

          {/* Footer controls for backspace and submit */}
          <div style={{ display: "flex", gap: "12px", width: "100%", maxWidth: "260px", justifyContent: "center" }}>
            <button
              type="button"
              className="btn-confirm-cancel"
              onClick={handleBackspace}
              disabled={loading || !code}
              style={{
                padding: "8px 16px",
                flex: 1
              }}
            >
              Backspace
            </button>
            <button
              type="button"
              className="btn-confirm-yes"
              onClick={() => handleSubmit()}
              disabled={loading || !code}
              style={{
                padding: "8px 16px",
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px"
              }}
            >
              {loading ? (
                <Loader2Icon className="spinner-icon" style={{ animation: "spin 1s linear infinite", width: "14px", height: "14px" }} />
              ) : (
                <>
                  <span>Submit</span>
                  <ArrowRightIcon style={{ width: "14px", height: "14px" }} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
