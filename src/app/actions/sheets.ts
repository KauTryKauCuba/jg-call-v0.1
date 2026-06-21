"use server"

import fs from "fs"
import path from "path"
import { google } from "googleapis"
import { cookies } from "next/headers"

export interface SheetDataResult {
  success: boolean
  data?: string[][]
  error?: string
  setupPending?: boolean
  activeSheet?: string
  requestCount?: number
  nextResetTime?: number
}

interface GoogleCredentials {
  client_email: string
  private_key: string
}

// In-memory Cache structures
interface CacheEntry<T> {
  data: T
  timestamp: number
}

// Helper to verify session pincode
async function verifySession() {
  const cookieStore = await cookies()
  const session = cookieStore.get("jg_session")?.value
  if (session !== "70861GA_verified") {
    throw new Error("Unauthorized: Invalid PIN code session.")
  }
}

const dataCache: Record<string, CacheEntry<string[][]>> = {}
let sheetsListCache: CacheEntry<string[]> | null = null
let gidsCache: Record<string, number> = {}

let rawSheetsMetadataCache: CacheEntry<{
  titles: string[]
  gids: Record<string, number>
}> | null = null

let scriptDataCache: CacheEntry<ScriptStep[]> | null = null

async function getCachedSpreadsheetMetadata(
  sheets: ReturnType<typeof getSheetsClient>,
  spreadsheetId: string
): Promise<{ titles: string[]; gids: Record<string, number> }> {
  const now = Date.now()
  if (rawSheetsMetadataCache && now - rawSheetsMetadataCache.timestamp < CACHE_TTL_LIST) {
    return rawSheetsMetadataCache.data
  }

  incrementApiCount()
  const response = await sheets.spreadsheets.get({
    spreadsheetId,
  })

  const titles: string[] = []
  const gids: Record<string, number> = {}

  response.data.sheets?.forEach(s => {
    if (s.properties?.title) {
      const title = s.properties.title
      titles.push(title)
      if (s.properties.sheetId !== undefined && s.properties.sheetId !== null) {
        gids[title] = s.properties.sheetId
      }
    }
  })

  const data = { titles, gids }
  rawSheetsMetadataCache = {
    data,
    timestamp: now
  }
  return data
}


import { getColumnIndices, getColumnLetter, getCombinedHeader, type ColumnIndices } from "@/utils/columnMapper"
export { type ColumnIndices, getColumnIndices, getColumnLetter, getCombinedHeader }

const colIndicesCache: Record<string, ColumnIndices> = {}

// Store quota state on global to survive Next.js HMR module re-evaluations.
// Uses minute-boundary windows — no interval needed, no drift, no orphaned timers.
interface ApiQuotaState {
  window: number
  count: number
}
const g = global as unknown as { _apiQuota?: ApiQuotaState }
if (!g._apiQuota) {
  g._apiQuota = { window: -1, count: 0 }
}

function incrementApiCount() {
  const currentWindow = Math.floor(Date.now() / 60000)
  const quota = g._apiQuota
  if (quota) {
    if (quota.window !== currentWindow) {
      quota.window = currentWindow
      quota.count = 0
    }
    quota.count++
  }
}

export async function getApiQuotaState(): Promise<{ requestCount: number; nextResetTime: number }> {
  const now = Date.now()
  const currentWindow = Math.floor(now / 60000)
  const quota = g._apiQuota
  if (quota) {
    if (quota.window !== currentWindow) {
      quota.window = currentWindow
      quota.count = 0
    }
  }
  return {
    requestCount: g._apiQuota?.count || 0,
    nextResetTime: (currentWindow + 1) * 60000
  }
}

const CACHE_TTL_DATA = 45000 // 45 seconds cache for data
const CACHE_TTL_LIST = 60000 // 60 seconds cache for sheets metadata

// Fetch auth client
function getSheetsClient(credentials: GoogleCredentials) {
  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  })
  return google.sheets({ version: "v4", auth })
}

