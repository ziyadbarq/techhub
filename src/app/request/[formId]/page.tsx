import { redirect } from "next/navigation";

// Redirect previously shared form links to the authenticated dashboard.
export default async function LegacyFormRedirect({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;
  redirect("/workflows/requests/new/" + encodeURIComponent(formId));
}
