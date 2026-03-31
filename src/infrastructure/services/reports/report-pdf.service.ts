/**
 * Report PDF Service
 *
 * Generates branded PDF reports using jsPDF with Barq brand identity.
 * - Black header (#1e2024) with white barq logo
 * - Yellow accent (#ffda00) for highlights
 * - Clean table layout with alternating rows
 */

import { injectable } from "inversify";
import { jsPDF } from "jspdf";
import { readFileSync } from "fs";
import { join } from "path";
import sharp from "sharp";
import type {
  IReportPdfService,
  GenerateReportPdfOptions,
} from "@/core/services/report-pdf.service.interface";
import type { ReportColumnDefinition } from "@/core/domain/reports/report-types";

/** Max rows in PDF to prevent massive files */
const MAX_PDF_ROWS = 5000;

/** Barq brand colors */
const BARQ_BLACK: [number, number, number] = [30, 32, 36]; // #1e2024
const BARQ_YELLOW: [number, number, number] = [255, 218, 0]; // #ffda00
const BARQ_LIGHT_BLUE: [number, number, number] = [223, 245, 247]; // #dff5f7

@injectable()
export class ReportPdfService implements IReportPdfService {
  private logoPngBase64: string | null = null;

  /**
   * Convert the SVG logo to PNG base64 using sharp (cached).
   * Returns empty string if conversion fails.
   */
  private async getLogoPngBase64(): Promise<string> {
    if (this.logoPngBase64 !== null) return this.logoPngBase64;

    try {
      const logoPath = join(process.cwd(), "public", "logos", "logo-white.svg");
      const svgBuffer = readFileSync(logoPath);
      // Render at 3x for crisp output: 107*3 = 321px wide
      const pngBuffer = await sharp(svgBuffer).resize(321).png().toBuffer();
      this.logoPngBase64 = `data:image/png;base64,${pngBuffer.toString("base64")}`;
    } catch {
      this.logoPngBase64 = "";
    }
    return this.logoPngBase64;
  }

  async generateReportPdf(options: GenerateReportPdfOptions): Promise<Buffer> {
    const {
      title,
      description,
      filters,
      columns,
      rows: allRows,
      summaryStats,
      generatedAt,
      generatedBy,
    } = options;

    const rows = allRows.slice(0, MAX_PDF_ROWS);
    const isTruncated = allRows.length > MAX_PDF_ROWS;

    // Create landscape A4 PDF
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let y = margin;

    // ---- Header (barq black background) ----
    const logoDataUrl = await this.getLogoPngBase64();
    this.drawPageHeader(doc, title, pageWidth, false, logoDataUrl);
    y = 28;

    // ---- Description & metadata ----
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(8);
    doc.text(description, margin, y);
    y += 5;

    doc.text(
      `Generated: ${generatedAt.toISOString().slice(0, 19).replace("T", " ")} | By: ${generatedBy}`,
      margin,
      y,
    );
    y += 5;

    // Applied filters
    const filterEntries = Object.entries(filters).filter(
      ([, v]) => v && v !== "",
    );
    if (filterEntries.length > 0) {
      const filterText = filterEntries
        .map(([k, v]) => `${k}: ${v}`)
        .join("  |  ");
      doc.text(`Filters: ${filterText}`, margin, y);
      y += 5;
    }

    // ---- Summary Stats ----
    if (summaryStats && summaryStats.length > 0) {
      y += 4;
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...BARQ_BLACK);
      const statsText = summaryStats
        .map((s) => `${s.label}: ${s.value}`)
        .join("  |  ");
      doc.text(statsText, margin, y);
      y += 7;
    } else {
      y += 4;
    }

    if (isTruncated) {
      doc.setTextColor(200, 0, 0);
      doc.setFontSize(7);
      doc.text(
        `Showing first ${MAX_PDF_ROWS.toLocaleString()} of ${allRows.length.toLocaleString()} rows. Export as CSV/Excel for full data.`,
        margin,
        y,
      );
      y += 5;
    }

    // ---- Table ----
    doc.setTextColor(0, 0, 0);
    const availWidth = pageWidth - margin * 2;
    const colWidths = this.calculateColumnWidths(columns, availWidth);

    // Table header
    this.drawTableHeader(doc, columns, colWidths, margin, y);
    y += 7;

    // Table rows
    const rowHeight = 6;
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");

