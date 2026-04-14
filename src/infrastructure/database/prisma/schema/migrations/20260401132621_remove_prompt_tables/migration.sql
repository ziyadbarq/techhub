/*
  Warnings:

  - You are about to drop the `prompt_blocks` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `prompt_composition_blocks` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `prompt_compositions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "prompt_blocks" DROP CONSTRAINT "prompt_blocks_parentBlockId_fkey";

-- DropForeignKey
ALTER TABLE "prompt_composition_blocks" DROP CONSTRAINT "prompt_composition_blocks_blockId_fkey";

-- DropForeignKey
ALTER TABLE "prompt_composition_blocks" DROP CONSTRAINT "prompt_composition_blocks_compositionId_fkey";

-- DropTable
DROP TABLE "prompt_blocks";

-- DropTable
DROP TABLE "prompt_composition_blocks";

-- DropTable
DROP TABLE "prompt_compositions";

-- DropEnum
DROP TYPE "PromptBlockCategory";

-- DropEnum
DROP TYPE "PromptPurpose";
