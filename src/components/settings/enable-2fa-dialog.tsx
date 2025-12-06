/**
 * Enable 2FA Dialog
 * Three-step wizard for enabling Two-Factor Authentication:
 * 1. Password confirmation
 * 2. QR code display + TOTP verification
 * 3. Backup codes display with copy button
 */

"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Copy,
  Check,
  KeyRound,
  Shield,
  Download,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  enable2FAAction,
  verify2FASetupAction,
} from "@/interface-adapters/controllers/two-factor.controller";

interface Enable2FADialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type Step = "password" | "verify" | "backup-codes";

export function Enable2FADialog({
  open,
  onOpenChange,
  onSuccess,
}: Enable2FADialogProps) {
  const [step, setStep] = useState<Step>("password");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [totpUri, setTotpUri] = useState<string | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setStep("password");
      setPassword("");
      setTotpCode("");
      setTotpUri(null);
      setQrCodeDataUrl(null);
      setBackupCodes([]);
      setIsLoading(false);
      setCopied(false);
      setShowSecret(false);
    }
  }, [open]);

  // Generate QR code when TOTP URI is available
  // Guard with !qrCodeDataUrl prevents duplicate generation in React Strict Mode
  useEffect(() => {
    if (totpUri && !qrCodeDataUrl) {
      QRCode.toDataURL(totpUri, {
        width: 250,
        margin: 2,
        errorCorrectionLevel: "M",
      })
        .then((dataUrl) => setQrCodeDataUrl(dataUrl))
        .catch((error) => {
          console.error("Failed to generate QR code:", error);
          toast.error("Failed to generate QR code");
        });
    }
  }, [totpUri, qrCodeDataUrl]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast.error("Please enter your password");
      return;
    }

    setIsLoading(true);
    try {
      const result = await enable2FAAction(password);

      if (!result.success) {
        toast.error(result.error || "Failed to enable 2FA");
        return;
      }

      if (!result.data) {
        toast.error("Invalid response from server");
        return;
      }

      setTotpUri(result.data.totpUri);
      setBackupCodes(result.data.backupCodes);
      setStep("verify");
      toast.success("Scan the QR code with your authenticator app");
    } catch (_error) {
      toast.error("Failed to enable 2FA. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totpCode || totpCode.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    setIsLoading(true);
    try {
      const result = await verify2FASetupAction(totpCode);

      if (!result.success) {
        toast.error(result.error || "Invalid code. Please try again.");
        setTotpCode("");
        return;
      }

      setStep("backup-codes");
      toast.success("2FA enabled successfully!");
    } catch (_error) {
      toast.error("Failed to verify code. Please try again.");
      setTotpCode("");
    } finally {
      setIsLoading(false);
    }
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    setCopied(true);
    toast.success("Backup codes copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadBackupCodes = () => {
    const blob = new Blob([backupCodes.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `barq-2fa-backup-codes-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Backup codes downloaded");
  };

  const handleComplete = () => {
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        {/* Step 1: Password Confirmation */}
        {step === "password" && (
          <form onSubmit={handlePasswordSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Enable Two-Factor Authentication
              </DialogTitle>
              <DialogDescription>
                Enter your password to begin setting up 2FA
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  autoFocus
                />
              </div>

              <Alert>
                <KeyRound className="h-4 w-4" />
                <AlertDescription>
                  You'll need an authenticator app like Google Authenticator,
                  Authy, or 1Password to generate verification codes.
                </AlertDescription>
              </Alert>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || !password}>
                {isLoading ? "Verifying..." : "Continue"}
              </Button>
            </DialogFooter>
          </form>
        )}

        {/* Step 2: QR Code & Verification */}
        {step === "verify" && (
          <form onSubmit={handleVerifySubmit}>
            <DialogHeader>
              <DialogTitle>Scan QR Code</DialogTitle>
              <DialogDescription>
                Use your authenticator app to scan this QR code
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {qrCodeDataUrl && (
                <div className="flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrCodeDataUrl}
                    alt="2FA QR Code"
                    className="rounded-lg border"
                  />
                </div>
              )}

              {/* Manual Entry Option */}
              {totpUri && (
                <Alert>
                  <KeyRound className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">
                        Can&apos;t scan the QR code?
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="bg-muted flex-1 rounded px-2 py-1 font-mono text-xs">
                          {showSecret
                            ? totpUri.match(/secret=([^&]+)/)?.[1] || "N/A"
                            : "••••••••••••••••"}
                        </code>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowSecret(!showSecret)}
                        >
                          {showSecret ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const secret =
                              totpUri.match(/secret=([^&]+)/)?.[1] || "";
                            navigator.clipboard.writeText(secret);
                            toast.success("Secret key copied");
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-muted-foreground text-xs">
                        Enter this secret key manually in your authenticator app
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="totp-code">Verification Code</Label>
                <Input
                  id="totp-code"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={totpCode}
                  onChange={(e) =>
                    setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  disabled={isLoading}
                  maxLength={6}
                  autoFocus
                />
                <p className="text-muted-foreground text-sm">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("password")}
                disabled={isLoading}
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={isLoading || totpCode.length !== 6}
              >
                {isLoading ? "Verifying..." : "Verify & Enable"}
              </Button>
            </DialogFooter>
          </form>
        )}

        {/* Step 3: Backup Codes */}
        {step === "backup-codes" && (
          <>
            <DialogHeader>
              <DialogTitle>Save Your Backup Codes</DialogTitle>
              <DialogDescription>
                Store these codes in a safe place. You can use them to access
                your account if you lose your authenticator device.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <Alert>
                <KeyRound className="h-4 w-4" />
                <AlertDescription>
                  Each code can only be used once. Keep them secure!
                </AlertDescription>
              </Alert>

              <div className="bg-muted rounded-lg p-4">
                <div className="space-y-1 font-mono text-sm">
                  {backupCodes.map((code, index) => (
                    <div key={index}>{code}</div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={copyBackupCodes}
                >
                  {copied ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Codes
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={downloadBackupCodes}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleComplete} className="w-full">
                Done
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
