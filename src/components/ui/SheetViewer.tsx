import * as React from "react"
import { getSheetData, getSpreadsheetSheets } from "@/app/actions/sheets"
import { AlertTriangleIcon } from "lucide-react"
import SheetTable from "./SheetTable"

interface SheetViewerProps {
  listResult?: {
    success: boolean
    setupPending?: boolean
    sheets?: string[]
    gids?: Record<string, number>
    error?: string
  }
  dataResult?: {
    success: boolean
    setupPending?: boolean
    data?: string[][]
    activeSheet?: string
    requestCount?: number
    error?: string
  }
  initialFilter?: string
}

export default async function SheetViewer({ listResult, dataResult, initialFilter }: SheetViewerProps) {
  const finalListResult = listResult || await getSpreadsheetSheets()
  const finalDataResult = dataResult || await getSheetData("All")
  
  const listResultVal = finalListResult
  const dataResultVal = finalDataResult

  const hasSetupError = (!listResultVal.success && listResultVal.setupPending) || (!dataResultVal.success && dataResultVal.setupPending)
  const errorMsg = listResultVal.error || dataResultVal.error

  if (!listResultVal.success || !dataResultVal.success) {
    return (
      <div className="sheet-error-card">
        <div className="sheet-error-header">
          <AlertTriangleIcon className="sheet-icon-error" />
          <h3>Google Sheets Connection Pending</h3>
        </div>
        
        {hasSetupError ? (
          <div className="sheet-setup-guide">
            <p className="sheet-guide-intro">
              We detected a placeholder configuration. Follow these 4 simple steps to connect your live Google Sheet:
            </p>
            <ol className="sheet-steps-list">
              <li>
                <strong>Download JSON Key:</strong> Go to Google Cloud Keys Console, click <strong>Add key</strong>, create a <strong>JSON key</strong>, rename it to <code>credentials.json</code>, and replace the placeholder in your project root.
              </li>
              <li>
                <strong>Enable API:</strong> Make sure the <strong>Google Sheets API</strong> is enabled in your GCP project.
              </li>
              <li>
                <strong>Share Sheet:</strong> Share your target Google Sheet with your service account email: <code className="sheet-code-highlight">jg-call@jg-call.iam.gserviceaccount.com</code> (give it <strong>Viewer</strong> access).
              </li>
              <li>
                <strong>Set Environment Variable:</strong> Update the sheet ID inside <code className="sheet-code-highlight">.env.local</code>.
              </li>
            </ol>
          </div>
        ) : (
          <p className="sheet-error-msg">{errorMsg || "Failed to load sheets data."}</p>
        )}
      </div>
    )
  }

  // Prepend "All" tab to the list of spreadsheets
  const sheetsList = ["All", ...(listResultVal.sheets || [])]
  const initialRows = dataResultVal.data || []
  const initialSheetName = dataResultVal.activeSheet || "All"
  const spreadsheetId = process.env.NEXT_PUBLIC_SPREADSHEET_ID || ""

  return (
    <div className="sheet-viewer-container">
      <SheetTable 
        key={initialFilter || "all"}
        initialRows={initialRows} 
        sheetsList={sheetsList}
        initialSheetName={initialSheetName}
        gids={listResultVal.gids}
        initialRequestCount={dataResultVal.requestCount || 0}
        spreadsheetId={spreadsheetId}
        initialFilter={initialFilter}
      />
    </div>
  )
}
