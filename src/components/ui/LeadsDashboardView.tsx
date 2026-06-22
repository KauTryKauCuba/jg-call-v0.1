import SheetViewer from "@/components/ui/SheetViewer"
import { getColumnIndices, getCombinedHeader, type SheetDataResult } from "@/app/actions/sheets"
import { BriefcaseIcon, CheckIcon, PhoneIcon, ExternalLinkIcon, ArrowLeftIcon } from "lucide-react"
import Link from "next/link"
import { PixelCanvas } from "@/components/ui/pixel-canvas"

interface LeadsDashboardViewProps {
  activeFilter: "all" | "completed" | "called" | "onboarded"
  listResult: {
    success: boolean
    sheets?: string[]
    gids?: Record<string, number>
    error?: string
  }
  dataResult: SheetDataResult
}

export default function LeadsDashboardView({ activeFilter, listResult, dataResult }: LeadsDashboardViewProps) {
  const initialAllRows = dataResult.data || []
  const combinedHeader = getCombinedHeader(initialAllRows)
  const cols = getColumnIndices(combinedHeader)
  const dataRows = initialAllRows.slice(2)

  const totalLeads = dataRows.filter((row: string[]) => row && row[cols.companyName]).length
  
  const completedLeads = dataRows.filter((row: string[]) => {
    const status = row[cols.ingested]?.toLowerCase()?.trim()
    return status === "complete"
  }).length

  const calledLeads = dataRows.filter((row: string[]) => {
    const status = row[cols.called]?.toLowerCase()?.trim()
    return status === "yes"
  }).length

  const onboardedLeads = dataRows.filter((row: string[]) => {
    const status = row[cols.acceptOnboard]?.toLowerCase()?.trim()
    return status === "yes"
  }).length

  return (
    <div className="app-container">
      {/* Back to Dashboard Header */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: "1.5rem", gap: "0.75rem" }}>
        <Link href="/" className="btn-choice" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", padding: "8px 16px" }}>
          <ArrowLeftIcon style={{ width: "14px", height: "14px" }} />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Top Header Section: Split into Cards */}
      <div className="top-grid-container" style={{ gridTemplateColumns: "1fr" }}>
        {/* Left Side: 5 Cards Grid (stretching full width) */}
        <div className="branding-cards-grid" style={{ height: "auto" }}>
          {/* 4 small cards in 1 row */}
          <div className="branding-card-row" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
            {/* Total Leads Card */}
            <Link 
              href="/leads" 
              style={{ 
                textDecoration: "none", 
                color: "inherit", 
                display: "flex", 
                width: "100%"
              }}
            >
              <div 
                className={`card branding-small-card sheet-tab-btn ${activeFilter === "all" ? "active" : ""}`} 
                style={{ 
                  width: "100%", 
                  cursor: "pointer",
                  position: "relative",
                  overflow: "hidden",
                  borderRadius: "24px",
                  "--active-color": "#a855f7",
                  "--tab-bg-gradient": "linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)",
                  "--tab-shadow": "rgba(168, 85, 247, 0.25)"
                } as React.CSSProperties}
              >
                <PixelCanvas
                  gap={8}
                  speed={25}
                  colors={["#f3e8ff", "#c084fc", "#a855f7"]}
                  variant="default"
                  active={activeFilter === "all"}
                  noFocus={true}
                />
                <div className="branding-icon-wrapper leads" style={{ position: "relative", zIndex: 10 }}>
                  <BriefcaseIcon className="branding-card-icon" />
                </div>
                <div style={{ position: "relative", zIndex: 10, textAlign: "left" }}>
                  <h2>{totalLeads}</h2>
                  <p>Total Leads</p>
                </div>
              </div>
            </Link>

            {/* Completed Card */}
            <Link 
              href="/completed" 
              style={{ 
                textDecoration: "none", 
                color: "inherit", 
                display: "flex", 
                width: "100%"
              }}
            >
              <div 
                className={`card branding-small-card sheet-tab-btn ${activeFilter === "completed" ? "active" : ""}`} 
                style={{ 
                  width: "100%", 
                  cursor: "pointer",
                  position: "relative",
                  overflow: "hidden",
                  borderRadius: "24px",
                  "--active-color": "#22c55e",
                  "--tab-bg-gradient": "linear-gradient(135deg, #22c55e 0%, #15803d 100%)",
                  "--tab-shadow": "rgba(34, 197, 94, 0.25)"
                } as React.CSSProperties}
              >
                <PixelCanvas
                  gap={5}
                  speed={35}
                  colors={["#dcfce7", "#86efac", "#22c55e"]}
                  variant="default"
                  active={activeFilter === "completed"}
                  noFocus={true}
                />
                <div className="branding-icon-wrapper completed" style={{ position: "relative", zIndex: 10 }}>
                  <CheckIcon className="branding-card-icon" />
                </div>
                <div style={{ position: "relative", zIndex: 10, textAlign: "left" }}>
                  <h2>{completedLeads}</h2>
                  <p>Completed</p>
                </div>
              </div>
            </Link>

            {/* Called Card */}
            <Link 
              href="/called" 
              style={{ 
                textDecoration: "none", 
                color: "inherit", 
                display: "flex", 
                width: "100%"
              }}
            >
              <div 
                className={`card branding-small-card sheet-tab-btn ${activeFilter === "called" ? "active" : ""}`} 
                style={{ 
                  width: "100%", 
                  cursor: "pointer",
                  position: "relative",
                  overflow: "hidden",
                  borderRadius: "24px",
                  "--active-color": "#3b82f6",
                  "--tab-bg-gradient": "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                  "--tab-shadow": "rgba(59, 130, 246, 0.25)"
                } as React.CSSProperties}
              >
                <PixelCanvas
                  gap={7}
                  speed={30}
                  colors={["#dbeafe", "#93c5fd", "#3b82f6"]}
                  variant="default"
                  active={activeFilter === "called"}
                  noFocus={true}
                />
                <div className="branding-icon-wrapper called" style={{ position: "relative", zIndex: 10 }}>
                  <PhoneIcon className="branding-card-icon" />
                </div>
                <div style={{ position: "relative", zIndex: 10, textAlign: "left" }}>
                  <h2>{calledLeads}</h2>
                  <p>Called</p>
                </div>
              </div>
            </Link>

            {/* Onboarded Card */}
            <Link 
              href="/onboarded" 
              style={{ 
                textDecoration: "none", 
                color: "inherit", 
                display: "flex", 
                width: "100%"
              }}
            >
              <div 
                className={`card branding-small-card sheet-tab-btn ${activeFilter === "onboarded" ? "active" : ""}`} 
                style={{ 
                  width: "100%", 
                  cursor: "pointer",
                  position: "relative",
                  overflow: "hidden",
                  borderRadius: "24px",
                  "--active-color": "#f59e0b",
                  "--tab-bg-gradient": "linear-gradient(135deg, #f59e0b 0%, #b45309 100%)",
                  "--tab-shadow": "rgba(245, 158, 11, 0.25)"
                } as React.CSSProperties}
              >
                <PixelCanvas
                  gap={5}
                  speed={35}
                  colors={["#fef3c7", "#fde047", "#f59e0b"]}
                  variant="default"
                  active={activeFilter === "onboarded"}
                  noFocus={true}
                />
                <div className="branding-icon-wrapper onboarded" style={{ position: "relative", zIndex: 10 }}>
                  <ExternalLinkIcon className="branding-card-icon" />
                </div>
                <div style={{ position: "relative", zIndex: 10, textAlign: "left" }}>
                  <h2>{onboardedLeads}</h2>
                  <p>Onboarded</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Spreadsheet Data Dashboard Section */}
      <div className="dashboard-container">
        <SheetViewer 
          listResult={listResult}
          dataResult={dataResult}
          initialFilter={activeFilter}
        />
      </div>
    </div>
  )
}
