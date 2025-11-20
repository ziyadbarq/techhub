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
  title: "Barq App Boilerplate",
  description:
    "Clean Architecture Next.js starter with DI, AI integration, and modern theme system",
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
