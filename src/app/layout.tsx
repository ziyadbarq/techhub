import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { initContainer } from "@/di/container";

// Initialize DI container globally (required for all server actions)
initContainer();

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Barq Assets | Enterprise CMDB & ITAM System",
  description:
    "Complete asset and inventory management for Barq. Track devices, manage warranties, control inventory, and maintain full audit trails with enterprise-grade architecture.",
  icons: {
    icon: "/logos/barq-icon-black-whiteBG-margined.png",
    apple: "/logos/barq-icon-black-whiteBG-margined.png",
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
