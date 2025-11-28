-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "FieldDataTypeEnum" ADD VALUE 'URL';
ALTER TYPE "FieldDataTypeEnum" ADD VALUE 'EMAIL';
ALTER TYPE "FieldDataTypeEnum" ADD VALUE 'PHONE';
ALTER TYPE "FieldDataTypeEnum" ADD VALUE 'MULTI_SELECT_ENUM';
ALTER TYPE "FieldDataTypeEnum" ADD VALUE 'CURRENCY';
ALTER TYPE "FieldDataTypeEnum" ADD VALUE 'ATTACHMENT_REFERENCE';

-- AlterTable
ALTER TABLE "field_definitions" ADD COLUMN     "archiveReason" TEXT,
ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "archivedById" TEXT,
ADD COLUMN     "conditionalLogic" JSONB,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedById" TEXT;

-- CreateTable
CREATE TABLE "field_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "entityType" TEXT NOT NULL,
    "category" TEXT,
    "standard" TEXT,
    "isBuiltIn" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "field_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "field_template_items" (
    "id" TEXT NOT NULL,
    "fieldTemplateId" TEXT NOT NULL,
    "fieldDefinitionId" TEXT,
    "fieldName" TEXT NOT NULL,
    "fieldLabel" TEXT NOT NULL,
    "fieldDataType" "FieldDataTypeEnum" NOT NULL,
    "description" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isUnique" BOOLEAN NOT NULL DEFAULT false,
    "validationRules" JSONB,
    "defaultValue" JSONB,
    "enumOptions" JSONB,
    "uiOrder" INTEGER NOT NULL DEFAULT 0,
    "uiGroup" TEXT,
    "isSearchable" BOOLEAN NOT NULL DEFAULT false,
    "isFilterable" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "field_template_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "field_templates_name_key" ON "field_templates"("name");

-- CreateIndex
CREATE UNIQUE INDEX "field_templates_code_key" ON "field_templates"("code");

-- CreateIndex
CREATE INDEX "field_templates_entityType_idx" ON "field_templates"("entityType");

-- CreateIndex
CREATE INDEX "field_templates_category_idx" ON "field_templates"("category");

-- CreateIndex
CREATE INDEX "field_templates_standard_idx" ON "field_templates"("standard");

-- CreateIndex
CREATE INDEX "field_templates_isBuiltIn_idx" ON "field_templates"("isBuiltIn");

-- CreateIndex
CREATE INDEX "field_templates_isActive_idx" ON "field_templates"("isActive");

-- CreateIndex
CREATE INDEX "field_template_items_fieldTemplateId_idx" ON "field_template_items"("fieldTemplateId");

-- CreateIndex
CREATE INDEX "field_template_items_fieldDefinitionId_idx" ON "field_template_items"("fieldDefinitionId");

-- CreateIndex
CREATE INDEX "field_template_items_uiOrder_idx" ON "field_template_items"("uiOrder");

-- CreateIndex
CREATE UNIQUE INDEX "field_template_items_fieldTemplateId_fieldName_key" ON "field_template_items"("fieldTemplateId", "fieldName");

-- CreateIndex
CREATE INDEX "field_definitions_deletedAt_idx" ON "field_definitions"("deletedAt");

-- CreateIndex
CREATE INDEX "field_definitions_archivedAt_idx" ON "field_definitions"("archivedAt");

-- AddForeignKey
ALTER TABLE "field_definitions" ADD CONSTRAINT "field_definitions_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_definitions" ADD CONSTRAINT "field_definitions_archivedById_fkey" FOREIGN KEY ("archivedById") REFERENCES "persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_templates" ADD CONSTRAINT "field_templates_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_template_items" ADD CONSTRAINT "field_template_items_fieldTemplateId_fkey" FOREIGN KEY ("fieldTemplateId") REFERENCES "field_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_template_items" ADD CONSTRAINT "field_template_items_fieldDefinitionId_fkey" FOREIGN KEY ("fieldDefinitionId") REFERENCES "field_definitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
