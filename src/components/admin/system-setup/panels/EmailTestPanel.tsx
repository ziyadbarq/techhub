"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Send, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { sendTestEmailAction } from "@/interface-adapters/controllers/setup.controller";

export function EmailTestPanel() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [lastResult, setLastResult] = useState<{
    success: boolean;
    messageId?: string;
    error?: string;
  } | null>(null);

  const handleSendTest = async () => {
    if (!email) {
      toast.error("Please enter an email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSending(true);
    setLastResult(null);

    try {
      const result = await sendTestEmailAction({
        to: email,
        message: message.trim() || undefined,
      });

      if (result.success) {
        setLastResult({
          success: true,
          messageId: result.data.messageId,
        });
        toast.success(`Test email sent to ${email}`);
      } else {
        setLastResult({
          success: false,
          error: result.error,
        });
        toast.error(result.error || "Failed to send test email");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setLastResult({
        success: false,
        error: errorMessage,
      });
      toast.error("Failed to send test email");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Mail className="h-5 w-5" />
          Email Service Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Send a test email to verify your email service configuration is
          working correctly.
        </p>

        {/* Email Input */}
        <div className="space-y-2">
          <Label htmlFor="test-email">Recipient Email</Label>
          <Input
            id="test-email"
            type="email"
            placeholder="test@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSending}
          />
        </div>

        {/* Optional Message */}
        <div className="space-y-2">
          <Label htmlFor="test-message">
            Custom Message{" "}
            <span className="text-muted-foreground text-xs">(Optional)</span>
          </Label>
          <Textarea
            id="test-message"
            placeholder="Add a custom message to include in the test email..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isSending}
            rows={3}
          />
        </div>

        {/* Send Button */}
        <Button
          onClick={handleSendTest}
          disabled={isSending || !email}
          className="w-full"
        >
          {isSending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Send Test Email
            </>
          )}
        </Button>

        {/* Result Display */}
        {lastResult && (
          <div
            className={`rounded-md border p-3 ${
              lastResult.success
                ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950"
                : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"
            }`}
          >
            <div className="flex items-start gap-2">
              {lastResult.success ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="mt-0.5 h-4 w-4 text-red-600" />
              )}
              <div className="flex-1 space-y-1">
                <p
                  className={`text-sm font-medium ${
                    lastResult.success
                      ? "text-green-900 dark:text-green-100"
                      : "text-red-900 dark:text-red-100"
                  }`}
                >
                  {lastResult.success
                    ? "Test email sent successfully!"
                    : "Failed to send test email"}
                </p>
                {lastResult.success && lastResult.messageId && (
                  <p className="text-muted-foreground text-xs">
                    Message ID: {lastResult.messageId}
                  </p>
                )}
                {!lastResult.success && lastResult.error && (
                  <p className="text-xs text-red-600 dark:text-red-400">
                    {lastResult.error}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