export async function getSpreadsheetSheets(): Promise<{
  success: boolean;
  sheets?: string[];
  gids?: Record<string, number>;
  error?: string;
  setupPending?: boolean
  nextResetTime?: number
}> {
  try {
    await verifySession()
    const now = Date.now()
    if (sheetsListCache && now - sheetsListCache.timestamp < CACHE_TTL_LIST) {
      return { success: true, sheets: sheetsListCache.data, gids: gidsCache }
    }

    const credentialsPath = path.join(process.cwd(), "credentials.json")
    if (!fs.existsSync(credentialsPath)) {
      return { success: false, setupPending: true, error: "credentials.json missing." }
    }
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf8"))
    const spreadsheetId = process.env.NEXT_PUBLIC_SPREADSHEET_ID
    if (!spreadsheetId) {
      return { success: false, setupPending: true, error: "Spreadsheet ID missing." }
    }
    const sheets = getSheetsClient(credentials)
    const metadata = await getCachedSpreadsheetMetadata(sheets, spreadsheetId)

    const titles: string[] = []
    const gids: Record<string, number> = {}

    metadata.titles.forEach(title => {
      const titleLower = title.toLowerCase().trim()
      if (titleLower === "team" || titleLower === "script") {
        return // Exclude system sheets
      }
      titles.push(title)
      if (metadata.gids[title] !== undefined) {
        gids[title] = metadata.gids[title]
      }
    })

    sheetsListCache = {
      data: titles,
      timestamp: now
    }
    gidsCache = gids

    return { success: true, sheets: titles, gids }
  } catch (error: unknown) {
    console.error("Failed to get sheet list:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch spreadsheet tabs." }
  }
}
async function syncIngestedStatusInSheet(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string,
  sheetName: string,
  rows: string[][]
): Promise<string[][]> {
  const combinedHeader = getCombinedHeader(rows)
  const cols = getColumnIndices(combinedHeader)

  colIndicesCache[sheetName] = cols

  const dataToUpdate: { range: string; values: string[][] }[] = []
  const updatedRows = rows.map((row, idx) => {
    if (idx < 2) return row // skip headers

    const newRow = [...row]

    const dummyEmail = newRow[cols.dummyEmail]
    const companyName = newRow[cols.companyName]
    const jobTitle = newRow[cols.jobTitle]
    const jobDescription = newRow[cols.jobDescription]
    const location = newRow[cols.location]
    const fullPartTime = newRow[cols.fullPartTime]
    const salaryRange = newRow[cols.salaryRange]
    const contactNo = newRow[cols.contactNo]

    const isCompleted =
      !!(dummyEmail && dummyEmail.trim()) &&
      !!(companyName && companyName.trim()) &&
      !!(jobTitle && jobTitle.trim()) &&
      !!(jobDescription && jobDescription.trim()) &&
      !!(location && location.trim()) &&
      !!(fullPartTime && fullPartTime.trim()) &&
      !!(salaryRange && salaryRange.trim()) &&
      !!(contactNo && contactNo.trim())

    const expectedValue = isCompleted ? "Complete" : "Uncomplete"
    const currentValue = newRow[cols.ingested]

    if (currentValue !== expectedValue) {
      while (newRow.length <= cols.ingested) {
        newRow.push("")
      }
      newRow[cols.ingested] = expectedValue
      dataToUpdate.push({
        range: `'${sheetName}'!${getColumnLetter(cols.ingested)}${idx + 1}`,
        values: [[expectedValue]]
      })
    }
    return newRow
  })

  if (dataToUpdate.length > 0) {
    try {
      incrementApiCount()
      // Run the update in the background (asynchronous) without awaiting it
      sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: {
          valueInputOption: "RAW",
          data: dataToUpdate
        }
      }).then(() => {
        console.log(`Successfully synced ${dataToUpdate.length} ingested status fields to Google Sheets in background for sheet "${sheetName}".`)
      }).catch(err => {
        console.error(`Failed batch updating ingested status in background for sheet ${sheetName}:`, err)
      })
    } catch (err) {
      console.error(`Failed initiating background update for sheet ${sheetName}:`, err)
    }
  }

  return updatedRows
}

