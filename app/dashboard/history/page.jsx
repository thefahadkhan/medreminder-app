"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "../../lib/supabase-provider"
import { useAuth } from "../../lib/auth-provider"
import {
  Typography,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Button,
  CircularProgress,
  Tabs,
  Tab,
  Box,
  Card,
  CardContent,
  Grid,
} from "@mui/material"
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  ArrowBack as ArrowBackIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
} from "@mui/icons-material"
import { useRouter } from "next/navigation"
import { format, isToday, isYesterday } from "date-fns"

export default function HistoryPage() {
  const { supabase } = useSupabase()
  const { user } = useAuth()
  const router = useRouter()
  const [doses, setDoses] = useState([])
  const [loading, setLoading] = useState(true)
  const [tabValue, setTabValue] = useState(0)

  useEffect(() => {
    if (user) {
      fetchDoseHistory()
    }
  }, [user])

  const fetchDoseHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("doses")
        .select(`
          *,
          medicines (
            name,
            strength
          )
        `)
        .lt("dose_time", new Date().toISOString())
        .order("dose_time", { ascending: false })
        .limit(100)

      if (error) throw error
      setDoses(data || [])
    } catch (error) {
      console.error("Error fetching dose history:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
  }

  const getFilteredDoses = () => {
    if (tabValue === 0) return doses // All
    if (tabValue === 1) return doses.filter((dose) => dose.taken) // Taken
    if (tabValue === 2) return doses.filter((dose) => !dose.taken) // Missed
    return doses
  }

  const formatDoseDate = (doseTime) => {
    const date = new Date(doseTime)

    if (isToday(date)) {
      return `Today at ${format(date, "h:mm a")}`
    } else if (isYesterday(date)) {
      return `Yesterday at ${format(date, "h:mm a")}`
    } else {
      return format(date, "MMM d, yyyy 'at' h:mm a")
    }
  }

  const takenDoses = doses.filter((dose) => dose.taken).length
  const missedDoses = doses.filter((dose) => !dose.taken).length
  const adherenceRate = doses.length > 0 ? Math.round((takenDoses / doses.length) * 100) : 0

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4 mx-auto">
            <CircularProgress size={40} className="text-white" />
          </div>
          <Typography variant="h6" className="text-slate-700 font-semibold">
            Loading your history...
          </Typography>
          <Typography variant="body2" className="text-slate-500 mt-1">
            Analyzing your medication adherence
          </Typography>
        </div>
      </div>
    )
  }

  const filteredDoses = getFilteredDoses()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-700 rounded-3xl p-8 text-white relative">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
          </div>

          <div className="relative z-10">
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => router.push("/dashboard")}
              className="mb-4 text-white/80 hover:text-white hover:bg-white/10 rounded-xl"
            >
              Back to Dashboard
            </Button>

            <Typography variant="h3" className="font-bold mb-2 text-2xl md:text-4xl">
              Dose History 📊
            </Typography>
            <Typography variant="h6" className="opacity-90 font-medium">
              Track your medication adherence journey
            </Typography>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <Grid container spacing={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Typography variant="h3" className="font-bold mb-1">
                    {doses.length}
                  </Typography>
                  <Typography variant="body1" className="opacity-90 font-medium">
                    Total Doses
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
          <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Typography variant="h3" className="font-bold mb-1">
                    {takenDoses}
                  </Typography>
                  <Typography variant="body1" className="opacity-90 font-medium">
                    Taken
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
                    {adherenceRate}%
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

      {/* History List */}
      <Paper className="rounded-3xl shadow-xl overflow-hidden bg-white border border-slate-200">
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            className="px-6 pt-4"
            sx={{
              "& .MuiTab-root": {
                borderRadius: "12px",
                margin: "0 4px",
                fontWeight: 600,
              },
            }}
          >
            <Tab label={`All (${doses.length})`} />
            <Tab label={`Taken (${takenDoses})`} />
            <Tab label={`Missed (${missedDoses})`} />
          </Tabs>
        </Box>

        {/* Dose List */}
        {filteredDoses.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <TimelineIcon className="text-5xl text-purple-500" />
            </div>
            <Typography variant="h6" className="text-slate-700 font-bold mb-2">
              No doses in this category
            </Typography>
            <Typography variant="body2" className="text-slate-500">
              Your dose history will appear here
            </Typography>
          </div>
        ) : (
          <List className="p-0">
            {filteredDoses.map((dose, index) => (
              <ListItem
                key={dose.id}
                className={`border-b border-slate-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 ${
                  index === filteredDoses.length - 1 ? "border-b-0" : ""
                } p-6`}
              >
                <ListItemIcon>
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                      dose.taken
                        ? "bg-gradient-to-r from-green-500 to-emerald-500"
                        : "bg-gradient-to-r from-red-500 to-pink-500"
                    }`}
                  >
                    {dose.taken ? (
                      <CheckCircleIcon className="text-white text-xl" />
                    ) : (
                      <CancelIcon className="text-white text-xl" />
                    )}
                  </div>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <div className="flex items-center gap-3 mb-2">
                      <Typography variant="h6" className="font-bold text-slate-800">
                        {dose.medicines?.name || "Unknown Medicine"}
                      </Typography>
                      {dose.medicines?.strength && (
                        <Chip
                          label={dose.medicines.strength}
                          size="small"
                          className="bg-blue-100 text-blue-700 font-medium"
                        />
                      )}
                    </div>
                  }
                  secondary={
                    <div className="space-y-1">
                      <Typography variant="body2" className="text-slate-600 font-medium">
                        {formatDoseDate(dose.dose_time)}
                      </Typography>
                      {dose.taken && dose.taken_at && (
                        <Typography variant="caption" className="text-green-600 font-medium">
                          ✅ Taken at {format(new Date(dose.taken_at), "h:mm a")}
                        </Typography>
                      )}
                    </div>
                  }
                />
                <Chip
                  label={dose.taken ? "Taken" : "Missed"}
                  color={dose.taken ? "success" : "error"}
                  size="small"
                  className="font-semibold"
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </div>
  )
}
