/**
 * Job Handlers Index
 *
 * Exports all job handlers for easy importing in worker configuration.
 */

export { handleTaskCompletedNotification } from "./task-completed-notification.handler";
export { handleCleanupOldTasks } from "./cleanup-old-tasks.handler";
export { handleSendTaskReminder } from "./send-task-reminder.handler";
export { handleWarrantyExpirationCheck } from "./warranty-expiration-check.handler";
export { handleActivateReadyReservations } from "./activate-ready-reservations.handler";
export { handleCompleteExpiredReservations } from "./complete-expired-reservations.handler";
export { handleSendReservationReminders } from "./send-reservation-reminders.handler";
