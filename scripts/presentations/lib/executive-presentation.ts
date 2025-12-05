/**
 * Executive Presentation
 *
 * Generates PDF presentation based on docs/ITAM-CMDB-Platform-Executive-Presentation.md
 * Designed for C-level and board presentation with strategic focus
 * Extends BasePresentation following Open/Closed Principle
 */

import { BasePresentation } from "./base-presentation";
import type { PresentationConfig } from "./base-presentation";

export class ExecutivePresentation extends BasePresentation {
  constructor(outputPath: string, config: PresentationConfig) {
    super(outputPath, config);
  }

  /**
   * Draw header background - executive style with accent
   */
  protected drawHeaderBackground(): void {
    const { width } = this.config.page;
    const { card, chart1 } = this.config.colors;

    // Card background
    this.doc.rect(0, 0, width, 80).fill(card);

    // Barq yellow accent bar at bottom of header
    this.doc.rect(0, 75, width, 5).fill(chart1);
  }

  /**
   * Draw footer background - executive style
   */
  protected drawFooterBackground(): void {
    const { width, height } = this.config.page;
    const { card } = this.config.colors;
    const footerY = height - 45;

    this.doc.rect(0, footerY - 5, width, 50).fill(card);
  }

  /**
   * Helper: Draw bullet list
   * Used across multiple slides for consistent formatting
   */
  private drawBulletList(
    items: string[],
    x: number,
    y: number,
    options?: {
      bulletChar?: string;
      bulletColor?: string;
      spacing?: number;
      fontSize?: number;
      maxWidth?: number;
    },
  ): number {
    const bulletChar = options?.bulletChar || "•";
    const bulletColor = options?.bulletColor || this.config.colors.chart1;
    const spacing = options?.spacing || this.config.spacing.sm;
    const fontSize = options?.fontSize || this.config.typography.body;
    const maxWidth = options?.maxWidth || this.config.page.contentWidth - 100;
    const { foreground } = this.config.colors;

    let currentY = y;

    items.forEach((item) => {
      // Draw bullet
      this.doc
        .fontSize(fontSize)
        .font("Helvetica-Bold")
        .fillColor(bulletColor)
        .text(bulletChar, x, currentY, { lineBreak: false, continued: false });

      // Calculate actual text height with wrapping
      const textHeight = this.doc
        .fontSize(fontSize)
        .font("Helvetica")
        .heightOfString(item, {
          width: maxWidth,
          lineGap: 2,
        });

      // Draw text
      this.doc
        .fontSize(fontSize)
        .font("Helvetica")
        .fillColor(foreground)
        .text(item, x + 20, currentY, {
          width: maxWidth,
          lineGap: 2,
          continued: false,
        });

      // Move to next item position using actual height
      currentY += textHeight + spacing;
    });

    return currentY;
  }

  /**
   * Helper: Draw arrow for diagrams
   * Used in architecture slide
   */
  private drawArrow(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: string,
  ): void {
    // Draw line
    this.doc.lineWidth(2).moveTo(x1, y1).lineTo(x2, y2).stroke(color);

    // Draw arrow head (triangle pointing right)
    const arrowSize = 8;
    this.doc
      .moveTo(x2, y2)
      .lineTo(x2 - arrowSize, y2 - arrowSize / 2)
      .lineTo(x2 - arrowSize, y2 + arrowSize / 2)
      .closePath()
      .fill(color);
  }

  /**
   * Helper: Draw numbered item
   * Used in leadership support slide
   */
  private drawNumberedItem(
    number: number,
    title: string,
    description: string,
    x: number,
    y: number,
    width: number,
  ): number {
    const { h3, body } = this.config.typography;
    const { chart1, foreground, muted } = this.config.colors;

    // Number circle
    this.doc.circle(x + 20, y + 20, 18).fill(chart1);
    this.doc
      .fontSize(h3)
      .font("Helvetica-Bold")
      .fillColor("#000000")
      .text(number.toString(), x + 12, y + 12, {
        lineBreak: false,
        continued: false,
      });

    // Calculate title height
    const titleHeight = this.doc
      .fontSize(h3)
      .font("Helvetica-Bold")
      .heightOfString(title, {
        width: width - 70,
      });

    // Title
    this.doc
      .fontSize(h3)
      .font("Helvetica-Bold")
      .fillColor(foreground)
      .text(title, x + 50, y + 10, {
        width: width - 70,
        continued: false,
      });

    // Calculate description height
    const descriptionHeight = this.doc
      .fontSize(body)
      .font("Helvetica")
      .heightOfString(description, {
        width: width - 70,
        lineGap: 2,
      });

    // Description
    this.doc
      .fontSize(body)
      .font("Helvetica")
      .fillColor(muted)
      .text(description, x + 50, y + 35, {
        width: width - 70,
        lineGap: 2,
        continued: false,
      });

    // Return next y position based on actual heights + padding
    return y + 10 + titleHeight + 5 + descriptionHeight + 20;
  }

