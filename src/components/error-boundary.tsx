"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { logger } from "@/lib/logger";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error with structured logger
    const scopedLogger = logger.scope("ErrorBoundary");
    scopedLogger.error(
      "componentDidCatch",
      "React error boundary caught an error",
      error,
      {
        componentStack: errorInfo.componentStack,
      },
    );

    // Update state with error details
    this.setState({
      error,
      errorInfo,
    });

    // In production, you could send error to logging service
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="bg-muted/40 flex min-h-screen items-center justify-center p-4">
          <Card className="border-destructive/50 w-full max-w-2xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-destructive h-6 w-6" />
                <CardTitle className="text-destructive">
                  Something went wrong
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                An unexpected error occurred. Please try refreshing the page or
                contact support if the problem persists.
              </p>

              {/* Show error details in development mode only */}
              {process.env.NODE_ENV === "development" && this.state.error && (
                <div className="space-y-2">
                  <div className="bg-destructive/10 rounded-md p-4">
                    <p className="text-destructive font-mono text-sm font-semibold">
                      {this.state.error.name}: {this.state.error.message}
                    </p>
                  </div>

                  {this.state.error.stack && (
                    <details className="group">
                      <summary className="text-muted-foreground hover:text-foreground cursor-pointer text-sm font-medium">
                        Stack trace
                      </summary>
                      <pre className="bg-muted mt-2 overflow-x-auto rounded-md p-4 text-xs">
                        <code>{this.state.error.stack}</code>
                      </pre>
                    </details>
                  )}

                  {this.state.errorInfo && (
                    <details className="group">
                      <summary className="text-muted-foreground hover:text-foreground cursor-pointer text-sm font-medium">
                        Component stack
                      </summary>
                      <pre className="bg-muted mt-2 overflow-x-auto rounded-md p-4 text-xs">
                        <code>{this.state.errorInfo.componentStack}</code>
                      </pre>
                    </details>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={this.handleReset} variant="default">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                >
                  Reload Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
