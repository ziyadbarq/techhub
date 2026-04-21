/**
 * Edit Verification Campaign Dialog
 */

"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { startOfToday } from "date-fns";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  UpdateVerificationCampaignSchema,
  type UpdateVerificationCampaignDTO,
} from "@/interface-adapters/dtos/generated/verification-campaign.dto";
import { updateVerificationCampaign } from "@/interface-adapters/controllers/verification-campaign.controller";
import type { VerificationCampaignDTO } from "@/interface-adapters/presenters/verification-campaign.presenter";

interface EditVerificationCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: VerificationCampaignDTO;
  onSuccess: () => void;
}

export function EditVerificationCampaignDialog({
  open,
  onOpenChange,
  campaign,
  onSuccess,
}: EditVerificationCampaignDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<UpdateVerificationCampaignDTO>({
    resolver: zodResolver(
      UpdateVerificationCampaignSchema,
    ) as Resolver<UpdateVerificationCampaignDTO>,
    defaultValues: {
      name: campaign.name,
      description: campaign.description || "",
      scheduledStart: campaign.scheduledStart,
      scheduledEnd: campaign.scheduledEnd,
    },
  });

  const handleSubmit = async (data: UpdateVerificationCampaignDTO) => {
    setIsSubmitting(true);
    try {
      const result = await updateVerificationCampaign(campaign.id, data);

      if (result.success) {
        toast.success("Campaign updated successfully");
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to update campaign");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Verification Campaign</DialogTitle>
          <DialogDescription>
            Update the campaign details. Target type cannot be changed after
            creation.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campaign Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Campaign name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Campaign description..."
                      rows={3}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="scheduledStart"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Scheduled Start Date</FormLabel>
                  <FormControl>
                    <DatePicker
                      value={field.value ? new Date(field.value) : undefined}
                      onChange={field.onChange}
                      buttonClassName="pl-3"
                      disabledTrigger={campaign.hasStarted}
                      calendarProps={{
                        disabled: (date) => date < startOfToday(),
                        initialFocus: true,
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    {campaign.hasStarted
                      ? "Cannot change start date after campaign has started"
                      : "When the campaign should become active"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="scheduledEnd"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Scheduled End Date (Optional)</FormLabel>
                  <FormControl>
                    <DatePicker
                      value={field.value ? new Date(field.value) : undefined}
                      onChange={field.onChange}
                      placeholder="Pick a date (optional)"
                      buttonClassName="pl-3"
                      calendarProps={{
                        disabled: (date) => {
                          const scheduledStart = form.watch("scheduledStart");
                          return (
                            date <
                            (scheduledStart
                              ? new Date(scheduledStart)
                              : startOfToday())
                          );
                        },
                        initialFocus: true,
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional deadline for campaign completion
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90"
              >
                {isSubmitting ? "Updating..." : "Update Campaign"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