  // ========== SLIDE METHODS ==========

  /**
   * Slide 1: Executive Title Slide
   */
  public addExecutiveTitleSlide(): void {
    this.addPage();

    const { hero, h3, body } = this.config.typography;
    const { foreground, muted, chart1 } = this.config.colors;
    const { width } = this.config.page;

    // Main title
    this.drawCenteredText(
      "Enterprise ITAM & CMDB Platform",
      180,
      hero,
      foreground,
      "Helvetica-Bold",
    );

    // Subtitle
    this.drawCenteredText(
      "Regulatory-Grade Asset Intelligence for Saudi Arabia's Leading Fintech",
      250,
      h3,
      muted,
    );

    // Accent bar
    this.doc.rect(0, 290, width, 5).fill(chart1);

    // Presented by
    this.doc.fontSize(body).font("Helvetica").fillColor(muted);
    const presentedText = "Presented by: Technology Division, Barq";
    const presentedWidth = this.doc.widthOfString(presentedText);
    this.doc.text(presentedText, (width - presentedWidth) / 2, 320, {
      lineBreak: false,
      continued: false,
    });

    // Governed by
    const governedText = "Governed by: SAMA (Saudi Central Bank)";
    const governedWidth = this.doc.widthOfString(governedText);
    this.doc.text(governedText, (width - governedWidth) / 2, 345, {
      lineBreak: false,
      continued: false,
    });

    this.drawFooter();
  }

  /**
   * Slide 2: Executive Summary
   */
  public addExecutiveSummarySlide(): void {
    this.addPage();
    this.drawHeader("Why This Matters");

    const { margin, contentWidth } = this.config.page;
    const startY = 140;

    // Summary card (increased height from 290 to 340)
    this.drawCard(margin, startY, contentWidth, 340, 8, true);
    this.drawCardAccent(margin, startY, 340, this.config.colors.chart1, 8);

    const bullets = [
      "Regulatory pressure: SAMA demands 100% asset accountability; siloed trackers created blind spots and recurring audit pain.",
      "Our response: Unified ITAM & CMDB platform built in-house, deployed on-premises, and integrated with HR, Intune, Azure AD, ERP, and procurement systems.",
      "Proof: Automated controls, immutable audit trails, and 4,200+ assets with 98%+ device-to-user correlation accuracy.",
      "Value delivered: Avoids 1.5-2M SAR/year in vendor licensing plus ~850K SAR/year in operational efficiency — total ~2.35-2.85M SAR annually with zero vendor lock-in.",
    ];

    this.drawBulletList(bullets, margin + 30, startY + 20, {
      spacing: 20,
      maxWidth: contentWidth - 80,
    });

    this.drawFooter();
  }

  /**
   * Slide 3: The Challenge Before
   */
  public addChallengeSlide(): void {
    this.addPage();
    this.drawHeader("Fragmented Operations Were Costly");

    const { margin, contentWidth } = this.config.page;
    const startY = 140;

    // Challenge card (increased height from 270 to 320)
    this.drawCard(margin, startY, contentWidth, 320, 8, true);
    this.drawCardAccent(margin, startY, 320, this.config.colors.error, 8);

    const painPoints = [
      "6 departments maintained separate spreadsheets with mismatched ownership data (27% variance discovered).",
      "3+ weeks of manual effort were needed for every SAMA audit readiness cycle.",
      'Unknown "ghost devices" lingered after employee departures.',
      "Manual reconciliation across HR, Intune, Azure AD, and ERP slowed incident response and compliance checks.",
      "License over-allocation, contract renewal misses, and onboarding/offboarding delays inflated cost and risk.",
    ];

    this.drawBulletList(painPoints, margin + 30, startY + 20, {
      spacing: 18,
      maxWidth: contentWidth - 80,
      fontSize: this.config.typography.body - 1,
    });

    this.drawFooter();
  }

