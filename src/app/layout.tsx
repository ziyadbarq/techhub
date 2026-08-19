import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { ConfirmHost } from "@/components/design";
import { Toaster } from "@/components/ui/sonner";
import { BRANDING, getPageTitle, getPageDescription } from "@/config/branding";

// DI container is initialized lazily via getContainer() on first request
// This allows the app to build without environment variables

export const metadata: Metadata = {
  title: getPageTitle("home"),
  description: getPageDescription("default"),
  icons: {
    icon: BRANDING.logos.icon.whiteBG,
    apple: BRANDING.logos.icon.whiteBG,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <ConfirmHost />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
