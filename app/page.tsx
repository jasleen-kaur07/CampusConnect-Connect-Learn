"use client"

import { useAuth } from "@/contexts/auth-context"
import { LandingPage } from "@/components/landing-page"
import { Dashboard } from "@/components/dashboard"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function Home() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return user ? <Dashboard /> : <LandingPage />
}
