#!/usr/bin/env tsx

/**
 * Generate Standard TechHub Presentation
 *
 * Uses refactored architecture following SOLID principles
 */

import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { StandardPresentation } from "./lib/standard-presentation";
import { createPresentationConfig } from "./lib/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Output configuration
const outputDir = path.join(__dirname, "generated");
const outputPath = path.join(outputDir, "techhub-presentation-sample.pdf");

// Create output directory
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log("🎨 Generating TechHub Standard Presentation...");
console.log(`📁 Output: ${outputPath}`);

// Create presentation with standard config
const config = createPresentationConfig();
const presentation = new StandardPresentation(outputPath, config);

// Generate slides
presentation.addTitleSlide();
presentation.addFeatureSlide();
presentation.addStatsSlide();
presentation.addArchitectureSlide();
presentation.addClosingSlide();

// Save
presentation.save();

console.log("✅ Standard PDF generated successfully!");
console.log("✨ Done! Open the PDF to view your presentation.");
