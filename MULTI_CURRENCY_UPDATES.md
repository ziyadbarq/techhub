# Multi-Currency Display Updates

## Overview
Updated the Asset Overview Tab component to display currencies with dual display format, showing both the original currency and SAR (Saudi Riyal) conversion with exchange rates.

## Changes Made

### File: `/home/user/barq-assets/src/components/assets/asset-overview-tab.tsx`

#### 1. Added Imports
```typescript
import * as React from "react";
import { CurrencyDisplay } from "@/components/ui/currency-display";
import { convertCurrencyAction } from "@/interface-adapters/controllers/exchange-rate.controller";
```

#### 2. Added State Management
```typescript
const [currencyConversion, setCurrencyConversion] = React.useState<{
  sarAmount: number;
  exchangeRate: number;
} | null>(null);
const [isLoadingConversion, setIsLoadingConversion] = React.useState(false);
```

#### 3. Added Currency Conversion Logic
Implemented a `useEffect` hook that:
- Runs when the component mounts or when `asset.purchaseCost` or `asset.currency` changes
- Only fetches conversion if:
  - Asset has a purchase cost
  - Asset has a currency specified
  - Currency is NOT already SAR (no need to convert)
- Calls `convertCurrencyAction` server action to get the SAR conversion
- Stores the converted amount and exchange rate in state
- Handles errors gracefully (silent failure - just won't show conversion)

#### 4. Updated Purchase Cost Display
Replaced the simple text display:
```typescript
// OLD
<p className="text-sm font-semibold">
  {asset.currency || "USD"} {asset.purchaseCost.toLocaleString()}
</p>
```

With the new `CurrencyDisplay` component:
```typescript
// NEW
<div className="text-sm font-semibold">
  {isLoadingConversion ? (
    <span className="text-muted-foreground">
      {asset.currency || "SAR"} {asset.purchaseCost.toLocaleString()} (converting...)
    </span>
  ) : (
    <CurrencyDisplay
      amount={asset.purchaseCost}
      currency={asset.currency || "SAR"}
      sarAmount={currencyConversion?.sarAmount}
      exchangeRate={currencyConversion?.exchangeRate}
      mode="dual"
      className="text-sm font-semibold"
    />
  )}
</div>
```

## How It Works

### For Assets with SAR Currency
- No conversion needed
- Displays: `ر.س 1,234.56` (single display)

### For Assets with Foreign Currency (e.g., USD)
1. **Loading State**: Shows `USD 1,234 (converting...)`
2. **After Conversion**: Shows `$1,234.00 (ر.س 4,627.50)` (dual display)
3. **With Tooltip**: Hover to see exchange rate: `1 USD = 3.75 SAR`

### For Assets without Currency Field
- Defaults to SAR
- Displays as SAR currency

## Features

1. **Dual Currency Display**: Shows original currency + SAR conversion in parentheses
2. **Exchange Rate Tooltip**: Hover over the amount to see the current exchange rate
3. **Loading State**: Shows a temporary message while fetching conversion
4. **Error Handling**: Gracefully falls back to original display if conversion fails
5. **Smart Conversion**: Only converts when necessary (skips if already SAR)
6. **Responsive**: Uses existing exchange rate data from the database

## Integration with Existing System

The implementation uses:
- **CurrencyDisplay Component**: `/home/user/barq-assets/src/components/ui/currency-display.tsx`
- **Exchange Rate Controller**: `/home/user/barq-assets/src/interface-adapters/controllers/exchange-rate.controller.ts`
- **Convert Currency Use Case**: `/home/user/barq-assets/src/core/use-cases/foundation/exchange-rate/convert-currency.use-case.ts`

## Example Output

### Asset with USD Currency ($100)
```
Purchase Cost
$100.00 (ر.س 375.00)
```

### Asset with EUR Currency (€50)
```
Purchase Cost
€50.00 (ر.س 187.50)
```

### Asset with SAR Currency (ر.س 1,000)
```
Purchase Cost
ر.س 1,000.00
```

## Technical Details

- **Component Type**: Client component (`"use client"`)
- **State Management**: React.useState for conversion data and loading state
- **Side Effects**: React.useEffect for fetching conversion on mount
- **Permissions**: Inherits from `convertCurrencyAction` (requires `FX_RATES_CONVERT` permission)
- **Error Handling**: Try-catch with console.error for debugging, silent failure for UX

## Testing Recommendations

1. Test with asset that has USD currency and valid exchange rate
2. Test with asset that has SAR currency (should skip conversion)
3. Test with asset that has no currency (should default to SAR)
4. Test with asset that has currency without active exchange rate (should handle gracefully)
5. Verify tooltip shows correct exchange rate on hover
6. Verify loading state appears briefly during conversion
