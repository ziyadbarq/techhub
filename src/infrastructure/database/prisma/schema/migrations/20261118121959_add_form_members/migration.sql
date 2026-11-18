-- CreateEnum
CREATE TYPE "FormMemberRole" AS ENUM ('OWNER', 'MANAGER', 'VIEWER');

-- CreateTable
CREATE TABLE "form_members" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "FormMemberRole" NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "form_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "form_members_userId_idx" ON "form_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "form_members_formId_userId_role_key" ON "form_members"("formId", "userId", "role");

-- AddForeignKey
ALTER TABLE "form_members" ADD CONSTRAINT "form_members_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_members" ADD CONSTRAINT "form_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
