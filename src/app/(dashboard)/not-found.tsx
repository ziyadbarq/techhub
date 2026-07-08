/**
 * Dashboard Not Found Page
 *
 * Rendered when a server component calls notFound() or a URL under the
 * dashboard doesn't match any route. Keeps the app chrome (via the dashboard
 * layout) instead of Next.js's bare default 404.
 */

import Link from "next/link";
import { FileQuestion, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="bg-muted mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full">
            <FileQuestion className="text-muted-foreground h-6 w-6" />
          </div>
          <CardTitle>Page not found</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            The page you are looking for doesn&apos;t exist or the record may
            have been deleted.
          </p>
          <div className="flex justify-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
