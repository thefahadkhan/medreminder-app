"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "../lib/supabase-provider"
import {
  Card,
  CardContent,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Box,
} from "@mui/material"
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Medication as MedicationIcon,
  Schedule as ScheduleIcon,
} from "@mui/icons-material"
import { format } from "date-fns"

export default function MedicineCard({ medicine, onUpdate }) {
  const { supabase } = useSupabase()
  const router = useRouter()
  const [anchorEl, setAnchorEl] = useState(null)
  const open = Boolean(anchorEl)

  const handleMenuClick = (event) => {
    event.stopPropagation()
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleEdit = (event) => {
    event.stopPropagation()
    handleClose()
    router.push(`/dashboard/medicines/edit/${medicine.id}`)
  }

  const handleDelete = async (event) => {
    event.stopPropagation()
    handleClose()
    if (confirm("Are you sure you want to delete this medicine?")) {
      try {
        await supabase.from("doses").delete().eq("medicine_id", medicine.id)
        const { error } = await supabase.from("medicines").delete().eq("id", medicine.id)
        if (error) throw error
        onUpdate()
      } catch (error) {
        console.error("Error deleting medicine:", error)
      }
    }
  }

  const handleCardClick = (event) => {
    if (event.target === event.currentTarget || event.target.closest(".card-content-area")) {
      router.push(`/dashboard/medicines/${medicine.id}`)
    }
  }

  return (
    <Box className="w-full">
      <Card
        className="h-full cursor-pointer transition-all duration-300 hover:shadow-2xl rounded-3xl bg-gradient-to-br from-white via-blue-50 to-purple-50 border border-blue-100 group w-full"
        onClick={handleCardClick}
        sx={{ width: "100%", maxWidth: "100%" }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-400 to-pink-500 rounded-full translate-y-12 -translate-x-12"></div>
        </div>

        <CardContent
          className="p-4 sm:p-6 relative z-10 card-content-area"
          sx={{ width: "100%", boxSizing: "border-box" }}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 flex-shrink-0">
                <MedicationIcon className="text-white text-lg sm:text-xl" />
              </div>
              <div className="flex-1 min-w-0">
                <Typography
                  variant="h6"
                  component="div"
                  className="font-bold text-slate-800 text-sm sm:text-base"
                  sx={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: "100%",
                  }}
                  title={medicine.name}
                >
                  {medicine.name}
                </Typography>
                <Chip
                  label={medicine.status === "active" ? "Active" : "Completed"}
                  size="small"
                  className={`mt-1 text-xs ${
                    medicine.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                  }`}
                />
              </div>
            </div>

            <IconButton
              aria-label="more"
              onClick={handleMenuClick}
              className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl flex-shrink-0"
              size="small"
            >
              <MoreVertIcon />
            </IconButton>
          </div>

          {/* Details */}
          <div className="space-y-2 sm:space-y-3">
            {medicine.formula && (
              <div className="grid grid-cols-3 gap-2 items-start">
                <Typography variant="body2" className="font-semibold text-slate-600 text-xs sm:text-sm">
                  Formula:
                </Typography>
                <Typography
                  variant="body2"
                  className="text-slate-800 text-xs sm:text-sm col-span-2"
                  sx={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={medicine.formula}
                >
                  {medicine.formula}
                </Typography>
              </div>
            )}

            {medicine.strength && (
              <div className="grid grid-cols-3 gap-2 items-start">
                <Typography variant="body2" className="font-semibold text-slate-600 text-xs sm:text-sm">
                  Strength:
                </Typography>
                <Typography
                  variant="body2"
                  className="text-slate-800 text-xs sm:text-sm col-span-2"
                  title={medicine.strength}
                >
                  {medicine.strength}
                </Typography>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 items-start">
              <Typography variant="body2" className="font-semibold text-slate-600 text-xs sm:text-sm">
                Frequency:
              </Typography>
              <Typography variant="body2" className="text-slate-800 capitalize text-xs sm:text-sm col-span-2">
                {medicine.frequency.replace(/_/g, " ")}
              </Typography>
            </div>

            <div className="grid grid-cols-3 gap-2 items-start">
              <Typography variant="body2" className="font-semibold text-slate-600 text-xs sm:text-sm">
                Started:
              </Typography>
              <Typography variant="body2" className="text-slate-800 text-xs sm:text-sm col-span-2">
                {format(new Date(medicine.start_date), "MMM d, yyyy")}
              </Typography>
            </div>
          </div>

          {/* Dose Times */}
          <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-200">
            <div className="flex items-center mb-2">
              <ScheduleIcon className="text-blue-500 mr-2 text-sm sm:text-base flex-shrink-0" />
              <Typography variant="body2" className="text-slate-600 font-semibold text-xs sm:text-sm">
                Dose Times:
              </Typography>
            </div>
            <div className="flex flex-wrap gap-1 sm:gap-2">
              {medicine.timings.map((time, index) => (
                <Chip key={index} label={time} size="small" className="bg-blue-100 text-blue-700 font-medium text-xs" />
              ))}
            </div>
          </div>
        </CardContent>

        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          onClick={(e) => e.stopPropagation()}
          PaperProps={{
            className: "rounded-2xl shadow-xl border border-slate-200",
          }}
        >
          <MenuItem onClick={handleEdit} className="text-blue-600 hover:bg-blue-50 rounded-xl mx-2 my-1">
            <ListItemIcon>
              <EditIcon fontSize="small" className="text-blue-600" />
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleDelete} className="text-red-600 hover:bg-red-50 rounded-xl mx-2 my-1">
            <ListItemIcon>
              <DeleteIcon fontSize="small" className="text-red-600" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        </Menu>
      </Card>
    </Box>
  )
}