  /**
   * Slide 4: Vision
   */
  public addVisionSlide(): void {
    this.addPage();
    this.drawHeader("One Source of Truth for All Technology Assets");

    const { margin, contentWidth } = this.config.page;
    const { h3 } = this.config.typography;
    const { chart1 } = this.config.colors;
    const startY = 160;

    // Vision card
    this.drawCard(margin, startY, contentWidth, 240, 8, true);
    this.drawCardAccent(margin, startY, 240, chart1, 8);

    const visionPoints = [
      "Eliminates spreadsheet chaos and departmental silos.",
      "Integrates HR, Intune, Azure AD, ERP, procurement, and discovery sources.",
      "Powers smart decisions across IT, Security, Finance, and Operations.",
      "Provides SAMA-ready audit trails and compliance evidence.",
      "Scales with Barq's growth as a leading fintech innovator.",
    ];

    this.drawBulletList(visionPoints, margin + 30, startY + 20, {
      spacing: 20,
      maxWidth: contentWidth - 80,
    });

    // Tagline at bottom
    const tagline =
      "\"If it's technology, it's tracked. If it's tracked, it's optimized.\"";
    this.drawCenteredText(
      tagline,
      startY + 200,
      h3,
      chart1,
      "Helvetica-BoldOblique",
    );

    this.drawFooter();
  }

  /**
   * Slide 5: Platform Overview
   */
  public addPlatformOverviewSlide(): void {
    this.addPage();
    this.drawHeader("What We Built: Enterprise-Grade ITAM & CMDB");

    const { margin, contentWidth } = this.config.page;
    const { h3, body, small } = this.config.typography;
    const { foreground, muted, chart1, chart2, chart3 } = this.config.colors;

    const startY = 140;
    const layers = [
      {
        title: "Foundation Layer",
        description:
          "People, Departments, Locations, Vendors, Tags, Custom Fields, Attachments",
        color: chart1,
      },
      {
        title: "Asset & Inventory Management",
        description:
          "Lifecycle automation: Stock → Kits → Reservations → Assignment → Maintenance → Disposal. Multi-currency support with universal imports.",
        color: chart2,
      },
      {
        title: "CMDB, Service & Compliance",
        description:
          "Service catalog with dependency mapping, Intune integration, impact analysis, license & contract management, immutable audit trails.",
        color: chart3,
      },
    ];

    layers.forEach((layer, index) => {
      const y = startY + index * 95;

      // Card
      this.drawCard(margin, y, contentWidth, 80, 8, true);
      this.drawCardAccent(margin, y, 80, layer.color, 8);

      // Title
      this.doc
        .fontSize(h3)
        .font("Helvetica-Bold")
        .fillColor(foreground)
        .text(layer.title, margin + 30, y + 15, {
          width: contentWidth - 60,
          continued: false,
        });

      // Description
      this.doc
        .fontSize(small)
        .font("Helvetica")
        .fillColor(muted)
        .text(layer.description, margin + 30, y + 42, {
          width: contentWidth - 60,
          lineGap: 2,
          continued: false,
        });
    });

    // Stats at bottom
    this.doc.fontSize(body).font("Helvetica-Bold").fillColor(chart1);
    const statsText =
      "10 integrated modules  •  35+ entity types  •  Clean architecture";
    const statsWidth = this.doc.widthOfString(statsText);
    this.doc.text(
      statsText,
      (this.config.page.width - statsWidth) / 2,
      startY + 290,
      { lineBreak: false, continued: false },
    );

    this.drawFooter();
  }