export async function getSheetData(sheetName?: string): Promise<SheetDataResult> {
  try {
    await verifySession()
    const targetSheet = sheetName || "All"
    const now = Date.now()

    // Serve from cache if valid
    if (dataCache[targetSheet] && now - dataCache[targetSheet].timestamp < CACHE_TTL_DATA) {
      return {
        success: true,
        data: dataCache[targetSheet].data,
        activeSheet: targetSheet,
        requestCount: g._apiQuota?.count || 0,
        nextResetTime: (Math.floor(now / 60000) + 1) * 60000,
      }
    }

    const credentialsPath = path.join(process.cwd(), "credentials.json")

    if (!fs.existsSync(credentialsPath)) {
      return {
        success: false,
        setupPending: true,
        error: "credentials.json file is missing in the project root."
      }
    }

    const credentialsContent = fs.readFileSync(credentialsPath, "utf8")
    const credentials = JSON.parse(credentialsContent)

    if (credentials.private_key && credentials.private_key.includes("PLACEHOLDER")) {
      return {
        success: false,
        setupPending: true,
        error: "credentials.json is configured with a placeholder private key."
      }
    }

    const spreadsheetId = process.env.NEXT_PUBLIC_SPREADSHEET_ID
    if (!spreadsheetId || spreadsheetId.trim() === "") {
      return {
        success: false,
        setupPending: true,
        error: "NEXT_PUBLIC_SPREADSHEET_ID environment variable is missing."
      }
    }

    const sheets = getSheetsClient(credentials)

    const metadata = await getCachedSpreadsheetMetadata(sheets, spreadsheetId)
    const sheetsList = metadata.titles.filter(title => {
      const lower = title.toLowerCase().trim()
      return lower !== "team" && lower !== "script"
    })

    if (metadata.titles.length === 0) {
      return { success: false, error: "No sheets found in the spreadsheet." }
    }

    if (targetSheet === "All" || targetSheet === "Duplicates") {
      // Fetch all sheets in a single batch request
      incrementApiCount()
      const ranges = sheetsList.map(name => `'${name}'!A1:Z100`)
      const response = await sheets.spreadsheets.values.batchGet({
        spreadsheetId,
        ranges,
      })

      const valueRanges = response.data.valueRanges || []
      const fetchPromises = sheetsList.map(async (name, index) => {
        const valRange = valueRanges[index]
        let rows = valRange?.values || []
        if (rows.length > 0) {
          rows = await syncIngestedStatusInSheet(sheets, spreadsheetId, name, rows)
        }
        return { name, rows }
      })

      const results = await Promise.all(fetchPromises)

      // Find first sheet that has rows to get the headers
      const firstWithData = results.find(r => r.rows.length > 0)
      if (!firstWithData) {
        return {
          success: true,
          data: [],
          activeSheet: targetSheet,
        }
      }

      // Headers (first 2 rows of first sheet with data)
      const masterCombinedHeader = getCombinedHeader(firstWithData.rows)
      const masterCols = getColumnIndices(masterCombinedHeader)

      const headers = firstWithData.rows.slice(0, 2)
      let combinedRows: string[][] = [...headers]

      for (const result of results) {
        const dataRows = result.rows.slice(2)
        const sheetCombinedHeader = getCombinedHeader(result.rows)
        const sheetCols = getColumnIndices(sheetCombinedHeader)

        // For each data row, align to masterCols layout
        dataRows.forEach((row, idx) => {
          if (!row || row.length === 0) return

          const alignedRow = new Array(22).fill("")

          const keys = [
            "dataBy", "dummyEmail", "companyName", "jobTitle", "jobDescription",
            "location", "fullPartTime", "salaryRange", "contactNo", "ingested",
            "called", "calledBy", "callAnswered", "accepted", "acceptOnboard",
            "companyEmail", "reasonReject", "jobLink"
          ] as const;

          keys.forEach(key => {
            const masterIdx = masterCols[key]
            const sheetIdx = sheetCols[key]
            if (masterIdx !== undefined && sheetIdx !== undefined && sheetIdx < row.length) {
              alignedRow[masterIdx] = row[sheetIdx] || ""
            }
          })

          alignedRow[20] = result.name
          alignedRow[21] = String(idx + 3) // 1-based index (data begins at row 3 after headers)
          combinedRows.push(alignedRow)
        })
      }

      if (targetSheet === "Duplicates") {
        const companyCounts: Record<string, number> = {}
        const dataRowsOnly = combinedRows.slice(2)

        dataRowsOnly.forEach(row => {
          const company = (row[masterCols.companyName] || "").trim().toLowerCase()
          if (company) {
            companyCounts[company] = (companyCounts[company] || 0) + 1
          }
        })

        const duplicateRows = dataRowsOnly.filter(row => {
          const company = (row[masterCols.companyName] || "").trim().toLowerCase()
          return company && companyCounts[company] > 1
        })

        combinedRows = [...headers, ...duplicateRows]
      }

      dataCache[targetSheet] = {
        data: combinedRows,
        timestamp: now
      }

      return {
        success: true,
        data: combinedRows,
        activeSheet: targetSheet,
        requestCount: g._apiQuota?.count || 0,
        nextResetTime: (Math.floor(now / 60000) + 1) * 60000,
      }
    } else {
      // Individual sheet fetch
      const range = `'${targetSheet}'!A1:Z100`
      incrementApiCount()
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      })

      let rows = response.data.values
      if (!rows || rows.length === 0) {
        return {
          success: true,
          data: [],
          activeSheet: targetSheet,
        }
      }

      // Sync the Ingested status in column K in Google Sheets
      if (targetSheet.toLowerCase().trim() !== "team") {
        rows = await syncIngestedStatusInSheet(sheets, spreadsheetId, targetSheet, rows)
      }

      // Append metadata to this sheet's rows too for consistency
      const processedRows = rows.map((row, idx) => {
        if (idx < 2) return row // Don't append metadata to headers
        const newRow = [...row]
        while (newRow.length < 20) {
          newRow.push("")
        }
        newRow[20] = targetSheet!
        newRow[21] = String(idx + 1) // 1-based index for sheets.values
        return newRow
      })

      dataCache[targetSheet] = {
        data: processedRows,
        timestamp: now
      }

      return {
        success: true,
        data: processedRows,
        activeSheet: targetSheet,
        requestCount: g._apiQuota?.count || 0,
        nextResetTime: (Math.floor(now / 60000) + 1) * 60000,
      }
    }
  } catch (error: unknown) {
    console.error("Google Sheets API error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch data from Google Sheets."
    }
  }
}

