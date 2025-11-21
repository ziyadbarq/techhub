/**
 * Custom React Hooks
 *
 * Barrel export file for all custom hooks
 */

export { useDebounce } from "./use-debounce";
export { useLocalStorage } from "./use-local-storage";
export { useFocusTrap } from "./use-focus-trap";
export {
  useBadgeUpdates,
  updateBadge,
  incrementBadge,
  decrementBadge,
  clearBadge,
  getAllBadges,
  startMockBadgeUpdates,
  initializeBadges,
  type BadgeRegistry,
} from "./use-badge-updates";
export { useSidebarNavigation } from "./use-sidebar-navigation";
