/**
 * Documentation Index
 * Main landing page for documentation section
 */

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function DocsIndexPage() {
  // Redirect to getting-started as the default docs page
  redirect("/docs/getting-started");
}