  /**
   * Slide 6: Architecture & Integration
   */
  public addArchitectureIntegrationSlide(): void {
    this.addPage();
    this.drawHeader("Enterprise-Grade Foundation");

    const { margin, contentWidth } = this.config.page;
    const { h3, body, small } = this.config.typography;
    const { foreground, chart1, chart2 } = this.config.colors;

    const startY = 140;

    // System diagram with 3 columns
    const colWidth = contentWidth / 3;

    // Left column: External Systems
    this.doc
      .fontSize(h3)
      .font("Helvetica-Bold")
      .fillColor(chart1)
      .text("External Systems", margin, startY, {
        width: colWidth,
        align: "center",
        continued: false,
      });

    const leftSystems = [
      "HR / Payroll",
      "Azure AD / SSO",
      "Intune / MDM",
      "Procurement",
      "Vendors",
    ];

    let leftY = startY + 40;
    leftSystems.forEach((system) => {
      this.doc
        .fontSize(body - 2)
        .font("Helvetica")
        .fillColor(foreground)
        .text(system, margin + 10, leftY, {
          width: colWidth - 20,
          continued: false,
        });
      leftY += 22;
    });

    // Middle column: TechHub Platform Core
    const midX = margin + colWidth;
    this.doc
      .fontSize(h3)
      .font("Helvetica-Bold")
      .fillColor(chart1)
      .text("TechHub Platform Core", midX, startY, {
        width: colWidth,
        align: "center",
        continued: false,
      });

    const platformItems = [
      "• ITAM & Asset Management",
      "• CMDB & Service Catalog",
      "• Change & ITSM Roadmap",
      "• Unified Task Hub (2026)",
    ];

    let midY = startY + 40;
    platformItems.forEach((item) => {
      this.doc
        .fontSize(body - 2)
        .font("Helvetica")
        .fillColor(foreground)
        .text(item, midX + 10, midY, {
          width: colWidth - 20,
          continued: false,
        });
      midY += 22;
    });

    // Right column: Output
    const rightX = margin + colWidth * 2;
    this.doc
      .fontSize(h3)
      .font("Helvetica-Bold")
      .fillColor(chart1)
      .text("Output", rightX, startY, {
        width: colWidth,
        align: "center",
        continued: false,
      });

    const outputs = ["ERP / Finance", "Audit Reports", "Analytics & BI"];

    let rightY = startY + 40;
    outputs.forEach((output) => {
      this.doc
        .fontSize(body - 2)
        .font("Helvetica")
        .fillColor(foreground)
        .text(output, rightX + 10, rightY, {
          width: colWidth - 20,
          continued: false,
        });
      rightY += 22;
    });

    // Draw arrows
    const arrowY = startY + 80;
    // Left to middle
    this.drawArrow(margin + colWidth - 10, arrowY, midX + 10, arrowY, chart2);

    // Middle to right
    this.drawArrow(midX + colWidth - 10, arrowY, rightX + 10, arrowY, chart2);

    // Tech stack section
    const techY = startY + 180;
    this.drawCard(margin, techY, contentWidth, 100, 8, true);
    this.drawCardAccent(margin, techY, 100, chart1, 6);

    this.drawBulletList(
      [
        "Built on Next.js 16 (React 19), TypeScript 5.9, Prisma 7 (PostgreSQL), Redis, and a 5-layer clean architecture with modular dependency injection.",
        "Zero external SaaS dependencies — complete data sovereignty and on-prem control.",
      ],
      margin + 25,
      techY + 15,
      {
        spacing: 16,
        maxWidth: contentWidth - 50,
        fontSize: small,
      },
    );

    this.drawFooter();
  }

  /**
   * Slide 7: Operational Intelligence
   */
  public addOperationalIntelligenceSlide(): void {
    this.addPage();
    this.drawHeader("Every Asset and Service in Context");

    const { margin, contentWidth } = this.config.page;
    const { h3, body } = this.config.typography;
    const { foreground, muted, chart1, chart2, chart3 } = this.config.colors;

    const startY = 140;
    const features = [
      {
        title: "Asset 360° View",
        description:
          "Ownership history (HR + Azure AD), Intune compliance, warranty/PO metadata, lifecycle state, and related kits/reservations/disposal records.",
        color: chart1,
      },
      {
        title: "Relationship Mapping",
        description:
          "Service → CI → Infrastructure → Integrations lineage for change impact and incident response.",
        color: chart2,
      },
      {
        title: "Automated Discovery",
        description:
          "Feeds OCI, GCP, and network data directly into the CMDB with drift detection and reconciliation.",
        color: chart3,
      },
    ];

    features.forEach((feature, index) => {
      const y = startY + index * 95;

      // Card
      this.drawCard(margin, y, contentWidth, 80, 8, true);
      this.drawCardAccent(margin, y, 80, feature.color, 8);

      // Title
      this.doc
        .fontSize(h3)
        .font("Helvetica-Bold")
        .fillColor(foreground)
        .text(feature.title, margin + 30, y + 15, {
          width: contentWidth - 60,
          continued: false,
        });

      // Description
      this.doc
        .fontSize(body - 1)
        .font("Helvetica")
        .fillColor(muted)
        .text(feature.description, margin + 30, y + 42, {
          width: contentWidth - 60,
          lineGap: 2,
          continued: false,
        });
    });

    this.drawFooter();
  }

