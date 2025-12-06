"use client";

/**
 * Settings Form Component
 *
 * Allows users to update their profile information
 */

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Loader2, CheckCircle2, AlertCircle, Upload, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  updateMyProfileAction,
  uploadProfilePhotoAction,
} from "@/interface-adapters/controllers/my-dashboard.controller";
import { toast } from "sonner";
import {
  getMyPreferencesAction,
  updateMyPreferencesAction,
  type UserPreferencesDTO,
} from "@/interface-adapters/controllers/my-dashboard.controller";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Enable2FADialog } from "./enable-2fa-dialog";
import { Disable2FADialog } from "./disable-2fa-dialog";
import { useIsFeatureEnabled } from "@/hooks/use-feature-flags";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { useRef } from "react";
import { authClient } from "@/lib/auth/client";

// Validation schema
const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  email: z.string().email("Invalid email address"),
  image: z.string().url("Invalid image URL").optional().or(z.literal("")),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface SettingsFormProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    twoFactorEnabled?: boolean | null;
    lastLoginMethod?: string | null;
  };
}

export function SettingsForm({ user }: SettingsFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [preferences, setPreferences] = useState<UserPreferencesDTO | null>(
    null,
  );
  const [enable2FAOpen, setEnable2FAOpen] = useState(false);
  const [disable2FAOpen, setDisable2FAOpen] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isRemovingPhoto, setIsRemovingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if ATTACHMENTS feature is enabled
  const attachmentsEnabled = useIsFeatureEnabled(FEATURE_FLAGS.ATTACHMENTS);

  // Determine if user is SSO (Microsoft OAuth)
  const isSSOUser = user.lastLoginMethod === "microsoft";

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name || "",
      email: user.email || "",
      image: user.image || "",
    },
  });

  const onSubmit = async (_data: ProfileFormData) => {
    try {
      setIsLoading(true);
      setMessage(null);

      const result = await updateMyProfileAction({
        name: _data.name?.trim() || undefined,
        image: _data.image?.trim() || "",
      });

      if (!result.success) {
        setMessage({
          type: "error",
          text: result.error || "Failed to update profile.",
        });
        return;
      }

      toast.success("Profile updated successfully");
      setMessage({
        type: "success",
        text: "Profile updated successfully!",
      });

      // Refresh Better Auth session cache (updates UserMenu and other client components)
      await authClient.$fetch("/get-session");

      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to update profile. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    async function loadPreferences() {
      setPrefsLoading(true);
      const result = await getMyPreferencesAction();
      if (result.success) {
        setPreferences(result.data);
      } else {
        toast.error(result.error ?? "Failed to load preferences");
      }
      setPrefsLoading(false);
    }
    void loadPreferences();
  }, []);

  const handleUpdatePreferences = async (
    updates: Partial<UserPreferencesDTO>,
  ) => {
    if (!preferences) return;
    const next = {
      ...preferences,
      ...updates,
      notifications: {
        ...preferences.notifications,
        ...(updates.notifications ?? {}),
      },
    };
    setPreferences(next);
    const result = await updateMyPreferencesAction(next);
    if (!result.success) {
      toast.error(result.error ?? "Failed to save preferences");
    } else {
      toast.success("Preferences saved");
      setPreferences(result.data);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Client-side validation
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Only JPEG, PNG, and WebP are allowed.");
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error("File size exceeds 5MB. Please choose a smaller image.");
      return;
    }

    setIsUploadingPhoto(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const result = await uploadProfilePhotoAction(formData);

      if (!result.success) {
        toast.error(result.error || "Failed to upload photo");
        return;
      }

      // Success - refresh both server data and client session cache
      toast.success("Profile photo updated successfully");

      // Refresh Better Auth session cache (updates UserMenu and other client components)
      await authClient.$fetch("/get-session");

      // Force a hard refresh to update server component data
      window.location.reload();
    } catch (_error) {
      toast.error("Failed to upload photo. Please try again.");
    } finally {
      setIsUploadingPhoto(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <Form {...form}>
      <div className="space-y-6">
        {/* Profile Picture */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>
              {isSSOUser
                ? "Your profile picture is managed by Microsoft"
                : attachmentsEnabled
                  ? "Upload a custom profile picture or provide an image URL"
                  : "Update your profile picture by providing an image URL"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <UserAvatar
                name={user.name || undefined}
                email={user.email || undefined}
                image={user.image || undefined}
                size="lg"
              />

              <div className="flex-1 space-y-4">
                {/* Case 1: SSO User (Read-only) */}
                {isSSOUser ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label>Avatar Status</Label>
                      <Badge variant="secondary">Managed by Microsoft</Badge>
                    </div>
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Your profile picture is automatically synced from
                        Microsoft. Contact your IT admin to update it.
                      </AlertDescription>
                    </Alert>
                  </div>
                ) : attachmentsEnabled ? (
                  /* Case 2: Email/Password User + ATTACHMENTS Enabled */
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Upload Photo</Label>
                      <div className="flex gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={handleFileUpload}
                          disabled={isUploadingPhoto}
                          className="hidden"
                          id="photo-upload"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingPhoto}
                          className="w-full sm:w-auto"
                        >
                          {isUploadingPhoto ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="mr-2 h-4 w-4" />
                              Choose File
                            </>
                          )}
                        </Button>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        Upload a custom photo (JPEG, PNG, WebP - max 5MB)
                      </p>
                    </div>

                    {/* Show current upload status if user has uploaded avatar */}
                    {user.image?.includes("/avatars/") && (
                      <div className="space-y-2">
                        <Label>Current Avatar</Label>
                        <Alert>
                          <CheckCircle2 className="h-4 w-4" />
                          <AlertDescription className="flex items-center justify-between">
                            <span>Using uploaded profile photo</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={isRemovingPhoto}
                              onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();

                                setIsRemovingPhoto(true);
                                try {
                                  // Remove uploaded photo and reset to default
                                  const result = await updateMyProfileAction({
                                    image: "",
                                  });

                                  if (result.success) {
                                    toast.success("Profile photo removed");

                                    // Refresh Better Auth session cache first
                                    await authClient.$fetch("/get-session");

                                    // Force a hard refresh to update server component data
                                    window.location.reload();
                                  } else {
                                    toast.error(
                                      result.error ?? "Failed to remove photo",
                                    );
                                  }
                                } catch (error) {
                                  console.error("Error removing photo:", error);
                                  toast.error(
                                    "Failed to remove photo. Please try again.",
                                  );
                                } finally {
                                  setIsRemovingPhoto(false);
                                }
                              }}
                            >
                              {isRemovingPhoto ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Removing...
                                </>
                              ) : (
                                "Remove"
                              )}
                            </Button>
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}

                    {/* Optional: URL input (hidden when using uploaded avatar) */}
                    {!user.image?.includes("/avatars/") && (
                      <FormField
                        control={form.control}
                        name="image"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Or use Image URL</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://example.com/avatar.jpg"
                                disabled={isLoading || isUploadingPhoto}
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Alternatively, provide a direct image URL
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                ) : (
                  /* Case 3: Email/Password User + ATTACHMENTS Disabled */
                  <FormField
                    control={form.control}
                    name="image"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://example.com/avatar.jpg"
                            disabled={isLoading}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Provide an image URL for your profile picture
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your personal information and email address
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Success/Error Messages */}
              {message && (
                <Alert
                  variant={message.type === "error" ? "destructive" : "default"}
                >
                  {message.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>{message.text}</AlertDescription>
                </Alert>
              )}

              {/* Name Field */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Name"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Your display name shown across the application
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email Field */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        disabled
                        readOnly
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Your email address for login and notifications (managed
                      via SSO)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <div className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>
              Timezone, date format, currency display, and notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {prefsLoading || !preferences ? (
              <div className="space-y-3">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-48" />
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select
                      value={preferences.timezone}
                      onValueChange={(value) =>
                        handleUpdatePreferences({ timezone: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Riyadh">Asia/Riyadh</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="Europe/London">
                          Europe/London
                        </SelectItem>
                        <SelectItem value="America/New_York">
                          America/New_York
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date Format</Label>
                    <Select
                      value={preferences.dateFormat}
                      onValueChange={(value) =>
                        handleUpdatePreferences({
                          dateFormat: value as UserPreferencesDTO["dateFormat"],
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dd/MM/yyyy">dd/MM/yyyy</SelectItem>
                        <SelectItem value="MM/dd/yyyy">MM/dd/yyyy</SelectItem>
                        <SelectItem value="yyyy-MM-dd">yyyy-MM-dd</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Currency Display</Label>
                    <Select
                      value={preferences.currencyDisplay}
                      onValueChange={(value) =>
                        handleUpdatePreferences({
                          currencyDisplay:
                            value as UserPreferencesDTO["currencyDisplay"],
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select display" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sar">SAR only</SelectItem>
                        <SelectItem value="original">
                          Original currency
                        </SelectItem>
                        <SelectItem value="dual">Dual display</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium">Notifications</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <ToggleRow
                      label="Email notifications"
                      checked={
                        preferences.notifications?.emailNotifications ?? false
                      }
                      onCheckedChange={(checked) =>
                        handleUpdatePreferences({
                          notifications: { emailNotifications: checked },
                        })
                      }
                    />
                    <ToggleRow
                      label="Teams notifications"
                      checked={
                        preferences.notifications?.teamsNotifications ?? false
                      }
                      onCheckedChange={(checked) =>
                        handleUpdatePreferences({
                          notifications: { teamsNotifications: checked },
                        })
                      }
                    />
                    <ToggleRow
                      label="WhatsApp notifications"
                      checked={
                        preferences.notifications?.whatsappNotifications ??
                        false
                      }
                      onCheckedChange={(checked) =>
                        handleUpdatePreferences({
                          notifications: { whatsappNotifications: checked },
                        })
                      }
                    />
                    <ToggleRow
                      label="Weekly digest"
                      checked={preferences.notifications?.weeklyDigest ?? false}
                      onCheckedChange={(checked) =>
                        handleUpdatePreferences({
                          notifications: { weeklyDigest: checked },
                        })
                      }
                    />
                    <ToggleRow
                      label="Asset alerts"
                      checked={preferences.notifications?.assetAlerts ?? false}
                      onCheckedChange={(checked) =>
                        handleUpdatePreferences({
                          notifications: { assetAlerts: checked },
                        })
                      }
                    />
                    <ToggleRow
                      label="Approval alerts"
                      checked={
                        preferences.notifications?.approvalAlerts ?? false
                      }
                      onCheckedChange={(checked) =>
                        handleUpdatePreferences({
                          notifications: { approvalAlerts: checked },
                        })
                      }
                    />
                    <ToggleRow
                      label="Warranty alerts"
                      checked={
                        preferences.notifications?.warrantyAlerts ?? false
                      }
                      onCheckedChange={(checked) =>
                        handleUpdatePreferences({
                          notifications: { warrantyAlerts: checked },
                        })
                      }
                    />
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>
              Manage your password and security settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">Password</p>
                <p className="text-muted-foreground text-sm">
                  Managed by corporate SSO. Contact IT to update your password.
                </p>
              </div>
              <Button variant="outline" disabled>
                Managed by SSO
              </Button>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <p className="font-medium">Two-Factor Authentication</p>
                  {user.twoFactorEnabled ? (
                    <Badge variant="default" className="bg-green-500">
                      Enabled
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Not Enabled</Badge>
                  )}
                </div>
                <p className="text-muted-foreground text-sm">
                  {user.twoFactorEnabled
                    ? "Your account is protected with 2FA"
                    : "Add an extra layer of security to your account"}
                </p>
              </div>
              {user.twoFactorEnabled ? (
                <Button
                  variant="outline"
                  onClick={() => setDisable2FAOpen(true)}
                >
                  Disable 2FA
                </Button>
              ) : (
                <Button
                  variant="default"
                  onClick={() => setEnable2FAOpen(true)}
                >
                  Enable 2FA
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2FA Dialogs */}
      <Enable2FADialog
        open={enable2FAOpen}
        onOpenChange={setEnable2FAOpen}
        onSuccess={() => {
          router.refresh();
          toast.success("2FA has been enabled successfully");
        }}
      />

      <Disable2FADialog
        open={disable2FAOpen}
        onOpenChange={setDisable2FAOpen}
        onSuccess={() => {
          router.refresh();
          toast.success("2FA has been disabled");
        }}
      />
    </Form>
  );
}

interface ToggleRowProps {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function ToggleRow({ label, checked, onCheckedChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <p className="text-sm font-medium">{label}</p>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
