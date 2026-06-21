"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { SearchIcon, InfoIcon, ExternalLinkIcon, MapPinIcon, BriefcaseIcon, DollarSignIcon, CopyIcon, CheckIcon, Loader2Icon, FileSpreadsheetIcon, ArrowUpIcon, PhoneIcon } from "lucide-react"
import { updateRowStatus, getSheetData, getApiQuotaState, saveCallRecord } from "@/app/actions/sheets"
import { PixelCanvas } from "./pixel-canvas"
import { getColumnIndices, getColumnLetter } from "@/utils/columnMapper"




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

interface SheetTableProps {
  initialRows: string[][]
  sheetsList: string[]
  initialSheetName: string
  gids?: Record<string, number>
  initialRequestCount: number
}

export default function SheetTable({ initialRows, sheetsList, initialSheetName, gids, initialRequestCount }: SheetTableProps) {
  const [rows, setRows] = React.useState<string[][]>(initialRows)
  const cols = React.useMemo(() => {
    const headerRow = rows[1] || rows[0] || []
    return getColumnIndices(headerRow)
  }, [rows])
  const [isMounted, setIsMounted] = React.useState(false)


  React.useEffect(() => {
    const handle = requestAnimationFrame(() => {
      setIsMounted(true)
    })
    return () => cancelAnimationFrame(handle)
  }, [])
  const [activeTab, setActiveTab] = React.useState<string>(initialSheetName)
  const [loading, setLoading] = React.useState<boolean>(false)
  const [showSkeleton, setShowSkeleton] = React.useState<boolean>(false)

  React.useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setShowSkeleton(true)
      }, 150)
      return () => clearTimeout(timer)
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowSkeleton(false)
    }
  }, [loading])

  const [searchTerm, setSearchTerm] = React.useState("")
  const [selectedJob, setSelectedJob] = React.useState<string[] | null>(null)
  const [showScrollTop, setShowScrollTop] = React.useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [updatingCell, setUpdatingCell] = React.useState<string | null>(null)
  const [copiedEmail, setCopiedEmail] = React.useState<string | null>(null)
  const [requestCount, setRequestCount] = React.useState<number>(initialRequestCount)
  const [secondsRemaining, setSecondsRemaining] = React.useState<number>(60)
  const stickyHeaderRef = React.useRef<HTMLDivElement>(null)
  const [stickyHeaderHeight, setStickyHeaderHeight] = React.useState(135)
  const sentinelRef = React.useRef<HTMLDivElement>(null)
  const [isHeaderStuck, setIsHeaderStuck] = React.useState(false)
  const [pendingConfirm, setPendingConfirm] = React.useState<{
    title: string
    message: string
    onConfirm: () => void
  } | null>(null)

  // Quick Call Sync states
  const [qcSelectedSheet, setQcSelectedSheet] = React.useState<string>("")
  const [qcSelectedCompanyIdx, setQcSelectedCompanyIdx] = React.useState<number>(-1)
  const [qcSelectedTeam, setQcSelectedTeam] = React.useState<string>("")
  const [qcCompanies, setQcCompanies] = React.useState<string[][]>([])
  const [qcTeams, setQcTeams] = React.useState<Record<string, string[]>>({})
  const [qcDuplicateRecords, setQcDuplicateRecords] = React.useState<string[][]>([])


  // Call States
  const [isCalling, setIsCalling] = React.useState(false)
  const [callStartTime, setCallStartTime] = React.useState<number | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = React.useState(0)

  // modal states
  const [showCallDetailsModal, setShowCallDetailsModal] = React.useState(false)
  const [modalCalledVal, setModalCalledVal] = React.useState<"Yes" | "No">("Yes")
  const [modalAnsweredVal, setModalAnsweredVal] = React.useState<"Yes" | "No">("Yes")
  const [modalAcceptOnboardVal, setModalAcceptOnboardVal] = React.useState<"Yes" | "No">("Yes")
  const [modalCompanyEmailVal, setModalCompanyEmailVal] = React.useState<string>("")
  const [modalReasonRejectVal, setModalReasonRejectVal] = React.useState<string>("")
  const [savingCallDetails, setSavingCallDetails] = React.useState(false)


  // Refs to read current state values inside event listener without dependencies
  const qcSelectedSheetRef = React.useRef(qcSelectedSheet)
  const qcSelectedCompanyIdxRef = React.useRef(qcSelectedCompanyIdx)
  const qcSelectedTeamRef = React.useRef(qcSelectedTeam)
  const qcCompaniesRef = React.useRef(qcCompanies)
  const qcTeamsRef = React.useRef(qcTeams)
  const qcDuplicateRecordsRef = React.useRef(qcDuplicateRecords)
  const isCallingRef = React.useRef(isCalling)
  const callStartTimeRef = React.useRef(callStartTime)

  React.useEffect(() => {
    qcSelectedSheetRef.current = qcSelectedSheet
    qcSelectedCompanyIdxRef.current = qcSelectedCompanyIdx
    qcSelectedTeamRef.current = qcSelectedTeam
    qcCompaniesRef.current = qcCompanies
    qcTeamsRef.current = qcTeams
    qcDuplicateRecordsRef.current = qcDuplicateRecords
    isCallingRef.current = isCalling
    callStartTimeRef.current = callStartTime
  })

  // Listen to state changes from QuickCallWidget card
  React.useEffect(() => {
    const handleWidgetUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail.selectedSheet !== undefined && detail.selectedSheet !== qcSelectedSheetRef.current) {
        setQcSelectedSheet(detail.selectedSheet)
      }
      if (detail.selectedCompanyIdx !== undefined && detail.selectedCompanyIdx !== qcSelectedCompanyIdxRef.current) {
        setQcSelectedCompanyIdx(detail.selectedCompanyIdx)
      }
      if (detail.selectedTeam !== undefined && detail.selectedTeam !== qcSelectedTeamRef.current) {
        setQcSelectedTeam(detail.selectedTeam)
      }
      if (detail.companies !== undefined) {
        const prev = qcCompaniesRef.current
        if (prev.length !== detail.companies.length || prev.some((row, i) => row[cols.companyName] !== detail.companies[i]?.[cols.companyName])) {
          setQcCompanies(detail.companies)
        }
      }
      if (detail.duplicateRecords !== undefined) {
        setQcDuplicateRecords(detail.duplicateRecords)
      }
      if (detail.teams !== undefined) {
        if (JSON.stringify(qcTeamsRef.current) !== JSON.stringify(detail.teams)) {
          setQcTeams(detail.teams)
        }
      }
      if (detail.isCalling !== undefined && detail.isCalling !== isCallingRef.current) {
        setIsCalling(detail.isCalling)
      }
      if (detail.callStartTime !== undefined && detail.callStartTime !== callStartTimeRef.current) {
        setCallStartTime(detail.callStartTime)
      }
    }
    window.addEventListener("quick-call-widget-update", handleWidgetUpdate)
    return () => window.removeEventListener("quick-call-widget-update", handleWidgetUpdate)
  }, [cols.companyName])

  // Sync state changes back to QuickCallWidget
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("quick-call-sticky-update", {
        detail: { selectedSheet: qcSelectedSheet, selectedCompanyIdx: qcSelectedCompanyIdx, selectedTeam: qcSelectedTeam, isCalling, callStartTime }
      }))
    }
  }, [qcSelectedSheet, qcSelectedCompanyIdx, qcSelectedTeam, isCalling, callStartTime])

  // Timer ticker
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
  React.useEffect(() => {
    const handleRefresh = async () => {
      setLoading(true)
      const result = await getSheetData(activeTab)
      if (result.success && result.data) {
        setRows(result.data)
        if (result.requestCount !== undefined) {
          setRequestCount(result.requestCount)
        }
      }
      setLoading(false)
    }
    window.addEventListener("google-sheets-refresh", handleRefresh)
    return () => window.removeEventListener("google-sheets-refresh", handleRefresh)
  }, [activeTab])

  // Call Button Handlers
  const handleStartCall = () => {
    if (isCalling) return
    setIsCalling(true)
    setCallStartTime(Date.now())
  }

  const handleEndCall = () => {
    if (!isCalling) return
    setModalCalledVal("Yes")
    setModalAnsweredVal("Yes")
    setModalAcceptOnboardVal("Yes")
    setModalCompanyEmailVal("")
    setModalReasonRejectVal("")
    setShowCallDetailsModal(true)
  }

  const handleConfirmCallDetails = async () => {
    const selectedRow = qcSelectedCompanyIdx >= 0 && qcSelectedCompanyIdx < qcCompanies.length ? qcCompanies[qcSelectedCompanyIdx] : null
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
    const sheetName = selectedRow[20] || qcSelectedSheet

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
    const teamMembers = qcTeams[qcSelectedTeam] ? qcTeams[qcSelectedTeam].join(", ") : ""
    const calledByValue = `Team ${qcSelectedTeam}: ${teamMembers} - ${timestamp}`

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
    qcDuplicateRecordsRef.current.forEach(dup => {
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
      window.dispatchEvent(new CustomEvent("google-sheets-refresh"))
      setIsCalling(false)
      setCallStartTime(null)
      setShowCallDetailsModal(false)
    } else {
      alert(`Failed to save call details: ${res.error}`)
    }
  }

  const handleCancelCallDetails = () => {
    setIsCalling(false)
    setCallStartTime(null)
    setShowCallDetailsModal(false)
  }

  const [showQcSticky, setShowQcSticky] = React.useState(false)

  // Scroll event listener to toggle sticky quick call visibility
  React.useEffect(() => {
    const showRef = { current: showQcSticky }
    const handleScroll = () => {
      const shouldShow = window.scrollY > 250 && !!qcSelectedTeam
      if (showRef.current !== shouldShow) {
        showRef.current = shouldShow
        setShowQcSticky(shouldShow)
      }
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [qcSelectedTeam]) // eslint-disable-line react-hooks/exhaustive-deps

  // Update global offset height CSS variable based on whether showQcSticky is true
  React.useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.style.setProperty("--quick-call-height", showQcSticky ? "76px" : "0px")
    }
    return () => {
      if (typeof document !== "undefined") {
        document.documentElement.style.setProperty("--quick-call-height", "0px")
      }
    }
  }, [showQcSticky])

  const qcSentinelRef = React.useRef<HTMLDivElement>(null)
  const [isQcStuck, setIsQcStuck] = React.useState(false)

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsQcStuck(!entry.isIntersecting)
      },
      {
        rootMargin: "0px 0px 0px 0px"
      }
    )
    if (qcSentinelRef.current) {
      observer.observe(qcSentinelRef.current)
    }
    return () => observer.disconnect()
  }, [])

  React.useEffect(() => {
    const handleResize = () => {
      if (stickyHeaderRef.current) {
        const height = stickyHeaderRef.current.offsetHeight
        setStickyHeaderHeight(prev => Math.abs(prev - height) > 2 ? height : prev)
      }
    }

    handleResize()

    if (typeof ResizeObserver !== "undefined" && stickyHeaderRef.current) {
      const observer = new ResizeObserver(handleResize)
      observer.observe(stickyHeaderRef.current)
      return () => observer.disconnect()
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  React.useEffect(() => {
    const handleScroll = () => {
      if (!sentinelRef.current) return
      const sentinelTop = sentinelRef.current.getBoundingClientRect().top
      const headerBottom = stickyHeaderHeight + (showQcSticky ? 76 : 0)
      const isStuck = sentinelTop <= headerBottom
      setIsHeaderStuck(prev => prev !== isStuck ? isStuck : prev)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("resize", handleScroll)
    handleScroll()

    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", handleScroll)
    }
  }, [stickyHeaderHeight, showQcSticky])

  // Purely client-side countdown — ticks from the real clock, always accurate
  React.useEffect(() => {
    const tick = () => {
      const now = Date.now()
      setSecondsRemaining(Math.max(1, Math.ceil(((Math.floor(now / 60000) + 1) * 60000 - now) / 1000)))
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [])

  // Poll server only for request count (every 5 s, fires immediately on mount)
  React.useEffect(() => {
    const fetchCount = async () => {
      try {
        const state = await getApiQuotaState()
        setRequestCount(state.requestCount)
      } catch (err) {
        console.error("Failed to poll API quota state:", err)
      }
    }
    fetchCount()
    const pollInterval = setInterval(fetchCount, 5000)
    return () => clearInterval(pollInterval)
  }, [])

  // Parallax scroll effect for top grid cards and back-to-top visibility
  React.useEffect(() => {
    const scrollTopRef = { current: showScrollTop }
    const handleScroll = () => {
      const topGrid = document.querySelector(".top-grid-container") as HTMLElement
      const scrollY = window.scrollY

      if (topGrid) {
        const opacity = Math.max(0, 1 - scrollY / 400)
        const scale = Math.max(0.92, 1 - scrollY / 4000)
        const translateY = scrollY * 0.45

        topGrid.style.opacity = String(opacity)
        topGrid.style.transform = `scale(${scale}) translateY(${translateY}px)`
        topGrid.style.pointerEvents = scrollY > 350 ? "none" : "auto"
      }

      const shouldShow = scrollY > 300
      if (scrollTopRef.current !== shouldShow) {
        scrollTopRef.current = shouldShow
        setShowScrollTop(shouldShow)
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Map rows with their sheet row number and original sheet name, filter out empty rows
  const mappedRows = React.useMemo(() => {
    if (!rows || rows.length < 3) return []
    return rows.slice(2).map((row, index) => {
      const sheetName = row[20] || activeTab
      const sheetRowNumber = parseInt(row[21]) || (index + 3)
      return {
        data: row,
        sheetName,
        sheetRowNumber
      }
    }).filter(item => item.data && item.data.length > 0 && item.data[cols.companyName])
  }, [rows, activeTab, cols.companyName])

  // Track frequency of company names across the entire sheet data
  const { companyCounts, companySheets } = React.useMemo(() => {
    const counts: Record<string, number> = {}
    const sheetsMap: Record<string, Set<string>> = {}

    mappedRows.forEach(item => {
      const company = (item.data[cols.companyName] || "").trim().toLowerCase()
      if (company) {
        counts[company] = (counts[company] || 0) + 1
        if (!sheetsMap[company]) {
          sheetsMap[company] = new Set()
        }
        sheetsMap[company].add(item.sheetName)
      }
    })

    const sheetsListMap: Record<string, string[]> = {}
    Object.keys(sheetsMap).forEach(company => {
      sheetsListMap[company] = Array.from(sheetsMap[company])
    })

    return {
      companyCounts: counts,
      companySheets: sheetsListMap
    }
  }, [mappedRows, cols.companyName])

  const [showDuplicatesOnly, setShowDuplicatesOnly] = React.useState(false)
  const [ingestedFilter, setIngestedFilter] = React.useState<"all" | "completed" | "uncompleted">("all")

  const initialCols = React.useMemo(() => {
    const headerRow = initialRows[1] || initialRows[0] || []
    return getColumnIndices(headerRow)
  }, [initialRows])

  // Calculate the amount of company records inside each sheet tab based on initialRows
  const tabCounts = React.useMemo(() => {
    const counts: Record<string, number> = {}
    if (initialRows && initialRows.length >= 3) {
      initialRows.slice(2).forEach(row => {
        if (row && row.length > 0 && row[initialCols.companyName]) {
          const sheetName = row[20] || activeTab
          counts[sheetName] = (counts[sheetName] || 0) + 1
        }
      })
    }
    // Total valid records count for the "All" tab
    let total = 0
    Object.keys(counts).forEach(key => {
      total += counts[key]
    })
    counts["All"] = total
    return counts
  }, [initialRows, activeTab, initialCols.companyName])

  // Count how many duplicate rows are in the current mapped rows
  const duplicateRowsCount = React.useMemo(() => {
    return mappedRows.filter(item => {
      const company = (item.data[cols.companyName] || "").trim().toLowerCase()
      return company && companyCounts[company] > 1
    }).length
  }, [mappedRows, companyCounts, cols.companyName])

  // Count how many completed and uncompleted records are in the current mapped rows
  const ingestionCounts = React.useMemo(() => {
    let completed = 0
    let uncompleted = 0
    mappedRows.forEach(item => {
      const row = item.data
      const dummyEmail = row[cols.dummyEmail]
      const companyName = row[cols.companyName]
      const jobTitle = row[cols.jobTitle]
      const location = row[cols.location]
      const salary = row[cols.salaryRange]
      const contactNo = row[cols.contactNo]

      const isCompleted = row[cols.ingested]
        ? row[cols.ingested].toLowerCase() === "complete"
        : (
          !!(dummyEmail && dummyEmail.trim()) &&
          !!(companyName && companyName.trim()) &&
          !!(jobTitle && jobTitle.trim()) &&
          !!(row[cols.jobDescription] && row[cols.jobDescription].trim()) &&
          !!(location && location.trim()) &&
          !!(row[cols.fullPartTime] && row[cols.fullPartTime].trim()) &&
          !!(salary && salary.trim()) &&
          !!(contactNo && contactNo.trim())
        );

      if (isCompleted) completed++
      else uncompleted++
    })
    return { completed, uncompleted }
  }, [mappedRows, cols])

  // Filter data based on search term, duplicates filter, and ingestion status filter
  const filteredRows = React.useMemo(() => {
    let rowsToFilter = mappedRows
    if (showDuplicatesOnly) {
      rowsToFilter = mappedRows.filter(item => {
        const company = (item.data[cols.companyName] || "").trim().toLowerCase()
        return company && companyCounts[company] > 1
      })
    }
    if (ingestedFilter !== "all") {
      rowsToFilter = rowsToFilter.filter(item => {
        const row = item.data
        const dummyEmail = row[cols.dummyEmail]
        const companyName = row[cols.companyName]
        const jobTitle = row[cols.jobTitle]
        const location = row[cols.location]
        const salary = row[cols.salaryRange]
        const contactNo = row[cols.contactNo]

        const isCompleted = row[cols.ingested]
          ? row[cols.ingested].toLowerCase() === "complete"
          : (
            !!(dummyEmail && dummyEmail.trim()) &&
            !!(companyName && companyName.trim()) &&
            !!(jobTitle && jobTitle.trim()) &&
            !!(row[cols.jobDescription] && row[cols.jobDescription].trim()) &&
            !!(location && location.trim()) &&
            !!(row[cols.fullPartTime] && row[cols.fullPartTime].trim()) &&
            !!(salary && salary.trim()) &&
            !!(contactNo && contactNo.trim())
          );

        return ingestedFilter === "completed" ? isCompleted : !isCompleted
      })
    }
    return rowsToFilter.filter(item => {
      const row = item.data
      const searchString = `${row[cols.dataBy] || ""} ${row[1] || ""} ${row[cols.dummyEmail] || ""} ${row[cols.companyName] || ""} ${row[cols.jobTitle] || ""} ${row[cols.location] || ""} ${row[cols.salaryRange] || ""} ${item.sheetName}`.toLowerCase()
      return searchString.includes(searchTerm.toLowerCase())
    })
  }, [mappedRows, searchTerm, showDuplicatesOnly, ingestedFilter, companyCounts, cols])


  const handleTabChange = async (tabName: string) => {
    if (tabName === activeTab || loading) return
    setLoading(true)
    setActiveTab(tabName)
    setShowDuplicatesOnly(false)
    const result = await getSheetData(tabName)
    if (result.success && result.data) {
      setRows(result.data)
      if (result.requestCount !== undefined) {
        setRequestCount(result.requestCount)
      }
    } else {
      alert(`Failed to load sheet data: ${result.error}`)
    }
    setLoading(false)
  }

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email)
    setCopiedEmail(email)
    setTimeout(() => setCopiedEmail(null), 1500)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleStatusChangeWithConfirm = (
    sheetRowNumber: number,
    columnGroup: "called" | "answered" | "accepted",
    value: "Yes" | "No" | "Pending",
    sheetName: string
  ) => {
    const displayVal = value === "Pending" ? "Not yet" : value
    setPendingConfirm({
      title: "⚠️ Save Changes to Google Sheet?",
      message: `Apologies for the interruption! We just want to double-check: are you sure you want to change this status to "${displayVal}"? Since this updates the live spreadsheet directly, we want to be extra careful to prevent any accidental data corruption. Thank you!`,
      onConfirm: () => {
        handleStatusChange(sheetRowNumber, columnGroup, value, sheetName)
      }
    })
  }

  const handleGoogleSheetLinkClick = (e: React.MouseEvent, url: string, cellDescription: string) => {
    e.preventDefault()
    setPendingConfirm({
      title: "⚠️ Opening Live Spreadsheet",
      message: `Sorry for the extra popup! You are about to open ${cellDescription} directly in Google Sheets. Please proceed with caution when viewing or editing to prevent accidental changes. Thank you for understanding!`,
      onConfirm: () => {
        window.open(url, "_blank", "noopener,noreferrer")
      }
    })
  }

  const handleStatusChange = async (
    sheetRowNumber: number,
    columnGroup: "called" | "answered" | "accepted",
    value: "Yes" | "No" | "Pending",
    sheetName: string
  ) => {
    const key = `${sheetName}_${sheetRowNumber}_${columnGroup}`
    setUpdatingCell(key)
    const result = await updateRowStatus(sheetRowNumber, columnGroup, value, sheetName)
    setUpdatingCell(null)
    if (!result.success) {
      alert(`Failed to update sheet: ${result.error}`)
    } else {
      // Fetch fresh data for the active tab to update the state immediately
      const refreshResult = await getSheetData(activeTab)
      if (refreshResult.success && refreshResult.data) {
        setRows(refreshResult.data)
        if (refreshResult.requestCount !== undefined) {
          setRequestCount(refreshResult.requestCount)
        }
      }
    }
  }

  const renderStatusSelector = (
    statusVal: string,
    sheetRowNumber: number,
    columnGroup: "called" | "answered" | "accepted",
    sheetName: string,
    companyName?: string
  ) => {
    let currentVal: "Yes" | "No" | "Pending" = "Pending"
    const lowerVal = statusVal?.trim()?.toLowerCase()
    if (lowerVal === "yes") currentVal = "Yes"
    else if (lowerVal === "no") currentVal = "No"

    const isClickable = columnGroup === "called" && currentVal === "Pending" && !!companyName

    const handleClick = () => {
      if (!isClickable) return
      window.dispatchEvent(new CustomEvent("quick-call-sticky-update", {
        detail: {
          selectedSheet: sheetName,
          targetCompanyName: companyName,
          targetRowNumber: sheetRowNumber
        }
      }))
    }

    return (
      <span
        onClick={handleClick}
        className={`status-badge-static ${currentVal === "Yes" ? "status-yes" : currentVal === "No" ? "status-no" : "status-pending"
          }`}
        style={isClickable ? { cursor: "pointer", transition: "transform 0.15s ease" } : undefined}
        title={isClickable ? "Click to set up call for this company" : undefined}
      >
        {currentVal === "Yes" ? "Yes" : currentVal === "No" ? "No" : "Not yet"}
      </span>
    )
  }

  return (
    <div
      className="sheet-table-section"
      style={{ "--sticky-header-height": `${stickyHeaderHeight}px` } as React.CSSProperties}
    >
      <div ref={qcSentinelRef} style={{ height: "0", margin: "0" }} />
      {/* Embedded Sticky Quick Call Controls */}
      <div className={`quick-call-sticky-bar ${showQcSticky ? "is-active" : ""} ${isQcStuck ? "is-stuck" : ""}`}>
        {(() => {
          const fullSheetsList = ["All", "Jobstreet", "Jobstore", "Indeed", "Hiredly", "Bossjob", "LinkedIn", "AJobThing", "MyFutureJobs"]
          const selectedSheetIdx = fullSheetsList.indexOf(qcSelectedSheet);
          const sheetTheme = TAB_THEMES[selectedSheetIdx !== -1 ? selectedSheetIdx % TAB_THEMES.length : 0];

          return (
            <div className="sticky-bar-content">
              <div className="sticky-bar-left">
                <span className="sticky-logo" style={{ color: "#ffffff", background: "none", WebkitTextFillColor: "#ffffff" }}>
                  <PhoneIcon style={{ width: "16px", height: "16px", stroke: "#ffffff" }} />
                  Quick Call
                </span>
              </div>

              <div className="sticky-controls-group">
                {/* Sheet Selector */}
                <div className="sticky-field">
                  <label>Sheet:</label>
                  <div
                    className="sticky-value"
                    style={{
                      "--active-color": sheetTheme.activeColor,
                      "--tab-bg-gradient": sheetTheme.bgGradient,
                      "--tab-shadow": sheetTheme.shadow
                    } as React.CSSProperties}
                  >
                    <PixelCanvas
                      gap={sheetTheme.gap}
                      speed={sheetTheme.speed}
                      colors={sheetTheme.colors}
                      variant="default"
                      active={true}
                    />
                    <span style={{ position: "relative", zIndex: 10 }}>
                      {qcSelectedSheet || "-"}
                    </span>
                  </div>
                </div>

                {/* Company Selector */}
                <div className="sticky-field">
                  <label>Company:</label>
                  <div
                    className="sticky-value"
                    style={{
                      "--active-color": sheetTheme.activeColor,
                      "--tab-bg-gradient": sheetTheme.bgGradient,
                      "--tab-shadow": sheetTheme.shadow
                    } as React.CSSProperties}
                  >
                    <PixelCanvas
                      gap={sheetTheme.gap}
                      speed={sheetTheme.speed}
                      colors={sheetTheme.colors}
                      variant="default"
                      active={true}
                    />
                    <span className="sticky-company-value" title={qcCompanies[qcSelectedCompanyIdx]?.[3] || ""} style={{ position: "relative", zIndex: 10 }}>
                      {qcCompanies[qcSelectedCompanyIdx]?.[3] || "None"}
                    </span>
                  </div>
                </div>

                {/* Team Selector */}
                <div className="sticky-field">
                  <label>Team:</label>
                  <div
                    className="sticky-value"
                    style={{
                      "--active-color": sheetTheme.activeColor,
                      "--tab-bg-gradient": sheetTheme.bgGradient,
                      "--tab-shadow": sheetTheme.shadow
                    } as React.CSSProperties}
                  >
                    <PixelCanvas
                      gap={sheetTheme.gap}
                      speed={sheetTheme.speed}
                      colors={sheetTheme.colors}
                      variant="default"
                      active={true}
                    />
                    <span style={{ position: "relative", zIndex: 10 }}>
                      {qcSelectedTeam ? (qcTeams[qcSelectedTeam] ? `Team ${qcSelectedTeam}: ${qcTeams[qcSelectedTeam].join(", ")}` : `Team ${qcSelectedTeam}`) : "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Call Button */}
              <div className="sticky-call-btn-container">
                {qcSelectedTeam ? (
                  isCalling ? (
                    <button
                      type="button"
                      onClick={handleEndCall}
                      className="sheet-tab-btn active call-btn-active"
                      style={{
                        "--active-color": "#ef4444",
                        "--tab-bg-gradient": "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
                        "--tab-shadow": "rgba(239, 68, 68, 0.4)",
                        height: "38px",
                        borderRadius: "10px",
                        padding: "0 20px",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        position: "relative",
                        cursor: "pointer"
                      } as React.CSSProperties}
                    >
                      <PixelCanvas
                        gap={4}
                        speed={40}
                        colors={["#fee2e2", "#fca5a5", "#ef4444"]}
                        variant="default"
                        active={true}
                      />
                      <PhoneIcon className="call-icon-anim" style={{ width: "14px", height: "14px", position: "relative", zIndex: 10 }} />
                      <span style={{ position: "relative", zIndex: 10 }}>End Call ({formatTimer(elapsedSeconds)})</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStartCall}
                      className="sheet-tab-btn active"
                      style={{
                        "--active-color": sheetTheme.activeColor,
                        "--tab-bg-gradient": sheetTheme.bgGradient,
                        "--tab-shadow": sheetTheme.shadow,
                        height: "38px",
                        borderRadius: "10px",
                        padding: "0 20px",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        position: "relative",
                        cursor: "pointer"
                      } as React.CSSProperties}
                    >
                      <PixelCanvas
                        gap={sheetTheme.gap}
                        speed={sheetTheme.speed}
                        colors={sheetTheme.colors}
                        variant="default"
                        active={true}
                      />
                      <PhoneIcon style={{ width: "14px", height: "14px", position: "relative", zIndex: 10 }} />
                      <span style={{ position: "relative", zIndex: 10 }}>Start Call</span>
                    </button>
                  )
                ) : (
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontStyle: "italic" }}>
                    Select a team to start
                  </span>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Header with Title and Badging */}
      <div className="sheet-viewer-header">
        <div className="sheet-viewer-title">
          <FileSpreadsheetIcon className="sheet-icon-connected" style={{ color: "#a855f7" }} />
          <h3>Live Google Sheet Data</h3>
        </div>
        <div className="sheet-badges-row">
          <span className="sheet-badge">Synced Live</span>
          <span className="sheet-badge quota-badge" title="Quota metric 'Read requests' (limit 'Read requests per minute per user' of sheets.googleapis.com) for consumer project_number:201991942141" suppressHydrationWarning>
            API Read Requests: {isMounted ? requestCount : 0} / 300 (resets in {isMounted ? secondsRemaining : 60}s)
          </span>
        </div>
      </div>

      {/* Sticky Header Controls (Tabs & Search) */}
      <div className={`dashboard-sticky-header ${isHeaderStuck ? "is-stuck" : ""}`} ref={stickyHeaderRef}>
        {/* Dynamic Tab Bar */}
        {sheetsList.length > 1 && (
          <div className="sheet-tabs-bar">
            {sheetsList.map((tab, idx) => {
              const theme = TAB_THEMES[idx % TAB_THEMES.length]
              return (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`sheet-tab-btn ${activeTab === tab ? "active" : ""}`}
                  disabled={loading}
                  style={{
                    "--active-color": theme.activeColor,
                    "--tab-bg-gradient": theme.bgGradient,
                    "--tab-shadow": theme.shadow
                  } as React.CSSProperties}
                >
                  <PixelCanvas
                    gap={theme.gap}
                    speed={theme.speed}
                    colors={theme.colors}
                    variant="default"
                    active={activeTab === tab}
                    noFocus={true}
                  />
                  <span className="sheet-tab-text" style={{ position: "relative", zIndex: 10 }}>
                    {tab} <span style={{ opacity: 0.6, fontSize: "0.85em", marginLeft: "4px" }}>({tabCounts[tab] || 0})</span>
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {/* Search Bar & Duplicates Toggle Row */}
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <div className="search-bar-container" style={{ flex: 1 }}>
            <SearchIcon className="search-icon" />
            <input
              type="text"
              placeholder="Search by job title, company, salary or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <button
            className={`sheet-tab-btn ${ingestedFilter === "completed" ? "active" : ""}`}
            onClick={() => setIngestedFilter(ingestedFilter === "completed" ? "all" : "completed")}
            style={{
              "--active-color": "#22c55e",
              "--tab-bg-gradient": "linear-gradient(135deg, #22c55e 0%, #15803d 100%)",
              "--tab-shadow": "rgba(34, 197, 94, 0.25)",
              height: "44px",
              borderRadius: "12px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 16px"
            } as React.CSSProperties}
          >
            <PixelCanvas
              gap={5}
              speed={35}
              colors={["#dcfce7", "#86efac", "#22c55e"]}
              variant="default"
              active={ingestedFilter === "completed"}
              noFocus={true}
            />
            <span className="sheet-tab-text" style={{ position: "relative", zIndex: 10 }}>
              Completed: {ingestionCounts.completed}
            </span>
          </button>
          <button
            className={`sheet-tab-btn ${ingestedFilter === "uncompleted" ? "active" : ""}`}
            onClick={() => setIngestedFilter(ingestedFilter === "uncompleted" ? "all" : "uncompleted")}
            style={{
              "--active-color": "#f59e0b",
              "--tab-bg-gradient": "linear-gradient(135deg, #f59e0b 0%, #b45309 100%)",
              "--tab-shadow": "rgba(245, 158, 11, 0.25)",
              height: "44px",
              borderRadius: "12px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 16px"
            } as React.CSSProperties}
          >
            <PixelCanvas
              gap={5}
              speed={35}
              colors={["#fef3c7", "#fde047", "#f59e0b"]}
              variant="default"
              active={ingestedFilter === "uncompleted"}
              noFocus={true}
            />
            <span className="sheet-tab-text" style={{ position: "relative", zIndex: 10 }}>
              Uncompleted: {ingestionCounts.uncompleted}
            </span>
          </button>
          <button
            className={`sheet-tab-btn ${showDuplicatesOnly ? "active" : ""}`}
            onClick={() => setShowDuplicatesOnly(!showDuplicatesOnly)}
            style={{
              "--active-color": "#ef4444",
              "--tab-bg-gradient": "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
              "--tab-shadow": "rgba(239, 68, 68, 0.25)",
              height: "44px",
              borderRadius: "12px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 16px"
            } as React.CSSProperties}
          >
            <PixelCanvas
              gap={5}
              speed={35}
              colors={["#fee2e2", "#fca5a5", "#ef4444"]}
              variant="default"
              active={showDuplicatesOnly}
              noFocus={true}
            />
            <span className="sheet-tab-text" style={{ position: "relative", zIndex: 10 }}>
              Duplicates: {duplicateRowsCount}
            </span>
          </button>
        </div>
      </div>

      <div ref={sentinelRef} style={{ height: "0", margin: "0" }} />
      {/* Main Grid View / Table */}
      <div className={`sheet-table-wrapper ${loading ? "is-table-loading" : ""} ${isHeaderStuck ? "is-stuck" : ""}`}>
        <table className="sheet-table">
          <thead>
            <tr>
              <th className="col-num">No.</th>
              <th className="col-job">Source / Company / Job & by</th>
              <th className="col-meta">Salary & Location</th>
              <th className="col-contact">Contact Info</th>
              <th className="col-email">Dummy<br />Email</th>
              <th className="col-data-collection">Data<br />Collection</th>
              <th className="col-status" style={{ textAlign: "center" }}>Called</th>
              <th className="col-status" style={{ textAlign: "center" }}>Answered</th>
              <th className="col-status" style={{ textAlign: "center" }}>Accepted</th>
              <th className="col-actions">More Details</th>
            </tr>
          </thead>
          <tbody>
            {showSkeleton ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={`skeleton-${idx}`} className="sheet-row">
                  <td className="col-num" style={{ verticalAlign: "middle" }}><div className="skeleton-cell" style={{ width: "24px", height: "14px" }}></div></td>
                  <td className="col-job" style={{ verticalAlign: "middle" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div className="skeleton-cell" style={{ width: "60px", height: "14px" }}></div>
                      <div className="skeleton-cell" style={{ width: "160px", height: "16px" }}></div>
                      <div className="skeleton-cell" style={{ width: "100px", height: "12px" }}></div>
                    </div>
                  </td>
                  <td className="col-meta" style={{ verticalAlign: "middle" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div className="skeleton-cell" style={{ width: "110px", height: "14px" }}></div>
                      <div className="skeleton-cell" style={{ width: "130px", height: "12px" }}></div>
                    </div>
                  </td>
                  <td className="col-contact" style={{ verticalAlign: "middle" }}><div className="skeleton-cell" style={{ width: "90px", height: "14px" }}></div></td>
                  <td className="col-email" style={{ verticalAlign: "middle" }}><div className="skeleton-cell" style={{ width: "150px", height: "14px" }}></div></td>
                  <td className="col-data-collection" style={{ verticalAlign: "middle" }}><div className="skeleton-cell" style={{ width: "80px", height: "24px", borderRadius: "12px" }}></div></td>
                  <td className="col-status" style={{ verticalAlign: "middle" }}><div className="skeleton-cell" style={{ width: "70px", height: "24px", borderRadius: "8px", margin: "auto" }}></div></td>
                  <td className="col-status" style={{ verticalAlign: "middle" }}><div className="skeleton-cell" style={{ width: "70px", height: "24px", borderRadius: "8px", margin: "auto" }}></div></td>
                  <td className="col-status" style={{ verticalAlign: "middle" }}><div className="skeleton-cell" style={{ width: "70px", height: "24px", borderRadius: "8px", margin: "auto" }}></div></td>
                  <td className="col-actions" style={{ verticalAlign: "middle" }}><div className="skeleton-cell" style={{ width: "36px", height: "36px", borderRadius: "8px" }}></div></td>
                </tr>
              ))
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>
                  No matching job records found.
                </td>
              </tr>
            ) : (
              filteredRows.map((item, index) => {
                const row = item.data
                const sheetRowNumber = item.sheetRowNumber
                const sheetName = item.sheetName

                const dataBy = row[cols.dataBy]
                const dummyEmail = row[cols.dummyEmail]
                const companyName = row[cols.companyName]
                const jobTitle = row[cols.jobTitle]
                const location = row[cols.location]
                const salary = row[cols.salaryRange]
                const contactNo = row[cols.contactNo]
                const jobLink = row[cols.jobLink]

                const isCopied = copiedEmail === dummyEmail

                const themeIdx = sheetsList.indexOf(sheetName)
                const rowTheme = TAB_THEMES[themeIdx !== -1 ? themeIdx % TAB_THEMES.length : 0]

                return (
                  <tr key={index} className="sheet-row">
                    <td className="col-num" style={{ color: "var(--text-secondary)", fontWeight: 500 }}>
                      {index + 1}
                    </td>
                    <td className="col-job">
                      <div className="job-meta-cell">
                        <div className="badge-row-container">
                          <div className="sheet-badge-mini" style={{
                            backgroundColor: `${rowTheme.activeColor}15`,
                            color: rowTheme.activeColor,
                            border: `1px solid ${rowTheme.activeColor}30`,
                          }}>
                            {sheetName}
                          </div>
                          {companyName && companyCounts[companyName.trim().toLowerCase()] > 1 && (
                            <div className="sheet-badge-mini duplicate-badge">
                              Duplicate
                            </div>
                          )}
                        </div>
                        {(() => {
                          const getGid = (name: string) => {
                            if (!gids) return 0;
                            const cleanName = name.trim().toLowerCase();
                            const foundKey = Object.keys(gids).find(k => k.trim().toLowerCase() === cleanName);
                            if (foundKey) return gids[foundKey];
                            const values = Object.values(gids);
                            return values.length > 0 ? values[0] : 0;
                          };
                          const gid = getGid(sheetName);
                          const spreadsheetId = process.env.NEXT_PUBLIC_SPREADSHEET_ID;
                          const companyColLetter = getColumnLetter(cols.companyName)
                          const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=${gid}&range=${companyColLetter}${sheetRowNumber}`;

                          return url ? (
                            <a
                              href={url}
                              onClick={(e) => handleGoogleSheetLinkClick(e, url, `Company Name (cell ${companyColLetter}${sheetRowNumber}) inside tab "${sheetName}"`)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="job-title-text company-cell-link"
                              title={`Go to Company Name cell ${companyColLetter}${sheetRowNumber} in Google Sheets`}
                            >
                              {companyName || "Unknown Company"}
                            </a>
                          ) : (
                            <span className="job-title-text">{companyName || "Unknown Company"}</span>
                          );
                        })()}
                        <span className="company-title-text">{jobTitle || "Untitled"}</span>
                        {dataBy && (
                          <span className="data-by-text">By: {dataBy}</span>
                        )}
                        {(() => {
                          const otherSheets = companyName
                            ? (companySheets[companyName.trim().toLowerCase()] || []).filter(s => s !== sheetName)
                            : []
                          if (otherSheets.length === 0) return null
                          return (
                            <div className="badge-row-container" style={{ marginTop: "4px" }}>
                              {otherSheets.map(otherSheet => {
                                const otherThemeIdx = sheetsList.indexOf(otherSheet)
                                const otherRowTheme = TAB_THEMES[otherThemeIdx !== -1 ? otherThemeIdx % TAB_THEMES.length : 0]
                                return (
                                  <div
                                    key={otherSheet}
                                    className="sheet-badge-mini"
                                    style={{
                                      backgroundColor: `${otherRowTheme.activeColor}10`,
                                      color: `${otherRowTheme.activeColor}dd`,
                                      border: `1px dashed ${otherRowTheme.activeColor}40`,
                                    }}
                                    title={`Also exists in ${otherSheet}`}
                                  >
                                    Also in: {otherSheet}
                                  </div>
                                )
                              })}
                            </div>
                          )
                        })()}
                      </div>
                    </td>
                    <td className="col-meta">
                      <div className="job-meta-cell">
                        <span className="salary-text">{salary || "N/A"}</span>
                        <span className="location-text">{location || "N/A"}</span>
                      </div>
                    </td>
                    <td className="col-contact">
                      <span className="contact-phone">{contactNo || "-"}</span>
                    </td>
                    <td className="col-email">
                      {dummyEmail ? (
                        <div className="email-copy-wrapper">
                          <span className="contact-email">{dummyEmail}</span>
                          <button
                            onClick={() => handleCopyEmail(dummyEmail)}
                            className={`copy-email-btn ${isCopied ? "is-copied" : ""}`}
                            title={isCopied ? "Copied!" : "Copy Email"}
                          >
                            {isCopied ? (
                              <CheckIcon className="copy-btn-icon" style={{ color: "#22c55e" }} />
                            ) : (
                              <CopyIcon className="copy-btn-icon" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span>-</span>
                      )}
                    </td>
                    <td className="col-data-collection">
                      {(() => {
                        const isCompleted = row[cols.ingested]
                          ? row[cols.ingested].toLowerCase() === "complete"
                          : (
                            !!(dummyEmail && dummyEmail.trim()) &&
                            !!(companyName && companyName.trim()) &&
                            !!(jobTitle && jobTitle.trim()) &&
                            !!(row[cols.jobDescription] && row[cols.jobDescription].trim()) &&
                            !!(location && location.trim()) &&
                            !!(row[cols.fullPartTime] && row[cols.fullPartTime].trim()) &&
                            !!(salary && salary.trim()) &&
                            !!(contactNo && contactNo.trim())
                          );

                        const missingFields = [];
                        if (!dummyEmail || !dummyEmail.trim()) missingFields.push("Dummy Email");
                        if (!companyName || !companyName.trim()) missingFields.push("Company Name");
                        if (!jobTitle || !jobTitle.trim()) missingFields.push("Job Title");
                        if (!row[cols.jobDescription] || !row[cols.jobDescription].trim()) missingFields.push("Job Description");
                        if (!location || !location.trim()) missingFields.push("Location");
                        if (!row[cols.fullPartTime] || !row[cols.fullPartTime].trim()) missingFields.push("Full/Partime");
                        if (!salary || !salary.trim()) missingFields.push("Salary Range");
                        if (!contactNo || !contactNo.trim()) missingFields.push("Contact No");

                        const fieldToColLetter: Record<string, string> = {
                          "Dummy Email": getColumnLetter(cols.dummyEmail),
                          "Company Name": getColumnLetter(cols.companyName),
                          "Job Title": getColumnLetter(cols.jobTitle),
                          "Job Description": getColumnLetter(cols.jobDescription),
                          "Location": getColumnLetter(cols.location),
                          "Full/Partime": getColumnLetter(cols.fullPartTime),
                          "Salary Range": getColumnLetter(cols.salaryRange),
                          "Contact No": getColumnLetter(cols.contactNo)
                        };

                        return (
                          <div className="status-ingested-cell">
                            <span className={`status-badge-static ${isCompleted ? "status-yes" : "status-no"}`}>
                              {isCompleted ? "Completed" : "Uncompleted"}
                            </span>
                            {!isCompleted && missingFields.length > 0 && (
                              <span className="missing-fields-text">
                                Missing:{" "}
                                {missingFields.map((field, fIdx) => {
                                  const colLetter = fieldToColLetter[field];
                                  const getGid = (name: string) => {
                                    if (!gids) return 0;
                                    const cleanName = name.trim().toLowerCase();
                                    const foundKey = Object.keys(gids).find(k => k.trim().toLowerCase() === cleanName);
                                    if (foundKey) return gids[foundKey];
                                    const values = Object.values(gids);
                                    return values.length > 0 ? values[0] : 0;
                                  };
                                  const gid = getGid(sheetName);
                                  const spreadsheetId = process.env.NEXT_PUBLIC_SPREADSHEET_ID;
                                  const url = colLetter
                                    ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=${gid}&range=${colLetter}${sheetRowNumber}`
                                    : undefined;

                                  return (
                                    <React.Fragment key={field}>
                                      {fIdx > 0 && ", "}
                                      {url ? (
                                        <a
                                          href={url}
                                          onClick={(e) => handleGoogleSheetLinkClick(e, url, `"${field}" (cell ${colLetter}${sheetRowNumber}) inside tab "${sheetName}"`)}
                                          className="missing-field-link"
                                          title={`Go to cell ${colLetter}${sheetRowNumber} in Google Sheets`}
                                        >
                                          {field}
                                        </a>
                                      ) : (
                                        field
                                      )}
                                    </React.Fragment>
                                  );
                                })}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="col-status" style={{ textAlign: "center" }}>
                      {renderStatusSelector(row[cols.called], sheetRowNumber, "called", sheetName, companyName)}
                    </td>
                    <td className="col-status" style={{ textAlign: "center" }}>
                      {renderStatusSelector(row[cols.callAnswered], sheetRowNumber, "answered", sheetName)}
                    </td>
                    <td className="col-status" style={{ textAlign: "center" }}>
                      {renderStatusSelector(row[cols.acceptOnboard], sheetRowNumber, "accepted", sheetName)}
                    </td>
                    <td className="col-actions">
                      <div className="action-buttons-cell">
                        <button
                          onClick={() => setSelectedJob(row)}
                          className="table-action-btn view-btn"
                          title="View Details"
                        >
                          <InfoIcon className="table-btn-icon" />
                        </button>
                        {jobLink && (
                          <a
                            href={jobLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="table-action-btn link-btn"
                            title="Open Job Link"
                          >
                            <ExternalLinkIcon className="table-btn-icon" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Detail Drawer - Standardized to Centered Dialog */}
      {isMounted && selectedJob && createPortal(
        <div className="confirm-overlay" onClick={() => setSelectedJob(null)}>
          <div className="confirm-modal confirm-modal-detail" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "550px" }}>
            <div className="confirm-header" style={{ paddingBottom: "1rem" }}>
              <h4 style={{ display: "flex", flexDirection: "column", gap: "4px", color: "var(--text-primary)", fontSize: "1.15rem", fontWeight: 600 }}>
                <span>{selectedJob[cols.jobTitle]}</span>
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 400 }}>{selectedJob[cols.companyName]}</span>
              </h4>
            </div>

            <div className="confirm-body" style={{ maxHeight: "60vh", overflowY: "auto" }}>
              <div className="detail-cards-grid">
                {/* Row 1: 2 cards */}
                <div className="detail-card-row-2">
                  <div className="detail-card">
                    <BriefcaseIcon className="detail-card-icon" />
                    <div>
                      <span>Job Type</span>
                      <strong>{selectedJob[cols.fullPartTime] || "Full Time"}</strong>
                    </div>
                  </div>
                  <div className="detail-card">
                    <DollarSignIcon className="detail-card-icon" />
                    <div>
                      <span>Salary Range</span>
                      <strong>{selectedJob[cols.salaryRange] || "N/A"}</strong>
                    </div>
                  </div>
                </div>

                {/* Row 2: 2 cards */}
                <div className="detail-card-row-2">
                  <div className="detail-card">
                    <MapPinIcon className="detail-card-icon" />
                    <div>
                      <span>Location</span>
                      <strong>{selectedJob[cols.location] || "N/A"}</strong>
                    </div>
                  </div>
                  <div className="detail-card">
                    <PhoneIcon className="detail-card-icon" />
                    <div>
                      <span>Assignment Contact</span>
                      <strong>{selectedJob[cols.contactNo] || "-"}</strong>
                    </div>
                  </div>
                </div>

                {/* Row 3: 1 big card */}
                <div className="detail-card detail-card-big">
                  <h3 className="detail-card-title">Job Description</h3>
                  <div className="detail-card-content">
                    {selectedJob[cols.jobDescription]?.split("\n").map((line, i) => (
                      <p key={i} style={{ marginBottom: "0.5rem" }}>{line}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="confirm-footer" style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
              <button
                className="btn-confirm-cancel"
                onClick={() => setSelectedJob(null)}
              >
                Close
              </button>
              {selectedJob[cols.jobLink] && (
                <a
                  href={selectedJob[cols.jobLink]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-confirm-yes"
                  style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}
                >
                  Apply & View Original Post
                </a>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Floating Back to Top Button */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="back-to-top-btn"
          aria-label="Back to top"
        >
          <ArrowUpIcon className="back-to-top-btn-icon" />
        </button>
      )}

      {/* Database Warning Confirmation Modal */}
      {isMounted && pendingConfirm && createPortal(
        <div className="confirm-overlay" onClick={() => setPendingConfirm(null)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-header">
              <h4>{pendingConfirm.title}</h4>
            </div>
            <div className="confirm-body">
              <p>{pendingConfirm.message}</p>
            </div>
            <div className="confirm-footer">
              <button
                className="btn-confirm-cancel"
                onClick={() => setPendingConfirm(null)}
              >
                No, Cancel
              </button>
              <button
                className="btn-confirm-yes"
                onClick={() => {
                  pendingConfirm.onConfirm()
                  setPendingConfirm(null)
                }}
              >
                Yes, Proceed
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Call Details Input Confirmation Modal */}
      {isMounted && showCallDetailsModal && (() => {
        const selectedRow = qcSelectedCompanyIdx >= 0 && qcSelectedCompanyIdx < qcCompanies.length ? qcCompanies[qcSelectedCompanyIdx] : null;
        if (!selectedRow) return null;

        return createPortal(
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
        );
      })()}
    </div>
  )
}
