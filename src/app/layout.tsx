import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { BRANDING, getPageTitle, getPageDescription } from "@/config/branding";

// DI container is initialized lazily via getContainer() on first request
// This allows the app to build without environment variables

const inter = Inter({ subsets: ["latin"] });

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
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