  /**
   * Slide 10: Business Benefits
   */
  public addBusinessBenefitsSlide(): void {
    this.addPage();
    this.drawHeader("What Leaders Gain");

    const { margin, contentWidth } = this.config.page;
    const { h3, body } = this.config.typography;
    const { foreground, muted, chart1, chart2, chart3 } = this.config.colors;

    const startY = 140;
    const benefits = [
      {
        title: "Financial",
        description:
          "Reduced license waste, linked PO-to-asset visibility, automated renewal alerts, and leverage in vendor negotiations.",
        color: chart1,
      },
      {
        title: "Operational",
        description:
          "Zero-touch discovery, accurate onboarding/offboarding kits, dashboards with compliance signals, and exportable audit packs.",
        color: chart2,
      },
      {
        title: "Security & Compliance",
        description:
          "Verified asset ownership, dependency-aware incident response, and immutable audit trails with disposal certificates.",
        color: chart3,
      },
    ];

    benefits.forEach((benefit, index) => {
      const y = startY + index * 95;

      // Card
      this.drawCard(margin, y, contentWidth, 80, 8, true);
      this.drawCardAccent(margin, y, 80, benefit.color, 8);

      // Title
      this.doc
        .fontSize(h3)
        .font("Helvetica-Bold")
        .fillColor(foreground)
        .text(benefit.title, margin + 30, y + 15, {
          width: contentWidth - 60,
          continued: false,
        });

      // Description
      this.doc
        .fontSize(body)
        .font("Helvetica")
        .fillColor(muted)
        .text(benefit.description, margin + 30, y + 42, {
          width: contentWidth - 60,
          lineGap: 2,
          continued: false,
        });
    });

    this.drawFooter();
  }

  /**
   * Slide 13: Strategic Roadmap
   */
  public addRoadmapSlide(): void {
    this.addPage();
    this.drawHeader("From ITAM to Enterprise Intelligence");

    const { margin, contentWidth } = this.config.page;
    const { h3, small } = this.config.typography;
    const { chart1, chart2, chart3 } = this.config.colors;

    const startY = 140;
    const phaseWidth = (contentWidth - 40) / 3;
    const cardHeight = 195; // Increased from 170 to 195

    const phases = [
      {
        title: "Q1-Q2 2026",
        items: [
          "Change Management System (BRD → deployment) with TechHub visibility and multi-step approvals.",
          "Mobile access for verification, approvals, and task management.",
        ],
        color: chart1,
        x: margin,
      },
      {
        title: "Q3-Q4 2026",
        items: [
          "Enterprise Task Hub aggregating TechHub, Jira, CRM, renewals, and compliance tasks.",
          "Built-in ITSM module with full CMDB context and predictive analytics powered by Intune telemetry.",
        ],
        color: chart2,
        x: margin + phaseWidth + 20,
      },
      {
        title: "2027 Vision",
        items: [
          "RAG AI assistant over Barq's knowledge base, intelligent automation for approvals, predictive maintenance, and enterprise-wide intelligence dashboards.",
        ],
        color: chart3,
        x: margin + (phaseWidth + 20) * 2,
      },
    ];

    // Draw phases
    phases.forEach((phase) => {
      // Card
      this.drawCard(phase.x, startY, phaseWidth, cardHeight, 8, true);
      this.drawCardAccent(phase.x, startY, cardHeight, phase.color, 8);

      // Title
      this.doc
        .fontSize(h3)
        .font("Helvetica-Bold")
        .fillColor(phase.color)
        .text(phase.title, phase.x + 20, startY + 15, {
          width: phaseWidth - 40,
          continued: false,
        });

      // Items
      this.drawBulletList(phase.items, phase.x + 20, startY + 50, {
        spacing: 14,
        maxWidth: phaseWidth - 40,
        fontSize: small - 1,
        bulletColor: phase.color,
      });
    });

    // Timeline at bottom
    const timelineY = startY + cardHeight + 40;
    const timelineStartX = margin + phaseWidth / 2;
    const timelineEndX = margin + (phaseWidth + 20) * 2 + phaseWidth / 2;

    // Draw timeline line
    this.doc
      .moveTo(timelineStartX, timelineY)
      .lineTo(timelineEndX, timelineY)
      .lineWidth(3)
      .stroke(chart1);

    // Draw phase markers
    phases.forEach((phase) => {
      const markerX = phase.x + phaseWidth / 2;

      // Outer circle
      this.doc.circle(markerX, timelineY, 12).fill(phase.color);

      // Inner circle
      this.doc
        .circle(markerX, timelineY, 8)
        .fill(this.config.colors.background);
    });

    this.drawFooter();
  }

