"use client"

import * as React from "react"
import { PlayIcon, PauseIcon } from "lucide-react"
import { getColumnIndices } from "@/utils/columnMapper"

interface ScriptStep {
  badge: string
  text: string
  theme: 'script-teal' | 'script-gold'
}

interface ColdCallScriptProps {
  initialSteps?: ScriptStep[]
}

const DEFAULT_STEPS: ScriptStep[] = [
  {
    badge: "OPEN",
    text: `"Hi, is this [Company]? My name is [Name] from JobGiga, a new Malaysian hiring platform for SMEs. Do you have 30 seconds?"`,
    theme: "script-teal"
  },
  {
    badge: "HOOK",
    text: `"We noticed [Company] is currently hiring for [Job Title] in [Location]. We've created a free listing for that role on JobGiga — it's already visible to job-seekers at no cost to you."`,
    theme: "script-gold"
  },
  {
    badge: "TRANSPARENCY",
    text: `"To be upfront — we built this from your publicly posted ad to help seed our platform before launch. You own it. You can edit it, take it over, or ask us to remove it. No obligation."`,
    theme: "script-teal"
  },
  {
    badge: "QUALIFY",
    text: `"How are you finding applications for this role right now? Getting enough candidates?"`,
    theme: "script-gold"
  },
  {
    badge: "CLOSE",
    text: `"I can send you a claim link right now so you can take control in 2 minutes. Would [time A] or [time B] work for a quick walkthrough?"`,
    theme: "script-teal"
  }
]

function parseScriptText(text: string, context: { company: string; name: string; jobTitle: string; location: string }) {
  // Regex to split by bracketed placeholders while keeping them
  const parts = text.split(/(\[[^\]]+\])/g)
  return parts.map((part, index) => {
    if (part.startsWith('[') && part.endsWith(']')) {
      const cleanPart = part.toLowerCase().trim()
      if (cleanPart === '[company]') {
        return (
          <span key={index} className="highlight-tag">
            {context.company || "[Company]"}
          </span>
        )
      }
      if (cleanPart === '[name]') {
        return (
          <span key={index} className="highlight-tag">
            {context.name || "[Name]"}
          </span>
        )
      }
      if (cleanPart === '[job title]' || cleanPart === '[jobtitle]') {
        return (
          <span key={index} className="highlight-tag">
            {context.jobTitle || "[Job Title]"}
          </span>
        )
      }
      if (cleanPart === '[location]') {
        return (
          <span key={index} className="highlight-tag">
            {context.location || "[Location]"}
          </span>
        )
      }
      
      // Fallback for other bracketed items (e.g. [time A], [time B])
      return (
        <span key={index} className="highlight-tag">
          {part}
        </span>
      )
    }
    return part
  })
}

