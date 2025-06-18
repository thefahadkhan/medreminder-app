"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useSupabase } from "../../../../lib/supabase-provider"
import { useAuth } from "../../../../lib/auth-provider"
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
  CircularProgress,
  Card,
  CardContent,
} from "@mui/material"
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Schedule as ScheduleIcon,
  Edit as EditIcon,
} from "@mui/icons-material"

export default function EditMedicine() {
  const { supabase } = useSupabase()
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const medicineId = params.id

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    formula: "",
    company: "",
    strength: "",
    startDate: "",
    frequency: "daily",
    durationDays: 7,
  })

  const [doseTimes, setDoseTimes] = useState(["08:00"])

  useEffect(() => {
    if (medicineId && user) {
      fetchMedicine()
    }
  }, [medicineId, user])

  const fetchMedicine = async () => {
    try {
      const { data, error } = await supabase
        .from("medicines")
        .select("*")
        .eq("id", medicineId)
        .eq("user_id", user.id)
        .single()

      if (error) throw error

      if (data) {
        setFormData({
          name: data.name || "",
          formula: data.formula || "",
          company: data.company || "",
          strength: data.strength || "",
          startDate: data.start_date || "",
          frequency: data.frequency || "daily",
          durationDays: data.duration_days || 7,
        })
        setDoseTimes(data.timings || ["08:00"])
      }
    } catch (error) {
      console.error("Error fetching medicine:", error)
      setError("Failed to load medicine details")
    } finally {
      setLoading(false)
    }
  }

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

    setSaving(true)
    setError("")
    setSuccess("")

    try {
      // Update medicine
      const { error: medicineError } = await supabase
        .from("medicines")
        .update({
          name: formData.name.trim(),
          formula: formData.formula?.trim() || null,
          company: formData.company?.trim() || null,
          strength: formData.strength?.trim() || null,
          start_date: formData.startDate,
          frequency: formData.frequency,
          timings: doseTimes,
          duration_days: Number.parseInt(formData.durationDays),
        })
        .eq("id", medicineId)
        .eq("user_id", user.id)

      if (medicineError) throw medicineError

      setSuccess("Medicine updated successfully!")

      // Redirect after 1 second
      setTimeout(() => {
        router.push("/dashboard/medicines")
      }, 1000)
    } catch (error) {
      console.error("Update error:", error)
      setError(error.message || "Failed to update medicine")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mb-4 mx-auto">
            <CircularProgress size={40} className="text-white" />
          </div>
          <Typography variant="h6" className="text-slate-700 font-semibold">
            Loading medicine details...
          </Typography>
          <Typography variant="body2" className="text-slate-500 mt-1">
            Preparing edit form
          </Typography>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="bg-gradient-to-r from-orange-600 via-red-600 to-pink-700 rounded-3xl p-8 text-white relative">
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

            <Typography variant="h3" className="font-bold mb-2 text-2xl md:text-4xl">
              Edit Medicine ✏️
            </Typography>
            <Typography variant="h6" className="opacity-90 font-medium">
              Update your medicine information and schedule
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
      <Paper className="p-8 rounded-3xl shadow-xl bg-gradient-to-br from-white via-orange-50 to-red-50 border border-orange-100">
        <form onSubmit={handleSubmit}>
          <Grid container spacing={4}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" className="font-bold text-slate-800 mb-4 flex items-center">
                <EditIcon className="mr-2 text-orange-500" />
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
              <Card className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-2xl">
                <CardContent className="p-6">
                  <Typography variant="h6" className="font-bold text-slate-800 mb-2 flex items-center">
                    <ScheduleIcon className="mr-2 text-orange-500" />
                    Dose Times
                  </Typography>
                  <Typography variant="body2" className="text-slate-600 mb-6">
                    Update times when you need to take this medicine
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
                    className="mt-2 border-2 border-orange-500 text-orange-600 hover:bg-orange-50 rounded-2xl"
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
                  onClick={() => router.push("/dashboard/medicines")}
                  className="px-8 py-3 border-2 border-slate-300 text-slate-600 hover:bg-slate-50 rounded-2xl"
                  size="large"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={saving}
                  className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                  size="large"
                >
                  {saving ? "Updating..." : "Update Medicine"}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </div>
  )
}
