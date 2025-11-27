/**
 * Dependency Infographic Widget
 * Visual guide showing entity dependencies for data entry workflow
 */

export { DependencyInfographic } from "./dependency-infographic";
export {
  DependencyNode,
  type DependencyNodeData,
  type DependencyNodeType,
} from "./dependency-node";
export { useDependencyLayout } from "./use-dependency-layout";
export {
  DEPENDENCY_ENTITIES,
  LAYOUT_CONFIG,
  getTierColors,
  getEdgeColor,
  type DependencyEntity,
  type TierType,
} from "./config";
