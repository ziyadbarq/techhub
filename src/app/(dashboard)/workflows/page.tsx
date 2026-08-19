import { redirect } from "next/navigation";

/** Stable landing route used by breadcrumbs and navigation prefetches. */
export default function WorkflowsPage() {
  redirect("/workflows/inbox");
}
