"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { getSheetData, getSpreadsheetSheets, saveCallRecord } from "@/app/actions/sheets"
import { PhoneIcon, MailIcon, MapPinIcon, BriefcaseIcon, Loader2Icon, CheckIcon, CopyIcon, LayersIcon, UsersIcon, ChevronDown } from "lucide-react"
import { PixelCanvas } from "./pixel-canvas"
import { getColumnIndices } from "@/utils/columnMapper"


const TAB_THEMES = [
  {
    activeColor: "#22c55e",
    colors: ["#dcfce7", "#86efac", "#22c55e"],
    speed: 35,
    gap: 5,
    bgGradient: "linear-gradient(135deg, #22c55e 0%, #15803d 100%)",
    shadow: "rgba(34, 197, 94, 0.25)"
  },
  {
    activeColor: "#a855f7",
    colors: ["#f3e8ff", "#c084fc", "#a855f7"],
    speed: 25,
    gap: 8,
    bgGradient: "linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)",
    shadow: "rgba(168, 85, 247, 0.25)"
  },
  {
    activeColor: "#0ea5e9",
    colors: ["#e0f2fe", "#7dd3fc", "#0ea5e9"],
    speed: 30,
    gap: 7,
    bgGradient: "linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)",
    shadow: "rgba(14, 165, 233, 0.25)"
  },
  {
    activeColor: "#ec4899",
    colors: ["#fce7f3", "#f472b6", "#ec4899"],
    speed: 40,
    gap: 4,
    bgGradient: "linear-gradient(135deg, #ec4899 0%, #be185d 100%)",
    shadow: "rgba(236, 72, 153, 0.25)"
  },
  {
    activeColor: "#f59e0b",
    colors: ["#fef3c7", "#fde047", "#f59e0b"],
    speed: 20,
    gap: 9,
    bgGradient: "linear-gradient(135deg, #f59e0b 0%, #b45309 100%)",
    shadow: "rgba(245, 158, 11, 0.25)"
  }
]

const fullSheetsList = ["All", "Jobstreet", "Jobstore", "Indeed", "Hiredly", "Bossjob", "LinkedIn", "AJobThing", "MyFutureJobs"]

interface QuickCallWidgetProps {
  initialSheets?: string[]
  initialAllRows?: string[][]
  initialTeams?: Record<string, string[]>
}

