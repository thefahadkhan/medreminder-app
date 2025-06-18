"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "../lib/supabase-provider"
import { useAuth } from "../lib/auth-provider"
import {
  Typography,
  Grid,
  Button,
  Paper,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  Box,
  Avatar,
  LinearProgress,
} from "@mui/material"
import {
  Add as AddIcon,
  Medication as MedicationIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Timeline as TimelineIcon,
  LocalHospital as HospitalIcon,
} from "@mui/icons-material"
import UpcomingDoses from "../components/upcoming-doses"
import { scheduleUpcomingNotifications } from "../lib/notifications"

export default function Dashboard() {
  const { user } = useAuth()
  const { supabase } = useSupabase()
  const router = useRouter()

  const [medicines, setMedicines] = useState([])
  const [upcomingDoses, setUpcomingDoses] = useState([])
  const [stats, setStats] = useState({
    totalMedicines: 0,
    activeMedicines: 0,
    todayDoses: 0,
    takenToday: 0,
  })
  const [loading, setLoading] = useState(true)

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (user) {
      fetchDashboardData()

      const interval = setInterval(() => {
        fetchDashboardData()
        updateMissedDoses()
      }, 30000)

      return () => clearInterval(interval)
    }
  }, [user])

  // Schedule notifications on load
  useEffect(() => {
    if (user) {
      scheduleUpcomingNotifications(supabase, user.id)
    }
  }, [user, supabase])

  const fetchDashboardData = async () => {
    try {
      // Fetch medicines
      const { data: medicinesData, error: medicinesError } = await supabase
        .from("medicines")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (medicinesError) throw medicinesError

      // Fetch upcoming doses
      const { data: dosesData, error: dosesError } = await supabase
        .from("doses")
        .select(`
          *,
          medicines (
            id,
            name,
            strength
          )
        `)
        .eq("taken", false)
        .gte("dose_time", new Date().toISOString())
        .order("dose_time", { ascending: true })
        .limit(5)

      if (dosesError) throw dosesError

      // Fetch today's doses for stats
      const today = new Date()
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString()

      const { data: todayDosesData, error: todayError } = await supabase
        .from("doses")
        .select("*")
        .gte("dose_time", startOfDay)
        .lt("dose_time", endOfDay)

      if (todayError) throw todayError

      setMedicines(medicinesData || [])
      setUpcomingDoses(dosesData || [])

      const activeMedicines = medicinesData?.filter((m) => m.status === "active").length || 0
      const todayDoses = todayDosesData?.length || 0
      const takenToday = todayDosesData?.filter((d) => d.taken).length || 0

      setStats({
        totalMedicines: medicinesData?.length || 0,
        activeMedicines,
        todayDoses,
        takenToday,
      })
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateMissedDoses = async () => {
    try {
      const now = new Date()
      const gracePeriod = new Date(now.getTime() - 15 * 60 * 1000)

      const { data: dosesToUpdate, error: checkError } = await supabase
        .from("doses")
        .select("id")
        .eq("taken", false)
        .lt("dose_time", gracePeriod.toISOString())

      if (checkError) {
        console.error("Error checking missed doses:", checkError)
        return
      }

      if (dosesToUpdate && dosesToUpdate.length > 0) {
        const { error } = await supabase
          .from("doses")
          .update({
            taken: false,
            status: "missed",
            updated_at: now.toISOString(),
          })
          .in(
            "id",
            dosesToUpdate.map((d) => d.id),
          )

        if (error) {
          console.error("Error updating missed doses:", error)
        } else {
          console.log(`Updated ${dosesToUpdate.length} missed doses`)
        }
      }
    } catch (error) {
      console.error("Error in updateMissedDoses:", error)
    }
  }

  const refreshDoses = () => {
    fetchDashboardData()
  }

  const adherenceRate = stats.todayDoses > 0 ? Math.round((stats.takenToday / stats.todayDoses) * 100) : 0

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-4 mx-auto">
            <CircularProgress size={40} className="text-white" />
          </div>
          <Typography variant="h6" className="text-slate-700 font-semibold">
            Loading your dashboard...
          </Typography>
          <Typography variant="body2" className="text-slate-500 mt-1">
            Preparing your health insights
          </Typography>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="relative overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 rounded-3xl p-8 text-white relative">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <Typography variant="h3" className="font-bold mb-2 text-2xl md:text-4xl">
                  Welcome back! 👋
                </Typography>
                <Typography variant="h6" className="opacity-90 font-medium">
                  {user?.email?.split("@")[0]}, here's your health overview
                </Typography>
                <div className="flex items-center mt-4 space-x-4">
                  <Chip
                    icon={<CheckCircleIcon />}
                    label={`${adherenceRate}% Adherence Today`}
                    className="bg-white/20 text-white border-white/30"
                    variant="outlined"
                  />
                </div>
              </div>

              <div className="hidden md:block">
                <Avatar className="w-20 h-20 bg-white/20 text-white text-2xl font-bold">
                  {user?.email?.charAt(0).toUpperCase()}
                </Avatar>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} lg={3}>
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Typography variant="h3" className="font-bold mb-1">
                    {stats.totalMedicines}
                  </Typography>
                  <Typography variant="body1" className="opacity-90 font-medium">
                    Total Medicines
                  </Typography>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  <MedicationIcon className="text-2xl" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Typography variant="h3" className="font-bold mb-1">
                    {stats.activeMedicines}
                  </Typography>
                  <Typography variant="body1" className="opacity-90 font-medium">
                    Active Medicines
                  </Typography>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  <TrendingUpIcon className="text-2xl" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Typography variant="h3" className="font-bold mb-1">
                    {stats.todayDoses}
                  </Typography>
                  <Typography variant="body1" className="opacity-90 font-medium">
                    Today's Doses
                  </Typography>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  <ScheduleIcon className="text-2xl" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <Card className="bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Typography variant="h3" className="font-bold mb-1">
                    {stats.takenToday}
                  </Typography>
                  <Typography variant="body1" className="opacity-90 font-medium">
                    Taken Today
                  </Typography>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  <CheckCircleIcon className="text-2xl" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Adherence Progress */}
      {stats.todayDoses > 0 && (
        <Paper className="p-6 rounded-3xl shadow-xl bg-gradient-to-r from-white to-blue-50 border border-blue-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Typography variant="h6" className="font-bold text-slate-800 flex items-center">
                <TimelineIcon className="mr-2 text-blue-500" />
                Today's Adherence
              </Typography>
              <Typography variant="body2" className="text-slate-600">
                You've taken {stats.takenToday} out of {stats.todayDoses} doses
              </Typography>
            </div>
            <Chip
              label={`${adherenceRate}%`}
              className={`font-bold text-lg px-4 py-2 ${
                adherenceRate >= 80
                  ? "bg-green-100 text-green-700"
                  : adherenceRate >= 60
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
              }`}
            />
          </div>
          <LinearProgress
            variant="determinate"
            value={adherenceRate}
            className="h-3 rounded-full"
            sx={{
              backgroundColor: "rgba(0,0,0,0.1)",
              "& .MuiLinearProgress-bar": {
                backgroundColor: adherenceRate >= 80 ? "#10b981" : adherenceRate >= 60 ? "#f59e0b" : "#ef4444",
                borderRadius: "6px",
              },
            }}
          />
        </Paper>
      )}

      {/* Quick Actions */}
      <Paper className="p-6 rounded-3xl shadow-xl bg-white border border-slate-200">
        <Typography variant="h6" className="font-bold text-slate-800 mb-6 flex items-center">
          <HospitalIcon className="mr-2 text-blue-500" />
          Quick Actions
        </Typography>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => router.push("/dashboard/medicines/add")}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-2xl py-4 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
            size="large"
          >
            Add Medicine
          </Button>
          <Button
            variant="outlined"
            onClick={() => router.push("/dashboard/medicines")}
            className="border-2 border-green-500 text-green-600 hover:bg-green-50 rounded-2xl py-4 font-semibold hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300"
            size="large"
          >
            View All Medicines
          </Button>
          <Button
            variant="outlined"
            onClick={() => router.push("/dashboard/history")}
            className="border-2 border-purple-500 text-purple-600 hover:bg-purple-50 rounded-2xl py-4 font-semibold hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300"
            size="large"
          >
            View History
          </Button>
        </div>
      </Paper>

      {/* Upcoming Doses */}
      <Paper className="p-6 rounded-3xl shadow-xl bg-white border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <Typography variant="h6" className="font-bold text-slate-800 flex items-center">
            <ScheduleIcon className="mr-2 text-blue-500" />
            Upcoming Doses
          </Typography>
          <div className="flex items-center space-x-2">
            <Chip label="Auto-refreshing" size="small" className="bg-green-100 text-green-700 animate-pulse" />
            <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
          </div>
        </div>
        <UpcomingDoses doses={upcomingDoses} refreshDoses={refreshDoses} />
      </Paper>

      {/* Recent Medicines */}
      {medicines.length > 0 && (
        <Paper className="p-6 rounded-3xl shadow-xl bg-white border border-slate-200">
          <Typography variant="h6" className="font-bold text-slate-800 mb-6 flex items-center">
            <MedicationIcon className="mr-2 text-blue-500" />
            Recent Medicines
          </Typography>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {medicines.slice(0, 3).map((medicine) => (
              <Card
                key={medicine.id}
                className="cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-slate-200 rounded-2xl overflow-hidden group"
                onClick={() => router.push(`/dashboard/medicines/${medicine.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-300">
                      <MedicationIcon className="text-white" />
                    </div>
                    <div className="flex-1">
                      <Typography variant="h6" className="font-bold truncate text-slate-800">
                        {medicine.name}
                      </Typography>
                      <Typography variant="body2" className="text-slate-500">
                        {medicine.frequency.replace(/_/g, " ")}
                      </Typography>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Chip
                      label={medicine.status === "active" ? "Active" : "Completed"}
                      size="small"
                      className={
                        medicine.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                      }
                    />
                    {medicine.strength && (
                      <Typography variant="caption" className="text-slate-500 font-medium">
                        {medicine.strength}
                      </Typography>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {medicines.length > 3 && (
            <Box className="text-center mt-6">
              <Button
                variant="text"
                onClick={() => router.push("/dashboard/medicines")}
                className="text-blue-600 hover:bg-blue-50 rounded-xl font-semibold"
              >
                View All {medicines.length} Medicines →
              </Button>
            </Box>
          )}
        </Paper>
      )}
    </div>
  )
}
