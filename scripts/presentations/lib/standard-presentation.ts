/**
 * Standard TechHub Presentation
 *
 * Extends BasePresentation with standard styling
 * Follows Open/Closed Principle - open for extension, closed for modification
 */

import { BasePresentation } from "./base-presentation";
import type { PresentationConfig } from "./base-presentation";

export class StandardPresentation extends BasePresentation {
  constructor(outputPath: string, config: PresentationConfig) {
    super(outputPath, config);
  }

  /**
   * Draw header background - standard style
   */
  protected drawHeaderBackground(): void {
    this.doc
      .rect(0, 0, this.config.page.width, 80)
      .fill(this.config.colors.card);
  }

  /**
   * Draw footer background - standard style
   */
  protected drawFooterBackground(): void {
    const footerY = this.config.page.height - 45;
    this.doc
      .rect(0, footerY - 5, this.config.page.width, 50)
      .fill(this.config.colors.card);
  }

  /**
   * Title Slide
   */
  public addTitleSlide(): void {
    this.addPage();

    const { hero, h2, h3 } = this.config.typography;
    const { foreground, muted, chart1 } = this.config.colors;
    const { width } = this.config.page;

    // Accent bar
    this.doc.rect(0, 200, width, 10).fill(chart1);

    // Main title
    this.drawCenteredText(
      "barq TechHub",
      250,
      hero,
      foreground,
      "Helvetica-Bold",
    );

    // Subtitle
    this.drawCenteredText(
      "Enterprise CMDB & IT Asset Management",
      320,
      h2,
      muted,
    );

    // Tagline
    this.drawCenteredText(
      "Built for Financial Services Compliance",
      370,
      h3,
      chart1,
    );

    this.drawFooter();
  }

  /**
   * Feature Slide
   */
  public addFeatureSlide(): void {
    this.addPage();
    this.drawHeader("Platform Overview");

    const startY = 120;
    const features = [
      {
        title: "Configuration Management Database",
        description:
          "Map dependencies, track relationships, and maintain service topology",
        icon: "◆",
        color: this.config.colors.chart1,
      },
      {
        title: "IT Asset Management",
        description:
          "Complete asset lifecycle tracking with warranty and contract management",
        color: this.config.colors.chart2,
      },
      {
        title: "Compliance & Audit",
        description:
          "Immutable audit trails, disposal certificates, and regulatory reports",
        color: this.config.colors.chart3,
      },
      {
        title: "License Management",
        description:
          "Track software licenses, entitlements, and optimize costs",
        color: this.config.colors.chart4,
      },
    ];

    const { margin, contentWidth } = this.config.page;
    const { h3, body } = this.config.typography;
    const { foreground, muted } = this.config.colors;

    features.forEach((feature, index) => {
      const y = startY + index * 90;

      // Card
      this.drawCard(margin + 40, y - 10, contentWidth - 40, 70, 5);

      // Accent bar
      this.drawCardAccent(margin + 40, y - 10, 70, feature.color, 6, 5);

      // Title
      this.doc.fontSize(h3).font("Helvetica-Bold").fillColor(foreground);
      this.doc.text(feature.title, margin + 60, y + 5, {
        lineBreak: false,
        continued: false,
      });

      // Description
      this.doc.fontSize(body).font("Helvetica").fillColor(muted);
      this.doc.text(feature.description, margin + 60, y + 30, {
        width: contentWidth - 80,
        lineBreak: false,
        continued: false,
      });
    });

    this.drawFooter();
  }

