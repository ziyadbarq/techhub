import { ShieldCheck } from "lucide-react";
import { MicrosoftSignInButton } from "@/components/auth/microsoft-sign-in-button";

type Props = { returnTo: string; authenticated: boolean };

/** Do not render form details or the catalog until the current session is Microsoft SSO. */
export function MicrosoftPortalGate({ returnTo, authenticated }: Props) {
  return (
    <section className="mx-auto flex max-w-7xl items-center justify-center px-5 pb-12 pt-12 sm:px-8 sm:pt-20" aria-labelledby="microsoft-portal-title">
      <div className="w-full max-w-lg rounded-[32px] border border-slate-200 bg-white px-6 py-10 text-center shadow-[0_26px_90px_-45px_rgba(13,36,68,0.5)] sm:px-12 sm:py-14 dark:border-white/10 dark:bg-[#111a2b]">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-[#edf4ff] text-[#326caa] dark:bg-white/10 dark:text-[#b7dbff]">
          <ShieldCheck className="h-8 w-8" aria-hidden="true" />
        </div>
        <p className="mt-7 text-xs font-bold uppercase tracking-[0.18em] text-[#477fba] dark:text-[#99c6fb]">TechHub · Secure request</p>
        <h1 id="microsoft-portal-title" className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
          Sign in with your Microsoft work account
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-7 text-slate-500 dark:text-slate-400">
          {authenticated
            ? "This session was not authenticated with Microsoft. Continue with your work account to access the request portal."
            : "Access the request form directly using your barq Microsoft account. You won't need to open the dashboard."}
        </p>
        <div className="mx-auto mt-8 max-w-sm">
          <MicrosoftSignInButton callbackURL={returnTo} reauthenticate={authenticated} />
        </div>
        <p className="mt-7 text-xs leading-5 text-slate-400">Only authorized employees with TechHub request permissions can submit.</p>
      </div>
    </section>
  );
}
