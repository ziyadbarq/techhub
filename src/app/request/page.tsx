import { redirect } from "next/navigation";

// Old shared URLs remain valid, but all forms now live in the dashboard.
export default function LegacyRequestRedirect() {
  redirect("/workflows/forms");
}