    for (let i = 0; i < rows.length; i++) {
      // Page break check
      if (y + rowHeight > pageHeight - 15) {
        this.drawFooter(doc, pageWidth, pageHeight);
        doc.addPage();
        y = margin;

        // Re-draw header on new page (compact)
        this.drawPageHeader(
          doc,
          `${title} (continued)`,
          pageWidth,
          true,
          logoDataUrl,
        );
        y = 18;

        this.drawTableHeader(doc, columns, colWidths, margin, y);
        y += 7;
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
      }

      // Alternating row background
      if (i % 2 === 0) {
        doc.setFillColor(...BARQ_LIGHT_BLUE);
        doc.rect(margin, y - 4, availWidth, rowHeight, "F");
      }

      // Cell values
      let x = margin;
      doc.setTextColor(30, 30, 30);
      for (let c = 0; c < columns.length; c++) {
        const col = columns[c];
        const rawVal = rows[i][col.key];
        const text = this.formatCellValue(rawVal, col);

        if (col.align === "right") {
          doc.text(text, x + colWidths[c] - 2, y, { align: "right" });
        } else if (col.align === "center") {
          doc.text(text, x + colWidths[c] / 2, y, { align: "center" });
        } else {
          const clipped = text.length > 40 ? text.slice(0, 37) + "..." : text;
          doc.text(clipped, x + 2, y);
        }
        x += colWidths[c];
      }

      y += rowHeight;
    }

    // Final footer
    this.drawFooter(doc, pageWidth, pageHeight);

    // Convert to Buffer
    const arrayBuffer = doc.output("arraybuffer");
    return Buffer.from(arrayBuffer);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Draw the page header with barq black background and logo
   */
  private drawPageHeader(
    doc: jsPDF,
    title: string,
    pageWidth: number,
    compact: boolean,
    logoDataUrl: string,
  ): void {
    const headerHeight = compact ? 12 : 20;
    const margin = 15;

    // Black header background
    doc.setFillColor(...BARQ_BLACK);
    doc.rect(0, 0, pageWidth, headerHeight, "F");

    // Yellow accent line at bottom of header
    doc.setFillColor(...BARQ_YELLOW);
    doc.rect(0, headerHeight, pageWidth, 0.8, "F");

    const titleY = compact ? 8 : 13;
    let titleX = margin;

    // Add PNG logo (converted from SVG via sharp)
    if (logoDataUrl) {
      try {
        const logoWidth = 25;
        const logoHeight = 8.6;
        const logoY = compact ? 1.7 : 5.7;
        doc.addImage(logoDataUrl, "PNG", margin, logoY, logoWidth, logoHeight);
        titleX = margin + logoWidth + 5;
      } catch {
        // Fallback to text
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(compact ? 10 : 14);
        doc.setFont("helvetica", "bold");
        doc.text("barq", margin, titleY);
        titleX = margin + 20;
      }
    } else {
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(compact ? 10 : 14);
      doc.setFont("helvetica", "bold");
      doc.text("barq", margin, titleY);
      titleX = margin + 20;
    }

    // Title text (white on black)
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(compact ? 8 : 10);
    doc.setFont("helvetica", "normal");
    doc.text(title, titleX, titleY);
  }

  private calculateColumnWidths(
    columns: ReportColumnDefinition[],
    availWidth: number,
  ): number[] {
    const weights = columns.map((col) => {
      switch (col.type) {
        case "badge":
          return 1.2;
        case "number":
        case "percentage":
          return 1;
        case "currency":
          return 1.5;
        case "date":
          return 1.3;
        default:
          return 2;
      }
    });

    const totalWeight = weights.reduce((s, w) => s + w, 0);
    return weights.map((w) => (w / totalWeight) * availWidth);
  }

  private drawTableHeader(
    doc: jsPDF,
    columns: ReportColumnDefinition[],
    colWidths: number[],
    margin: number,
    y: number,
  ): void {
    // Dark header row matching barq black
    doc.setFillColor(50, 52, 56);
    const totalWidth = colWidths.reduce((s, w) => s + w, 0);
    doc.rect(margin, y - 4, totalWidth, 6, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");

    let x = margin;
    for (let i = 0; i < columns.length; i++) {
      const col = columns[i];
      if (col.align === "right") {
        doc.text(col.label, x + colWidths[i] - 2, y, { align: "right" });
      } else if (col.align === "center") {
        doc.text(col.label, x + colWidths[i] / 2, y, { align: "center" });
      } else {
        doc.text(col.label, x + 2, y);
      }
      x += colWidths[i];
    }
  }

  private drawFooter(doc: jsPDF, pageWidth: number, pageHeight: number): void {
    const pageCount = doc.getNumberOfPages();

    // Yellow accent line above footer
    doc.setFillColor(...BARQ_YELLOW);
    doc.rect(0, pageHeight - 8, pageWidth, 0.4, "F");

    doc.setFontSize(6);
    doc.setTextColor(120, 120, 120);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Page ${pageCount} | barq TechHub Reports`,
      pageWidth / 2,
      pageHeight - 4,
      { align: "center" },
    );
  }

  private formatCellValue(value: unknown, col: ReportColumnDefinition): string {
    if (value == null || value === "") return "—";

    switch (col.type) {
      case "currency":
        return typeof value === "number"
          ? value.toLocaleString("en-SA", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
          : String(value);
      case "number":
        return typeof value === "number"
          ? value.toLocaleString()
          : String(value);
      case "date": {
        const d = new Date(String(value));
        return isNaN(d.getTime())
          ? String(value)
          : d.toISOString().slice(0, 10);
      }
      case "percentage":
        return `${value}%`;
      default:
        return String(value);
    }
  }
}
