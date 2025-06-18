// Service Worker for Push Notifications
const CACHE_NAME = "medreminder-v1"

// Install event
self.addEventListener("install", (event) => {
  console.log("Service Worker installing...")
  self.skipWaiting()
})

// Activate event
self.addEventListener("activate", (event) => {
  console.log("Service Worker activating...")
  event.waitUntil(self.clients.claim())
})

// Push event - Handle incoming push notifications
self.addEventListener("push", (event) => {
  console.log("Push notification received:", event)

  if (!event.data) {
    console.log("No data in push event")
    return
  }

  try {
    const data = event.data.json()
    console.log("Push data:", data)

    const options = {
      body: data.body || "Time for your medicine!",
      icon: data.icon || "/favicon.ico",
      badge: data.badge || "/favicon.ico",
      tag: data.tag || "medicine-reminder",
      data: data.data || {},
      requireInteraction: true,
      actions: data.actions || [
        {
          action: "mark-taken",
          title: "✅ Mark as Taken",
        },
        {
          action: "view",
          title: "👁️ View Dashboard",
        },
      ],
      vibrate: [200, 100, 200], // Vibration pattern
      timestamp: Date.now(),
    }

    event.waitUntil(
      self.registration.showNotification(data.title || "💊 Medicine Reminder", options)
    )
  } catch (error) {
    console.error("Error parsing push data:", error)

    // Fallback notification
    event.waitUntil(
      self.registration.showNotification("💊 Medicine Reminder", {
        body: "Time for your medicine!",
        icon: "/favicon.ico",
        tag: "medicine-reminder-fallback",
        requireInteraction: true,
      })
    )
  }
})

// Notification click event
self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked:", event)

  event.notification.close()

  const action = event.action
  const data = event.notification.data

  if (action === "mark-taken" && data.doseId) {
    // Handle mark as taken
    event.waitUntil(handleMarkAsTaken(data.doseId))
  } else if (action === "take-late" && data.doseId) {
    // Handle take late (for missed doses)
    event.waitUntil(handleMarkAsTaken(data.doseId))
  } else if (action === "view" || !action) {
    // Open dashboard
    event.waitUntil(clients.openWindow(data.url || "/dashboard"))
  }
})

// Handle marking dose as taken
async function handleMarkAsTaken(doseId) {
  try {
    // Send message to main thread
    const clients = await self.clients.matchAll()
    clients.forEach((client) => {
      client.postMessage({
        type: "DOSE_TAKEN",
        doseId: doseId,
      })
    })

    // Show confirmation notification
    await self.registration.showNotification("✅ Dose Marked as Taken", {
      body: "Great job! Keep up with your medication schedule.",
      icon: "/favicon.ico",
      tag: "dose-taken-confirmation",
      requireInteraction: false,
    })

    console.log("Dose marked as taken:", doseId)
  } catch (error) {
    console.error("Error marking dose as taken:", error)
  }
}

// Background sync for offline functionality
self.addEventListener("sync", (event) => {
  console.log("Background sync triggered:", event.tag)

  if (event.tag === "dose-sync") {
    event.waitUntil(syncDoses())
  }
})

async function syncDoses() {
  try {
    // Sync any pending dose updates when back online
    console.log("Syncing doses...")
  } catch (error) {
    console.error("Error syncing doses:", error)
  }
}

// Handle messages from main thread
self.addEventListener("message", (event) => {
  console.log("Service Worker received message:", event.data)

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
})
