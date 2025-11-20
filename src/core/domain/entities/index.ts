/**
 * Domain Entities Barrel Export
 *
 * This file exports all domain entities.
 * Entities contain business logic and validation.
 */

// Prompt System Entities (AI Infrastructure)
export { PromptBlockEntity } from "./prompt-block.entity";
export { PromptCompositionEntity } from "./prompt-composition.entity";
export type {
  CreatePromptBlockData,
  PromptBlockMetadata,
} from "./prompt-block.entity";
export type {
  CreatePromptCompositionData,
  CompositionBlock,
  CompositionVariables,
} from "./prompt-composition.entity";

// Task Entity (Example CRUD)
export { Task, TaskStatus } from "./task.entity";
export type { CreateTaskProps } from "./task.entity";
