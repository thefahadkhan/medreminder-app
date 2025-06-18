"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useSupabase } from "../../../lib/supabase-provider"
import { useAuth } from "../../../lib/auth-provider"
import { Typography, Paper, Grid, Button, CircularProgress, Chip, Card, CardContent, Alert, Box } from "@mui/material"
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Medication as MedicationIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
  TrendingUp as TrendingUpIcon,
} from "@mui/icons-material"
import { format, isToday, isTomorrow, isPast } from "date-fns"

export default function MedicineDetail() {
  const { supabase } = useSupabase()
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const medicineId = params.id

  const [medicine, setMedicine] = useState(null)
  const [doses, setDoses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (medicineId && user) {
      fetchMedicineDetails()
    }
  }, [medicineId, user])

  const fetchMedicineDetails = async () => {
    try {
      // Fetch medicine details
      const { data: medicineData, error: medicineError } = await supabase
        .from("medicines")
        .select("*")
        .eq("id", medicineId)
        .eq("user_id", user.id)
        .single()

      if (medicineError) throw medicineError

      // Fetch doses for this medicine
      const { data: dosesData, error: dosesError } = await supabase
        .from("doses")
        .select("*")
        .eq("medicine_id", medicineId)
        .order("dose_time", { ascending: true })

      if (dosesError) throw dosesError

      setMedicine(medicineData)
      setDoses(dosesData || [])
    } catch (error) {
      console.error("Error fetching medicine details:", error)
      setError("Failed to load medicine details")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    router.push(`/dashboard/medicines/edit/${medicineId}`)
  }

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this medicine? This will also delete all associated doses.")) {
      try {
        // Delete doses first
        await supabase.from("doses").delete().eq("medicine_id", medicineId)

        // Delete medicine
        const { error } = await supabase.from("medicines").delete().eq("id", medicineId)
        if (error) throw error

        router.push("/dashboard/medicines")
      } catch (error) {
        console.error("Error deleting medicine:", error)
        setError("Failed to delete medicine")
      }
    }
  }

  const markDoseAsTaken = async (doseId) => {
    try {
      const { error } = await supabase
        .from("doses")
        .update({
          taken: true,
          taken_at: new Date().toISOString(),
        })
        .eq("id", doseId)

      if (error) throw error

      // Refresh doses
      fetchMedicineDetails()
    } catch (error) {
      console.error("Error marking dose as taken:", error)
    }
  }

  const getDoseStatus = (dose) => {
    const doseTime = new Date(dose.dose_time)
    const now = new Date()

    if (dose.taken) {
      return { status: "taken", color: "success", icon: <CheckCircleIcon /> }
    }

    // Give a 15-minute grace period before marking as missed
    const gracePeriod = 15 * 60 * 1000 // 15 minutes in milliseconds
    const missedThreshold = new Date(doseTime.getTime() + gracePeriod)

    if (now > missedThreshold) {
      return { status: "missed", color: "error", icon: <CancelIcon /> }
    } else {
      return { status: "upcoming", color: "primary", icon: <ScheduleIcon /> }
    }
  }

  const formatDoseTime = (doseTime) => {
    const date = new Date(doseTime)

    if (isToday(date)) {
      return `Today at ${format(date, "h:mm a")}`
    } else if (isTomorrow(date)) {
      return `Tomorrow at ${format(date, "h:mm a")}`
    } else {
      return format(date, "MMM d, yyyy 'at' h:mm a")
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-4 mx-auto">
            <CircularProgress size={40} className="text-white" />
          </div>
          <Typography variant="h6" className="text-slate-700 font-semibold">
            Loading medicine details...
          </Typography>
          <Typography variant="body2" className="text-slate-500 mt-1">
            Preparing detailed information
          </Typography>
        </div>
      </div>
    )
  }

  if (error || !medicine) {
    return (
      <div className="space-y-4">
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push("/dashboard/medicines")}
          className="text-gray-600 hover:text-gray-800"
        >
          Back to Medicines
        </Button>
        <Alert severity="error" className="rounded-lg">
          {error || "Medicine not found"}
        </Alert>
      </div>
    )
  }

  const takenDoses = doses.filter((dose) => dose.taken).length
  const totalDoses = doses.length
  const upcomingDoses = doses.filter((dose) => !dose.taken && !isPast(new Date(dose.dose_time))).length
  const missedDoses = doses.filter((dose) => !dose.taken && isPast(new Date(dose.dose_time))).length

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-700 rounded-3xl p-8 text-white relative">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
          </div>

          <div className="relative z-10">
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => router.push("/dashboard/medicines")}
              className="mb-4 text-white/80 hover:text-white hover:bg-white/10 rounded-xl"
            >
              Back to Medicines
            </Button>

            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex-1 min-w-0">
                <Typography variant="h3" className="font-bold mb-2 text-2xl md:text-4xl">
                  {medicine.name} 💊
                </Typography>
                <div className="flex items-center gap-3 mt-4">
                  <Chip
                    label={medicine.status === "active" ? "Active" : "Completed"}
                    className={`${
                      medicine.status === "active"
                        ? "bg-green-500/20 text-green-100 border-green-400/30"
                        : "bg-gray-500/20 text-gray-100 border-gray-400/30"
                    } border backdrop-blur-sm`}
                  />
                  {medicine.strength && (
                    <Chip
                      label={medicine.strength}
                      className="bg-blue-500/20 text-blue-100 border-blue-400/30 border backdrop-blur-sm"
                    />
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={handleEdit}
                  className="bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-2xl backdrop-blur-sm"
                >
                  Edit
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DeleteIcon />}
                  onClick={handleDelete}
                  className="border-red-400/50 text-red-200 hover:bg-red-500/20 rounded-2xl backdrop-blur-sm"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <Grid container spacing={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Typography variant="h3" className="font-bold mb-1">
                    {takenDoses}
                  </Typography>
                  <Typography variant="body1" className="opacity-90 font-medium">
                    Doses Taken
                  </Typography>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  <CheckCircleIcon className="text-2xl" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Typography variant="h3" className="font-bold mb-1">
                    {upcomingDoses}
                  </Typography>
                  <Typography variant="body1" className="opacity-90 font-medium">
                    Upcoming
                  </Typography>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  <ScheduleIcon className="text-2xl" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="bg-gradient-to-br from-red-500 to-pink-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Typography variant="h3" className="font-bold mb-1">
                    {missedDoses}
                  </Typography>
                  <Typography variant="body1" className="opacity-90 font-medium">
                    Missed
                  </Typography>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  <CancelIcon className="text-2xl" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Typography variant="h3" className="font-bold mb-1">
                    {totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0}%
                  </Typography>
                  <Typography variant="body1" className="opacity-90 font-medium">
                    Adherence
                  </Typography>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  <TrendingUpIcon className="text-2xl" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Medicine Info */}
      <Paper className="p-8 rounded-3xl shadow-xl bg-gradient-to-br from-white via-blue-50 to-purple-50 border border-blue-100">
        <Typography variant="h6" className="font-bold text-slate-800 mb-6 flex items-center text-xl">
          <InfoIcon className="mr-3 text-blue-500 text-2xl" />
          Medicine Information
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} sm={6}>
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-blue-200">
              <Typography variant="body2" className="text-slate-600 font-semibold mb-1">
                Name
              </Typography>
              <Typography variant="h6" className="font-bold text-slate-800">
                {medicine.name}
              </Typography>
            </div>
          </Grid>

          {medicine.formula && (
            <Grid item xs={12} sm={6}>
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-blue-200">
                <Typography variant="body2" className="text-slate-600 font-semibold mb-1">
                  Formula
                </Typography>
                <Typography variant="h6" className="font-bold text-slate-800">
                  {medicine.formula}
                </Typography>
              </div>
            </Grid>
          )}

          {medicine.company && (
            <Grid item xs={12} sm={6}>
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-blue-200">
                <Typography variant="body2" className="text-slate-600 font-semibold mb-1">
                  Company
                </Typography>
                <Typography variant="h6" className="font-bold text-slate-800">
                  {medicine.company}
                </Typography>
              </div>
            </Grid>
          )}

          {medicine.strength && (
            <Grid item xs={12} sm={6}>
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-blue-200">
                <Typography variant="body2" className="text-slate-600 font-semibold mb-1">
                  Strength
                </Typography>
                <Typography variant="h6" className="font-bold text-slate-800">
                  {medicine.strength}
                </Typography>
              </div>
            </Grid>
          )}

          <Grid item xs={12} sm={6}>
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-blue-200">
              <Typography variant="body2" className="text-slate-600 font-semibold mb-1">
                Start Date
              </Typography>
              <Typography variant="h6" className="font-bold text-slate-800">
                {format(new Date(medicine.start_date), "MMM d, yyyy")}
              </Typography>
            </div>
          </Grid>

          <Grid item xs={12} sm={6}>
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-blue-200">
              <Typography variant="body2" className="text-slate-600 font-semibold mb-1">
                Frequency
              </Typography>
              <Typography variant="h6" className="font-bold text-slate-800 capitalize">
                {medicine.frequency.replace(/_/g, " ")}
              </Typography>
            </div>
          </Grid>

          <Grid item xs={12} sm={6}>
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-blue-200">
              <Typography variant="body2" className="text-slate-600 font-semibold mb-1">
                Duration
              </Typography>
              <Typography variant="h6" className="font-bold text-slate-800">
                {medicine.duration_days} days
              </Typography>
            </div>
          </Grid>

          <Grid item xs={12} sm={6}>
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-blue-200">
              <Typography variant="body2" className="text-slate-600 font-semibold mb-2">
                Dose Times
              </Typography>
              <div className="flex flex-wrap gap-2">
                {medicine.timings.map((time, index) => (
                  <Chip key={index} label={time} className="bg-blue-500 text-white font-semibold shadow-md" />
                ))}
              </div>
            </div>
          </Grid>
        </Grid>
      </Paper>

      {/* Dose Schedule */}
      <Paper className="p-8 rounded-3xl shadow-xl bg-gradient-to-br from-white via-purple-50 to-pink-50 border border-purple-100">
        <Typography variant="h6" className="font-bold text-slate-800 mb-6 flex items-center text-xl">
          <ScheduleIcon className="mr-3 text-purple-500 text-2xl" />
          Dose Schedule ({doses.length} total doses)
        </Typography>

        {doses.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <MedicationIcon className="text-5xl text-purple-500" />
            </div>
            <Typography variant="h6" className="text-slate-700 font-bold mb-2">
              No doses scheduled
            </Typography>
            <Typography variant="body1" className="text-slate-500">
              No doses scheduled for this medicine.
            </Typography>
          </div>
        ) : (
          <div className="space-y-4">
            {doses.slice(0, 10).map((dose) => {
              const doseStatus = getDoseStatus(dose)
              return (
                <Card
                  key={dose.id}
                  className="bg-white/70 backdrop-blur-sm border border-purple-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 rounded-2xl"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div
                          className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
                            doseStatus.status === "taken"
                              ? "bg-gradient-to-r from-green-500 to-emerald-500"
                              : doseStatus.status === "missed"
                                ? "bg-gradient-to-r from-red-500 to-pink-500"
                                : "bg-gradient-to-r from-blue-500 to-indigo-500"
                          }`}
                        >
                          <div className="text-white text-xl">{doseStatus.icon}</div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <Typography variant="h6" className="font-bold text-slate-800">
                            {formatDoseTime(dose.dose_time)}
                          </Typography>
                          <div className="flex items-center gap-3 mt-2">
                            <Chip
                              label={doseStatus.status.charAt(0).toUpperCase() + doseStatus.status.slice(1)}
                              className={`font-semibold ${
                                doseStatus.status === "taken"
                                  ? "bg-green-100 text-green-700"
                                  : doseStatus.status === "missed"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-blue-100 text-blue-700"
                              }`}
                            />
                            {dose.taken && dose.taken_at && (
                              <Typography variant="caption" className="text-green-600 font-medium">
                                ✅ Taken at {format(new Date(dose.taken_at), "h:mm a")}
                              </Typography>
                            )}
                          </div>
                        </div>
                      </div>

                      {!dose.taken && !isPast(new Date(dose.dose_time)) && (
                        <Button
                          variant="contained"
                          onClick={() => markDoseAsTaken(dose.id)}
                          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                        >
                          Mark Taken
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            {doses.length > 10 && (
              <Box className="text-center pt-6">
                <Typography variant="body1" className="text-slate-500 font-medium">
                  ... and {doses.length - 10} more doses
                </Typography>
              </Box>
            )}
          </div>
        )}
      </Paper>
    </div>
  )
}
