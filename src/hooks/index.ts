/**
 * Custom React Hooks
 *
 * Barrel export file for all custom hooks
 */

export { useDebounce } from "./use-debounce";
export { useLocalStorage } from "./use-local-storage";
export { useFocusTrap } from "./use-focus-trap";
export { useColumnVisibility } from "./use-column-visibility";
export { useColumnVisibilityEnhanced } from "./use-column-visibility-enhanced";
export {
  useBadgeUpdates,
  updateBadge,
  incrementBadge,
  decrementBadge,
  clearBadge,
  getAllBadges,
  initializeBadges,
  type BadgeRegistry,
} from "./use-badge-updates";
export { useSidebarNavigation } from "./use-sidebar-navigation";
export { useEntityTypeOptions } from "./use-entity-type-options";
export { useConfigurationItemReferenceData } from "./use-configuration-item-reference-data";