  /**
   * Slide 14: Leadership Support Needed
   */
  public addLeadershipSupportSlide(): void {
    this.addPage();
    this.drawHeader("Critical Success Factors");

    const { margin, contentWidth } = this.config.page;
    const startY = 140;

    // Single card for all factors (increased height from 300 to 350)
    this.drawCard(margin, startY, contentWidth, 350, 8, true);
    this.drawCardAccent(margin, startY, 350, this.config.colors.chart1, 8);

    const factors = [
      {
        number: 1,
        title: "Executive Mandate",
        description:
          "Enforce asset attestation, disposal sign-offs, and platform adoption as the single source of truth.",
      },
      {
        number: 2,
        title: "Resource Allocation",
        description:
          "Dedicated development capacity, integration budget, departmental stewards (2-4 hrs/month), and formal training.",
      },
      {
        number: 3,
        title: "Process Authority",
        description:
          "Govern procurement, change management, and contract tracking through the platform.",
      },
      {
        number: 4,
        title: "Strategic Investment",
        description:
          "Fund TechHub roadmap, AI infrastructure, external connectors, and capacity for enterprise-wide task orchestration.",
      },
    ];

    let currentY = startY + 20;
    factors.forEach((factor) => {
      currentY = this.drawNumberedItem(
        factor.number,
        factor.title,
        factor.description,
        margin + 20,
        currentY,
        contentWidth - 40,
      );
    });

    this.drawFooter();
  }

  /**
   * Slide 8: Connected Ecosystem
   */
  public addConnectedEcosystemSlide(): void {
    this.addPage();
    this.drawHeader("Deep Integrations Across the Organization");

    const { margin, contentWidth } = this.config.page;
    const { h3, small } = this.config.typography;
    const { foreground, chart1, chart2, chart3, chart4 } = this.config.colors;

    const startY = 120;
    const cardWidth = (contentWidth - 20) / 2;
    const cardHeight = 145; // Increased from 130 to 145

    const categories = [
      {
        title: "Identity & Authentication",
        items: [
          "Azure AD / Microsoft Entra ID via Better Auth with 269 granular permissions.",
        ],
        color: chart1,
        x: margin,
        y: startY,
      },
      {
        title: "Device & Compliance",
        items: [
          "Microsoft Intune inventory, compliance history, encryption status, and patch posture.",
          "Zero-touch cloud/network discovery (OCI, GCP, switches, routers) with multi-cloud readiness.",
        ],
        color: chart2,
        x: margin + cardWidth + 20,
        y: startY,
      },
      {
        title: "Business Systems",
        items: [
          "HR lifecycle feeds, ERP/procurement purchase orders and contracts, custom Excel/CSV imports.",
        ],
        color: chart3,
        x: margin,
        y: startY + cardHeight + 15,
      },
      {
        title: "TechHub Roadmap Integrations",
        items: [
          "Built-in change management (Q1-Q2 2026), unified task hub and ITSM (Q3-Q4 2026), SOC/SIEM feeds and automation toolchains thereafter.",
        ],
        color: chart4,
        x: margin + cardWidth + 20,
        y: startY + cardHeight + 15,
      },
    ];

    categories.forEach((category) => {
      // Card
      this.drawCard(category.x, category.y, cardWidth, cardHeight, 8, true);
      this.drawCardAccent(
        category.x,
        category.y,
        cardHeight,
        category.color,
        8,
      );

      // Title
      this.doc
        .fontSize(h3)
        .font("Helvetica-Bold")
        .fillColor(foreground)
        .text(category.title, category.x + 25, category.y + 12, {
          width: cardWidth - 50,
          continued: false,
        });

      // Items
      this.drawBulletList(category.items, category.x + 25, category.y + 40, {
        spacing: 14,
        maxWidth: cardWidth - 50,
        fontSize: small,
      });
    });

    this.drawFooter();
  }

  /**
   * Slide 9: Governance & Compliance
   */
  public addGovernanceSlide(): void {
    this.addPage();
    this.drawHeader("SAMA-Ready Controls");

    const { margin, contentWidth } = this.config.page;
    const { h3, small } = this.config.typography;
    const { foreground, chart1, chart2, chart3 } = this.config.colors;

    const startY = 120;
    const sectionWidth = (contentWidth - 40) / 3;

    const sections = [
      {
        title: "Ownership & Accountability",
        items: [
          "IT Operations: platform administration and lifecycle enforcement.",
          "Information Security: compliance monitoring and audit support.",
          "Procurement & Finance: contract governance and cost control.",
          "Department Heads: custody attestation and usage accountability.",
        ],
        color: chart1,
        x: margin,
      },
      {
        title: "Automated Controls",
        items: [
          "Immutable audit logs, HR↔Azure AD↔Intune reconciliation, verification campaigns, renewal alerts, and role-based approvals.",
        ],
        color: chart2,
        x: margin + sectionWidth + 20,
      },
      {
        title: "Regulatory Alignment",
        items: [
          "SAMA cybersecurity framework readiness with evidence for asset accountability, change management, and disposal governance.",
        ],
        color: chart3,
        x: margin + (sectionWidth + 20) * 2,
      },
    ];

    sections.forEach((section) => {
      // Card (increased height from 280 to 320)
      this.drawCard(section.x, startY, sectionWidth, 320, 8, true);
      this.drawCardAccent(section.x, startY, 320, section.color, 6);

      // Title
      this.doc
        .fontSize(h3)
        .font("Helvetica-Bold")
        .fillColor(foreground)
        .text(section.title, section.x + 20, startY + 12, {
          width: sectionWidth - 40,
          continued: false,
        });

      // Items (reduced spacing from 16 to 14)
      this.drawBulletList(section.items, section.x + 20, startY + 50, {
        spacing: 14,
        maxWidth: sectionWidth - 40,
        fontSize: small - 1,
      });
    });

    this.drawFooter();
  }

