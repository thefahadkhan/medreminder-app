"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "./lib/auth-provider"
import { CircularProgress } from "@mui/material"

export default function Home() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.push("/dashboard")
      } else {
        router.push("/login")
      }
    }
  }, [user, isLoading, router])

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-center">
        <CircularProgress size={60} className="text-blue-500" />
        <p className="mt-4 text-gray-600 text-lg">Loading MedReminder...</p>
      </div>
    </div>
  )
}