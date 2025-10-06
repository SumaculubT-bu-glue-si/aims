
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AuditConfirmationRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the correct corrective-actions page
    router.replace('/audits/corrective-actions')
  }, [router])

  return (
    <div className="flex-grow flex items-center justify-center">
      <div className="text-center">
        <p className="text-muted-foreground">Redirecting to Corrective Actions...</p>
      </div>
    </div>
  )
}