  /**
   * Stats Slide
   */
  public addStatsSlide(): void {
    this.addPage();
    this.drawHeader("Platform Capabilities");

    const startY = 140;
    const stats = [
      {
        label: "Entities Managed",
        value: "35+",
        color: this.config.colors.chart1,
      },
      {
        label: "Integrated Systems",
        value: "12+",
        color: this.config.colors.chart2,
      },
      {
        label: "Audit Coverage",
        value: "100%",
        color: this.config.colors.chart3,
      },
      {
        label: "RBAC Permissions",
        value: "269",
        color: this.config.colors.chart4,
      },
    ];

    const cardWidth = 150;
    const cardHeight = 180;
    const spacing = 30;
    const totalWidth = stats.length * cardWidth + (stats.length - 1) * spacing;
    const startX = (this.config.page.width - totalWidth) / 2;

    const { hero, small } = this.config.typography;
    const { muted } = this.config.colors;

    stats.forEach((stat, index) => {
      const x = startX + index * (cardWidth + spacing);
      const y = startY;

      // Card
      this.drawCard(x, y, cardWidth, cardHeight, 8);

      // Top accent
      this.doc.roundedRect(x, y, cardWidth, 5, 8).fill(stat.color);

      // Value
      this.doc.fontSize(hero).font("Helvetica-Bold").fillColor(stat.color);

      const valueWidth = this.doc.widthOfString(stat.value);
      const valueX = x + (cardWidth - valueWidth) / 2;
      this.doc.text(stat.value, valueX, y + 50, {
        lineBreak: false,
        continued: false,
      });

      // Label
      this.doc.fontSize(small).font("Helvetica").fillColor(muted);

      const labelWidth = this.doc.widthOfString(stat.label);
      const labelX = x + (cardWidth - labelWidth) / 2;
      this.doc.text(stat.label, labelX, y + 110, {
        lineBreak: false,
        continued: false,
      });
    });

    this.drawFooter();
  }

  /**
   * Architecture Slide
   */
  public addArchitectureSlide(): void {
    this.addPage();
    this.drawHeader("5-Layer Clean Architecture");

    const startY = 140;
    const layers = [
      {
        name: "Presentation",
        color: this.config.colors.chart1,
        desc: "UI Components & Pages",
      },
      {
        name: "Interface Adapters",
        color: this.config.colors.chart2,
        desc: "Controllers & DTOs",
      },
      {
        name: "Use Cases",
        color: this.config.colors.chart3,
        desc: "Business Logic",
      },
      {
        name: "Domain",
        color: this.config.colors.chart4,
        desc: "Entities & Rules",
      },
      {
        name: "Infrastructure",
        color: this.config.colors.chart5,
        desc: "Repositories & Services",
      },
    ];

    const layerHeight = 60;
    const layerSpacing = 10;
    const { margin, contentWidth } = this.config.page;
    const { h3, body } = this.config.typography;
    const { foreground, muted } = this.config.colors;

    layers.forEach((layer, index) => {
      const y = startY + index * (layerHeight + layerSpacing);

      // Card
      this.drawCard(margin + 100, y, contentWidth - 200, layerHeight, 5);

      // Accent
      this.drawCardAccent(margin + 100, y, layerHeight, layer.color, 8, 5);

      // Name
      this.doc.fontSize(h3).font("Helvetica-Bold").fillColor(foreground);
      this.doc.text(layer.name, margin + 130, y + 10, {
        lineBreak: false,
        continued: false,
      });

      // Description
      this.doc.fontSize(body).font("Helvetica").fillColor(muted);
      this.doc.text(layer.desc, margin + 130, y + 35, {
        lineBreak: false,
        continued: false,
      });
    });

    this.drawFooter();
  }

  /**
   * Closing Slide
   */
  public addClosingSlide(): void {
    this.addPage();
    this.drawHeader("Get Started");

    const startY = 180;
    const { h1, body, h3 } = this.config.typography;
    const { foreground, muted, chart1 } = this.config.colors;
    const { md, lg } = this.config.spacing;
    const { width } = this.config.page;

    // Main message
    this.drawCenteredText(
      "Ready to Transform Your IT Operations?",
      startY,
      h1,
      foreground,
      "Helvetica-Bold",
    );

    // CTA card
    const cardWidth = 500;
    const cardHeight = 100;
    const cardX = (width - cardWidth) / 2;
    const cardY = startY + 80;

    this.drawCard(cardX, cardY, cardWidth, cardHeight, 8);

    // Contact label
    this.drawCenteredText(
      "Contact Technology Operations",
      cardY + md + 5,
      body,
      muted,
    );

    // Email
    this.drawCenteredText(
      "it-support@barq.com",
      cardY + lg + md,
      h3,
      chart1,
      "Helvetica-Bold",
    );

    this.drawFooter();
  }
}