export async function updateRowStatus(
  sheetRowNumber: number,
  columnGroup: "called" | "answered" | "accepted",
  newValue: "Yes" | "No" | "Pending",
  sheetName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const credentialsPath = path.join(process.cwd(), "credentials.json")
    if (!fs.existsSync(credentialsPath)) {
      return { success: false, error: "Credentials file missing." }
    }

    const credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf8"))
    const spreadsheetId = process.env.NEXT_PUBLIC_SPREADSHEET_ID

    if (!spreadsheetId) {
      return { success: false, error: "Spreadsheet ID is missing." }
    }

    const sheets = getSheetsClient(credentials)

    const cols = colIndicesCache[sheetName] || {
      called: 11,
      calledBy: 12,
      callAnswered: 13,
      acceptOnboard: 14,
      companyEmail: 15,
      reasonReject: 16
    }

    let colLetter = ""
    if (columnGroup === "called") {
      colLetter = getColumnLetter(cols.called)
    } else if (columnGroup === "answered") {
      colLetter = getColumnLetter(cols.callAnswered)
    } else if (columnGroup === "accepted") {
      colLetter = getColumnLetter(cols.acceptOnboard)
    }

    const colRange = `'${sheetName}'!${colLetter}${sheetRowNumber}`
    const values = [[newValue === "Pending" ? "Not Yet" : newValue]]

    incrementApiCount()
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: colRange,
      valueInputOption: "RAW",
      requestBody: { values }
    })

    // Invalidate caches to guarantee fresh reads after update
    delete dataCache[sheetName]
    delete dataCache["All"]
    delete dataCache["Duplicates"]
    sheetsListCache = null
    rawSheetsMetadataCache = null
    scriptDataCache = null

    return { success: true }
  } catch (error: unknown) {
    console.error("Google Sheets Update Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update cell."
    }
  }
}