export default function ColdCallScript({ initialSteps }: ColdCallScriptProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [isAutoScrolling, setIsAutoScrolling] = React.useState(true)
  const autoScrollRef = React.useRef<number | null>(null)
  const isTransitioning = React.useRef(false)
  const scrollPosRef = React.useRef(0)

  // Selection context state for placeholder replacement
  const [context, setContext] = React.useState({
    company: "",
    name: "",
    jobTitle: "",
    location: ""
  })

  // Listen for selection updates from QuickCallWidget
  React.useEffect(() => {
    const handleUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (!detail) return

      const { selectedCompanyIdx, companies, selectedTeam, teams } = detail

      let companyName = ""
      let jobTitle = ""
      let location = ""
      let teamMembers = ""

      if (companies && companies.length > 0 && selectedCompanyIdx >= 0 && selectedCompanyIdx < companies.length) {
        const companyRow = companies[selectedCompanyIdx]
        
        const headerRow = companies[0].map((h: string, i: number) => {
          const sub = companies[1]?.[i] || ""
          return sub ? `${h} - ${sub}` : h
        })
        const cols = getColumnIndices(headerRow)

        companyName = companyRow[cols.companyName] || ""
        jobTitle = companyRow[cols.jobTitle] || ""
        location = companyRow[cols.location] || ""
      }

      if (teams && selectedTeam && teams[selectedTeam]) {
        teamMembers = teams[selectedTeam].join(", ")
      }

      setContext({
        company: companyName,
        name: teamMembers,
        jobTitle: jobTitle,
        location: location
      })
    }

    window.addEventListener("quick-call-widget-update", handleUpdate)
    
    // Request initial sync state from QuickCallWidget
    window.dispatchEvent(new CustomEvent("quick-call-widget-request-sync"))

    return () => {
      window.removeEventListener("quick-call-widget-update", handleUpdate)
    }
  }, [])

  const steps = initialSteps && initialSteps.length > 0 ? initialSteps : DEFAULT_STEPS

  // Sync scrollPosRef with actual container scrollTop when auto-scrolling starts
  React.useEffect(() => {
    if (isAutoScrolling && containerRef.current) {
      scrollPosRef.current = containerRef.current.scrollTop
    }
  }, [isAutoScrolling])

  // Auto-scroll implementation using requestAnimationFrame for butter-smooth scrolling
  React.useEffect(() => {
    if (!isAutoScrolling) {
      if (autoScrollRef.current) {
        cancelAnimationFrame(autoScrollRef.current)
        autoScrollRef.current = null
      }
      return
    }

    let lastTime = performance.now()
    const scrollSpeed = 38 // balanced speed (38 pixels per second)

    const scroll = (now: number) => {
      const container = containerRef.current
      if (!container) return

      const elapsed = (now - lastTime) / 1000
      lastTime = now

      if (!isTransitioning.current) {
        // Increment floating point scroll coordinate
        scrollPosRef.current += scrollSpeed * elapsed
        // Assign rounded coordinate to scrollTop (prevents step/integer rounding jitters)
        container.scrollTop = Math.round(scrollPosRef.current)

        // Loop back to top if reached the bottom
        if (container.scrollTop + container.clientHeight >= container.scrollHeight - 1) {
          isTransitioning.current = true
          setTimeout(() => {
            if (container) {
              container.scrollTo({ top: 0, behavior: "smooth" })
              // Wait for smooth scroll animation to finish before resuming scroll
              setTimeout(() => {
                isTransitioning.current = false
                scrollPosRef.current = 0 // Reset coordinate ref
                lastTime = performance.now() // Reset timer after warp
              }, 600)
            } else {
              isTransitioning.current = false
            }
          }, 1500)
        }
      }

      autoScrollRef.current = requestAnimationFrame(scroll)
    }

    autoScrollRef.current = requestAnimationFrame(scroll)

    return () => {
      if (autoScrollRef.current) {
        cancelAnimationFrame(autoScrollRef.current)
      }
    }
  }, [isAutoScrolling])

  // Stop auto-scroll when user clicks, scrolls, or touches inside the container
  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleUserInteraction = () => {
      setIsAutoScrolling(false)
    }

    container.addEventListener("wheel", handleUserInteraction, { passive: true })
    container.addEventListener("touchmove", handleUserInteraction, { passive: true })

    return () => {
      container.removeEventListener("wheel", handleUserInteraction)
      container.removeEventListener("touchmove", handleUserInteraction)
    }
  }, [])

  const handleContainerClick = () => {
    setIsAutoScrolling(false)
  }

  return (
    <div className="card branding-big-card" style={{ position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem", width: "100%" }}>
        <h1 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
          <span>📞 Cold Call Script Template</span>
        </h1>
        <button
          onClick={(e) => {
            e.stopPropagation()
            setIsAutoScrolling(prev => !prev)
          }}
          className="btn-choice"
          style={{
            padding: "4px 8px",
            minWidth: "auto",
            fontSize: "0.725rem",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid var(--border-color)",
            borderRadius: "6px",
            color: "var(--text-secondary)",
            cursor: "pointer"
          }}
          title={isAutoScrolling ? "Pause Auto Scroll" : "Resume Auto Scroll"}
        >
          {isAutoScrolling ? (
            <>
              <PauseIcon style={{ width: "12px", height: "12px" }} />
              <span>Autoscroll On</span>
            </>
          ) : (
            <>
              <PlayIcon style={{ width: "12px", height: "12px" }} />
              <span>Autoscroll Off</span>
            </>
          )}
        </button>
      </div>

      <div 
        ref={containerRef}
        className="script-container" 
        onClick={handleContainerClick}
        style={{ cursor: isAutoScrolling ? "pointer" : "default" }}
      >
        {steps.map((step, index) => (
          <div key={index} className={`script-row ${step.theme}`}>
            <div className="script-badge-cell">
              <div className="script-badge">{step.badge}</div>
            </div>
            <div className="script-text">
              <span>{parseScriptText(step.text, context)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
