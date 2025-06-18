"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "../../lib/supabase-provider"
import { useAuth } from "../../lib/auth-provider"
import {
  Typography,
  Grid,
  Button,
  CircularProgress,
  Paper,
  TextField,
  InputAdornment,
  Box,
  Container,
} from "@mui/material"
import { Add as AddIcon, Search as SearchIcon, ArrowBack as ArrowBackIcon } from "@mui/icons-material"
import { useRouter } from "next/navigation"
import MedicineCard from "../../components/medicine-card"

export default function MedicinesPage() {
  const { supabase } = useSupabase()
  const { user } = useAuth()
  const router = useRouter()
  const [medicines, setMedicines] = useState([])
  const [filteredMedicines, setFilteredMedicines] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (user) {
      fetchMedicines()
    }
  }, [user])

  useEffect(() => {
    if (searchTerm) {
      const filtered = medicines.filter(
        (medicine) =>
          medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          medicine.formula?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          medicine.company?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredMedicines(filtered)
    } else {
      setFilteredMedicines(medicines)
    }
  }, [searchTerm, medicines])

  const fetchMedicines = async () => {
    try {
      const { data, error } = await supabase
        .from("medicines")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setMedicines(data || [])
      setFilteredMedicines(data || [])
    } catch (error) {
      console.error("Error fetching medicines:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearchClick = (event) => {
    event.stopPropagation()
    event.target.focus()
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-4 mx-auto">
            <CircularProgress size={40} className="text-white" />
          </div>
          <Typography variant="h6" className="text-slate-700 font-semibold">
            Loading your medicines...
          </Typography>
          <Typography variant="body2" className="text-slate-500 mt-1">
            Organizing your medicine collection
          </Typography>
        </div>
      </div>
    )
  }

  return (
    <Container maxWidth={false} className="px-4 sm:px-6 lg:px-8" sx={{ maxWidth: "100%", overflow: "hidden" }}>
      <div className="space-y-8 w-full">
        {/* Header */}
        <div className="relative overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-700 rounded-3xl p-8 text-white relative">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
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

              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="flex-1 min-w-0">
                  <Typography variant="h3" className="font-bold mb-2 text-2xl md:text-4xl">
                    All Medicines ({filteredMedicines.length})
                  </Typography>
                  <Typography variant="h6" className="opacity-90 font-medium">
                    Manage your complete medicine collection
                  </Typography>
                </div>

                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => router.push("/dashboard/medicines/add")}
                  className="bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-2xl px-8 py-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 backdrop-blur-sm flex-shrink-0"
                  size="large"
                >
                  Add Medicine
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <Paper
          className="p-6 rounded-3xl shadow-xl bg-gradient-to-r from-white to-blue-50 border border-blue-100"
          onClick={(e) => e.stopPropagation()}
          sx={{ width: "100%", boxSizing: "border-box" }}
        >
          <TextField
            fullWidth
            placeholder="Search medicines by name, formula, or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClick={handleSearchClick}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon className="text-blue-500" />
                </InputAdornment>
              ),
            }}
            className="bg-white rounded-2xl"
            sx={{
              width: "100%",
              "& .MuiOutlinedInput-root": {
                borderRadius: "16px",
                border: "2px solid #e2e8f0",
                "&:hover": {
                  borderColor: "#3b82f6",
                },
                "&.Mui-focused": {
                  borderColor: "#3b82f6",
                },
              },
            }}
          />
        </Paper>

        {/* Medicines Grid */}
        <Box sx={{ width: "100%", overflow: "hidden" }}>
          {filteredMedicines.length === 0 ? (
            <div className="flex justify-center items-center w-full">
              <Paper className="p-16 rounded-3xl shadow-xl text-center bg-gradient-to-br from-white via-blue-50 to-purple-50 border border-blue-100 max-w-2xl mx-auto w-full">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <SearchIcon className="text-5xl text-blue-500" />
                </div>
                <Typography variant="h5" className="text-slate-700 font-bold mb-3">
                  {searchTerm ? "No medicines found" : "No medicines added yet"}
                </Typography>
                <Typography variant="body1" className="text-slate-500 mb-8 max-w-md mx-auto">
                  {searchTerm
                    ? "Try a different search term or check your spelling"
                    : "Start building your medicine collection by adding your first medicine"}
                </Typography>
                {!searchTerm && (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => router.push("/dashboard/medicines/add")}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-2xl px-8 py-4 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                    size="large"
                  >
                    Add Your First Medicine
                  </Button>
                )}
              </Paper>
            </div>
          ) : (
            <div className="w-full">
              <Box className="mb-6">
                <Typography variant="h6" className="text-slate-700 font-semibold">
                  {searchTerm
                    ? `Found ${filteredMedicines.length} medicine${filteredMedicines.length !== 1 ? "s" : ""}`
                    : "Your Medicine Collection"}
                </Typography>
              </Box>
              <Grid container spacing={4} sx={{ width: "100%", margin: 0 }}>
                {filteredMedicines.map((medicine) => (
                  <Grid
                    item
                    xs={12}
                    sm={6}
                    lg={4}
                    key={medicine.id}
                    sx={{
                      width: "100%",
                      paddingLeft: "16px !important",
                      paddingTop: "16px !important",
                    }}
                  >
                    <MedicineCard medicine={medicine} onUpdate={fetchMedicines} />
                  </Grid>
                ))}
              </Grid>
            </div>
          )}
        </Box>
      </div>
    </Container>
  )
}