export async function saveCallRecord(
  sheetRowNumber: number,
  sheetName: string,
  calledStatus: "Yes" | "No",
  answeredStatus: "Yes" | "No",
  calledByValue: string,
  acceptOnboard?: "Yes" | "No" | "",
  companyEmail?: string,
  reasonReject?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await verifySession()
    const credentialsPath = path.join(process.cwd(), "credentials.json")
    if (!fs.existsSync(credentialsPath)) {
      return { success: false, error: "Credentials file missing." }
    }

    const credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf8"))
    const spreadsheetId = process.env.NEXT_PUBLIC_SPREADSHEET_ID

    if (!spreadsheetId) {
      return { success: false, error: "Spreadsheet ID is missing." }
    }

    const sheets = getSheetsClient(credentials)

    const cols = colIndicesCache[sheetName] || {
      called: 11,
      calledBy: 12,
      callAnswered: 13,
      acceptOnboard: 14,
      companyEmail: 15,
      reasonReject: 16
    }

    const startCol = getColumnLetter(cols.called)
    const endCol = getColumnLetter(cols.reasonReject !== undefined ? cols.reasonReject : 16)
    const colRange = `'${sheetName}'!${startCol}${sheetRowNumber}:${endCol}${sheetRowNumber}`
    const values = [[
      calledStatus,
      calledByValue,
      answeredStatus,
      acceptOnboard || "",
      companyEmail || "",
      reasonReject || ""
    ]]

    incrementApiCount()
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: colRange,
      valueInputOption: "RAW",
      requestBody: { values }
    })

    // Invalidate caches to guarantee fresh reads after update
    delete dataCache[sheetName]
    delete dataCache["All"]
    delete dataCache["Duplicates"]
    sheetsListCache = null
    rawSheetsMetadataCache = null
    scriptDataCache = null

    return { success: true }
  } catch (error: unknown) {
    console.error("Google Sheets Save Call Record Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save call record."
    }
  }
}

export interface ScriptStep {
  badge: string
  text: string
  theme: 'script-teal' | 'script-gold'
}

export async function getScriptData(): Promise<{ success: boolean; data?: ScriptStep[]; error?: string }> {
  try {
    await verifySession()
    const now = Date.now()
    if (scriptDataCache && now - scriptDataCache.timestamp < CACHE_TTL_LIST) {
      return { success: true, data: scriptDataCache.data }
    }

    const credentialsPath = path.join(process.cwd(), "credentials.json")
    if (!fs.existsSync(credentialsPath)) {
      return { success: false, error: "credentials.json file is missing." }
    }
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf8"))
    const spreadsheetId = process.env.NEXT_PUBLIC_SPREADSHEET_ID
    if (!spreadsheetId) {
      return { success: false, error: "NEXT_PUBLIC_SPREADSHEET_ID missing." }
    }
    const sheets = getSheetsClient(credentials)

    // Check sheet list to see if 'script' tab exists
    const metadata = await getCachedSpreadsheetMetadata(sheets, spreadsheetId)
    const exactScriptName = metadata.titles.find(t => t.toLowerCase().trim() === "script")

    if (!exactScriptName) {
      return { success: false, error: "Sheet named 'script' not found in spreadsheet." }
    }

    incrementApiCount()
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${exactScriptName}'!A1:C50`,
    })

    const rows = response.data.values || []
    if (rows.length === 0) {
      scriptDataCache = { data: [], timestamp: now }
      return { success: true, data: [] }
    }

    // Check for header row
    let startIndex = 0
    const firstRow = rows[0].map(c => String(c).toLowerCase().trim())
    const hasHeader = firstRow.some(cell => cell.includes("badge") || cell.includes("step") || cell.includes("text") || cell.includes("script") || cell.includes("content"))
    if (hasHeader) {
      startIndex = 1
    }

    const scriptSteps: ScriptStep[] = []
    for (let i = startIndex; i < rows.length; i++) {
      const row = rows[i]
      if (!row || row.length === 0) continue

      const badge = String(row[0] || "").trim()
      const text = String(row[1] || "").trim()
      if (!badge && !text) continue

      // Determine theme: alternate by default unless the third column specifies it
      let theme: 'script-teal' | 'script-gold' = (scriptSteps.length % 2 === 0) ? 'script-teal' : 'script-gold'
      if (row[2]) {
        const customTheme = String(row[2]).toLowerCase().trim()
        if (customTheme.includes("gold") || customTheme.includes("yellow") || customTheme.includes("orange")) {
          theme = 'script-gold'
        } else if (customTheme.includes("teal") || customTheme.includes("blue") || customTheme.includes("green")) {
          theme = 'script-teal'
        }
      }

      scriptSteps.push({
        badge: badge.toUpperCase(),
        text,
        theme
      })
    }

    scriptDataCache = {
      data: scriptSteps,
      timestamp: now
    }

    return { success: true, data: scriptSteps }
  } catch (error: unknown) {
    console.error("Failed to fetch script data:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch script data." }
  }
}


