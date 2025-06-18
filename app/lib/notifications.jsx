"use client"

import {
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  scheduleNotificationForDose,
  scheduleNotificationsForDoses,
  testPushNotification,
  requestNotificationPermission,
  registerServiceWorker,
} from "./push-notifications"

// Re-export all push notification functions
export {
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  scheduleNotificationForDose,
  scheduleNotificationsForDoses,
  testPushNotification,
  requestNotificationPermission,
  registerServiceWorker,
}

// Legacy support
export const setupNotificationServiceWorker = registerServiceWorker

export const getNotificationPermission = () => {
  if (!("Notification" in window)) {
    return "not-supported"
  }
  return Notification.permission
}

export const showNotification = (title, options = {}) => {
  if (Notification.permission === "granted") {
    const { actions, ...cleanOptions } = options

    const notification = new Notification(title, {
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      ...cleanOptions,
    })

    setTimeout(() => {
      notification.close()
    }, 10000)

    return notification
  }
}

export const showServiceWorkerNotification = async (title, options = {}) => {
  try {
    const registration = await navigator.serviceWorker.getRegistration()
    if (!registration) {
      throw new Error("Service Worker not registered")
    }

    await registration.showNotification(title, {
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      requireInteraction: true,
      ...options,
    })

    return true
  } catch (error) {
    console.error("ServiceWorker notification failed:", error)
    return false
  }
}

export const scheduleUpcomingNotifications = async (supabase, userId) => {
  try {
    if (!userId) {
      console.log("No user ID provided for scheduling notifications")
      return
    }

    const { data: doses, error } = await supabase
      .from("doses")
      .select(`
        *,
        medicines (
          id,
          name,
          strength,
          user_id
        )
      `)
      .eq("taken", false)
      .gt("dose_time", new Date().toISOString())
      .lt("dose_time", new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString())
      .order("dose_time", { ascending: true })

    if (error) {
      console.error("Error fetching upcoming doses:", error)
      return
    }

    if (!doses || doses.length === 0) {
      console.log("No upcoming doses found for notifications")
      return
    }

    let scheduledCount = 0
    doses.forEach((dose) => {
      if (dose.medicines) {
        const doseTime = new Date(dose.dose_time)
        const now = new Date()
        const timeDiff = doseTime.getTime() - now.getTime()

        if (timeDiff > 0 && timeDiff <= 24 * 60 * 60 * 1000) {
          setTimeout(async () => {
            await showServiceWorkerNotification(`💊 Time for ${dose.medicines.name}`, {
              body: `It's time to take your ${dose.medicines.name}${dose.medicines.strength ? ` (${dose.medicines.strength})` : ""}`,
              tag: `dose-${dose.id}`,
              data: {
                doseId: dose.id,
                url: "/dashboard",
              },
              actions: [
                { action: "mark-taken", title: "✅ Mark as Taken" },
                { action: "view", title: "👁️ View Dashboard" },
              ],
            })
          }, timeDiff)
          scheduledCount++
        }
      }
    })

    console.log(`Scheduled ${scheduledCount} ServiceWorker notifications`)
  } catch (error) {
    console.error("Error scheduling notifications:", error)
  }
}

export const startNotificationChecker = (supabase, userId) => {
  const checkInterval = setInterval(async () => {
    try {
      const now = new Date()
      const oneMinuteAgo = new Date(now.getTime() - 60000)
      const oneMinuteFromNow = new Date(now.getTime() + 60000)

      const { data: dueDoses, error } = await supabase
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
        .gte("dose_time", oneMinuteAgo.toISOString())
        .lte("dose_time", oneMinuteFromNow.toISOString())

      if (error) {
        console.error("Error checking due doses:", error)
        return
      }

      if (dueDoses && dueDoses.length > 0) {
        dueDoses.forEach(async (dose) => {
          if (dose.medicines) {
            console.log(`Showing notification for dose: ${dose.medicines.name}`)

            await showServiceWorkerNotification(`💊 Time for ${dose.medicines.name}`, {
              body: `It's time to take your ${dose.medicines.name}${dose.medicines.strength ? ` (${dose.medicines.strength})` : ""}`,
              tag: `dose-${dose.id}`,
              data: {
                doseId: dose.id,
                url: "/dashboard",
              },
              actions: [
                { action: "mark-taken", title: "✅ Mark as Taken" },
                { action: "view", title: "👁️ View Dashboard" },
              ],
            })
          }
        })
      }
    } catch (error) {
      console.error("Error in notification checker:", error)
    }
  }, 60000)

  return () => clearInterval(checkInterval)
}

export const checkAndNotifyMissedDoses = async (supabase, userId) => {
  try {
    const now = new Date()
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000)
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

    // Get doses that became missed in last 15 minutes
    const { data: recentlyMissedDoses, error } = await supabase
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
      .gte("dose_time", oneHourAgo.toISOString()) // Not older than 1 hour
      .lt("dose_time", fifteenMinutesAgo.toISOString()) // More than 15 minutes ago
      .order("dose_time", { ascending: false })

    if (error) {
      console.error("Error checking missed doses:", error)
      return
    }

    if (recentlyMissedDoses && recentlyMissedDoses.length > 0) {
      console.log(`Found ${recentlyMissedDoses.length} recently missed doses`)

      for (const dose of recentlyMissedDoses) {
        if (dose.medicines) {
          // Use showServiceWorkerNotification function instead of direct Notification API
          await showServiceWorkerNotification(`⚠️ Missed: ${dose.medicines.name}`, {
            body: `You missed your ${dose.medicines.name} dose scheduled for ${new Date(dose.dose_time).toLocaleTimeString()}`,
            tag: `missed-${dose.id}`,
            icon: "/favicon.ico",
            badge: "/favicon.ico",
            requireInteraction: true,
            data: {
              doseId: dose.id,
              medicineId: dose.medicine_id,
              type: "missed",
              url: "/dashboard",
            },
            actions: [
              {
                action: "take-late",
                title: "✅ Take Now",
              },
              {
                action: "skip",
                title: "❌ Skip",
              },
            ],
          })

          console.log(`Sent missed dose notification for: ${dose.medicines.name}`)
        }
      }
    }
  } catch (error) {
    console.error("Error in checkAndNotifyMissedDoses:", error)
  }
}
