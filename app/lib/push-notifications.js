"use client"

// Convert VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// Register service worker
export const registerServiceWorker = async () => {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Service Worker not supported")
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js")
    console.log("Service Worker registered successfully:", registration)
    await navigator.serviceWorker.ready
    return registration
  } catch (error) {
    console.error("Service Worker registration failed:", error)
    throw error
  }
}

// Subscribe to push notifications - SIMPLE VERSION
export const subscribeToPushNotifications = async (supabase, userId) => {
  try {
    console.log("Starting push notification subscription for user:", userId)

    const permission = await Notification.requestPermission()
    console.log("Notification permission:", permission)

    if (permission !== "granted") {
      throw new Error("Notification permission denied")
    }

    // Check for VAPID key
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

    if (!vapidPublicKey) {
      console.error("VAPID public key not found in environment variables")
      throw new Error("VAPID public key not configured. Please set NEXT_PUBLIC_VAPID_PUBLIC_KEY environment variable.")
    }

    console.log("VAPID key found:", vapidPublicKey.substring(0, 20) + "...")

    const registration = await registerServiceWorker()

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    })

    console.log("Push subscription created:", subscription)

    const keys = subscription.toJSON().keys

    // Simple subscription data without user_agent
    const subscriptionData = {
      user_id: userId,
      endpoint: subscription.endpoint,
      p256dh: keys?.p256dh || "fallback-p256dh-key",
      auth: keys?.auth || "fallback-auth-key",
      is_active: true,
    }

    console.log("Saving subscription data...")

    // First, deactivate existing subscriptions
    await supabase.from("push_subscriptions").update({ is_active: false }).eq("user_id", userId)

    // Insert new subscription
    const { data, error } = await supabase.from("push_subscriptions").insert(subscriptionData).select()

    if (error) {
      console.error("Database error:", error)
      throw new Error(`Failed to save subscription: ${error.message}`)
    }

    console.log("Push subscription saved successfully:", data)
    return subscription
  } catch (error) {
    console.error("Push subscription failed:", error)
    throw error
  }
}

// Unsubscribe from push notifications
export const unsubscribeFromPushNotifications = async (supabase, userId) => {
  try {
    const registration = await navigator.serviceWorker.getRegistration()
    if (!registration) return true

    const subscription = await registration.pushManager.getSubscription()
    if (subscription) {
      await subscription.unsubscribe()
    }

    const { error } = await supabase.from("push_subscriptions").update({ is_active: false }).eq("user_id", userId)

    if (error) {
      console.error("Error removing push subscription:", error)
      throw error
    }

    console.log("Push subscription removed successfully")
    return true
  } catch (error) {
    console.error("Unsubscribe failed:", error)
    throw error
  }
}

// Test push notification using ServiceWorker
export const testPushNotification = async () => {
  try {
    const registration = await navigator.serviceWorker.getRegistration()
    if (!registration) {
      throw new Error("Service Worker not registered")
    }

    await registration.showNotification("🧪 Test Notification", {
      body: "This is a test notification from MedReminder! 💊",
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: "test-notification",
      requireInteraction: true,
      actions: [
        {
          action: "view",
          title: "View Dashboard",
        },
      ],
      data: {
        url: "/dashboard",
      },
    })

    return true
  } catch (error) {
    console.error("Test notification failed:", error)
    throw error
  }
}

// Request notification permission
export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) {
    throw new Error("Notifications not supported")
  }

  if (Notification.permission === "granted") {
    return true
  }

  if (Notification.permission === "denied") {
    throw new Error("Notification permission denied")
  }

  const permission = await Notification.requestPermission()
  return permission === "granted"
}

// Check if push notifications are supported
export const isPushNotificationSupported = () => {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window
}

// Get current subscription status
export const getSubscriptionStatus = async () => {
  try {
    if (!isPushNotificationSupported()) {
      return { supported: false, subscribed: false }
    }

    const registration = await navigator.serviceWorker.getRegistration()
    if (!registration) {
      return { supported: true, subscribed: false }
    }

    const subscription = await registration.pushManager.getSubscription()
    return {
      supported: true,
      subscribed: !!subscription,
      permission: Notification.permission,
    }
  } catch (error) {
    console.error("Error checking subscription status:", error)
    return { supported: false, subscribed: false, error: error.message }
  }
}

// Schedule notification for a dose
export const scheduleNotificationForDose = async (supabase, medicine, dose) => {
  try {
    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("id")
      .eq("user_id", medicine.user_id)
      .eq("is_active", true)
      .limit(1)

    if (!subscriptions || subscriptions.length === 0) {
      console.log("No active push subscriptions found")
      return false
    }

    const notification = {
      user_id: medicine.user_id,
      medicine_id: medicine.id,
      dose_id: dose.id,
      push_subscription_id: subscriptions[0].id,
      title: `💊 Time for ${medicine.name}`,
      body: `It's time to take your ${medicine.name}${medicine.strength ? ` (${medicine.strength})` : ""}`,
      status: "pending",
      scheduled_for: dose.dose_time,
    }

    const { error } = await supabase.from("notifications").insert(notification)

    if (error) {
      console.error("Error scheduling notification:", error)
      throw error
    }

    console.log("Notification scheduled for:", dose.dose_time)
    return true
  } catch (error) {
    console.error("Error scheduling notification:", error)
    return false
  }
}

// Schedule notifications for multiple doses
export const scheduleNotificationsForDoses = async (supabase, medicine, doses) => {
  if (!doses || doses.length === 0) {
    console.log("No doses to schedule notifications for")
    return true
  }

  try {
    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("id")
      .eq("user_id", medicine.user_id)
      .eq("is_active", true)
      .limit(1)

    if (!subscriptions || subscriptions.length === 0) {
      console.log("No active push subscriptions found")
      return false
    }

    const notifications = doses.map((dose) => ({
      user_id: medicine.user_id,
      medicine_id: medicine.id,
      dose_id: dose.id,
      push_subscription_id: subscriptions[0].id,
      title: `💊 Time for ${medicine.name}`,
      body: `It's time to take your ${medicine.name}${medicine.strength ? ` (${medicine.strength})` : ""}`,
      status: "pending",
      scheduled_for: dose.dose_time,
    }))

    const { error } = await supabase.from("notifications").insert(notifications)

    if (error) {
      console.error("Error scheduling bulk notifications:", error)
      throw error
    }

    console.log(`Successfully scheduled ${notifications.length} notifications`)
    return true
  } catch (error) {
    console.error("Error scheduling bulk notifications:", error)
    return false
  }
}
