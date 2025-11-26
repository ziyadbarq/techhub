/**
 * Directory Page - Redirects to Persons
 * This route is deprecated, redirecting to the unified /persons page
 */

import { redirect } from "next/navigation";

export default function DirectoryPage() {
  redirect("/persons");
}
