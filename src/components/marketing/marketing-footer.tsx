import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { ExternalLink } from "lucide-react";

/**
 * Marketing Footer Component
 * Clean footer for landing page with links and Barq branding
 */
export function MarketingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted/30 w-full border-t">
      <div className="container mx-auto px-4 py-12 md:px-6">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Branding */}
          <div className="space-y-4">
            <Logo className="h-8 w-auto" />
            <p className="text-muted-foreground text-sm">
              Enterprise CMDB & ITAM system built by Barq for Barq.
              SAMA-compliant asset management for financial services.
            </p>
            <div className="border-barq-yellow/20 bg-barq-yellow/5 rounded-md border p-3">
              <p className="text-foreground text-xs font-semibold">
                🔒 Internal Use Only
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                Built for SAMA regulatory compliance and audit readiness
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold tracking-wide uppercase">
              Quick Links
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/login"
                  className="text-muted-foreground hover:text-barq-yellow transition-colors"
                >
                  Login
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="text-muted-foreground hover:text-barq-yellow transition-colors"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className="text-muted-foreground hover:text-barq-yellow transition-colors"
                >
                  Get Started
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="mb-4 text-sm font-semibold tracking-wide uppercase">
              Resources
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/docs"
                  className="text-muted-foreground hover:text-barq-yellow transition-colors"
                >
                  Documentation
                </Link>
              </li>
              <li>
                <a
                  href="#faq"
                  className="text-muted-foreground hover:text-barq-yellow transition-colors"
                >
                  FAQ
                </a>
              </li>
              <li>
                <a
                  href="mailto:it-support@barq.com"
                  className="text-muted-foreground hover:text-barq-yellow transition-colors"
                >
                  Support
                </a>
              </li>
            </ul>
          </div>

          {/* About Barq */}
          <div>
            <h3 className="mb-4 text-sm font-semibold tracking-wide uppercase">
              About Barq
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="https://barq.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-barq-yellow inline-flex items-center gap-1 transition-colors"
                >
                  Barq.com
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <span className="text-muted-foreground text-xs">
                  Regulated by SAMA (Saudi Central Bank)
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t pt-8">
          <div className="flex flex-col items-center justify-between gap-4 text-sm sm:flex-row">
            <div className="text-center sm:text-left">
              <p className="text-muted-foreground">
                © {currentYear} Barq. All rights reserved.
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                On-premises deployment for Technology Operations. SAMA-compliant
                ITAM & CMDB.
              </p>
            </div>
            <div className="text-center sm:text-right">
              <p className="bg-barq-yellow/10 text-barq-yellow inline-block rounded-md px-3 py-1.5 text-xs font-semibold">
                Built by Barq Technology Team
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
