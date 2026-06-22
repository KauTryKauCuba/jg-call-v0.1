import { getSheetData, getSpreadsheetSheets } from "@/app/actions/sheets"
import LeadsDashboardView from "@/components/ui/LeadsDashboardView"

export const dynamic = "force-dynamic"

export default async function CompletedLeadsPage() {
  const [listResult, dataResult] = await Promise.all([
    getSpreadsheetSheets(),
    getSheetData("All")
  ])

  if (!dataResult.success || !dataResult.data) {
    return (
      <div className="app-container" style={{ padding: "2rem", display: "flex", justifyContent: "center" }}>
        <div className="sheet-error-card" style={{ maxWidth: "540px", width: "100%" }}>
          <h3>Failed to load completed leads</h3>
          <p className="sheet-error-msg">{dataResult.error || "Please make sure your session and configuration are valid."}</p>
        </div>
      </div>
    )
  }

  return (
    <LeadsDashboardView 
      activeFilter="completed" 
      listResult={listResult} 
      dataResult={dataResult} 
    />
  )
}
