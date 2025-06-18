"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "../lib/supabase-provider"
import { IconButton, Typography, Chip, Card, CardContent } from "@mui/material"
import {
  Medication as MedicationIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as TimeIcon,
} from "@mui/icons-material"

export default function UpcomingDoses({ doses, refreshDoses }) {
  const { supabase } = useSupabase()
  const [loading, setLoading] = useState({})
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update current time every minute for accurate countdowns
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  const handleMarkAsTaken = async (doseId) => {
    setLoading((prev) => ({ ...prev, [doseId]: true }))

    try {
      const { error } = await supabase
        .from("doses")
        .update({
          taken: true,
          taken_at: new Date().toISOString(),
        })
        .eq("id", doseId)

      if (error) throw error
      refreshDoses()
    } catch (error) {
      console.error("Error marking dose as taken:", error)
    } finally {
      setLoading((prev) => ({ ...prev, [doseId]: false }))
    }
  }

  const getTimeDisplay = (doseTime) => {
    try {
      const doseDate = new Date(doseTime)
      const now = currentTime

      if (isNaN(doseDate.getTime())) {
        return "Invalid date"
      }

      if (
        doseDate.getDate() === now.getDate() &&
        doseDate.getMonth() === now.getMonth() &&
        doseDate.getFullYear() === now.getFullYear()
      ) {
        const hours = doseDate.getHours()
        const minutes = doseDate.getMinutes()
        const ampm = hours >= 12 ? "PM" : "AM"
        const displayHours = hours % 12 || 12
        const displayMinutes = minutes.toString().padStart(2, "0")
        return `Today at ${displayHours}:${displayMinutes} ${ampm}`
      }

      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      if (
        doseDate.getDate() === tomorrow.getDate() &&
        doseDate.getMonth() === tomorrow.getMonth() &&
        doseDate.getFullYear() === tomorrow.getFullYear()
      ) {
        const hours = doseDate.getHours()
        const minutes = doseDate.getMinutes()
        const ampm = hours >= 12 ? "PM" : "AM"
        const displayHours = hours % 12 || 12
        const displayMinutes = minutes.toString().padStart(2, "0")
        return `Tomorrow at ${displayHours}:${displayMinutes} ${ampm}`
      }

      const month = doseDate.toLocaleDateString("en-US", { month: "short" })
      const day = doseDate.getDate()
      const year = doseDate.getFullYear()
      const hours = doseDate.getHours()
      const minutes = doseDate.getMinutes()
      const ampm = hours >= 12 ? "PM" : "AM"
      const displayHours = hours % 12 || 12
      const displayMinutes = minutes.toString().padStart(2, "0")

      return `${month} ${day}, ${year} at ${displayHours}:${displayMinutes} ${ampm}`
    } catch (error) {
      console.error("Error formatting date:", error)
      return "Invalid date"
    }
  }

  const getCountdown = (doseTime) => {
    try {
      const doseDate = new Date(doseTime)
      const now = currentTime

      if (isNaN(doseDate.getTime())) {
        return "Invalid date"
      }

      const diffMs = doseDate.getTime() - now.getTime()

      // If dose time has passed by more than 15 minutes, mark as overdue
      if (diffMs < -15 * 60 * 1000) {
        return "Overdue"
      }

      // If dose time is within 15 minutes (past or future), show "Now"
      if (Math.abs(diffMs) <= 15 * 60 * 1000) {
        return "Now"
      }

      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
      const diffDays = Math.floor(diffHours / 24)

      if (diffDays > 0) {
        return `in ${diffDays} day${diffDays > 1 ? "s" : ""}`
      } else if (diffHours > 0) {
        return `in ${diffHours} hour${diffHours > 1 ? "s" : ""}`
      } else if (diffMinutes > 0) {
        return `in ${diffMinutes} minute${diffMinutes > 1 ? "s" : ""}`
      } else {
        return "Now"
      }
    } catch (error) {
      console.error("Error calculating countdown:", error)
      return "Error"
    }
  }

  const getCountdownColor = (doseTime) => {
    const doseDate = new Date(doseTime)
    const now = currentTime
    const diffMs = doseDate.getTime() - now.getTime()

    // If more than 15 minutes overdue
    if (diffMs < -15 * 60 * 1000) return "error"

    // If within 15 minutes (past or future)
    if (Math.abs(diffMs) <= 15 * 60 * 1000) return "success"

    // If within 30 minutes in future
    if (diffMs > 0 && diffMs <= 30 * 60 * 1000) return "warning"

    return "primary"
  }

  if (!doses || doses.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <MedicationIcon className="text-4xl text-blue-500" />
        </div>
        <Typography variant="h6" className="text-slate-700 font-semibold mb-2">
          No upcoming doses scheduled
        </Typography>
        <Typography variant="body2" className="text-slate-500">
          All caught up! 🎉
        </Typography>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {doses.map((dose) => (
        <Card
          key={dose.id}
          className="bg-gradient-to-r from-blue-50 via-white to-purple-50 border border-blue-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 rounded-2xl overflow-hidden"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1">
                <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <MedicationIcon className="text-white text-xl" />
                </div>

                <div className="flex-1 min-w-0">
                  <Typography variant="h6" className="font-bold text-slate-800 truncate">
                    {dose.medicines?.name || "Unknown Medicine"}
                  </Typography>
                  <div className="flex items-center space-x-2 mt-1">
                    <TimeIcon className="text-slate-400 text-sm" />
                    <Typography variant="body2" className="text-slate-600">
                      {getTimeDisplay(dose.dose_time)}
                    </Typography>
                  </div>
                  <div className="mt-2">
                    <Chip
                      label={getCountdown(dose.dose_time)}
                      size="small"
                      color={getCountdownColor(dose.dose_time)}
                      className="font-semibold"
                    />
                  </div>
                </div>
              </div>

              <IconButton
                onClick={() => handleMarkAsTaken(dose.id)}
                disabled={loading[dose.id]}
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 w-12 h-12 shadow-lg hover:shadow-xl transition-all duration-300"
                size="large"
              >
                <CheckCircleIcon />
              </IconButton>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
