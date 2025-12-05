/**
 * Base Presentation Class
 *
 * Implements core presentation functionality following SOLID principles:
 * - Single Responsibility: Each method has one clear purpose
 * - Open/Closed: Open for extension via inheritance, closed for modification
 * - Liskov Substitution: Subclasses can replace base class
 * - Interface Segregation: Clean, focused interface
 * - Dependency Inversion: Depends on abstractions (ColorScheme, Config)
 */

import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import SVGtoPDF from "svg-to-pdfkit";

export interface ColorScheme {
  background: string;
  card: string;
  foreground: string;
  muted: string;
  subtle: string;
  accent: string;
  border: string;
  [key: string]: string; // Allow dynamic chart colors
}

export interface TypographyScale {
  hero: number;
  h1: number;
  h2: number;
  h3: number;
  body: number;
  small: number;
  tiny: number;
}

export interface SpacingScale {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

export interface PageConfig {
  width: number;
  height: number;
  margin: number;
  contentWidth: number;
  contentHeight: number;
}

export interface PresentationConfig {
  colors: ColorScheme;
  typography: TypographyScale;
  spacing: SpacingScale;
  page: PageConfig;
  branding: {
    logo: string;
    appName: string;
    tagline: string;
    copyright: string;
  };
}

/**
 * Abstract Base Presentation Class
 * Provides core functionality for PDF presentation generation
 */
export abstract class BasePresentation {
  protected doc: PDFKit.PDFDocument;
  protected currentPage = 0;
  protected config: PresentationConfig;

  constructor(outputPath: string, config: PresentationConfig) {
    this.config = config;

    this.doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margins: {
        top: config.page.margin,
        bottom: config.page.margin,
        left: config.page.margin,
        right: config.page.margin,
      },
      bufferPages: true,
    });

    this.doc.pipe(fs.createWriteStream(outputPath));
  }

  /**
   * Add a new page with background
   * Template method that can be overridden by subclasses
   */
  protected addPage(): void {
    if (this.currentPage > 0) {
      this.doc.addPage();
    }
    this.currentPage++;

    this.drawPageBackground();
  }

  /**
   * Draw page background - can be overridden
   */
  protected drawPageBackground(): void {
    this.doc
      .rect(0, 0, this.config.page.width, this.config.page.height)
      .fill(this.config.colors.background);
  }

  /**
   * Draw header - template method
   */
  protected drawHeader(title: string): void {
    this.drawHeaderBackground();
    this.drawHeaderLogo();
    this.drawHeaderTitle(title);
  }

  /**
   * Draw header background - can be overridden
   */
  protected abstract drawHeaderBackground(): void;

  /**
   * Draw header logo - can be overridden
   */
  protected drawHeaderLogo(): void {
    const { appName } = this.config.branding;
    const { body } = this.config.typography;
    const { margin } = this.config.page;
    const { muted } = this.config.colors;

    // Load and draw barq logo SVG
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const logoPath = path.join(
      __dirname,
      "../../../public/logos/logo-white.svg",
    );
    const logoSVG = fs.readFileSync(logoPath, "utf8");

    // Draw SVG logo
    SVGtoPDF(this.doc, logoSVG, margin, 22, {
      width: 80,
      height: 28,
      preserveAspectRatio: "xMinYMin meet",
    });

    // App name next to logo
    this.doc.fontSize(body).font("Helvetica").fillColor(muted);
    this.doc.text(appName, margin + 90, 32, {
      lineBreak: false,
      continued: false,
    });
  }

  /**
   * Draw header title
   */
  protected drawHeaderTitle(title: string): void {
    const { h3 } = this.config.typography;
    const { foreground } = this.config.colors;
    const { width } = this.config.page;

    this.doc.fontSize(h3).font("Helvetica-Bold").fillColor(foreground);

    // Calculate center position
    const titleWidth = this.doc.widthOfString(title);
    const centerX = (width - titleWidth) / 2;

    this.doc.text(title, centerX, 30, { lineBreak: false, continued: false });
  }

  /**
   * Draw footer - template method
   */
  protected drawFooter(): void {
    this.drawFooterBackground();
    this.drawFooterContent();
  }

  /**
   * Draw footer background - can be overridden
   */
  protected abstract drawFooterBackground(): void;

  /**
   * Draw footer content with proper text positioning
   * Uses manual width calculation to prevent extra pages
   */
  protected drawFooterContent(): void {
    const footerY = this.config.page.height - 40;
    const { tiny } = this.config.typography;
    const { muted, subtle } = this.config.colors;
    const { margin, width } = this.config.page;
    const { copyright, tagline } = this.config.branding;

    // Left: Copyright - absolute positioning
    this.doc
      .fontSize(tiny)
      .font("Helvetica")
      .fillColor(subtle || muted);
    this.doc.text(copyright, margin, footerY, {
      lineBreak: false,
      continued: false,
    });

    // Center: Tagline - calculate center position manually
    const taglineWidth = this.doc.widthOfString(tagline);
    const centerX = (width - taglineWidth) / 2;

    this.doc.fontSize(tiny).fillColor(subtle || muted);
    this.doc.text(tagline, centerX, footerY, {
      lineBreak: false,
      continued: false,
    });

    // Right: Page number - absolute positioning
    const pageNum = `${this.currentPage}`;
    const pageNumWidth = this.doc.widthOfString(pageNum);

    this.doc.fontSize(tiny).fillColor(subtle || muted);
    this.doc.text(pageNum, width - margin - pageNumWidth, footerY, {
      lineBreak: false,
      continued: false,
    });
  }

  /**
   * Draw a card with optional shadow
   * Reusable component following DRY principle
   */
  protected drawCard(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number = 8,
    withShadow: boolean = false,
  ): void {
    if (withShadow) {
      // Shadow
      this.doc.opacity(0.5);
      this.doc.roundedRect(x + 3, y + 3, width, height, radius).fill("#000000");
      this.doc.opacity(1);
    }

    // Card
    this.doc
      .roundedRect(x, y, width, height, radius)
      .fill(this.config.colors.card);
  }

  /**
   * Draw accent bar on card
   * Reusable component
   */
  protected drawCardAccent(
    x: number,
    y: number,
    height: number,
    color: string,
    width: number = 6,
    radius: number = 8,
  ): void {
    this.doc.roundedRect(x, y, width, height, radius).fill(color);
  }

  /**
   * Draw centered text with manual positioning
   * Prevents extra page breaks
   */
  protected drawCenteredText(
    text: string,
    y: number,
    fontSize: number,
    color: string,
    font: string = "Helvetica",
  ): void {
    this.doc.fontSize(fontSize).font(font).fillColor(color);

    const textWidth = this.doc.widthOfString(text);
    const centerX = (this.config.page.width - textWidth) / 2;

    this.doc.text(text, centerX, y, {
      lineBreak: false,
      continued: false,
    });
  }

  /**
   * Finalize and save document
   */
  public save(): void {
    this.doc.end();
  }

  /**
   * Get current page number
   */
  public getCurrentPage(): number {
    return this.currentPage;
  }

  /**
   * Get document instance for advanced operations
   */
  protected getDocument(): PDFKit.PDFDocument {
    return this.doc;
  }
}
