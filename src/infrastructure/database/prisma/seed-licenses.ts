/**
 * License Management Seed Data
 * Seeds license products and addons for Microsoft 365
 */

import type { PrismaClient } from "../../../generated/prisma/client.js";
import {
  LICENSE_PRODUCT_DATA,
  LICENSE_ADDON_DATA,
} from "./seed-config-licenses.js";
import { logSection, logStep, logSuccess } from "./seed-utils.js";

/**
 * Seed license products and addons
 */
export async function seedLicenses(prisma: PrismaClient) {
  logSection("License Management");

  // Seed License Products
  logStep("📦", "Creating license products...");
  for (const product of LICENSE_PRODUCT_DATA) {
    // Look up vendor by code
    const vendor = await prisma.vendor.findUnique({
      where: { code: product.vendorCode },
    });

    if (!vendor) {
      console.warn(
        `   ⚠️  Vendor ${product.vendorCode} not found, skipping product: ${product.name}`,
      );
      continue;
    }

    await prisma.licenseProduct.upsert({
      where: { code: product.code },
      update: {
        name: product.name,
        description: product.description,
        metricType: product.metricType,
      },
      create: {
        name: product.name,
        code: product.code,
        vendorId: vendor.id,
        metricType: product.metricType,
        description: product.description,
      },
    });
  }
  logSuccess(`Created ${LICENSE_PRODUCT_DATA.length} license products`);

  // Seed License Addons
  logStep("🔌", "Creating license addons...");
  for (const addon of LICENSE_ADDON_DATA) {
    // Look up the license product by code
    const licenseProduct = await prisma.licenseProduct.findUnique({
      where: { code: addon.licenseProductCode },
    });

    if (!licenseProduct) {
      console.warn(
        `   ⚠️  License product ${addon.licenseProductCode} not found, skipping addon: ${addon.name}`,
      );
      continue;
    }

    await prisma.licenseAddon.upsert({
      where: {
        licenseProductId_code: {
          licenseProductId: licenseProduct.id,
          code: addon.code,
        },
      },
      update: {
        name: addon.name,
        description: addon.description,
        isActive: addon.isActive,
      },
      create: {
        name: addon.name,
        code: addon.code,
        licenseProductId: licenseProduct.id,
        description: addon.description,
        isActive: addon.isActive,
      },
    });
  }
  logSuccess(`Created ${LICENSE_ADDON_DATA.length} license addons`);
}
