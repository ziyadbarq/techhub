-- DropForeignKey
ALTER TABLE "persons" DROP CONSTRAINT IF EXISTS "persons_primaryRoleId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "persons_primaryRoleId_idx";

-- DropTable
DROP TABLE IF EXISTS "person_role_assignments" CASCADE;

-- AlterTable
ALTER TABLE "persons" DROP COLUMN IF EXISTS "primaryRoleId";
