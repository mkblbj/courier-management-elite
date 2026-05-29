import { ScanCountAppHeader } from "../components/ScanCountAppHeader"
import { ScanCountPwaRegistrar } from "../components/ScanCountPwaRegistrar"
import { ScanCountWorkspace } from "../components/ScanCountWorkspace"

export default function ScanCountMobilePage() {
  return (
    <div className="min-h-screen bg-background">
      <ScanCountPwaRegistrar />
      <ScanCountAppHeader />
      <ScanCountWorkspace
        showHeaderText={false}
        className="pb-[calc(env(safe-area-inset-bottom)+1rem)]"
      />
    </div>
  )
}
