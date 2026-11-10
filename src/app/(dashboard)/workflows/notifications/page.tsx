import { redirect } from "next/navigation";

// Preserve old bookmarks while moving notifications to TechHub's main header.
export default function LegacyWorkflowNotificationsPage() {
  redirect("/notifications");
}
