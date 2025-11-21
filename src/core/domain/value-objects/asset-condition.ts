/**
 * Asset Condition Value Object
 * Represents the physical condition of an asset
 */

export enum AssetCondition {
  NEW = "NEW",
  GOOD = "GOOD",
  FAIR = "FAIR",
  POOR = "POOR",
}

export const ASSET_CONDITION_VALUES = Object.values(AssetCondition);

/**
 * Get human-readable label for condition
 */
export function getConditionLabel(condition: AssetCondition): string {
  const labels: Record<AssetCondition, string> = {
    [AssetCondition.NEW]: "New",
    [AssetCondition.GOOD]: "Good",
    [AssetCondition.FAIR]: "Fair",
    [AssetCondition.POOR]: "Poor",
  };
  return labels[condition];
}

/**
 * Get badge color class for condition
 */
export function getConditionBadgeColor(condition: AssetCondition): string {
  const colors: Record<AssetCondition, string> = {
    [AssetCondition.NEW]:
      "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
    [AssetCondition.GOOD]:
      "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
    [AssetCondition.FAIR]:
      "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
    [AssetCondition.POOR]:
      "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  };
  return colors[condition];
}

/**
 * Validate if string is a valid Asset Condition
 */
export function isValidAssetCondition(value: string): value is AssetCondition {
  return ASSET_CONDITION_VALUES.includes(value as AssetCondition);
}
