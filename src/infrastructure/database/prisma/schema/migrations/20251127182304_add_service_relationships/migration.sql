-- CreateEnum
CREATE TYPE "ServiceRelationshipType" AS ENUM ('DEPENDS_ON', 'CALLS', 'PUBLISHES_EVENTS_TO', 'CONSUMES_EVENTS_FROM', 'BACKUP_FOR');

-- CreateTable
CREATE TABLE "service_relationships" (
    "id" TEXT NOT NULL,
    "from_service_id" TEXT NOT NULL,
    "to_service_id" TEXT NOT NULL,
    "relationship_type" "ServiceRelationshipType" NOT NULL,
    "is_critical" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "metadata" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "valid_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valid_to" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "service_relationships_from_service_id_idx" ON "service_relationships"("from_service_id");

-- CreateIndex
CREATE INDEX "service_relationships_to_service_id_idx" ON "service_relationships"("to_service_id");

-- CreateIndex
CREATE INDEX "service_relationships_relationship_type_idx" ON "service_relationships"("relationship_type");

-- CreateIndex
CREATE INDEX "service_relationships_is_active_idx" ON "service_relationships"("is_active");

-- CreateIndex
CREATE INDEX "service_relationships_is_critical_idx" ON "service_relationships"("is_critical");

-- CreateIndex
CREATE INDEX "service_relationships_from_service_id_is_active_idx" ON "service_relationships"("from_service_id", "is_active");

-- CreateIndex
CREATE INDEX "service_relationships_to_service_id_is_active_idx" ON "service_relationships"("to_service_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "service_relationships_from_service_id_to_service_id_relatio_key" ON "service_relationships"("from_service_id", "to_service_id", "relationship_type");

-- AddForeignKey
ALTER TABLE "service_relationships" ADD CONSTRAINT "service_relationships_from_service_id_fkey" FOREIGN KEY ("from_service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_relationships" ADD CONSTRAINT "service_relationships_to_service_id_fkey" FOREIGN KEY ("to_service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
