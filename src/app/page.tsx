import QuickCallWidget from "@/components/ui/QuickCallWidget";
import SheetViewer from "@/components/ui/SheetViewer";
import { getSheetData, getSpreadsheetSheets, getColumnIndices, getCombinedHeader, getScriptData } from "@/app/actions/sheets";
import { BriefcaseIcon, CheckIcon, PhoneIcon, ExternalLinkIcon } from "lucide-react";
import ColdCallScript from "@/components/ui/ColdCallScript";
import LogoutCard from "@/components/ui/LogoutCard";

export const dynamic = "force-dynamic"

export default async function Home() {
  // Preload all data on the server in parallel
  const [listResult, dataResult, teamResult, scriptResult] = await Promise.all([
    getSpreadsheetSheets(),
    getSheetData("All"),
    getSheetData("team"),
    getScriptData()
  ])

  // Extract sheets list
  const initialSheets = (listResult.sheets || []).filter(
    (s: string) => s !== "All" && s !== "Duplicates"
  )
  const initialAllRows = dataResult.data || []

  // Extract and map team members
  const initialTeams: Record<string, string[]> = {}
  if (teamResult.success && teamResult.data) {
    const teamRows = teamResult.data.slice(2)
    let currentTeam = ""
    teamRows.forEach(row => {
      if (row[0] && row[0].trim() !== "") {
        currentTeam = row[0].trim()
      }
      if (row[1] && row[1].trim() !== "") {
        if (!initialTeams[currentTeam]) {
          initialTeams[currentTeam] = []
        }
        initialTeams[currentTeam].push(row[1].trim())
      }
    })
  }

  // Calculate statistics from sheet data
  const combinedHeader = getCombinedHeader(initialAllRows)
  const cols = getColumnIndices(combinedHeader)
  const dataRows = initialAllRows.slice(2)

  const totalLeads = dataRows.filter(row => row && row[cols.companyName]).length
  
  const completedLeads = dataRows.filter(row => {
    const status = row[cols.ingested]?.toLowerCase()?.trim()
    return status === "complete"
  }).length

  const calledLeads = dataRows.filter(row => {
    const status = row[cols.called]?.toLowerCase()?.trim()
    return status === "yes"
  }).length

  const onboardedLeads = dataRows.filter(row => {
    const status = row[cols.acceptOnboard]?.toLowerCase()?.trim()
    return status === "yes"
  }).length

  return (
    <div className="app-container">
      {/* Top Header Section: Split into Cards */}
      <div className="top-grid-container">
        {/* Left Side: 5 Cards Grid */}
        <div className="branding-cards-grid">
          <LogoutCard />
          {/* Row 1: 2 small cards */}
          <div className="branding-card-row">
            <div className="card branding-small-card">
              <div className="branding-icon-wrapper leads">
                <BriefcaseIcon className="branding-card-icon" />
              </div>
              <div>
                <h2>{totalLeads}</h2>
                <p>Total Leads</p>
              </div>
            </div>
            <div className="card branding-small-card">
              <div className="branding-icon-wrapper completed">
                <CheckIcon className="branding-card-icon" />
              </div>
              <div>
                <h2>{completedLeads}</h2>
                <p>Completed</p>
              </div>
            </div>
          </div>

          {/* Row 2: 2 small cards */}
          <div className="branding-card-row">
            <div className="card branding-small-card">
              <div className="branding-icon-wrapper called">
                <PhoneIcon className="branding-card-icon" />
              </div>
              <div>
                <h2>{calledLeads}</h2>
                <p>Called</p>
              </div>
            </div>
            <div className="card branding-small-card">
              <div className="branding-icon-wrapper onboarded">
                <ExternalLinkIcon className="branding-card-icon" />
              </div>
              <div>
                <h2>{onboardedLeads}</h2>
                <p>Onboarded</p>
              </div>
            </div>
          </div>

          {/* Row 3: 1 big card (interactive script) */}
          <ColdCallScript initialSteps={scriptResult.success ? scriptResult.data : []} />
        </div>

        {/* Right Card: Quick Call Lookup Widget */}
        <div className="card interactive-demo-card">
          <QuickCallWidget 
            initialSheets={initialSheets}
            initialAllRows={initialAllRows}
            initialTeams={initialTeams}
          />
        </div>
      </div>

      {/* Spreadsheet Data Dashboard Section */}
      <div className="dashboard-container">
        <SheetViewer 
          listResult={listResult}
          dataResult={dataResult}
        />
      </div>
    </div>
  );
}
