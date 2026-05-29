"use client"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { ScanCountWorkspace } from "./components/ScanCountWorkspace"

export default function ScanCountPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <ScanCountWorkspace />
    </div>
  )
}
