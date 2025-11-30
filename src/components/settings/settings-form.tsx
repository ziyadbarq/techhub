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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, CheckCircle2, AlertCircle, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { updateMyProfileAction } from "@/interface-adapters/controllers/my-dashboard.controller";
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

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name || "",
      email: user.email || "",
      image: user.image || "",
    },
  });

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : user.email?.[0]?.toUpperCase() || "U";

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

  return (
    <div className="space-y-6">
      {/* Profile Picture */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
          <CardDescription>
            Update your profile picture by providing an image URL
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage
                src={form.watch("image") || user.image || undefined}
                alt={user.name || ""}
              />
              <AvatarFallback className="text-xl">{initials}</AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Input
                          placeholder="https://example.com/avatar.jpg"
                          disabled={isLoading}
                          {...field}
                        />
                        <Button type="button" variant="outline" disabled>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload
                        </Button>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Enter a URL to your profile picture or upload an image
                      (upload coming soon)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
          <Form {...form}>
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
          </Form>
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
                      preferences.notifications?.whatsappNotifications ?? false
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
                    checked={preferences.notifications?.approvalAlerts ?? false}
                    onCheckedChange={(checked) =>
                      handleUpdatePreferences({
                        notifications: { approvalAlerts: checked },
                      })
                    }
                  />
                  <ToggleRow
                    label="Warranty alerts"
                    checked={preferences.notifications?.warrantyAlerts ?? false}
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
                Change your password to keep your account secure
              </p>
            </div>
            <Button variant="outline" disabled>
              Change Password
            </Button>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">Two-Factor Authentication</p>
              <p className="text-muted-foreground text-sm">
                Add an extra layer of security to your account
              </p>
            </div>
            <Button variant="outline" disabled>
              Enable 2FA
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
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
