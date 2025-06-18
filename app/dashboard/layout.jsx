"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../lib/auth-provider"
import { useSupabase } from "../lib/supabase-provider"
import {
  requestNotificationPermission,
  setupNotificationServiceWorker,
  scheduleUpcomingNotifications,
  startNotificationChecker,
  checkAndNotifyMissedDoses,
} from "../lib/notifications"
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Button,
  Avatar,
  useTheme,
  useMediaQuery,
} from "@mui/material"
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Medication as MedicationIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Close as CloseIcon,
} from "@mui/icons-material"

const drawerWidth = 300

export default function DashboardLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, signOut } = useAuth()
  const { supabase } = useSupabase()
  const router = useRouter()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleSignOut = async () => {
    await signOut()
    router.push("/login")
  }

  // Notification setup + missed dose checker
  useEffect(() => {
    const setupNotifications = async () => {
      try {
        const hasPermission = await requestNotificationPermission()
        if (hasPermission) {
          await setupNotificationServiceWorker()
          if (user) {
            scheduleUpcomingNotifications(supabase, user.id)
            const cleanup = startNotificationChecker(supabase, user.id)
            checkAndNotifyMissedDoses(supabase, user.id)

            const missedDoseInterval = setInterval(() => {
              checkAndNotifyMissedDoses(supabase, user.id)
            }, 120000)

            return () => {
              cleanup()
              clearInterval(missedDoseInterval)
            }
          }
        }
      } catch (error) {
        console.error("Error setting up notifications:", error)
      }
    }

    if (user) {
      const cleanup = setupNotifications()
      return () => {
        if (cleanup && typeof cleanup === "function") {
          cleanup()
        }
      }
    }
  }, [user, supabase])

  // Service worker message listener
  useEffect(() => {
    const handleServiceWorkerMessage = (event) => {
      if (event.data && event.data.type === "DOSE_TAKEN") {
        const doseId = event.data.doseId
        if (doseId) {
          supabase
            .from("doses")
            .update({
              taken: true,
              taken_at: new Date().toISOString(),
            })
            .eq("id", doseId)
            .then(() => {
              console.log("Dose marked as taken from notification")
            })
            .catch((error) => {
              console.error("Error marking dose as taken:", error)
            })
        }
      }
    }

    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", handleServiceWorkerMessage)
    }

    return () => {
      if (typeof window !== "undefined" && "serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("message", handleServiceWorkerMessage)
      }
    }
  }, [user, supabase])

  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard", color: "from-blue-500 to-cyan-500" },
    {
      text: "Medicines",
      icon: <MedicationIcon />,
      path: "/dashboard/medicines",
      color: "from-green-500 to-emerald-500",
    },
    { text: "History", icon: <HistoryIcon />, path: "/dashboard/history", color: "from-purple-500 to-violet-500" },
    { text: "Settings", icon: <SettingsIcon />, path: "/dashboard/settings", color: "from-orange-500 to-red-500" },
  ]

  const drawer = (
    <div className="h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-400/20 to-purple-600/20"></div>
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-10 w-24 h-24 bg-blue-400/10 rounded-full blur-lg"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
              <MedicationIcon className="text-white text-xl" />
            </div>
            <div>
              <Typography variant="h6" className="font-bold text-white">
                MedReminder
              </Typography>
            </div>
          </div>
          {isMobile && (
            <IconButton onClick={handleDrawerToggle} className="text-white/70 hover:text-white">
              <CloseIcon />
            </IconButton>
          )}
        </div>
      </div>

      {/* User Profile */}
      <div className="relative z-10 p-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
          <div className="flex items-center space-x-3">
            <Avatar className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 text-white font-bold shadow-lg">
              {user?.email?.charAt(0).toUpperCase()}
            </Avatar>
            <div className="flex-1 min-w-0">
              <Typography variant="body1" className="font-semibold text-white truncate">
                {user?.email?.split("@")[0]}
              </Typography>
              <Typography variant="caption" className="text-blue-200 block truncate">
                {user?.email}
              </Typography>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="relative z-10 px-4 flex-1">
        <List className="space-y-2">
          {menuItems.map((item, index) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                onClick={() => {
                  router.push(item.path)
                  if (isMobile) setMobileOpen(false)
                }}
                className="rounded-xl mx-2 hover:bg-white/10 transition-all duration-300 group"
                sx={{
                  "&:hover": {
                    transform: "translateX(8px)",
                  },
                }}
              >
                <ListItemIcon className="min-w-12">
                  <div
                    className={`w-10 h-10 bg-gradient-to-r ${item.color} rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300`}
                  >
                    {item.icon}
                  </div>
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  className="text-white font-medium"
                  primaryTypographyProps={{
                    className: "font-semibold",
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </div>

      {/* Bottom Section */}
      <div className="relative z-10 p-4 border-t border-white/10">
        <ListItemButton
          onClick={handleSignOut}
          className="rounded-xl hover:bg-red-500/20 transition-all duration-300 group"
        >
          <ListItemIcon className="min-w-12">
            <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
              <LogoutIcon className="text-white" />
            </div>
          </ListItemIcon>
          <ListItemText
            primary="Sign Out"
            className="text-white font-medium"
            primaryTypographyProps={{
              className: "font-semibold",
            }}
          />
        </ListItemButton>
      </div>
    </div>
  )

  return (
    <Box sx={{ display: "flex" }} className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <CssBaseline />

      {/* Top App Bar */}
      <AppBar
        position="fixed"
        className="bg-white/80 backdrop-blur-xl shadow-lg border-b border-white/20"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar className="bg-transparent">
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: "none" } }}
            className="text-slate-700 hover:bg-blue-100/50 rounded-xl"
          >
            <MenuIcon />
          </IconButton>

          <div className="flex-1 flex items-center justify-between">
            <div>
              <Typography variant="h6" noWrap component="div" className="text-slate-800 font-bold">
                Medicine Dashboard
              </Typography>
            </div>

            <div className="hidden md:flex items-center space-x-3">
              <Button
                onClick={handleSignOut}
                className="text-slate-600 hover:text-slate-800 hover:bg-slate-100/50 rounded-xl normal-case font-medium"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer */}
      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              border: "none",
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              border: "none",
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: "80px",
        }}
        className="min-h-screen"
      >
        <div className="max-w-7xl mx-auto">{children}</div>
      </Box>
    </Box>
  )
}
