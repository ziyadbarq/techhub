import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CheckCircle2, FileText, LockKeyhole } from "lucide-react";
import { CopyRequestLink } from "@/components/workflows/copy-request-link";
import { loadRequestFormData } from "@/lib/workflows/load-request-form";
import { SubmitRequestForm } from "@/app/(dashboard)/workflows/requests/new/[formId]/submit-form";
import { getMicrosoftPortalAccess } from "@/lib/auth/microsoft-portal-access";
import { MicrosoftPortalGate } from "@/components/auth/microsoft-portal-gate";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Submit a Request | TechHub" };

export default async function StandaloneRequestPage({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = await params;
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  const access = await getMicrosoftPortalAccess();
  if (!access.allowed) {
    return <MicrosoftPortalGate returnTo={"/request/" + encodeURIComponent(formId)} authenticated={access.authenticated} />;
  }
  const { form, orgUsers, formNameToId, systemFieldValues } = await loadRequestFormData(formId);

  return (
    <div className="mx-auto max-w-7xl px-5 pb-10 pt-8 sm:px-8 sm:pt-12 lg:px-12">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
        <Link href="/request" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-300">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All request forms
        </Link>
        <CopyRequestLink path={"/request/" + form.id} />
      </div>
      <div className="grid gap-7 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,1fr)] lg:items-start lg:gap-10">
        <aside className="space-y-6 lg:sticky lg:top-28">
          <div className="rounded-[30px] bg-[#13243d] p-7 text-white shadow-[0_22px_65px_-36px_rgba(15,30,54,0.65)] sm:p-9">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[#c8e3ff]"><FileText className="h-6 w-6" aria-hidden="true" /></div>
            <p className="mt-8 text-[11px] font-bold uppercase tracking-[0.18em] text-[#a6c9ef]">Service request</p>
            <h1 className="mt-3 break-words text-3xl font-semibold leading-tight tracking-[-0.035em]">{form.name}</h1>
            <p className="mt-4 text-sm leading-7 text-[#bdcce0]">{form.description || "Complete the form and submit your request for processing."}</p>
            <div className="mt-8 flex items-center gap-2 border-t border-white/15 pt-5 text-xs text-[#bed1e8]">
              <CheckCircle2 className="h-4 w-4 text-[#96e4b2]" aria-hidden="true" />
              Form version {form.publishedVersion.versionNumber} · Published
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-[#111a2b]">
            <h2 className="text-sm font-semibold">What happens next?</h2>
            <ol className="mt-5 space-y-4 text-sm">
              <li className="flex items-start gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-400/15 dark:text-blue-200">1</span><span className="pt-1 text-slate-600 dark:text-slate-300">Complete the required details.</span></li>
              <li className="flex items-start gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-400/15 dark:text-blue-200">2</span><span className="pt-1 text-slate-600 dark:text-slate-300">Submit securely with your TechHub account.</span></li>
              <li className="flex items-start gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-400/15 dark:text-blue-200">3</span><span className="pt-1 text-slate-600 dark:text-slate-300">Receive a reference number for tracking.</span></li>
            </ol>
            <div className="mt-6 flex items-start gap-2 rounded-xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500 dark:bg-white/5 dark:text-slate-400"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> Microsoft sign-in and TechHub permissions are required to submit.</div>
          </div>
        </aside>
        <section className="min-w-0 overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_14px_48px_-34px_rgba(10,27,54,0.45)] dark:border-white/10 dark:bg-[#111a2b]">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-6 py-6 sm:px-9 dark:border-white/10">
            <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-300">Request details</p><h2 className="mt-2 text-xl font-semibold tracking-tight">Tell us what you need</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Fields marked * are required.</p></div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Ready to submit</span>
          </div>
          <div className="px-6 py-8 sm:px-9 sm:py-10">
            <SubmitRequestForm formId={form.id} schema={form.publishedVersion.schemaJson as never} users={orgUsers} formNameToId={formNameToId} systemFieldValues={systemFieldValues} successMode="inline" submitEndpoint="/api/workflow/portal/requests" />
          </div>
        </section>
      </div>
      <p className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400">Need to see your submitted requests? <Link href="/workflows/requests?scope=mine" className="font-semibold underline-offset-4 hover:underline">Open My Requests <ArrowUpRight className="inline h-3 w-3" aria-hidden="true" /></Link></p>
    </div>
  );
}
