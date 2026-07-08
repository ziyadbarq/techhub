import { injectable, inject } from "inversify";
import { ValidationError } from "@/core/domain/errors/validation.error";
import { jsPDF } from "jspdf";
import { DI_TOKENS } from "@/di/types";
import type { IAssetDisposalRepository } from "@/core/repositories/asset-disposal.repository.interface";
import type { IAssetRepository } from "@/core/repositories/asset.repository.interface";
import { LogExecution } from "@/lib/decorators/log-execution.decorator";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface GenerateDisposalCertificatePDFRequest {
  disposalId: string;
}

export interface GenerateDisposalCertificatePDFResponse {
  pdfBuffer: Buffer;
  certificateNumber: string;
  filename: string;
}

/**
 * Generates a PDF certificate for a completed asset disposal.
 *
 * The certificate includes:
 * - Barq header and logo placeholder
 * - Certificate number and issue date
 * - Asset details (tag, model, serial number)
 * - Disposal details (type, method, completion date, reason)
 * - Approver information and signatures section
 * - Footer with timestamp
 */
@injectable()
export class GenerateDisposalCertificatePDFUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetDisposalRepository)
    private readonly disposalRepository: IAssetDisposalRepository,
    @inject(DI_TOKENS.IAssetRepository)
    private readonly assetRepository: IAssetRepository,
  ) {}

  @LogExecution("disposal.generateCertificatePdf")
  async execute(
    request: GenerateDisposalCertificatePDFRequest,
  ): Promise<GenerateDisposalCertificatePDFResponse> {
    // Fetch disposal details
    const disposal = await this.disposalRepository.findById(request.disposalId);
    if (!disposal) {
      throw new NotFoundError(`Disposal ${request.disposalId} not found`);
    }

    if (disposal.status !== "COMPLETED") {
      throw new ValidationError(
        "Certificate can only be generated for completed disposals",
      );
    }

    if (!disposal.certificateNumber) {
      throw new ValidationError("Disposal must have a certificate number");
    }

    // Fetch asset details
    const asset = await this.assetRepository.findById(disposal.assetId);
    if (!asset) {
      throw new NotFoundError(`Asset ${disposal.assetId} not found`);
    }

    // Generate PDF
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let yPos = margin;

    // === HEADER ===
    pdf.setFillColor(0, 40, 100); // Dark blue
    pdf.rect(0, 0, pageWidth, 40, "F");

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont("helvetica", "bold");
    pdf.text("BARQ", margin, 20);

    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text("Financial Services", margin, 28);

    yPos = 50;

    // === CERTIFICATE TITLE ===
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(20);
    pdf.setFont("helvetica", "bold");
    pdf.text("ASSET DISPOSAL CERTIFICATE", pageWidth / 2, yPos, {
      align: "center",
    });

    yPos += 15;

    // === CERTIFICATE INFO ===
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");
    pdf.text(
      `Certificate Number: ${disposal.certificateNumber}`,
      pageWidth / 2,
      yPos,
      { align: "center" },
    );

    yPos += 7;
    pdf.text(
      `Issue Date: ${disposal.certificateIssuedAt?.toLocaleDateString() ?? new Date().toLocaleDateString()}`,
      pageWidth / 2,
      yPos,
      { align: "center" },
    );

    yPos += 15;

    // === ASSET DETAILS SECTION ===
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("Asset Information", margin, yPos);

    yPos += 8;
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");

    const assetDetails = [
      `Asset Tag: ${asset.assetTag}`,
      `Serial Number: ${asset.serialNumber ?? "N/A"}`,
      `Model: ${asset.assetModelId}`, // Note: Would need to fetch model name from repository
    ];

    for (const detail of assetDetails) {
      pdf.text(detail, margin + 5, yPos);
      yPos += 6;
    }

    yPos += 5;

    // === DISPOSAL DETAILS SECTION ===
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("Disposal Information", margin, yPos);

    yPos += 8;
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");

    const disposalDetails = [
      `Disposal Type: ${disposal.disposalType}`,
      `Disposal Date: ${disposal.disposalDate?.toLocaleDateString() ?? "N/A"}`,
      `Reason: ${disposal.reason ?? "N/A"}`,
      `Vendor: ${disposal.disposalVendorId ?? "N/A"}`,
      `Recipient: ${disposal.recipientInfo ?? "N/A"}`,
      `Estimated Value: ${disposal.estimatedValue ? `${disposal.estimatedValue} ${disposal.currency ?? "SAR"}` : "N/A"}`,
      `Actual Proceeds: ${disposal.actualProceeds ? `${disposal.actualProceeds} ${disposal.currency ?? "SAR"}` : "N/A"}`,
    ];

    for (const detail of disposalDetails) {
      pdf.text(detail, margin + 5, yPos);
      yPos += 6;
    }

    yPos += 5;

    // === DATA SANITIZATION SECTION ===
    if (disposal.sanitizationChecklist) {
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("Data Sanitization", margin, yPos);

      yPos += 8;
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");

      const checklist = disposal.sanitizationChecklist as {
        dataWiped?: boolean;
        driveRemoved?: boolean;
        verified?: boolean;
        method?: string;
      };

      const sanitizationDetails = [
        `Data Wiped: ${checklist.dataWiped ? "Yes" : "No"}`,
        `Drive Removed: ${checklist.driveRemoved ? "Yes" : "No"}`,
        `Verified: ${checklist.verified ? "Yes" : "No"}`,
        `Method: ${checklist.method ?? "N/A"}`,
      ];

      for (const detail of sanitizationDetails) {
        pdf.text(detail, margin + 5, yPos);
        yPos += 6;
      }

      yPos += 5;
    }

    // === APPROVAL SECTION ===
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("Approval", margin, yPos);

    yPos += 8;
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");

    pdf.text(`Initiated By: ${disposal.initiatedById}`, margin + 5, yPos);
    yPos += 6;

    if (disposal.approvedById) {
      pdf.text(`Approved By: ${disposal.approvedById}`, margin + 5, yPos);
      yPos += 6;
      pdf.text(
        `Approved At: ${disposal.approvedAt?.toLocaleString() ?? "N/A"}`,
        margin + 5,
        yPos,
      );
      yPos += 6;
    }

    // === SIGNATURE SECTION ===
    yPos += 10;
    pdf.setDrawColor(0, 0, 0);
    pdf.line(margin, yPos, margin + 60, yPos); // Signature line
    yPos += 5;
    pdf.setFontSize(9);
    pdf.text("Authorized Signature", margin, yPos);

    yPos += 10;
    pdf.line(pageWidth - margin - 60, yPos - 15, pageWidth - margin, yPos - 15);
    pdf.text("Date", pageWidth - margin - 30, yPos);

    // === FOOTER ===
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.text(
      "This certificate was generated electronically and is valid without signature.",
      pageWidth / 2,
      pageHeight - 20,
      { align: "center" },
    );

    pdf.text(
      `Generated: ${new Date().toLocaleString()}`,
      pageWidth / 2,
      pageHeight - 15,
      { align: "center" },
    );

    pdf.text(
      "Barq - Internal Use Only - Confidential",
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" },
    );

    // Generate buffer
    const pdfBuffer = Buffer.from(pdf.output("arraybuffer"));

    return {
      pdfBuffer,
      certificateNumber: disposal.certificateNumber,
      filename: `disposal-certificate-${disposal.certificateNumber}.pdf`,
    };
  }
}
