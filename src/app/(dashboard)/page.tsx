import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Logo } from "@/components/ui/logo";

export default function HomePage() {
  return (
    <div className="from-background to-muted/20 min-h-screen bg-gradient-to-b">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="mb-16 text-center">
          {/* Barq Logo */}
          <div className="mb-8 flex justify-center">
            <Logo width={200} height={60} priority />
          </div>

          <h1 className="from-barq-yellow to-barq-light-blue mb-4 bg-gradient-to-r bg-clip-text text-5xl font-bold text-transparent">
            Barq App Boilerplate
          </h1>
          <p className="text-muted-foreground mx-auto max-w-2xl text-xl">
            Production-ready Next.js starter with Clean Architecture, Dependency
            Injection, and AI infrastructure
          </p>
        </div>

        {/* Feature Cards */}
        <div className="mb-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Clean Architecture</CardTitle>
              <CardDescription>5-layer architecture</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Strict separation of concerns with dependency inversion. Domain
                entities, use cases, and repositories following SOLID
                principles.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dependency Injection</CardTitle>
              <CardDescription>InversifyJS container</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Type-safe DI with constructor injection. Singleton and transient
                scopes. Easy testing with mock implementations.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Infrastructure</CardTitle>
              <CardDescription>OpenAI with caching</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                GPT-5 integration with 24-hour extended prompt caching. Modular
                prompt system. 90% cost savings on cache hits.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Modern Theme System</CardTitle>
              <CardDescription>OKLCH color space</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Barq brand colors with dark mode support. Semantic design
                tokens. Type-safe theme utilities.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Task CRUD Example</CardTitle>
              <CardDescription>Complete demonstration</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Full example showing entity, repository, use cases, and UI. Use
                as template for your features.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>35+ UI Components</CardTitle>
              <CardDescription>shadcn/ui included</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Button, Dialog, Card, Input, Select, and more. Fully accessible.
                Customizable with Tailwind.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="space-y-4 text-center">
          <div className="flex justify-center gap-4">
            <Button
              size="lg"
              className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90"
            >
              <Link href="/tasks">View Task Demo</Link>
            </Button>
            <Button size="lg" variant="outline">
              <Link
                href="https://github.com/barqhub/barq-app-boilerplate"
                target="_blank"
                rel="noopener noreferrer"
              >
                View on GitHub
              </Link>
            </Button>
          </div>

          <p className="text-muted-foreground text-sm">
            Read the{" "}
            <Link
              href="https://github.com/barqhub/barq-app-boilerplate#readme"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              documentation
            </Link>{" "}
            for setup instructions
          </p>
        </div>

        {/* Tech Stack */}
        <div className="border-border mt-16 border-t pt-8">
          <p className="text-muted-foreground mb-4 text-center text-sm">
            Built with
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <span>Next.js 16</span>
            <span>•</span>
            <span>React 19</span>
            <span>•</span>
            <span>TypeScript</span>
            <span>•</span>
            <span>Tailwind CSS 4</span>
            <span>•</span>
            <span>Prisma</span>
            <span>•</span>
            <span>OpenAI</span>
            <span>•</span>
            <span>InversifyJS</span>
          </div>
        </div>
      </div>
    </div>
  );
}
