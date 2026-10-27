/**
 * Asset Delivery Note - printable handover form.
 *
 * Rendered as HTML rather than a generated PDF on purpose: the form is
 * bilingual, and the browser is the only renderer in this stack that shapes
 * Arabic and handles bidirectional text correctly. "Print -> Save as PDF"
 * produces the file the help desk prints, gets signed by hand, scans, and
 * uploads back onto the asset as an attachment.
 */

"use client";

import { ArrowLeft, CheckCircle2, Printer, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import type { AssetDTO } from "@/interface-adapters/presenters/asset.presenter";
import type { PersonDTO } from "@/interface-adapters/presenters/person.presenter";

interface DeliveryNotePrintProps {
  asset: AssetDTO;
  /** Current holder of the asset; null when the asset is unassigned. */
  person: PersonDTO | null;
  /** Printed reference, e.g. DN-DESKTOP-000016-20261027, to match the scan. */
  reference: string;
  /** Issue date, already formatted on the server (avoids hydration drift). */
  issuedOn: string;
}

function brandAndModelOf(asset: AssetDTO) {
  return [asset.vendorName, asset.modelName].filter(Boolean).join(" ");
}

/** Renders a value, or a blank line for whoever fills the form by hand. */
function Field({ value }: { value: string | null | undefined }) {
  if (value && value.trim().length > 0) {
    return <span>{value}</span>;
  }
  return <span className="dn-blank" aria-hidden="true" />;
}

export function DeliveryNotePrint({
  asset,
  person,
  reference,
  issuedOn,
}: DeliveryNotePrintProps) {
  const router = useRouter();
  // Once the print dialog closes, point the help desk at the next step.
  const [printed, setPrinted] = useState(false);

  useEffect(() => {
    const onAfterPrint = () => setPrinted(true);
    window.addEventListener("afterprint", onAfterPrint);
    return () => window.removeEventListener("afterprint", onAfterPrint);
  }, []);

  // "Save as PDF" names the file after the document title, so give each
  // asset's note a recognisable name instead of the app's page title.
  useEffect(() => {
    const previousTitle = document.title;
    document.title = `Delivery Note - ${asset.assetTag}`;
    return () => {
      document.title = previousTitle;
    };
  }, [asset.assetTag]);

  const attachmentsHref = `/assets/${encodeURIComponent(asset.assetTag)}?tab=attachments`;

  const employeeName = person
    ? [person.firstName, person.middleName, person.lastName]
        .filter(Boolean)
        .join(" ")
    : null;

  const department = person?.department || person?.orgUnitName || null;

  return (
    <>
      <style>{`
        /*
         * A4 with zero page margin: that stops Chrome printing its date/title
         * header and URL footer on the form. The sheet's own padding in the
         * print rules below supplies the margins a signed paper form needs.
         */
        @page { size: A4; margin: 0; }

        .dn-sheet {
          background: #fff;
          color: #000;
          max-width: 210mm;
          margin: 0 auto;
          padding: 16mm 14mm;
          font-family: "Times New Roman", "Noto Naskh Arabic", serif;
          font-size: 11pt;
          line-height: 1.5;
        }
        .dn-sheet h1, .dn-sheet h2 {
          text-align: center;
          font-size: 12pt;
          font-weight: 700;
          margin: 0 0 8px;
        }
        .dn-sheet h2 { margin-top: 18px; }

        .dn-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 6px;
          table-layout: fixed;
        }
        .dn-table th, .dn-table td {
          border: 1px solid #000;
          padding: 5px 8px;
          font-size: 10.5pt;
          vertical-align: middle;
          word-break: break-word;
        }
        .dn-table th { font-weight: 700; text-align: center; }
        .dn-label-en { width: 26%; font-weight: 700; }
        .dn-label-ar { width: 22%; text-align: right; direction: rtl; }
        .dn-value { text-align: center; }

        /* Empty rows so extra items can be written in by hand. */
        /* Same height as a filled row, so it is easy to write in. */
        .dn-table td.dn-empty { height: 34px; }

        .dn-blank {
          display: inline-block;
          min-width: 60%;
          border-bottom: 1px dotted #555;
        }

        .dn-declaration { margin-top: 22px; }
        .dn-declaration p { margin: 10px 0; text-align: justify; }
        .dn-ar { direction: rtl; text-align: right; unicode-bidi: isolate; }

        .dn-signatures {
          display: flex;
          gap: 40px;
          margin-top: 26px;
        }
        .dn-signatures > div { flex: 1; }
        .dn-sign-line {
          margin-top: 34px;
          border-top: 1px solid #000;
          padding-top: 4px;
          font-size: 10pt;
        }

        .dn-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 14px;
        }
        .dn-logo { height: 32px; width: auto; }
        .dn-meta { display: flex; align-items: flex-start; gap: 12px; }
        .dn-meta-text { font-size: 9.5pt; line-height: 1.6; text-align: right; }
        .dn-meta-text b { font-weight: 700; }

        .dn-sign-block { font-size: 10pt; }
        .dn-sign-title { font-weight: 700; margin-bottom: 6px; }
        .dn-sign-row {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          margin-top: 14px;
        }
        .dn-sign-row > span:first-child { white-space: nowrap; }
        .dn-sign-label { margin-top: 4px; }
        .dn-sign-box {
          height: 20mm;
          margin-top: 4px;
          border: 1px solid #000;
        }
        .dn-sign-fill {
          flex: 1;
          border-bottom: 1px solid #000;
          min-height: 18px;
          padding: 0 4px;
        }

        .dn-toolbar { margin: 0 auto 16px; max-width: 210mm; }

        /* On screen the sheet sits on a grey desk like a page preview. */
        @media screen {
          .dn-sheet { box-shadow: 0 1px 8px rgba(0, 0, 0, 0.15); }
        }

        /* The dashboard layout drops its chrome on this page; only the toolbar hides. */
        @media print {
          .dn-toolbar { display: none !important; }
          .dn-sheet { padding: 18mm 16mm; max-width: none; box-shadow: none; }
        }
      `}</style>

      <div className="dn-toolbar space-y-3 print:hidden">
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          {/* Upload only appears after printing (banner below): before that
              there is no signed copy to upload. */}
          <div className="flex items-center gap-2">
            <Button onClick={() => window.print()} className="gap-2">
              <Printer className="h-4 w-4" />
              Print / Save as PDF
            </Button>
          </div>
        </div>

        {printed ? (
          <div className="flex flex-col gap-3 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900 sm:flex-row sm:items-center sm:justify-between dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-100">
            <p className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Printed. Once the employee signs, scan it and upload it here.
            </p>
            <Button
              size="sm"
              onClick={() => router.push(attachmentsHref)}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload Signed Copy
            </Button>
          </div>
        ) : (
          <ol className="text-muted-foreground flex flex-wrap gap-x-6 gap-y-1 text-xs">
            <li>
              <b className="text-foreground">1.</b> Print the form
            </li>
            <li>
              <b className="text-foreground">2.</b> Employee and help desk sign
            </li>
            <li>
              <b className="text-foreground">3.</b> Scan and upload the signed
              copy
            </li>
          </ol>
        )}
      </div>

      <div className="dn-sheet">
        <div className="dn-header">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/logo-black.svg" alt="barq" className="dn-logo" />
          <div className="dn-meta">
            <div className="dn-meta-text">
              <div>
                <b>Ref:</b> {reference}
              </div>
              <div>
                <b>Issued:</b> {issuedOn}
              </div>
            </div>
          </div>
        </div>

        <h1>Employee Details</h1>
        <table className="dn-table">
          <tbody>
            <tr>
              <td className="dn-label-en">Employee Name</td>
              <td className="dn-value">
                <Field value={employeeName} />
              </td>
              <td className="dn-label-ar">اسم الموظف</td>
            </tr>
            <tr>
              <td className="dn-label-en">Employee ID</td>
              <td className="dn-value">
                <Field value={person?.employeeId} />
              </td>
              <td className="dn-label-ar">الرقم الوظيفي</td>
            </tr>
            <tr>
              <td className="dn-label-en">Email</td>
              <td className="dn-value">
                <Field value={person?.email} />
              </td>
              <td className="dn-label-ar">الإيميل</td>
            </tr>
            <tr>
              <td className="dn-label-en">Department</td>
              <td className="dn-value">
                <Field value={department} />
              </td>
              <td className="dn-label-ar">القسم</td>
            </tr>
          </tbody>
        </table>

        <h1>Delivery Note</h1>

        <h2>Asset Details</h2>
        <table className="dn-table">
          <thead>
            <tr>
              <th>Brand &amp; Model</th>
              <th>Serial Number</th>
              <th>Asset Tag</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="dn-value">
                <Field value={brandAndModelOf(asset)} />
              </td>
              <td className="dn-value">
                <Field value={asset.serialNumber} />
              </td>
              <td className="dn-value">{asset.assetTag}</td>
            </tr>
            {/* One spare row for an accessory written in by hand. */}
            <tr>
              <td className="dn-empty" />
              <td className="dn-empty" />
              <td className="dn-empty" />
            </tr>
          </tbody>
        </table>

        <div className="dn-declaration">
          <h2>
            Declaration | <bdi>إقرار وتعهد</bdi>
          </h2>

          <p className="dn-ar">
            أقرّ بأنني استلمت العهدة الموضحة أعلاه بحالة جيدة، وأتعهد بالمحافظة
            عليها واستخدامها للأغراض الوظيفية فقط وفق سياسات الشركة، وأتحمل
            المسؤولية في حال الفقدان أو التلف الناتج عن الإهمال، مع الالتزام
            بإعادتها عند الطلب.
          </p>

          <p>
            I declare that I have received the above-mentioned asset in good
            condition and undertake to maintain it and use it for business
            purposes only in accordance with company policies. I accept
            responsibility for any loss or damage resulting from negligence and
            agree to return it upon request.
          </p>
        </div>

        <div className="dn-signatures">
          <div className="dn-sign-block">
            <div className="dn-sign-title">
              Received by (Employee) | <bdi>المستلم (الموظف)</bdi>
            </div>
            {/* Left empty on purpose: signed by hand on the printed copy. */}
            <div className="dn-sign-label">
              Signature | <bdi>التوقيع</bdi>
            </div>
            <div className="dn-sign-box" />
            <div className="dn-sign-row">
              <span>
                Date | <bdi>التاريخ</bdi>
              </span>
              <span className="dn-sign-fill" />
            </div>
          </div>
          <div className="dn-sign-block">
            <div className="dn-sign-title">
              Handed over by (IT) | <bdi>المسلِّم (تقنية المعلومات)</bdi>
            </div>
            {/* Left empty on purpose: signed by hand on the printed copy. */}
            <div className="dn-sign-label">
              Signature | <bdi>التوقيع</bdi>
            </div>
            <div className="dn-sign-box" />
            <div className="dn-sign-row">
              <span>
                Date | <bdi>التاريخ</bdi>
              </span>
              <span className="dn-sign-fill" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
