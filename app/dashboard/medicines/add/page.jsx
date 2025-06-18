"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "../../../lib/supabase-provider"
import { useAuth } from "../../../lib/auth-provider"
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  IconButton,
  Stack,
  Card,
  CardContent,
} from "@mui/material"
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Schedule as ScheduleIcon,
} from "@mui/icons-material"
import { scheduleNotificationsForDoses } from "../../../lib/push-notifications"

export default function AddMedicine() {
  const { supabase } = useSupabase()
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    formula: "",
    company: "",
    strength: "",
    startDate: new Date().toISOString().split("T")[0],
    frequency: "daily",
    durationDays: 7,
  })

  const [doseTimes, setDoseTimes] = useState(["08:00"])

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const addDoseTime = () => {
    setDoseTimes([...doseTimes, "08:00"])
  }

  const removeDoseTime = (index) => {
    if (doseTimes.length > 1) {
      const newDoseTimes = [...doseTimes]
      newDoseTimes.splice(index, 1)
      setDoseTimes(newDoseTimes)
    }
  }

  const updateDoseTime = (index, time) => {
    const newDoseTimes = [...doseTimes]
    newDoseTimes[index] = time
    setDoseTimes(newDoseTimes)
  }

  const generateDoseSchedule = (medicine, startDate, frequency, doseTimes, durationDays) => {
    const doses = []
    const start = new Date(startDate)

    for (let day = 0; day < durationDays; day++) {
      const currentDate = new Date(start)
      currentDate.setDate(start.getDate() + day)

      let shouldAddDose = false
      if (frequency === "daily") {
        shouldAddDose = true
      } else if (frequency === "every_other_day") {
        shouldAddDose = day % 2 === 0
      } else if (frequency === "weekly") {
        shouldAddDose = day % 7 === 0
      }

      if (shouldAddDose) {
        doseTimes.forEach((timeStr) => {
          const [hours, minutes] = timeStr.split(":")
          const doseDateTime = new Date(currentDate)
          doseDateTime.setHours(Number.parseInt(hours), Number.parseInt(minutes), 0, 0)

          doses.push({
            medicine_id: medicine.id,
            dose_time: doseDateTime.toISOString(),
            taken: false,
          })
        })
      }
    }

    return doses
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      setError("Medicine name is required")
      return
    }

    if (doseTimes.length === 0) {
      setError("Please add at least one dose time")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      console.log("Creating medicine for user:", user.id)

      // Insert medicine
      const { data: medicine, error: medicineError } = await supabase
        .from("medicines")
        .insert({
          user_id: user.id,
          name: formData.name.trim(),
          formula: formData.formula?.trim() || null,
          company: formData.company?.trim() || null,
          strength: formData.strength?.trim() || null,
          start_date: formData.startDate,
          frequency: formData.frequency,
          timings: doseTimes,
          duration_days: Number.parseInt(formData.durationDays),
          status: "active",
        })
        .select()
        .single()

      if (medicineError) {
        console.error("Medicine creation error:", medicineError)
        throw medicineError
      }

      console.log("Medicine created successfully:", medicine)

      // Generate doses
      const doses = generateDoseSchedule(
        medicine,
        formData.startDate,
        formData.frequency,
        doseTimes,
        Number.parseInt(formData.durationDays),
      )

      console.log("Generated doses count:", doses.length)

      if (doses.length > 0) {
        const { data: createdDoses, error: dosesError } = await supabase.from("doses").insert(doses).select()

        if (dosesError) {
          console.error("Doses insertion error:", dosesError)
          throw dosesError
        }

        // Schedule push notifications for all doses
        try {
          await scheduleNotificationsForDoses(supabase, medicine, createdDoses)
          setSuccess("Medicine added successfully with notifications!")
        } catch (notifError) {
          console.error("Notification scheduling error:", notifError)
          setSuccess("Medicine added successfully, but notifications could not be scheduled.")
        }
      } else {
        const { error: dosesError } = await supabase.from("doses").insert(doses)
        if (dosesError) {
          console.error("Doses insertion error:", dosesError)
          throw dosesError
        }
        setSuccess("Medicine added successfully!")
      }

      console.log("All doses created successfully")

      // Show success message for 2 seconds before redirecting
      setTimeout(() => {
        router.push("/dashboard")
      }, 2000)
    } catch (error) {
      console.error("Complete error:", error)
      setError(error.message || "Failed to add medicine")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 rounded-3xl p-8 text-white relative">
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
              Add New Medicine 💊
            </Typography>
            <Typography variant="h6" className="opacity-90 font-medium">
              Set up your medicine schedule and reminders
            </Typography>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert severity="error" className="rounded-2xl shadow-lg">
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" className="rounded-2xl shadow-lg">
          {success}
        </Alert>
      )}

      {/* Form */}
      <Paper className="p-8 rounded-3xl shadow-xl bg-gradient-to-br from-white to-blue-50 border border-blue-100">
        <form onSubmit={handleSubmit}>
          <Grid container spacing={4}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" className="font-bold text-slate-800 mb-4">
                Basic Information
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Medicine Name"
                fullWidth
                required
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="bg-white rounded-2xl"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "16px",
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Formula (Optional)"
                fullWidth
                value={formData.formula}
                onChange={(e) => handleInputChange("formula", e.target.value)}
                className="bg-white rounded-2xl"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "16px",
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Company (Optional)"
                fullWidth
                value={formData.company}
                onChange={(e) => handleInputChange("company", e.target.value)}
                className="bg-white rounded-2xl"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "16px",
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Strength (Optional)"
                fullWidth
                placeholder="e.g., 500mg, 10ml"
                value={formData.strength}
                onChange={(e) => handleInputChange("strength", e.target.value)}
                className="bg-white rounded-2xl"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "16px",
                  },
                }}
              />
            </Grid>

            {/* Schedule Information */}
            <Grid item xs={12}>
              <Typography variant="h6" className="font-bold text-slate-800 mb-4 mt-6">
                Schedule Information
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Start Date"
                type="date"
                fullWidth
                required
                value={formData.startDate}
                onChange={(e) => handleInputChange("startDate", e.target.value)}
                className="bg-white rounded-2xl"
                InputLabelProps={{ shrink: true }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "16px",
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Frequency</InputLabel>
                <Select
                  value={formData.frequency}
                  label="Frequency"
                  onChange={(e) => handleInputChange("frequency", e.target.value)}
                  className="bg-white rounded-2xl"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "16px",
                    },
                  }}
                >
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="every_other_day">Every Other Day</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Duration (Days)"
                type="number"
                fullWidth
                required
                inputProps={{ min: 1 }}
                value={formData.durationDays}
                onChange={(e) => handleInputChange("durationDays", e.target.value)}
                className="bg-white rounded-2xl"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "16px",
                  },
                }}
              />
            </Grid>

            {/* Dose Times */}
            <Grid item xs={12}>
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl">
                <CardContent className="p-6">
                  <Typography variant="h6" className="font-bold text-slate-800 mb-2 flex items-center">
                    <ScheduleIcon className="mr-2 text-blue-500" />
                    Dose Times
                  </Typography>
                  <Typography variant="body2" className="text-slate-600 mb-6">
                    Add times when you need to take this medicine
                  </Typography>

                  {doseTimes.map((time, index) => (
                    <Stack direction="row" spacing={2} alignItems="center" className="mb-4" key={index}>
                      <TextField
                        label={`Dose ${index + 1}`}
                        type="time"
                        fullWidth
                        required
                        value={time}
                        onChange={(e) => updateDoseTime(index, e.target.value)}
                        className="bg-white rounded-2xl"
                        InputLabelProps={{ shrink: true }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "16px",
                          },
                        }}
                      />
                      <IconButton
                        color="error"
                        onClick={() => removeDoseTime(index)}
                        disabled={doseTimes.length === 1}
                        className="bg-red-50 hover:bg-red-100 rounded-2xl"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Stack>
                  ))}

                  <Button
                    startIcon={<AddIcon />}
                    onClick={addDoseTime}
                    variant="outlined"
                    className="mt-2 border-2 border-blue-500 text-blue-600 hover:bg-blue-50 rounded-2xl"
                  >
                    Add Another Time
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            {/* Action Buttons */}
            <Grid item xs={12} className="mt-8">
              <Box className="flex flex-col sm:flex-row justify-between gap-4">
                <Button
                  variant="outlined"
                  onClick={() => router.push("/dashboard")}
                  className="px-8 py-3 border-2 border-slate-300 text-slate-600 hover:bg-slate-50 rounded-2xl"
                  size="large"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                  size="large"
                >
                  {loading ? "Saving..." : "Save Medicine"}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </div>
  )
}