  /**
   * Slide 11: Proof of Impact
   */
  public addProofOfImpactSlide(): void {
    this.addPage();
    this.drawHeader("Platform Delivered & Operational");

    const { margin, contentWidth } = this.config.page;
    const { h3, small } = this.config.typography;
    const { foreground, chart1 } = this.config.colors;

    const startY = 130;

    // Single large card with 3 sections (increased height from 280 to 360)
    this.drawCard(margin, startY, contentWidth, 360, 8, true);
    this.drawCardAccent(margin, startY, 360, chart1, 8);

    let currentY = startY + 20;

    // Implementation Scope
    this.doc
      .fontSize(h3)
      .font("Helvetica-Bold")
      .fillColor(chart1)
      .text("Implementation Scope", margin + 30, currentY, {
        width: contentWidth - 60,
        continued: false,
      });

    currentY += 30;
    this.doc
      .fontSize(small)
      .font("Helvetica")
      .fillColor(foreground)
      .text(
        "10 modules live, 35+ entity types, 269 permissions, clean architecture with modular DI.",
        margin + 30,
        currentY,
        {
          width: contentWidth - 60,
          continued: false,
        },
      );

    currentY += 45;

    // Operational Metrics
    this.doc
      .fontSize(h3)
      .font("Helvetica-Bold")
      .fillColor(chart1)
      .text("Operational Metrics", margin + 30, currentY, {
        width: contentWidth - 60,
        continued: false,
      });

    currentY += 30;
    const opMetrics = [
      "4,200+ assets tracked with complete lifecycle visibility.",
      "100% coverage for Intune-managed devices; automated OCI/GCP/network discovery.",
      "Device-to-user correlation accuracy at 98%+.",
      "Onboarding kit preparation reduced from days to minutes; audit prep from months to days.",
    ];
    currentY = this.drawBulletList(opMetrics, margin + 30, currentY, {
      spacing: 10,
      maxWidth: contentWidth - 60,
      fontSize: small,
      bulletColor: chart1,
    });

    currentY += 15;

    // Business Impact
    this.doc
      .fontSize(h3)
      .font("Helvetica-Bold")
      .fillColor(chart1)
      .text("Business Impact", margin + 30, currentY, {
        width: contentWidth - 60,
        continued: false,
      });

    currentY += 30;
    const businessMetrics = [
      "~500K SAR/year license waste eliminated.",
      "Six departmental trackers consolidated.",
      "22 critical services modeled with full dependency graphs.",
      "Ghost devices eliminated through verification campaigns.",
    ];
    this.drawBulletList(businessMetrics, margin + 30, currentY, {
      spacing: 10,
      maxWidth: contentWidth - 60,
      fontSize: small,
      bulletColor: chart1,
    });

    this.drawFooter();
  }

  /**
   * Slide 12: Visual Evidence
   */
  public addVisualEvidenceSlide(): void {
    this.addPage();
    this.drawHeader("Platform in Action");

    const { margin, contentWidth } = this.config.page;
    const { body, small } = this.config.typography;
    const { foreground, muted, chart1 } = this.config.colors;

    const startY = 140;

    const screenshots = [
      "Executive dashboard (asset distribution, compliance risks, renewals, asset value)",
      "Asset 360° record with Intune trend, warranty, PO, and dependency graph",
      "CMDB service map with impact simulation",
      "Automated discovery dashboard showing OCI/GCP coverage and drift alerts",
      "Active verification campaign tracker",
    ];

    const cardHeight = 50;
    screenshots.forEach((screenshot, index) => {
      const y = startY + index * (cardHeight + 10);

      // Placeholder card with dotted border
      this.doc
        .roundedRect(margin + 40, y, contentWidth - 80, cardHeight, 8)
        .dash(5, { space: 3 })
        .stroke(muted);

      this.doc.undash();

      // Number
      this.doc.circle(margin + 60, y + cardHeight / 2, 12).fill(chart1);
      this.doc
        .fontSize(body)
        .font("Helvetica-Bold")
        .fillColor("#000000")
        .text((index + 1).toString(), margin + 55, y + cardHeight / 2 - 7, {
          lineBreak: false,
          continued: false,
        });

      // Label
      this.doc
        .fontSize(small)
        .font("Helvetica")
        .fillColor(foreground)
        .text(screenshot, margin + 90, y + cardHeight / 2 - 7, {
          width: contentWidth - 160,
          continued: false,
        });
    });

    this.drawFooter();
  }

