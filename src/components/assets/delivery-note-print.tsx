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

import { ArrowLeft, Printer } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import type { AssetDTO } from "@/interface-adapters/presenters/asset.presenter";
import type { PersonDTO } from "@/interface-adapters/presenters/person.presenter";

interface DeliveryNotePrintProps {
  asset: AssetDTO;
  /** Current holder of the asset; null when the asset is unassigned. */
  person: PersonDTO | null;
}

/** Renders a value, or a blank line for whoever fills the form by hand. */
function Field({ value }: { value: string | null | undefined }) {
  if (value && value.trim().length > 0) {
    return <span>{value}</span>;
  }
  return <span className="dn-blank" aria-hidden="true" />;
}

export function DeliveryNotePrint({ asset, person }: DeliveryNotePrintProps) {
  const router = useRouter();

  const employeeName = person
    ? [person.firstName, person.middleName, person.lastName]
        .filter(Boolean)
        .join(" ")
    : null;

  const department = person?.department || person?.orgUnitName || null;
  const brandAndModel = [asset.vendorName, asset.modelName]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <style>{`
        /* A4 with the margins a signed paper form needs. */
        @page { size: A4; margin: 18mm 16mm; }

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
        .dn-table td.dn-empty { height: 22px; }

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
          margin-top: 36px;
        }
        .dn-signatures > div { flex: 1; }
        .dn-sign-line {
          margin-top: 34px;
          border-top: 1px solid #000;
          padding-top: 4px;
          font-size: 10pt;
        }

        .dn-toolbar { margin: 0 auto 16px; max-width: 210mm; }

        @media print {
          .dn-toolbar { display: none !important; }
          .dn-sheet { padding: 0; max-width: none; }
        }
      `}</style>

      <div className="dn-toolbar flex items-center justify-between gap-2 print:hidden">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={() => window.print()} className="gap-2">
          <Printer className="h-4 w-4" />
          Print / Save as PDF
        </Button>
      </div>

      <div className="dn-sheet">
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
                <Field value={brandAndModel} />
              </td>
              <td className="dn-value">
                <Field value={asset.serialNumber} />
              </td>
              <td className="dn-value">{asset.assetTag}</td>
            </tr>
            {/* Blank rows: one printed note often covers several handed-over items. */}
            {Array.from({ length: 5 }).map((_, index) => (
              <tr key={index}>
                <td className="dn-empty" />
                <td className="dn-empty" />
                <td className="dn-empty" />
              </tr>
            ))}
          </tbody>
        </table>

        <div className="dn-declaration">
          <h2>Declaration | إقرار وتعهد</h2>

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
          <div>
            <div className="dn-sign-line">
              Employee Signature | توقيع الموظف
            </div>
          </div>
          <div>
            <div className="dn-sign-line">Date | التاريخ</div>
          </div>
        </div>
      </div>
    </>
  );
}
