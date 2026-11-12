import { redirect } from "next/navigation";

/**
 * Asset CSV/Excel import is now accessed only through Assets > Bulk Import.
 * Keep the previous URL working for bookmarks without maintaining a second
 * upload workflow or modifying the existing asset import engine.
 */
export default function LegacyDataImportPage() {
  redirect("/assets");
}
