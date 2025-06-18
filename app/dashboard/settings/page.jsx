"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../../lib/auth-provider"
import { useSupabase } from "../../lib/supabase-provider"
import {
  Typography,
  Grid,
  TextField,
  Button,
  Switch,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Chip,
  Card,
  CardContent,
} from "@mui/material"
import {
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Palette as PaletteIcon,
  Delete as DeleteIcon,
  Logout as LogoutIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from "@mui/icons-material"
import {
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  testPushNotification,
  requestNotificationPermission,
  isPushNotificationSupported,
} from "../../lib/push-notifications"

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const { supabase } = useSupabase()
  const router = useRouter()

  // Profile state
  const [profile, setProfile] = useState({
    displayName: "",
    email: user?.email || "",
  })

  // Settings state
  const [settings, setSettings] = useState({
    pushNotifications: false,
    reminderSound: true,
    autoMarkMissed: true,
  })

  // UI state
  const [loading, setLoading] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(true)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [notificationStatus, setNotificationStatus] = useState({
    supported: false,
    subscribed: false,
    permission: "default",
    hasActiveSubscription: false,
  })

  useEffect(() => {
    if (user) {
      loadUserProfile()
      loadSettings()
      checkNotificationStatus()
    }
  }, [user])

  const loadUserProfile = async () => {
    try {
      const displayName = user.email?.split("@")[0] || ""
      setProfile({
        displayName,
        email: user.email || "",
      })
    } catch (error) {
      console.error("Error loading profile:", error)
    }
  }

  const loadSettings = () => {
    try {
      const savedSettings = localStorage.getItem("medreminder_settings")
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings)
        setSettings(parsedSettings)
      }
    } catch (error) {
      console.error("Error loading settings:", error)
    }
  }

  const checkNotificationStatus = async () => {
    setCheckingStatus(true)
    try {
      // Check if push notifications are supported
      const supported = isPushNotificationSupported()

      let browserSubscribed = false
      let permission = "default"

      if (supported) {
        // Check browser permission
        permission = Notification.permission

        // Check if there's an active service worker subscription
        if ("serviceWorker" in navigator) {
          const registration = await navigator.serviceWorker.getRegistration()
          if (registration) {
            const subscription = await registration.pushManager.getSubscription()
            browserSubscribed = !!subscription
          }
        }
      }

      // Check database for active subscription
      let hasActiveSubscription = false
      if (user) {
        const { data: subscriptions, error } = await supabase
          .from("push_subscriptions")
          .select("id, is_active")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .limit(1)

        if (!error && subscriptions && subscriptions.length > 0) {
          hasActiveSubscription = true
        }
      }

      // Final status - user is truly subscribed only if both browser and database agree
      const isReallySubscribed = browserSubscribed && hasActiveSubscription && permission === "granted"

      setNotificationStatus({
        supported,
        subscribed: isReallySubscribed,
        permission,
        hasActiveSubscription,
      })

      // Update settings based on actual status
      handleSettingChange("pushNotifications", isReallySubscribed)

      console.log("Notification Status Check:", {
        supported,
        browserSubscribed,
        hasActiveSubscription,
        permission,
        finalStatus: isReallySubscribed,
      })
    } catch (error) {
      console.error("Error checking notification status:", error)
      setNotificationStatus({
        supported: false,
        subscribed: false,
        permission: "default",
        hasActiveSubscription: false,
      })
    } finally {
      setCheckingStatus(false)
    }
  }

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          display_name: profile.displayName,
        },
      })

      if (error) throw error

      setSuccess("Profile updated successfully!")
    } catch (error) {
      setError(error.message || "Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordReset = async () => {
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      })

      if (error) throw error

      setSuccess("Password reset email sent! Check your inbox.")
    } catch (error) {
      setError(error.message || "Failed to send password reset email")
    } finally {
      setLoading(false)
    }
  }

  const handleSettingChange = (setting, value) => {
    const newSettings = {
      ...settings,
      [setting]: value,
    }
    setSettings(newSettings)

    // Save to localStorage
    localStorage.setItem("medreminder_settings", JSON.stringify(newSettings))
  }

  const toggleNotifications = async () => {
    if (notificationStatus.subscribed) {
      // Disable notifications
      try {
        setLoading(true)
        await unsubscribeFromPushNotifications(supabase, user.id)

        // Update status immediately
        setNotificationStatus((prev) => ({
          ...prev,
          subscribed: false,
          hasActiveSubscription: false,
        }))
        handleSettingChange("pushNotifications", false)
        setSuccess("Push notifications disabled successfully!")
      } catch (error) {
        setError("Failed to disable notifications: " + error.message)
      } finally {
        setLoading(false)
      }
      return
    }

    // Enable notifications
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      // Check if notifications are supported
      if (!notificationStatus.supported) {
        throw new Error("Push notifications are not supported in this browser")
      }

      // Request permission and subscribe
      const hasPermission = await requestNotificationPermission()
      if (!hasPermission) {
        throw new Error("Notification permission denied")
      }

      await subscribeToPushNotifications(supabase, user.id)

      // Update status immediately
      setNotificationStatus((prev) => ({
        ...prev,
        subscribed: true,
        permission: "granted",
        hasActiveSubscription: true,
      }))

      handleSettingChange("pushNotifications", true)
      setSuccess("Push notifications enabled successfully!")

      // Test notification after 2 seconds
      setTimeout(async () => {
        try {
          await testPushNotification()
        } catch (error) {
          console.error("Test notification failed:", error)
        }
      }, 2000)
    } catch (error) {
      console.error("Error enabling notifications:", error)
      setError("Error enabling notifications: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const testNotification = async () => {
    try {
      setLoading(true)
      await testPushNotification()
      setSuccess("Test notification sent!")
    } catch (error) {
      setError("Test notification failed: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    setLoading(true)
    setError("")

    try {
      await supabase.from("doses").delete().neq("id", "00000000-0000-0000-0000-000000000000")
      await supabase.from("medicines").delete().eq("user_id", user.id)
      await signOut()
      router.push("/")
    } catch (error) {
      setError(error.message || "Failed to delete account")
    } finally {
      setLoading(false)
      setDeleteDialogOpen(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push("/login")
  }

  const getNotificationStatusChip = () => {
    if (checkingStatus) {
      return <Chip label="Checking..." color="default" size="small" />
    }

    if (!notificationStatus.supported) {
      return <Chip label="Not Supported" color="error" size="small" />
    }

    if (notificationStatus.subscribed) {
      return <Chip label="Enabled" color="success" size="small" icon={<CheckCircleIcon />} />
    }

    if (notificationStatus.permission === "denied") {
      return <Chip label="Permission Denied" color="error" size="small" icon={<ErrorIcon />} />
    }

    return <Chip label="Disabled" color="default" size="small" />
  }

  const getNotificationButtonText = () => {
    if (loading) return "..."
    if (checkingStatus) return "CHECKING"
    return notificationStatus.subscribed ? "ENABLED" : "ENABLE"
  }

  const getNotificationButtonColor = () => {
    if (checkingStatus || loading) return "default"
    return notificationStatus.subscribed ? "success" : "primary"
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="bg-gradient-to-r from-slate-800 via-gray-800 to-zinc-900 rounded-3xl p-8 text-white relative">
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

            <Typography variant="h3" className="font-bold mb-2 text-2xl md:text-4xl">
              Settings ⚙️
            </Typography>
            <Typography variant="h6" className="opacity-90 font-medium">
              Manage your account and app preferences
            </Typography>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <Alert severity="success" onClose={() => setSuccess("")} className="rounded-2xl shadow-lg">
          {success}
        </Alert>
      )}
      {error && (
        <Alert severity="error" onClose={() => setError("")} className="rounded-2xl shadow-lg">
          {error}
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* Profile Settings */}
        <Grid item xs={12} md={6}>
          <Card className="h-full rounded-3xl shadow-xl bg-gradient-to-br from-white via-blue-50 to-purple-50 border border-blue-100">
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mr-3">
                  <PersonIcon className="text-white" />
                </div>
                <Typography variant="h6" className="font-bold text-slate-800">
                  Profile Information
                </Typography>
              </div>

              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <TextField
                  label="Display Name"
                  fullWidth
                  value={profile.displayName}
                  onChange={(e) => setProfile((prev) => ({ ...prev, displayName: e.target.value }))}
                  className="bg-white rounded-2xl"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "16px",
                    },
                  }}
                />

                <TextField
                  label="Email Address"
                  fullWidth
                  value={profile.email}
                  disabled
                  className="bg-gray-100 rounded-2xl"
                  helperText="Email cannot be changed"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "16px",
                    },
                  }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-2xl px-8 py-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                  startIcon={loading && <CircularProgress size={16} />}
                >
                  {loading ? "Updating..." : "Update Profile"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* Security Settings */}
        <Grid item xs={12} md={6}>
          <Card className="h-full rounded-3xl shadow-xl bg-gradient-to-br from-white via-green-50 to-emerald-50 border border-green-100">
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mr-3">
                  <SecurityIcon className="text-white" />
                </div>
                <Typography variant="h6" className="font-bold text-slate-800">
                  Security
                </Typography>
              </div>

              <div className="space-y-6">
                <div>
                  <Typography variant="body1" className="text-slate-700 mb-4 font-medium">
                    Change your password to keep your account secure
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={handlePasswordReset}
                    disabled={loading}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-2xl px-8 py-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                    startIcon={loading && <CircularProgress size={16} />}
                  >
                    {loading ? "Sending..." : "Reset Password"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </Grid>

        {/* Notification Settings */}
        <Grid item xs={12}>
          <Card className="rounded-3xl shadow-xl bg-gradient-to-br from-white via-orange-50 to-red-50 border border-orange-100">
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mr-3">
                  <NotificationsIcon className="text-white" />
                </div>
                <Typography variant="h6" className="font-bold text-slate-800">
                  Notification Preferences
                </Typography>
              </div>

              <div className="space-y-6">
                {/* Push Notifications */}
                <Card className="bg-white/70 backdrop-blur-sm border border-orange-200 rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <Typography variant="h6" className="font-bold text-slate-800 mb-2">
                          Push Notifications
                        </Typography>
                        <Typography variant="body2" className="text-slate-600 mb-3">
                          {`Receive browser push notifications ${
                            notificationStatus.subscribed ? "(Click to disable)" : "(Click to enable)"
                          }`}
                        </Typography>
                        {getNotificationStatusChip()}
                      </div>
                      <div className="flex gap-3">
                        <Button
                          variant="contained"
                          color={getNotificationButtonColor()}
                          onClick={toggleNotifications}
                          disabled={loading || checkingStatus || !notificationStatus.supported}
                          className="rounded-2xl px-6 py-2 font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                        >
                          {getNotificationButtonText()}
                        </Button>
                        {notificationStatus.subscribed && !checkingStatus && (
                          <Button
                            variant="outlined"
                            onClick={testNotification}
                            disabled={loading}
                            className="border-2 border-orange-500 text-orange-600 hover:bg-orange-50 rounded-2xl px-6 py-2 font-bold"
                          >
                            TEST
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Reminder Sound */}
                <Card className="bg-white/70 backdrop-blur-sm border border-orange-200 rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Typography variant="h6" className="font-bold text-slate-800 mb-1">
                          Reminder Sound
                        </Typography>
                        <Typography variant="body2" className="text-slate-600">
                          Play sound with notifications
                        </Typography>
                      </div>
                      <Switch
                        checked={settings.reminderSound}
                        onChange={(e) => handleSettingChange("reminderSound", e.target.checked)}
                        color="primary"
                        size="large"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </Grid>

        {/* App Settings */}
        <Grid item xs={12} md={6}>
          <Card className="h-full rounded-3xl shadow-xl bg-gradient-to-br from-white via-purple-50 to-pink-50 border border-purple-100">
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mr-3">
                  <PaletteIcon className="text-white" />
                </div>
                <Typography variant="h6" className="font-bold text-slate-800">
                  App Preferences
                </Typography>
              </div>

              <Card className="bg-white/70 backdrop-blur-sm border border-purple-200 rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Typography variant="h6" className="font-bold text-slate-800 mb-1">
                        Auto Mark Missed
                      </Typography>
                      <Typography variant="body2" className="text-slate-600">
                        Automatically mark overdue doses as missed
                      </Typography>
                    </div>
                    <Switch
                      checked={settings.autoMarkMissed}
                      onChange={(e) => handleSettingChange("autoMarkMissed", e.target.checked)}
                      color="primary"
                      size="large"
                    />
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </Grid>

        {/* Danger Zone */}
        <Grid item xs={12}>
          <Card className="rounded-3xl shadow-xl bg-gradient-to-br from-red-50 via-pink-50 to-rose-50 border-2 border-red-200">
            <CardContent className="p-6 sm:p-8">
              <Typography variant="h6" className="font-bold text-red-600 mb-6 flex items-center">
                <DeleteIcon className="mr-2" />
                Danger Zone
              </Typography>

              <div className="space-y-6">
                <Card className="bg-white/70 backdrop-blur-sm border border-red-200 rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <Typography variant="h6" className="font-bold text-slate-800 mb-1">
                          Sign Out
                        </Typography>
                        <Typography variant="body2" className="text-slate-600">
                          Sign out of your account on this device
                        </Typography>
                      </div>
                      <Button
                        variant="contained"
                        startIcon={<LogoutIcon />}
                        onClick={handleSignOut}
                        className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded-2xl px-6 py-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                      >
                        Sign Out
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Divider />

                <Card className="bg-white/70 backdrop-blur-sm border border-red-200 rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <Typography variant="h6" className="font-bold text-red-600 mb-1">
                          Delete Account
                        </Typography>
                        <Typography variant="body2" className="text-slate-600">
                          Permanently delete your account and all data
                        </Typography>
                      </div>
                      <Button
                        variant="contained"
                        startIcon={<DeleteIcon />}
                        onClick={() => setDeleteDialogOpen(true)}
                        className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 rounded-2xl px-6 py-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                      >
                        Delete Account
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Delete Account Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          className: "rounded-3xl",
        }}
      >
        <DialogTitle className="text-red-600 font-bold text-xl">Delete Account</DialogTitle>
        <DialogContent className="pt-4">
          <Typography className="mb-4">
            Are you sure you want to delete your account? This action cannot be undone and will permanently delete:
          </Typography>
          <ul className="list-disc list-inside mt-2 space-y-2 text-slate-600">
            <li>All your medicines</li>
            <li>All dose history</li>
            <li>Your profile information</li>
            <li>All app settings</li>
          </ul>
        </DialogContent>
        <DialogActions className="p-6 pt-4">
          <Button onClick={() => setDeleteDialogOpen(false)} className="rounded-2xl px-6 py-2">
            Cancel
          </Button>
          <Button
            onClick={handleDeleteAccount}
            color="error"
            disabled={loading}
            variant="contained"
            className="bg-red-500 hover:bg-red-600 rounded-2xl px-6 py-2"
          >
            {loading ? "Deleting..." : "Delete Account"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
