#!/usr/bin/env tsx

/**
 * Generate Executive TechHub Presentation
 *
 * Converts docs/ITAM-CMDB-Platform-Executive-Presentation.md into PDF
 * Designed for C-level and board presentation
 */

import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { ExecutivePresentation } from "./lib/executive-presentation";
import { createPresentationConfig } from "./lib/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Output configuration
const outputDir = path.join(__dirname, "generated");
const outputPath = path.join(outputDir, "techhub-presentation-executive.pdf");

// Create output directory
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log("🎨 Generating TechHub Executive Presentation...");
console.log("📊 16 slides designed for C-level and board impact");
console.log(`📁 Output: ${outputPath}`);

// Create presentation with config
const config = createPresentationConfig();
const presentation = new ExecutivePresentation(outputPath, config);

// Generate all 16 slides (All phases complete!)
presentation.addExecutiveTitleSlide(); // Slide 1
presentation.addExecutiveSummarySlide(); // Slide 2
presentation.addChallengeSlide(); // Slide 3
presentation.addVisionSlide(); // Slide 4
presentation.addPlatformOverviewSlide(); // Slide 5
presentation.addArchitectureIntegrationSlide(); // Slide 6
presentation.addOperationalIntelligenceSlide(); // Slide 7
presentation.addConnectedEcosystemSlide(); // Slide 8
presentation.addGovernanceSlide(); // Slide 9
presentation.addBusinessBenefitsSlide(); // Slide 10
presentation.addProofOfImpactSlide(); // Slide 11
presentation.addVisualEvidenceSlide(); // Slide 12
presentation.addRoadmapSlide(); // Slide 13
presentation.addLeadershipSupportSlide(); // Slide 14
presentation.addROISlide(); // Slide 15
presentation.addClosingSlide(); // Slide 16

// Save
presentation.save();

console.log("✅ Executive PDF generated successfully!");
console.log("✨ Done! Open the PDF to view your executive presentation.");
