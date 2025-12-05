declare module "svg-to-pdfkit" {
  import type PDFKit from "pdfkit";

  interface SvgToPdfOptions {
    width?: number;
    height?: number;
    preserveAspectRatio?: string;
    [key: string]: unknown;
  }

  type SvgToPdf = (
    doc: PDFKit.PDFDocument,
    svg: string,
    x: number,
    y: number,
    options?: SvgToPdfOptions,
  ) => PDFKit.PDFDocument;

  const svgToPdf: SvgToPdf;
  export = svgToPdf;
}