export default function QuickCallWidget({
  initialSheets = [],
  initialAllRows = [],
  initialTeams = {}
}: QuickCallWidgetProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)

  const [sheets, setSheets] = React.useState<string[]>(initialSheets)
  const [selectedSheet, setSelectedSheet] = React.useState<string>(() => {
    return initialSheets.length > 0 ? initialSheets[0] : ""
  })
  const [allRows, setAllRows] = React.useState<string[][]>(initialAllRows)
  const cols = React.useMemo(() => {
    const headerRow = allRows[1] || allRows[0] || []
    return getColumnIndices(headerRow)
  }, [allRows])
  const [selectedCompanyIdx, setSelectedCompanyIdx] = React.useState<number>(-1)
  const [loadingSheets, setLoadingSheets] = React.useState(initialSheets.length === 0)
  const [loadingData, setLoadingData] = React.useState(false)
  const [copiedIdx, setCopiedIdx] = React.useState<string | null>(null)

  const [teams, setTeams] = React.useState<Record<string, string[]>>(initialTeams)
  const [selectedTeam, setSelectedTeam] = React.useState<string>("")

  const [dropdownOpen, setDropdownOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  const [isMounted, setIsMounted] = React.useState(false)
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true)
  }, [])

  // Call States
  const [isCalling, setIsCalling] = React.useState(false)
  const [callStartTime, setCallStartTime] = React.useState<number | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = React.useState(0)

  // Modal states
  const [showCallDetailsModal, setShowCallDetailsModal] = React.useState(false)
  const [modalCalledVal, setModalCalledVal] = React.useState<"Yes" | "No">("Yes")
  const [modalAnsweredVal, setModalAnsweredVal] = React.useState<"Yes" | "No">("Yes")
  const [modalAcceptOnboardVal, setModalAcceptOnboardVal] = React.useState<"Yes" | "No">("Yes")
  const [modalCompanyEmailVal, setModalCompanyEmailVal] = React.useState<string>("")
  const [modalReasonRejectVal, setModalReasonRejectVal] = React.useState<string>("")
  const [savingCallDetails, setSavingCallDetails] = React.useState(false)


  // Filter company list synchronously when selectedSheet or allRows changes
  const companies = React.useMemo(() => {
    if (!selectedSheet || allRows.length === 0) return []
    const dataRows = allRows.slice(2)
    return dataRows.filter(row => {
      const rowSheet = row[20]
      const companyName = row[cols.companyName]
      const calledStatus = row[cols.called]?.toLowerCase()?.trim()
      const isNotYet = !calledStatus || calledStatus === "not yet"
      return rowSheet === selectedSheet && !!companyName && isNotYet
    })
  }, [selectedSheet, allRows, cols])

  // Get active company index synchronously in rendering phase
  const activeCompanyIdx = selectedCompanyIdx >= 0 && selectedCompanyIdx < companies.length
    ? selectedCompanyIdx
    : (companies.length > 0 ? 0 : -1)

  const selectedRow = activeCompanyIdx >= 0 && activeCompanyIdx < companies.length ? companies[activeCompanyIdx] : null

  // Find duplicates of the selected company in other sheets
  const duplicateRecords = React.useMemo(() => {
    if (!selectedRow || allRows.length === 0) return []
    const companyName = selectedRow[cols.companyName]?.trim()?.toLowerCase()
    if (!companyName) return []

    const currentSheet = selectedRow[20]
    const currentSplitRow = selectedRow[21]

    return allRows.slice(2).filter(row => {
      const otherCompany = row[cols.companyName]?.trim()?.toLowerCase()
      const otherSheet = row[20]
      const otherSplitRow = row[21]
      // Same company name, but different sheet or different row in the sheet
      const isSameCompany = otherCompany === companyName
      const isDifferentRecord = otherSheet !== currentSheet || otherSplitRow !== currentSplitRow
      return isSameCompany && isDifferentRecord
    })
  }, [selectedRow, allRows, cols])


  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedCompanyIdx(companies.length > 0 ? 0 : -1)
  }, [selectedSheet, companies.length])

  // Refs to hold latest state values — used inside event listeners to avoid
  // dependency-array churn and the resulting re-render / re-registration loops.
  const selectedSheetRef = React.useRef(selectedSheet)
  const selectedCompanyIdxRef = React.useRef(selectedCompanyIdx)
  const selectedTeamRef = React.useRef(selectedTeam)
  const sheetsRef = React.useRef(sheets)
  const companiesRef = React.useRef(companies)
  const teamsRef = React.useRef(teams)
  const isCallingRef = React.useRef(isCalling)
  const callStartTimeRef = React.useRef(callStartTime)

  // Keep refs always in sync (no deps → runs every render, but is a no-op assignment)
  React.useEffect(() => {
    selectedSheetRef.current = selectedSheet
    selectedCompanyIdxRef.current = activeCompanyIdx
    selectedTeamRef.current = selectedTeam
    sheetsRef.current = sheets
    companiesRef.current = companies
    teamsRef.current = teams
    isCallingRef.current = isCalling
    callStartTimeRef.current = callStartTime
  })

  const [pendingTargetCompany, setPendingTargetCompany] = React.useState<{ name: string; rowNumber: number } | null>(null)

  // Auto-select company and scroll once the companies list updates for the selected sheet
  React.useEffect(() => {
    if (pendingTargetCompany && companies.length > 0) {
      const idx = companies.findIndex(row => {
        const rowNum = parseInt(row[21])
        const compName = row[cols.companyName]
        return rowNum === pendingTargetCompany.rowNumber && compName === pendingTargetCompany.name
      })
      if (idx !== -1) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedCompanyIdx(idx)
        setPendingTargetCompany(null)
        if (containerRef.current) {
          window.scrollTo({ top: 0, behavior: "smooth" })
        }
      }
    }
  }, [companies, pendingTargetCompany, cols])

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("quick-call-widget-update", {
        detail: { selectedSheet, selectedCompanyIdx: activeCompanyIdx, selectedTeam, sheets, companies, teams, isCalling, callStartTime, duplicateRecords }
      }))
    }
  }, [selectedSheet, activeCompanyIdx, selectedTeam, sheets, companies, teams, isCalling, callStartTime, duplicateRecords])

  // Allow sibling components to request current state sync when they mount
  React.useEffect(() => {
    const handleRequestSync = () => {
      window.dispatchEvent(new CustomEvent("quick-call-widget-update", {
        detail: { 
          selectedSheet: selectedSheetRef.current, 
          selectedCompanyIdx: selectedCompanyIdxRef.current, 
          selectedTeam: selectedTeamRef.current, 
          sheets: sheetsRef.current, 
          companies: companiesRef.current, 
          teams: teamsRef.current, 
          isCalling: isCallingRef.current, 
          callStartTime: callStartTimeRef.current, 
          duplicateRecords: duplicateRecords 
        }
      }))
    }
    window.addEventListener("quick-call-widget-request-sync", handleRequestSync)
    return () => {
      window.removeEventListener("quick-call-widget-request-sync", handleRequestSync)
    }
  }, [duplicateRecords])

  // Receive updates from the sticky component — listener registered ONCE,
  // reads current values through refs to avoid re-registration loops.
  React.useEffect(() => {
    const handleSync = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail.selectedSheet !== undefined && detail.selectedSheet !== selectedSheetRef.current) {
        setSelectedSheet(detail.selectedSheet)
      }
      if (detail.selectedCompanyIdx !== undefined && detail.selectedCompanyIdx !== selectedCompanyIdxRef.current) {
        setSelectedCompanyIdx(detail.selectedCompanyIdx)
      }
      if (detail.selectedTeam !== undefined && detail.selectedTeam !== selectedTeamRef.current) {
        setSelectedTeam(detail.selectedTeam)
      }
      if (detail.targetCompanyName !== undefined && detail.targetRowNumber !== undefined) {
        setPendingTargetCompany({
          name: detail.targetCompanyName,
          rowNumber: detail.targetRowNumber
        })
      }
      if (detail.isCalling !== undefined && detail.isCalling !== isCallingRef.current) {
        setIsCalling(detail.isCalling)
      }
      if (detail.callStartTime !== undefined && detail.callStartTime !== callStartTimeRef.current) {
        setCallStartTime(detail.callStartTime)
      }
    }
    window.addEventListener("quick-call-sticky-update", handleSync)
    return () => window.removeEventListener("quick-call-sticky-update", handleSync)
  }, []) // Empty deps — stable listener, uses refs for comparison

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Call timer countdown ticker
  React.useEffect(() => {
    if (!isCalling || !callStartTime) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setElapsedSeconds(0)
      return
    }

    const updateTimer = () => {
      const diff = Math.floor((Date.now() - callStartTime) / 1000)
      setElapsedSeconds(Math.max(0, diff))
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [isCalling, callStartTime])

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
  }

  // Load/Refresh data
  async function loadInitialData() {
    try {
      const [sheetsRes, dataRes, teamRes] = await Promise.all([
        getSpreadsheetSheets(),
        getSheetData("All"),
        getSheetData("team")
      ])

      if (sheetsRes.success && sheetsRes.sheets) {
        const activeSheets = sheetsRes.sheets.filter(s => s !== "All" && s !== "Duplicates")
        setSheets(activeSheets)
        if (activeSheets.length > 0 && !selectedSheet) {
          setSelectedSheet(activeSheets[0])
        }
      }

      if (dataRes.success && dataRes.data) {
        setAllRows(dataRes.data)
      }

      if (teamRes.success && teamRes.data) {
        const teamRows = teamRes.data.slice(2)
        let currentTeam = ""
        const teamMap: Record<string, string[]> = {}
        teamRows.forEach(row => {
          if (row[0] && row[0].trim() !== "") {
            currentTeam = row[0].trim()
          }
          if (row[1] && row[1].trim() !== "") {
            if (!teamMap[currentTeam]) {
              teamMap[currentTeam] = []
            }
            teamMap[currentTeam].push(row[1].trim())
          }
        })
        setTeams(teamMap)
      }
    } catch (err) {
      console.error("Failed to load initial widget data:", err)
    } finally {
      setLoadingSheets(false)
    }
  }

  // Fetch list of sheets and all rows on mount if not preloaded
  React.useEffect(() => {
    if (initialSheets.length === 0 || initialAllRows.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadInitialData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Listen to external refresh trigger
  React.useEffect(() => {
    const handleRefresh = async () => {
      setLoadingData(true)
      try {
        const dataRes = await getSheetData("All")
        if (dataRes.success && dataRes.data) {
          setAllRows(dataRes.data)
        }
      } catch (err) {
        console.error("Failed to refresh widget data:", err)
      } finally {
        setLoadingData(false)
      }
    }
    window.addEventListener("google-sheets-refresh", handleRefresh)
    return () => window.removeEventListener("google-sheets-refresh", handleRefresh)
  }, [])

  // Synchronous filter placeholder replaced by React.useMemo above

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedIdx(key)
    setTimeout(() => setCopiedIdx(null), 1500)
  }



  // Call Start / End Triggers
  const handleStartCall = () => {
    if (isCalling) return
    setIsCalling(true)
    setCallStartTime(Date.now())
  }

  const handleEndCall = () => {
    if (!isCalling) return
    // Show Call Details Modal to record result
    setModalCalledVal("Yes")
    setModalAnsweredVal("Yes")
    setModalAcceptOnboardVal("Yes")
    setModalCompanyEmailVal("")
    setModalReasonRejectVal("")
    setShowCallDetailsModal(true)
  }

  const handleConfirmCallDetails = async () => {
    if (!selectedRow) return

    // Validate compulsory fields
    if (modalAnsweredVal === "Yes") {
      if (modalAcceptOnboardVal === "Yes" && !modalCompanyEmailVal.trim()) {
        alert("Company Email is required when Accept Onboard is Yes.")
        return
      }
      if (modalAcceptOnboardVal === "No" && !modalReasonRejectVal.trim()) {
        alert("Reason Reject is required when Accept Onboard is No.")
        return
      }
    }

    setSavingCallDetails(true)

    const sheetRowNumber = parseInt(selectedRow[21])
    const sheetName = selectedRow[20] || selectedSheet

    // Format local time, e.g. "10:15 PM"
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
    const teamMembers = teams[selectedTeam] ? teams[selectedTeam].join(", ") : ""
    const calledByValue = `Team ${selectedTeam}: ${teamMembers} - ${timestamp}`

    const updatePromises = [
      saveCallRecord(
        sheetRowNumber,
        sheetName,
        modalCalledVal,
        modalAnsweredVal,
        calledByValue,
        modalAnsweredVal === "Yes" ? modalAcceptOnboardVal : "",
        modalAnsweredVal === "Yes" && modalAcceptOnboardVal === "Yes" ? modalCompanyEmailVal : "",
        modalAnsweredVal === "Yes" && modalAcceptOnboardVal === "No" ? modalReasonRejectVal : ""
      )
    ]

    // Find duplicates and update them in parallel too
    duplicateRecords.forEach(dup => {
      const dupRowNumber = parseInt(dup[21])
      const dupSheetName = dup[20]
      updatePromises.push(
        saveCallRecord(
          dupRowNumber,
          dupSheetName,
          modalCalledVal,
          modalAnsweredVal,
          calledByValue,
          modalAnsweredVal === "Yes" ? modalAcceptOnboardVal : "",
          modalAnsweredVal === "Yes" && modalAcceptOnboardVal === "Yes" ? modalCompanyEmailVal : "",
          modalAnsweredVal === "Yes" && modalAcceptOnboardVal === "No" ? modalReasonRejectVal : ""
        )
      )
    })

    const results = await Promise.all(updatePromises)
    const res = results[0]

    setSavingCallDetails(false)
    if (res.success) {
      // Dispatch refresh event to update the page
      window.dispatchEvent(new CustomEvent("google-sheets-refresh"))
      // Reset call states
      setIsCalling(false)
      setCallStartTime(null)
      setShowCallDetailsModal(false)
    } else {
      alert(`Failed to save call details: ${res.error}`)
    }
  }

  const handleCancelCallDetails = () => {
    // Reset call state without saving
    setIsCalling(false)
    setCallStartTime(null)
    setShowCallDetailsModal(false)
  }



  return (
    <div ref={containerRef} className="quick-call-widget-container">
      <div className="widget-header">
        <h3 className="widget-title">Quick Call Lookup</h3>
        <p className="widget-subtitle">Select a sheet and company to view pending calls.</p>
      </div>

      {loadingSheets || loadingData ? (
        <div className="widget-controls skeleton-loading-view" style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginTop: "1rem" }}>
          {/* Sheet Selector Skeleton */}
          <div className="widget-field">
            <div className="skeleton-cell" style={{ width: "80px", height: "12px", marginBottom: "0.25rem" }}></div>
            <div className="widget-tabs-bar" style={{ gap: "8px", flexWrap: "nowrap", overflowX: "hidden" }}>
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="skeleton-cell" style={{ width: "90px", height: "38px", borderRadius: "10px", flexShrink: 0 }}></div>
              ))}
            </div>
          </div>

          {/* Company Selector Dropdown Skeleton */}
          <div className="widget-field">
            <div className="skeleton-cell" style={{ width: "150px", height: "12px", marginBottom: "0.25rem" }}></div>
            <div className="skeleton-cell" style={{ width: "100%", height: "46px", borderRadius: "12px" }}></div>
          </div>

          {/* Details Card Skeleton */}
          <div className="widget-details-card" style={{ display: "flex", flexDirection: "column", gap: "1rem", minHeight: "135px" }}>
            <div className="widget-details-grid">
              <div className="widget-details-column">
                <div className="widget-details-row" style={{ display: "flex", gap: "8px" }}>
                  <div className="skeleton-cell" style={{ width: "20px", height: "20px", borderRadius: "50%", flexShrink: 0 }}></div>
                  <div className="widget-details-text" style={{ flex: 1 }}>
                    <div className="skeleton-cell" style={{ width: "60px", height: "10px" }}></div>
                    <div className="skeleton-cell" style={{ width: "140px", height: "16px", marginTop: "4px" }}></div>
                  </div>
                </div>
                <div className="widget-details-row" style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                  <div className="skeleton-cell" style={{ width: "20px", height: "20px", borderRadius: "50%", flexShrink: 0 }}></div>
                  <div className="widget-details-text" style={{ flex: 1 }}>
                    <div className="skeleton-cell" style={{ width: "60px", height: "10px" }}></div>
                    <div className="skeleton-cell" style={{ width: "110px", height: "14px", marginTop: "4px" }}></div>
                  </div>
                </div>
              </div>
              <div className="widget-details-column">
                <div className="widget-details-row" style={{ display: "flex", gap: "8px" }}>
                  <div className="skeleton-cell" style={{ width: "20px", height: "20px", borderRadius: "50%", flexShrink: 0 }}></div>
                  <div className="widget-details-text" style={{ flex: 1 }}>
                    <div className="skeleton-cell" style={{ width: "80px", height: "10px" }}></div>
                    <div className="skeleton-cell" style={{ width: "120px", height: "14px", marginTop: "4px" }}></div>
                  </div>
                </div>
                <div className="widget-details-row" style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                  <div className="skeleton-cell" style={{ width: "20px", height: "20px", borderRadius: "50%", flexShrink: 0 }}></div>
                  <div className="widget-details-text" style={{ flex: 1 }}>
                    <div className="skeleton-cell" style={{ width: "70px", height: "10px" }}></div>
                    <div className="skeleton-cell" style={{ width: "160px", height: "14px", marginTop: "4px" }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Team Selector Skeleton */}
          <div style={{ padding: "0.75rem 1.25rem", background: "rgba(255,255,255,0.01)", border: "1px solid var(--border-color)", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div className="skeleton-cell" style={{ width: "90px", height: "12px", marginBottom: "0.25rem" }}></div>
            <div className="widget-tabs-bar" style={{ gap: "10px", flexWrap: "nowrap", overflowX: "hidden" }}>
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="skeleton-cell" style={{ width: "110px", height: "56px", borderRadius: "12px", flexShrink: 0 }}></div>
              ))}
            </div>
          </div>

          {/* Start Call Button Skeleton */}
          <div className="skeleton-cell" style={{ width: "100%", height: "56px", borderRadius: "14px" }}></div>
        </div>
      ) : (
        <div className="widget-controls">
          <div className="widget-field">
            <label>Select Sheet</label>
            <div className="widget-tabs-bar" style={isCalling ? { opacity: 0.6, pointerEvents: "none" } : undefined}>
              {sheets.map(sheet => {
                const themeIdx = fullSheetsList.indexOf(sheet)
                const theme = TAB_THEMES[themeIdx !== -1 ? themeIdx % TAB_THEMES.length : 0]
                return (
                  <button
                    key={sheet}
                    onClick={() => {
                      if (!isCalling) {
                        setSelectedSheet(selectedSheet === sheet ? "" : sheet)
                      }
                    }}
                    className={`sheet-tab-btn ${selectedSheet === sheet ? "active" : ""}`}
                    disabled={isCalling}
                    style={{
                      "--active-color": theme.activeColor,
                      "--tab-bg-gradient": theme.bgGradient,
                      "--tab-shadow": theme.shadow,
                      height: "38px",
                      borderRadius: "10px",
                      padding: "0 14px",
                      fontSize: "0.85rem"
                    } as React.CSSProperties}
                  >
                    <PixelCanvas
                      gap={theme.gap}
                      speed={theme.speed}
                      colors={theme.colors}
                      variant="default"
                      active={selectedSheet === sheet}
                      noFocus={true}
                    />
                    <span className="sheet-tab-text" style={{ position: "relative", zIndex: 10 }}>
                      {sheet}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="widget-field">
            <label>Select Company (Pending Call)</label>
            {loadingData ? (
              <div className="widget-inline-loader">
                <Loader2Icon className="widget-spinner-small" />
                <span>Loading companies...</span>
              </div>
            ) : companies.length === 0 ? (
              <div className="custom-dropdown-container" style={{ opacity: 0.6, pointerEvents: "none" }}>
                <button type="button" className="custom-dropdown-trigger" disabled={true}>
                  <span>{!selectedSheet ? "Select a Sheet First" : "No Pending Companies"}</span>
                  <ChevronDown style={{ width: "16px", height: "16px", opacity: 0.7 }} />
                </button>
              </div>
            ) : (
              <div className="custom-dropdown-container" ref={dropdownRef} style={isCalling ? { opacity: 0.6, pointerEvents: "none" } : undefined}>
                <button
                  type="button"
                  onClick={() => !isCalling && setDropdownOpen(!dropdownOpen)}
                  disabled={isCalling}
                  className="custom-dropdown-trigger"
                >
                  <span>
                    {activeCompanyIdx >= 0 && activeCompanyIdx < companies.length
                      ? companies[activeCompanyIdx][cols.companyName]
                      : "-- Select Company --"}
                  </span>
                  <ChevronDown style={{ width: "16px", height: "16px", opacity: 0.7 }} />
                </button>

                {dropdownOpen && (
                  <div className="custom-dropdown-menu">
                    {companies.map((row, idx) => {
                      const companyName = row[cols.companyName]
                      const isCompleted = row[cols.ingested]?.toLowerCase() === "complete" || (
                        !!(row[cols.dummyEmail] && row[cols.dummyEmail].trim()) &&
                        !!(row[cols.companyName] && row[cols.companyName].trim()) &&
                        !!(row[cols.jobTitle] && row[cols.jobTitle].trim()) &&
                        !!(row[cols.jobDescription] && row[cols.jobDescription].trim()) &&
                        !!(row[cols.location] && row[cols.location].trim()) &&
                        !!(row[cols.fullPartTime] && row[cols.fullPartTime].trim()) &&
                        !!(row[cols.salaryRange] && row[cols.salaryRange].trim()) &&
                        !!(row[cols.contactNo] && row[cols.contactNo].trim())
                      )

                      const compNameLower = companyName?.trim()?.toLowerCase()
                      const currentSheet = row[20]
                      const currentSplitRow = row[21]
                      const hasDuplicates = allRows.slice(2).some(otherRow => {
                        const otherCompany = otherRow[cols.companyName]?.trim()?.toLowerCase()
                        const otherSheet = otherRow[20]
                        const otherSplitRow = otherRow[21]
                        return otherCompany === compNameLower && (otherSheet !== currentSheet || otherSplitRow !== currentSplitRow)
                      })

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setSelectedCompanyIdx(idx)
                            setDropdownOpen(false)
                          }}
                          className={`custom-dropdown-item ${activeCompanyIdx === idx ? "selected" : ""}`}
                        >
                          <span style={{ fontWeight: 500 }}>{companyName}</span>
                          <div className="custom-dropdown-badges">
                            <span className={`status-badge-static ${isCompleted ? "status-yes" : "status-no"}`}>
                              {isCompleted ? "Completed" : "Uncompleted"}
                            </span>
                            {hasDuplicates && (
                              <span className="sheet-badge-mini duplicate-badge" style={{ margin: 0, padding: "0.25rem 0.6rem", height: "auto", fontSize: "9px" }}>
                                DUPLICATE
                              </span>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {selectedRow && (() => {
        const isCompleted = selectedRow[cols.ingested]?.toLowerCase() === "complete" || (
          !!(selectedRow[cols.dummyEmail] && selectedRow[cols.dummyEmail].trim()) && // dummyEmail
          !!(selectedRow[cols.companyName] && selectedRow[cols.companyName].trim()) && // companyName
          !!(selectedRow[cols.jobTitle] && selectedRow[cols.jobTitle].trim()) && // jobTitle
          !!(selectedRow[cols.jobDescription] && selectedRow[cols.jobDescription].trim()) && // jobDescription
          !!(selectedRow[cols.location] && selectedRow[cols.location].trim()) && // location
          !!(selectedRow[cols.fullPartTime] && selectedRow[cols.fullPartTime].trim()) && // fullPartTime
          !!(selectedRow[cols.salaryRange] && selectedRow[cols.salaryRange].trim()) && // salaryRange
          !!(selectedRow[cols.contactNo] && selectedRow[cols.contactNo].trim())    // contactNo
        );

        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="widget-details-card" style={{ position: "relative" }}>
              <div style={{ position: "absolute", top: "1.25rem", right: "1.25rem" }}>
                <span className={`status-badge-static ${isCompleted ? "status-yes" : "status-no"}`}>
                  {isCompleted ? "Completed" : "Uncompleted"}
                </span>
              </div>

              <div className="widget-details-grid">
                <div className="widget-details-column">
                  <div className="widget-details-row">
                    <BriefcaseIcon className="widget-details-icon" />
                    <div className="widget-details-text" style={{ paddingRight: "100px" }}>
                      <div className="widget-details-label">Job Title</div>
                      <div className="widget-details-value">{selectedRow[cols.jobTitle] || "-"}</div>
                    </div>
                  </div>

                  {selectedRow[cols.location] && (
                    <div className="widget-details-row">
                      <MapPinIcon className="widget-details-icon" />
                      <div className="widget-details-text">
                        <div className="widget-details-label">Location</div>
                        <div className="widget-details-value">{selectedRow[cols.location]}</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="widget-details-column">
                  <div className="widget-details-row">
                    <PhoneIcon className="widget-details-icon" />
                    <div className="widget-details-text">
                      <div className="widget-details-label">Contact Number</div>
                      <div className="widget-details-value">{selectedRow[cols.contactNo] || "-"}</div>
                    </div>
                  </div>

                  {selectedRow[cols.dummyEmail] && (
                    <div className="widget-details-row">
                      <MailIcon className="widget-details-icon" />
                      <div className="widget-details-text">
                        <div className="widget-details-label">Dummy Email</div>
                        <div className="widget-details-value-wrapper">
                          <span className="widget-details-value">{selectedRow[cols.dummyEmail]}</span>
                          <button onClick={() => handleCopy(selectedRow[cols.dummyEmail], "main")} className="widget-copy-btn" title="Copy Email">
                            {copiedIdx === "main" ? <CheckIcon className="widget-copy-icon-success" /> : <CopyIcon className="widget-copy-icon" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Render duplicates under the main card */}
            {duplicateRecords.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", color: "#f87171", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  <LayersIcon style={{ width: "14px", height: "14px" }} />
                  <span>Duplicate Records Found ({duplicateRecords.length})</span>
                </div>

                {duplicateRecords.map((dupRow, dIdx) => {
                  const dupSheet = dupRow[20]
                  const dupSheetIdx = fullSheetsList.indexOf(dupSheet)
                  const dupTheme = TAB_THEMES[dupSheetIdx !== -1 ? dupSheetIdx % TAB_THEMES.length : 0]
                  const dupCompleted = dupRow[10]?.toLowerCase() === "complete" || (
                    !!(dupRow[2] && dupRow[2].trim()) &&
                    !!(dupRow[3] && dupRow[3].trim()) &&
                    !!(dupRow[4] && dupRow[4].trim()) &&
                    !!(dupRow[5] && dupRow[5].trim()) &&
                    !!(dupRow[6] && dupRow[6].trim()) &&
                    !!(dupRow[7] && dupRow[7].trim()) &&
                    !!(dupRow[8] && dupRow[8].trim()) &&
                    !!(dupRow[9] && dupRow[9].trim())
                  );

                  return (
                    <div
                      key={dIdx}
                      className="widget-details-card"
                      style={{
                        position: "relative",
                        borderLeft: `3px solid ${dupTheme.activeColor}`,
                        background: "rgba(255, 255, 255, 0.005)"
                      }}
                    >
                      <div style={{ position: "absolute", top: "1rem", right: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span className="sheet-badge-mini" style={{ backgroundColor: `${dupTheme.activeColor}15`, color: dupTheme.activeColor, border: `1px solid ${dupTheme.activeColor}30`, margin: 0 }}>
                          {dupSheet}
                        </span>
                        <span className={`status-badge-static ${dupCompleted ? "status-yes" : "status-no"}`}>
                          {dupCompleted ? "Completed" : "Uncompleted"}
                        </span>
                      </div>

                      <div className="widget-details-grid">
                        <div className="widget-details-column">
                          <div className="widget-details-row">
                            <BriefcaseIcon className="widget-details-icon" />
                            <div className="widget-details-text" style={{ paddingRight: "150px" }}>
                              <div className="widget-details-label">Job Title</div>
                              <div className="widget-details-value">{dupRow[4] || "-"}</div>
                            </div>
                          </div>

                          {dupRow[6] && (
                            <div className="widget-details-row">
                              <MapPinIcon className="widget-details-icon" />
                              <div className="widget-details-text">
                                <div className="widget-details-label">Location</div>
                                <div className="widget-details-value">{dupRow[6]}</div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="widget-details-column">
                          <div className="widget-details-row">
                            <PhoneIcon className="widget-details-icon" />
                            <div className="widget-details-text">
                              <div className="widget-details-label">Contact Number</div>
                              <div className="widget-details-value">{dupRow[9] || "-"}</div>
                            </div>
                          </div>

                          {dupRow[2] && (
                            <div className="widget-details-row">
                              <MailIcon className="widget-details-icon" />
                              <div className="widget-details-text">
                                <div className="widget-details-label">Dummy Email</div>
                                <div className="widget-details-value-wrapper">
                                  <span className="widget-details-value">{dupRow[2]}</span>
                                  <button onClick={() => handleCopy(dupRow[2], `dup-${dIdx}`)} className="widget-copy-btn" title="Copy Email">
                                    {copiedIdx === `dup-${dIdx}` ? <CheckIcon className="widget-copy-icon-success" /> : <CopyIcon className="widget-copy-icon" />}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Team Selector Section */}
            <div style={{ marginTop: "0.75rem", padding: "0.75rem 1.25rem", background: "rgba(255,255,255,0.01)", border: "1px solid var(--border-color)", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <label style={{ margin: 0, fontSize: "0.8rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>Select Team:</label>
                <div className="widget-tabs-bar" style={isCalling ? { opacity: 0.6, pointerEvents: "none", flexWrap: "nowrap", overflowX: "auto", paddingBottom: "4px", scrollbarWidth: "none", alignItems: "flex-start", gap: "10px" } : { flexWrap: "nowrap", overflowX: "auto", paddingBottom: "4px", scrollbarWidth: "none", alignItems: "flex-start", gap: "10px" }}>
                  {Object.keys(teams).map((tName, idx) => {
                    const theme = TAB_THEMES[idx % TAB_THEMES.length]
                    const members = teams[tName] || []
                    return (
                      <button
                        key={tName}
                        onClick={() => !isCalling && setSelectedTeam(selectedTeam === tName ? "" : tName)}
                        disabled={isCalling}
                        className={`sheet-tab-btn ${selectedTeam === tName ? "active" : ""}`}
                        style={{
                          "--active-color": theme.activeColor,
                          "--tab-bg-gradient": theme.bgGradient,
                          "--tab-shadow": theme.shadow,
                          height: "auto",
                          minHeight: "56px",
                          borderRadius: "12px",
                          padding: "10px 16px",
                          fontSize: "0.85rem",
                          display: "inline-flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                          justifyContent: "center",
                          gap: "4px",
                          textAlign: "left"
                        } as React.CSSProperties}
                      >
                        <PixelCanvas
                          gap={theme.gap}
                          speed={theme.speed}
                          colors={theme.colors}
                          variant="default"
                          active={selectedTeam === tName}
                          noFocus={true}
                        />
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", position: "relative", zIndex: 10 }}>
                          <UsersIcon style={{ width: "14px", height: "14px", opacity: 0.8 }} />
                          <span style={{ fontWeight: 600 }}>Team {tName}</span>
                        </div>
                        <span style={{ fontSize: "0.7rem", opacity: 0.8, fontWeight: 400, position: "relative", zIndex: 10 }}>
                          {members.join(", ")}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {selectedTeam && (() => {
              const selectedSheetIdx = fullSheetsList.indexOf(selectedSheet);
              const activeSheetTheme = TAB_THEMES[selectedSheetIdx !== -1 ? selectedSheetIdx % TAB_THEMES.length : 0];

              if (isCalling) {
                return (
                  <button
                    type="button"
                    onClick={handleEndCall}
                    className="sheet-tab-btn active call-btn-active"
                    style={{
                      "--active-color": "#ef4444",
                      "--tab-bg-gradient": "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
                      "--tab-shadow": "rgba(239, 68, 68, 0.4)",
                      width: "100%",
                      height: "56px",
                      borderRadius: "14px",
                      padding: "0 24px",
                      fontSize: "1.1rem",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      marginTop: "0.75rem",
                      position: "relative"
                    } as React.CSSProperties}
                  >
                    <PixelCanvas
                      gap={4}
                      speed={40}
                      colors={["#fee2e2", "#fca5a5", "#ef4444"]}
                      variant="default"
                      active={true}
                    />
                    <PhoneIcon className="icon-small call-icon-anim" style={{ width: "20px", height: "20px", position: "relative", zIndex: 10 }} />
                    <span style={{ position: "relative", zIndex: 10 }}>End Call ({formatTimer(elapsedSeconds)})</span>
                  </button>
                );
              }

              return (
                <button
                  type="button"
                  onClick={handleStartCall}
                  className="sheet-tab-btn active"
                  style={{
                    "--active-color": activeSheetTheme.activeColor,
                    "--tab-bg-gradient": activeSheetTheme.bgGradient,
                    "--tab-shadow": activeSheetTheme.shadow,
                    width: "100%",
                    height: "56px",
                    borderRadius: "14px",
                    padding: "0 24px",
                    fontSize: "1.1rem",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    marginTop: "0.75rem",
                    position: "relative"
                  } as React.CSSProperties}
                >
                  <PixelCanvas
                    gap={activeSheetTheme.gap}
                    speed={activeSheetTheme.speed}
                    colors={activeSheetTheme.colors}
                    variant="default"
                    active={true}
                  />
                  <PhoneIcon className="icon-small" style={{ width: "20px", height: "20px", position: "relative", zIndex: 10 }} />
                  <span style={{ position: "relative", zIndex: 10 }}>Start Call</span>
                </button>
              );
            })()}
          </div>
        );
      })()}

      {/* Placeholder Details card and disabled button when no calls are pending to lock card dimensions */}
      {!selectedRow && companies.length === 0 && (() => {
        const isSheetEmpty = !selectedSheet;

        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
            <div className="widget-details-card" style={{ position: "relative", minHeight: "135px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed var(--border-color)", background: "rgba(255, 255, 255, 0.005)" }}>
              <div style={{ textAlign: "center", padding: "1rem" }}>
                {isSheetEmpty ? (
                  <>
                    <BriefcaseIcon style={{ width: "24px", height: "24px", color: "var(--text-secondary)", marginBottom: "0.25rem", display: "inline-block" }} />
                    <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)" }}>No Sheet Selected</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.15rem" }}>
                      Select a sheet tab above to look up pending calls.
                    </div>
                  </>
                ) : (
                  <>
                    <CheckIcon style={{ width: "24px", height: "24px", color: "#22c55e", marginBottom: "0.25rem", display: "inline-block" }} />
                    <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)" }}>All Done!</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.15rem" }}>
                      All companies in this sheet have been called! 🎉
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Team Selector Section (Disabled shape) */}
            <div style={{ marginTop: "0.25rem", padding: "0.75rem 1.25rem", background: "rgba(255,255,255,0.01)", border: "1px solid var(--border-color)", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "0.5rem", opacity: 0.5 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <label style={{ margin: 0, fontSize: "0.8rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>Select Team:</label>
                <div className="widget-tabs-bar" style={{ flexWrap: "nowrap", overflowX: "auto", paddingBottom: "4px", scrollbarWidth: "none", alignItems: "flex-start", gap: "10px", pointerEvents: "none" }}>
                  {Object.keys(teams).map((tName, idx) => {
                    const theme = TAB_THEMES[idx % TAB_THEMES.length]
                    const members = teams[tName] || []
                    return (
                      <button
                        key={tName}
                        disabled={true}
                        className="sheet-tab-btn"
                        style={{
                          "--active-color": theme.activeColor,
                          "--tab-bg-gradient": theme.bgGradient,
                          "--tab-shadow": theme.shadow,
                          height: "auto",
                          minHeight: "56px",
                          borderRadius: "12px",
                          padding: "10px 16px",
                          fontSize: "0.85rem",
                          display: "inline-flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                          justifyContent: "center",
                          gap: "4px",
                          textAlign: "left"
                        } as React.CSSProperties}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", position: "relative", zIndex: 10 }}>
                          <UsersIcon style={{ width: "14px", height: "14px", opacity: 0.8 }} />
                          <span style={{ fontWeight: 600 }}>Team {tName}</span>
                        </div>
                        <span style={{ fontSize: "0.7rem", opacity: 0.8, fontWeight: 400, position: "relative", zIndex: 10 }}>
                          {members.join(", ")}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Start Call Button (Disabled shape) */}
            <button
              type="button"
              disabled={true}
              className="sheet-tab-btn"
              style={{
                width: "100%",
                height: "56px",
                borderRadius: "14px",
                padding: "0 24px",
                fontSize: "1.1rem",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                marginTop: "0.5rem",
                position: "relative",
                background: "rgba(255, 255, 255, 0.02)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-color)",
                cursor: "not-allowed",
                opacity: 0.5
              } as React.CSSProperties}
            >
              <PhoneIcon className="icon-small" style={{ width: "20px", height: "20px", position: "relative", zIndex: 10 }} />
              <span style={{ position: "relative", zIndex: 10 }}>
                {isSheetEmpty ? "Select a Sheet First" : "No Calls Pending"}
              </span>
            </button>
          </div>
        );
      })()}

      {/* Call Details Input Confirmation Modal */}
      {isMounted && showCallDetailsModal && selectedRow && createPortal(
        <div className="confirm-overlay">
          <div className="confirm-modal confirm-modal-call">
            <div className="confirm-header confirm-header-call">
              <h4>📞 Update Call Results</h4>
            </div>
            <div className="confirm-body">
              <p style={{ marginBottom: "1.25rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                You just ended a call with <strong>{selectedRow[3]}</strong>. Please select the call outcome below to update the Google Sheet directly.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginBottom: "0.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 500, fontSize: "0.95rem" }}>Called Status</span>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      className={`btn-choice ${modalCalledVal === "Yes" ? "active-yes" : ""}`}
                      onClick={() => setModalCalledVal("Yes")}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      className={`btn-choice ${modalCalledVal === "No" ? "active-no" : ""}`}
                      onClick={() => setModalCalledVal("No")}
                    >
                      No
                    </button>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 500, fontSize: "0.95rem" }}>Answered Status</span>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      className={`btn-choice ${modalAnsweredVal === "Yes" ? "active-yes" : ""}`}
                      onClick={() => setModalAnsweredVal("Yes")}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      className={`btn-choice ${modalAnsweredVal === "No" ? "active-no" : ""}`}
                      onClick={() => setModalAnsweredVal("No")}
                    >
                      No
                    </button>
                  </div>
                </div>

                {modalAnsweredVal === "Yes" && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 500, fontSize: "0.95rem" }}>Accept Onboard</span>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        type="button"
                        className={`btn-choice ${modalAcceptOnboardVal === "Yes" ? "active-yes" : ""}`}
                        onClick={() => setModalAcceptOnboardVal("Yes")}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        className={`btn-choice ${modalAcceptOnboardVal === "No" ? "active-no" : ""}`}
                        onClick={() => setModalAcceptOnboardVal("No")}
                      >
                        No
                      </button>
                    </div>
                  </div>
                )}

                {modalAnsweredVal === "Yes" && (
                  modalAcceptOnboardVal === "Yes" ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label style={{ fontWeight: 500, fontSize: "0.85rem", color: "var(--text-secondary)" }}>Company Email <span style={{ color: "#ef4444" }}>*</span></label>
                      <input
                        type="email"
                        placeholder="Enter company email address..."
                        value={modalCompanyEmailVal}
                        onChange={(e) => setModalCompanyEmailVal(e.target.value)}
                        style={{
                          padding: "10px 14px",
                          borderRadius: "10px",
                          border: "1px solid var(--border-color)",
                          background: "rgba(255, 255, 255, 0.03)",
                          color: "var(--text-primary)",
                          fontSize: "0.85rem",
                          outline: "none",
                          width: "100%"
                        }}
                      />
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label style={{ fontWeight: 500, fontSize: "0.85rem", color: "var(--text-secondary)" }}>Reason Reject <span style={{ color: "#ef4444" }}>*</span></label>
                      <input
                        type="text"
                        placeholder="Enter rejection reason..."
                        value={modalReasonRejectVal}
                        onChange={(e) => setModalReasonRejectVal(e.target.value)}
                        style={{
                          padding: "10px 14px",
                          borderRadius: "10px",
                          border: "1px solid var(--border-color)",
                          background: "rgba(255, 255, 255, 0.03)",
                          color: "var(--text-primary)",
                          fontSize: "0.85rem",
                          outline: "none",
                          width: "100%"
                        }}
                      />
                    </div>
                  )
                )}
              </div>
            </div>
            <div className="confirm-footer">
              <button
                className="btn-confirm-cancel"
                onClick={handleCancelCallDetails}
                disabled={savingCallDetails}
              >
                Cancel Call
              </button>
              <button
                className="btn-confirm-yes"
                onClick={handleConfirmCallDetails}
                disabled={savingCallDetails || (modalAnsweredVal === "Yes" && ((modalAcceptOnboardVal === "Yes" && !modalCompanyEmailVal.trim()) || (modalAcceptOnboardVal === "No" && !modalReasonRejectVal.trim())))}
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                {savingCallDetails && <Loader2Icon className="spinner-icon-inline" style={{ width: "14px", height: "14px", animation: "spin 1s linear infinite" }} />}
                Save & Update
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
