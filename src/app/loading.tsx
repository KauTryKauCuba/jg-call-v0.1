import React from "react"

export default function Loading() {
  return (
    <div className="app-container" style={{ opacity: 0.7, pointerEvents: "none" }}>
      {/* Top Header Section Skeleton */}
      <div className="top-grid-container">
        {/* Left Side Skeleton: 5 Cards Grid */}
        <div className="branding-cards-grid">
          {/* Logout/User header skeleton */}
          <div className="card" style={{ height: "70px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px" }}>
            <div style={{ width: "120px", height: "16px", background: "rgba(255,255,255,0.08)", borderRadius: "4px" }} className="pulse" />
            <div style={{ width: "80px", height: "32px", background: "rgba(255,255,255,0.08)", borderRadius: "6px" }} className="pulse" />
          </div>

          {/* Row 1: 2 small cards skeleton */}
          <div className="branding-card-row">
            <div className="card branding-small-card">
              <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: "rgba(255,255,255,0.08)" }} className="pulse" />
              <div style={{ flex: 1, marginLeft: "12px" }}>
                <div style={{ width: "40px", height: "24px", background: "rgba(255,255,255,0.08)", borderRadius: "4px", marginBottom: "6px" }} className="pulse" />
                <div style={{ width: "80px", height: "12px", background: "rgba(255,255,255,0.08)", borderRadius: "4px" }} className="pulse" />
              </div>
            </div>
            <div className="card branding-small-card">
              <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: "rgba(255,255,255,0.08)" }} className="pulse" />
              <div style={{ flex: 1, marginLeft: "12px" }}>
                <div style={{ width: "40px", height: "24px", background: "rgba(255,255,255,0.08)", borderRadius: "4px", marginBottom: "6px" }} className="pulse" />
                <div style={{ width: "80px", height: "12px", background: "rgba(255,255,255,0.08)", borderRadius: "4px" }} className="pulse" />
              </div>
            </div>
          </div>

          {/* Row 2: 2 small cards skeleton */}
          <div className="branding-card-row">
            <div className="card branding-small-card">
              <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: "rgba(255,255,255,0.08)" }} className="pulse" />
              <div style={{ flex: 1, marginLeft: "12px" }}>
                <div style={{ width: "40px", height: "24px", background: "rgba(255,255,255,0.08)", borderRadius: "4px", marginBottom: "6px" }} className="pulse" />
                <div style={{ width: "80px", height: "12px", background: "rgba(255,255,255,0.08)", borderRadius: "4px" }} className="pulse" />
              </div>
            </div>
            <div className="card branding-small-card">
              <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: "rgba(255,255,255,0.08)" }} className="pulse" />
              <div style={{ flex: 1, marginLeft: "12px" }}>
                <div style={{ width: "40px", height: "24px", background: "rgba(255,255,255,0.08)", borderRadius: "4px", marginBottom: "6px" }} className="pulse" />
                <div style={{ width: "80px", height: "12px", background: "rgba(255,255,255,0.08)", borderRadius: "4px" }} className="pulse" />
              </div>
            </div>
          </div>

          {/* Row 3: script card skeleton */}
          <div className="card" style={{ height: "160px", padding: "20px" }}>
            <div style={{ width: "150px", height: "16px", background: "rgba(255,255,255,0.08)", borderRadius: "4px", marginBottom: "16px" }} className="pulse" />
            <div style={{ height: "12px", background: "rgba(255,255,255,0.08)", borderRadius: "4px", marginBottom: "8px" }} className="pulse" />
            <div style={{ height: "12px", background: "rgba(255,255,255,0.08)", borderRadius: "4px", marginBottom: "8px" }} className="pulse" />
            <div style={{ width: "80%", height: "12px", background: "rgba(255,255,255,0.08)", borderRadius: "4px" }} className="pulse" />
          </div>
        </div>

        {/* Right Card: Quick Call Lookup Widget Skeleton */}
        <div className="card interactive-demo-card" style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "24px" }}>
          <div style={{ width: "180px", height: "20px", background: "rgba(255,255,255,0.08)", borderRadius: "4px" }} className="pulse" />
          <div style={{ height: "40px", background: "rgba(255,255,255,0.05)", borderRadius: "8px" }} className="pulse" />
          <div style={{ height: "40px", background: "rgba(255,255,255,0.05)", borderRadius: "8px" }} className="pulse" />
          <div style={{ height: "40px", background: "rgba(255,255,255,0.05)", borderRadius: "8px" }} className="pulse" />
          <div style={{ height: "45px", background: "rgba(255,255,255,0.08)", borderRadius: "8px", marginTop: "auto" }} className="pulse" />
        </div>
      </div>

      {/* Spreadsheet Data Dashboard Skeleton */}
      <div className="dashboard-container">
        <div className="card" style={{ padding: "24px", minHeight: "400px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
            <div style={{ width: "200px", height: "24px", background: "rgba(255,255,255,0.08)", borderRadius: "4px" }} className="pulse" />
            <div style={{ width: "300px", height: "36px", background: "rgba(255,255,255,0.08)", borderRadius: "6px" }} className="pulse" />
          </div>
          <div style={{ display: "flex", gap: "8px", marginBottom: "20px", overflow: "hidden" }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ width: "100px", height: "32px", background: "rgba(255,255,255,0.05)", borderRadius: "6px", flexShrink: 0 }} className="pulse" />
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ height: "40px", background: "rgba(255,255,255,0.03)", borderRadius: "6px" }} className="pulse" />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .pulse {
          animation: pulse-animation 1.5s infinite ease-in-out;
        }
        @keyframes pulse-animation {
          0% {
            opacity: 0.6;
          }
          50% {
            opacity: 0.3;
          }
          100% {
            opacity: 0.6;
          }
        }
      `}</style>
    </div>
  )
}
