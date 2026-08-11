// Reminder scheduling for Borrowed items.
//
// On native builds (Android/iOS via Capacitor) we schedule a real OS-level
// local notification that repeats daily starting from the chosen reminder
// date, so the user gets a nag every day until they cancel it or mark the
// item as returned. On web (and if the native plugin/permission isn't
// available) this quietly no-ops — the in-app "overdue" banner on the home
// screen is the fallback there, and it's checked every time the app opens.

import { Capacitor } from "@capacitor/core";
import { BorrowedItem } from "../types";

// Local notification ids must be 32-bit ints. Derive a stable one per
// borrowed-item id so re-scheduling replaces rather than duplicates.
function notificationIdFor(borrowedId: string): number {
  let hash = 0;
  for (let i = 0; i < borrowedId.length; i++) {
    hash = (hash * 31 + borrowedId.charCodeAt(i)) | 0;
  }
  return (Math.abs(hash) % 2147483646) + 1;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const current = await LocalNotifications.checkPermissions();
    if (current.display === "granted") return true;
    const perm = await LocalNotifications.requestPermissions();
    return perm.display === "granted";
  } catch (err) {
    console.warn("Local notifications permission request failed:", err);
    return false;
  }
}

// Schedules (or re-schedules) a daily-repeating reminder starting at
// item.next_reminder_at. Cancels any existing scheduled reminder first.
export async function scheduleBorrowedReminder(item: BorrowedItem): Promise<void> {
  await cancelBorrowedReminder(item.id);

  if (item.is_returned || item.reminder_interval === "none" || !item.next_reminder_at) {
    return;
  }
  if (!Capacitor.isNativePlatform()) return;

  try {
    const granted = await requestNotificationPermission();
    if (!granted) return;

    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const id = notificationIdFor(item.id);
    let at = new Date(item.next_reminder_at);
    // Local notifications must be scheduled in the future.
    if (at.getTime() <= Date.now()) {
      at = new Date(Date.now() + 5000);
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          id,
          title: "Borrowed item reminder",
          body: `${item.borrowed_to} still has your ${item.item_name}. Tap to mark it returned.`,
          schedule: {
            at,
            repeats: true,
            every: "day",
            allowWhileIdle: true,
          },
          extra: { borrowedId: item.id },
        },
      ],
    });
  } catch (err) {
    console.warn("Failed to schedule borrowed-item reminder:", err);
  }
}

export async function cancelBorrowedReminder(borrowedId: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const id = notificationIdFor(borrowedId);
    await LocalNotifications.cancel({ notifications: [{ id }] });
  } catch (err) {
    console.warn("Failed to cancel borrowed-item reminder:", err);
  }
}
