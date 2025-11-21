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
              Enterprise CMDB & ITAM system built for Barq's operational
              excellence.
            </p>
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
                <a
                  href="/docs"
                  className="text-muted-foreground hover:text-barq-yellow transition-colors"
                >
                  Documentation
                </a>
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
                <span className="text-muted-foreground">Internal Use Only</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t pt-8">
          <div className="text-muted-foreground flex flex-col items-center justify-between gap-4 text-sm sm:flex-row">
            <p>© {currentYear} Barq. All rights reserved.</p>
            <p className="text-xs">Built with ❤️ by Barq's Technology team</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