  /**
   * Slide 15: ROI Summary
   */
  public addROISlide(): void {
    this.addPage();
    this.drawHeader("Value Delivered: ~2.35-2.85M SAR/Year");

    const { margin, contentWidth } = this.config.page;
    const { hero, h3, small } = this.config.typography;
    const { foreground, chart1 } = this.config.colors;

    const startY = 130;

    // Hero number card
    this.drawCard(margin + 100, startY, contentWidth - 200, 80, 8, true);
    this.drawCardAccent(margin + 100, startY, 80, chart1, 8);

    this.drawCenteredText(
      "~2.35-2.85M SAR/Year",
      startY + 25,
      hero - 6,
      chart1,
      "Helvetica-Bold",
    );

    // Three breakdown sections
    const sectionsY = startY + 110;
    const sectionWidth = (contentWidth - 40) / 3;

    const sections = [
      {
        title: "Platform Cost Avoidance",
        items: [
          "1.5-2M SAR/year saved vs. ServiceNow-class ITAM+CMDB+ITSM licensing.",
          "500K-1M SAR one-time implementation/consulting cost avoidance.",
          "Lifetime license with unlimited seats and zero vendor lock-in.",
        ],
        x: margin,
      },
      {
        title: "Operational Savings",
        items: [
          "~500K SAR/year from license optimization.",
          "~200K SAR/year from faster audits and reconciliations.",
          "~150K SAR/year from eliminating ghost-device security exposure.",
        ],
        x: margin + sectionWidth + 20,
      },
      {
        title: "Efficiency & Risk",
        items: [
          "85% faster onboarding kit prep, 90% faster audit prep, 100% elimination of duplicate trackers, and fully automated infrastructure inventory.",
        ],
        x: margin + (sectionWidth + 20) * 2,
      },
    ];

    sections.forEach((section) => {
      // Card (increased height from 180 to 210)
      this.drawCard(section.x, sectionsY, sectionWidth, 210, 8, true);
      this.drawCardAccent(section.x, sectionsY, 210, chart1, 6);

      // Title
      this.doc
        .fontSize(h3 - 2)
        .font("Helvetica-Bold")
        .fillColor(foreground)
        .text(section.title, section.x + 20, sectionsY + 12, {
          width: sectionWidth - 40,
          continued: false,
        });

      // Items
      this.drawBulletList(section.items, section.x + 20, sectionsY + 45, {
        spacing: 12,
        maxWidth: sectionWidth - 40,
        fontSize: small - 1,
      });
    });

    this.drawFooter();
  }

  /**
   * Slide 16: Closing
   */
  public addClosingSlide(): void {
    this.addPage();
    this.drawHeader("From Fragmentation to Intelligence");

    const { margin, contentWidth } = this.config.page;
    const { h3, body } = this.config.typography;
    const { foreground, chart1 } = this.config.colors;
    const startY = 180;

    // Closing message card
    this.drawCard(margin + 40, startY, contentWidth - 80, 180, 8, true);
    this.drawCardAccent(margin + 40, startY, 180, chart1, 8);

    // Message
    const message =
      "Barq now runs a single, compliant, data-sovereign ITAM & CMDB platform that turns asset management into operational intelligence. The platform removes blind spots, accelerates decisions, and keeps the organization SAMA-ready while creating a durable financial advantage.";

    this.doc
      .fontSize(body)
      .font("Helvetica")
      .fillColor(foreground)
      .text(message, margin + 70, startY + 30, {
        width: contentWidth - 140,
        lineGap: 4,
        align: "center",
        continued: false,
      });

    // Tagline
    this.drawCenteredText(
      "Built by Barq, for Barq — ready for questions.",
      startY + 140,
      h3,
      chart1,
      "Helvetica-BoldOblique",
    );

    this.drawFooter();
  }

  /**
   * Save the presentation
   */
  public save(): void {
    this.doc.end();
  }
}
