# Multi-Currency Support Guide

**Status**: ✅ Fully Implemented
**Version**: 1.0
**Last Updated**: Current

## Overview

The Barq Asset Management system supports multi-currency functionality, allowing users to input and store costs in any supported currency (USD, EUR, GBP, etc.) while always displaying values in SAR (Saudi Riyal) as the primary currency with the original currency shown as secondary text.

This aligns with Barq's operations in Saudi Arabia and provides transparency for international transactions while maintaining consistency in financial reporting.

## Key Features

- ✅ **15 Supported Currencies**: SAR, USD, EUR, GBP, JPY, AUD, CAD, CHF, CNY, INR, AED, KWD, BHD, OMR, QAR
- ✅ **SAR as Base Currency**: All financial aggregations and reports use SAR
- ✅ **Dual Currency Display**: Shows original amount with SAR equivalent (e.g., "$100.00 (ر.س 375.00)")
- ✅ **Exchange Rate Management**: Self-service UI at `/fx-rates` for managing exchange rates
- ✅ **Live Conversion**: Real-time currency conversion based on active exchange rates
- ✅ **Graceful Fallback**: System works even if exchange rates are unavailable
- ✅ **Audit Trail**: Exchange rate history tracked with timestamps

## Business Logic

### Currency Storage

All monetary values are stored with their **original currency** to preserve transaction history:

```typescript
{
  purchaseCost: 1000.00,
  currency: "USD"
}
```

This approach ensures:
- **Historical Accuracy**: Original transaction amounts are never lost
- **Audit Compliance**: Complete financial trail for SAMA regulations
- **Flexibility**: Can recalculate in different base currencies if needed

### Display Strategy

The system uses a **SAR-primary, dual-display** format:

| Asset Currency | Display Format |
|----------------|----------------|
| SAR 1,000 | `ر.س 1,000.00` |
| USD 100 | `$100.00 (ر.س 375.00)` |
| EUR 200 | `€200.00 (ر.س 820.00)` |

**Hover Tooltip** shows exchange rate details: `1 USD = 3.750000 SAR`

### Exchange Rates

Exchange rates are stored as **"to SAR"** rates:

```typescript
{
  currency: "USD",
  rateToSAR: 3.75,  // 1 USD = 3.75 SAR
  isActive: true
}
```

**Conversion Formula**:
```typescript
sarAmount = amount × rateToSAR
```

**Example**:
- USD 100 × 3.75 = SAR 375.00

### Aggregation Strategy

All financial totals (dashboard, reports) are **converted to SAR before aggregation**:

1. Fetch all assets with their costs and currencies
2. For each asset, convert cost to SAR using active exchange rate
3. Sum all SAR values
4. Display total in SAR

**Example**:
```
Asset 1: USD 100 × 3.75 = SAR 375
Asset 2: EUR 200 × 4.10 = SAR 820
Asset 3: SAR 500 × 1.00 = SAR 500
─────────────────────────────────
Total: SAR 1,695
```

## Architecture

### Database Schema

#### ExchangeRate Table

```prisma
model ExchangeRate {
  id        String   @id @default(cuid())
  currency  String   @unique  // 3-letter ISO code
  rateToSAR Decimal  @db.Decimal(10, 6)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([currency])
  @@index([isActive])
  @@map("exchange_rates")
}
```

**Key Fields**:
- `currency`: Unique 3-letter ISO code (USD, EUR, GBP, etc.)
- `rateToSAR`: Conversion rate to SAR (6 decimal precision)
- `isActive`: Only active rates are used for conversions

#### Currency Fields in Entities

All entities with monetary values include a `currency` field:

- **Asset**: `currency` (nullable, defaults to "SAR")
- **Warranty**: `currency` (nullable)
- **MaintenanceRecord**: `currency` (nullable)
- **AssetDisposal**: `currency` (nullable)

### Clean Architecture Layers

#### 1. Domain Layer

**Entity**: `src/core/domain/entities/exchange-rate.entity.ts`
- Business rules for exchange rates
- Validation logic (rate > 0, currency format)
- Currency conversion calculations

**Repository Interface**: `src/core/repositories/exchange-rate.repository.interface.ts`
- Contract for data access
- Technology-agnostic

#### 2. Use Cases

Location: `src/core/use-cases/foundation/exchange-rate/`

- `get-all-exchange-rates.use-case.ts` - List all rates
- `get-exchange-rate-by-currency.use-case.ts` - Get specific rate
- `create-exchange-rate.use-case.ts` - Create new rate
- `update-exchange-rate.use-case.ts` - Update existing rate
- `delete-exchange-rate.use-case.ts` - Soft delete (set isActive=false)
- `convert-currency.use-case.ts` - **Convert amount from currency to SAR**

**Key Use Case: ConvertCurrencyUseCase**

```typescript
async execute(params: { amount: number; fromCurrency: string }): Promise<number> {
  // If already in SAR, return as-is
  if (params.fromCurrency === "SAR") {
    return params.amount;
  }

  // Get active exchange rate
  const rate = await this.exchangeRateRepository.getByCurrency(params.fromCurrency);

  if (!rate || !rate.isActive) {
    throw new Error(`No active exchange rate found for ${params.fromCurrency}`);
  }

  // Convert: amount × rateToSAR
  return params.amount * rate.rateToSAR;
}
```

#### 3. Infrastructure Layer

**Repository**: `src/infrastructure/database/repositories/prisma-exchange-rate.repository.ts`
- Implements `IExchangeRateRepository`
- Prisma database operations
- Connection pool management

**DI Registration**: `src/di/modules/foundation.module.ts`
- Binds repository interface to implementation
- Registers all 6 use cases
- Tokens in `src/di/types.ts`

#### 4. Interface Adapters

**DTOs**: `src/interface-adapters/dtos/generated/exchange-rate.dto.ts`

```typescript
export const CreateExchangeRateSchema = z.object({
  currency: z.string().length(3).regex(/^[A-Z]{3}$/),
  rateToSAR: z.number().positive().max(999999.999999),
  isActive: z.boolean().default(true),
});
```

**Controller**: `src/interface-adapters/controllers/exchange-rate.controller.ts`
- Server actions for UI
- Permission checks
- Error handling

**Presenter**: `src/interface-adapters/presenters/exchange-rate.presenter.ts`
- Data transformation for UI
- Formatting logic

### Presentation Layer

#### Currency Utilities

Location: `src/lib/utils.ts`

```typescript
// Format amount in specific currency
formatCurrency(1234.56, "USD") // "$1,234.56"
formatCurrency(1234.56, "SAR") // "ر.س 1,234.56"

// Format dual currency display
formatDualCurrency(100, "USD", 375) // "$100.00 (ر.س 375.00)"

// Format SAR only
formatSAR(1234.56) // "ر.س 1,234.56"

// Get currency symbol
getCurrencySymbol("USD") // "$"
```

#### CurrencyDisplay Component

Location: `src/components/ui/currency-display.tsx`

**Props**:
```typescript
interface CurrencyDisplayProps {
  amount: number;
  currency?: string;  // default: "SAR"
  sarAmount?: number;  // for dual display
  mode?: "single" | "dual" | "sar-only";  // default: "dual"
  showSymbol?: boolean;  // default: true
  showCode?: boolean;  // default: false
  exchangeRate?: number;  // for tooltip
  tooltip?: "auto" | "always" | "never";  // default: "auto"
  className?: string;
}
```

**Usage Examples**:

```tsx
// Simple SAR display
<CurrencyDisplay amount={1234.56} />
// Output: ر.س 1,234.56

// USD with dual display
<CurrencyDisplay
  amount={100}
  currency="USD"
  sarAmount={375}
  mode="dual"
/>
// Output: $100.00 (ر.س 375.00)

// With exchange rate tooltip
<CurrencyDisplay
  amount={100}
  currency="USD"
  sarAmount={375}
  exchangeRate={3.75}
/>
// Output: $100.00 (ر.س 375.00) [hover shows: 1 USD = 3.750000 SAR]
```

#### Currency Configuration

Location: `src/lib/currencies.config.ts`

**Supported Currencies**:
```typescript
export const SUPPORTED_CURRENCIES = [
  { code: "SAR", name: "Saudi Riyal", symbol: "ر.س", locale: "ar-SA" },
  { code: "USD", name: "US Dollar", symbol: "$", locale: "en-US" },
  { code: "EUR", name: "Euro", symbol: "€", locale: "de-DE" },
  { code: "GBP", name: "British Pound", symbol: "£", locale: "en-GB" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", locale: "ja-JP" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", locale: "en-AU" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$", locale: "en-CA" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF", locale: "de-CH" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥", locale: "zh-CN" },
  { code: "INR", name: "Indian Rupee", symbol: "₹", locale: "en-IN" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ", locale: "ar-AE" },
  { code: "KWD", name: "Kuwaiti Dinar", symbol: "د.ك", locale: "ar-KW" },
  { code: "BHD", name: "Bahraini Dinar", symbol: "د.ب", locale: "ar-BH" },
  { code: "OMR", name: "Omani Rial", symbol: "ر.ع", locale: "ar-OM" },
  { code: "QAR", name: "Qatari Riyal", symbol: "ر.ق", locale: "ar-QA" },
] as const;
```

## User Guide

### Managing Exchange Rates

Navigate to `/fx-rates` (Configuration → Exchange Rates)

#### Creating a New Exchange Rate

1. Click **"Create Exchange Rate"** button
2. Select currency from dropdown
3. Enter rate to SAR (e.g., 3.75 for USD)
4. Set active status
5. Click **"Create"**

**Example**:
- Currency: USD
- Rate to SAR: 3.75
- Active: ✓

This means: **1 USD = 3.75 SAR**

#### Updating an Exchange Rate

1. Find the currency in the table
2. Click **"Edit"** action
3. Update the rate to SAR
4. Click **"Update"**

**Note**: Rate changes are **immediate** and affect all future conversions. Historical values are not retroactively updated (they recalculate on page load).

#### Deactivating an Exchange Rate

1. Find the currency in the table
2. Click **"Delete"** (soft delete - sets `isActive = false`)
3. Confirm the action

**Impact**: Assets with this currency will show **single currency display only** (no SAR conversion) until the rate is reactivated.

### Entering Costs in Different Currencies

#### Asset Purchase Cost

1. Open Asset form (Create or Edit)
2. Enter **Purchase Cost** (e.g., 1000)
3. Select **Currency** from dropdown (e.g., USD)
4. Save the asset

**Result**: Asset cost is stored as USD 1,000 and displayed as "$1,000.00 (ر.س 3,750.00)"

#### Warranty Cost

1. Open Warranty form (Create or Edit)
2. Enter **Cost** (e.g., 500)
3. Select **Currency** from dropdown (e.g., EUR)
4. Save the warranty

**Result**: Warranty cost is stored as EUR 500 and displayed as "€500.00 (ر.س 2,050.00)"

#### Disposal Estimated Value

1. Open Disposal form (Create or Edit)
2. Enter **Estimated Value** (e.g., 200)
3. Select **Currency** from dropdown (e.g., GBP)
4. Save the disposal

**Result**: Disposal value is stored as GBP 200 and displayed as "£200.00 (ر.س 950.00)"

### Viewing Multi-Currency Data

#### Assets Table

The assets table shows all costs with dual currency display:

| Asset Tag | Purchase Cost |
|-----------|---------------|
| LAPTOP-001 | $1,000.00 (ر.س 3,750.00) |
| SERVER-002 | €2,500.00 (ر.س 10,250.00) |
| PHONE-003 | ر.س 2,000.00 |

**Tooltip**: Hover over any currency value to see the exchange rate used.

#### Asset Detail Page

The asset overview tab shows purchase cost with dual display and exchange rate tooltip.

#### Dashboard

The dashboard **Total Value** shows the sum of all assets converted to SAR:

```
Total Value: ر.س 16,000.00
```

This is calculated as:
- Asset 1 (USD): $1,000 × 3.75 = SAR 3,750
- Asset 2 (EUR): €2,500 × 4.10 = SAR 10,250
- Asset 3 (SAR): SAR 2,000 × 1.00 = SAR 2,000
- **Total: SAR 16,000**

## Developer Guide

### Adding Multi-Currency Support to a New Entity

Follow these steps to add multi-currency support to a new entity:

#### 1. Update Prisma Schema

Add `currency` field to your entity:

```prisma
model MyEntity {
  // ... existing fields
  cost     Decimal? @db.Decimal(12, 2)
  currency String?  @default("SAR")
  // ... rest
}
```

Run migration:
```bash
npx prisma migrate dev --name add_currency_to_my_entity
```

#### 2. Update Domain Entity

Add `currency` to entity props and methods:

```typescript
export interface MyEntityProps {
  // ... existing props
  cost: number | null;
  currency: string | null;
}

export interface CreateMyEntityProps {
  // ... existing props
  cost?: number | null;
  currency?: string | null;  // Add this
}
```

Add validation in `create()` and `update()` methods:

```typescript
static create(props: CreateMyEntityProps): MyEntity {
  // Validate currency if provided
  if (props.currency !== undefined && props.currency !== null) {
    MyEntity.validateCurrency(props.currency);
  }

  return new MyEntity({
    // ... other fields
    cost: props.cost ?? null,
    currency: props.currency ?? "SAR",  // Default to SAR
  });
}

private static validateCurrency(currency: string): void {
  if (currency.trim().length !== 3) {
    throw new Error("Currency must be a 3-letter ISO code");
  }
  if (!/^[A-Z]{3}$/i.test(currency.trim())) {
    throw new Error("Currency must be 3 uppercase letters");
  }
}
```

#### 3. Update DTOs

Add `currency` to DTO schemas:

```typescript
export const CreateMyEntitySchema = z.object({
  // ... existing fields
  cost: z.number().positive().optional(),
  currency: z.string().length(3).regex(/^[A-Z]{3}$/).default("SAR"),
});
```

#### 4. Update Form Component

Replace currency text input with Select dropdown:

```tsx
import { SUPPORTED_CURRENCIES } from "@/lib/currencies.config";

<FormField
  control={form.control}
  name="currency"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Currency</FormLabel>
      <Select
        onValueChange={field.onChange}
        value={field.value || "SAR"}
      >
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Select currency" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          {SUPPORTED_CURRENCIES.map((curr) => (
            <SelectItem key={curr.code} value={curr.code}>
              {curr.symbol} {curr.code} - {curr.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FormDescription>Currency for cost</FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>
```

#### 5. Update Table Component

Add multi-currency display to table columns:

```tsx
import * as React from "react";
import { CurrencyDisplay } from "@/components/ui/currency-display";
import { listExchangeRatesAction } from "@/interface-adapters/controllers/exchange-rate.controller";
import type { ExchangeRateResponseDTO } from "@/interface-adapters/presenters/exchange-rate.presenter";

// Inside component:
const [exchangeRates, setExchangeRates] = React.useState<Map<string, ExchangeRateResponseDTO>>(new Map());

React.useEffect(() => {
  async function fetchExchangeRates() {
    try {
      const result = await listExchangeRatesAction({ onlyActive: true });
      if (result.success && result.data) {
        const ratesMap = new Map<string, ExchangeRateResponseDTO>();
        result.data.forEach((rate) => {
          ratesMap.set(rate.currency, rate);
        });
        setExchangeRates(ratesMap);
      }
    } catch (error) {
      // Silently fail
    }
  }
  fetchExchangeRates();
}, []);

const calculateSARAmount = (amount: number, currency: string) => {
  if (currency === "SAR") {
    return { sarAmount: amount, exchangeRate: 1.0 };
  }
  const rate = exchangeRates.get(currency);
  if (!rate) return {};
  return { sarAmount: amount * rate.rateToSAR, exchangeRate: rate.rateToSAR };
};

// In column definition:
{
  accessorKey: "cost",
  header: "Cost",
  cell: ({ row }) => {
    const cost = row.getValue("cost") as number | null;
    const currency = row.original.currency || "SAR";

    if (!cost) {
      return <span className="text-muted-foreground">—</span>;
    }

    const { sarAmount, exchangeRate } = calculateSARAmount(cost, currency);

    return (
      <CurrencyDisplay
        amount={cost}
        currency={currency}
        sarAmount={sarAmount}
        exchangeRate={exchangeRate}
        mode="dual"
      />
    );
  },
}
```

#### 6. Update Detail/Overview Component

Add multi-currency display to detail views:

```tsx
import * as React from "react";
import { CurrencyDisplay } from "@/components/ui/currency-display";
import { convertCurrencyAction } from "@/interface-adapters/controllers/exchange-rate.controller";

// Inside component:
const [currencyConversion, setCurrencyConversion] = React.useState<{
  sarAmount: number;
  exchangeRate: number;
} | null>(null);

React.useEffect(() => {
  async function fetchConversion() {
    if (!entity.cost || entity.currency === "SAR") return;

    try {
      const result = await convertCurrencyAction({
        amount: entity.cost,
        fromCurrency: entity.currency,
      });

      if (result.success && result.data) {
        setCurrencyConversion(result.data);
      }
    } catch (error) {
      // Silently fail
    }
  }

  fetchConversion();
}, [entity.cost, entity.currency]);

// In display:
<CurrencyDisplay
  amount={entity.cost}
  currency={entity.currency || "SAR"}
  sarAmount={currencyConversion?.sarAmount}
  exchangeRate={currencyConversion?.exchangeRate}
  mode="dual"
/>
```

### Testing Multi-Currency Features

#### Unit Tests

Test currency conversion logic:

```typescript
describe("ConvertCurrencyUseCase", () => {
  it("should return same amount for SAR", async () => {
    const result = await convertCurrency.execute({
      amount: 100,
      fromCurrency: "SAR",
    });
    expect(result).toBe(100);
  });

  it("should convert USD to SAR correctly", async () => {
    // Given: USD rate is 3.75
    const result = await convertCurrency.execute({
      amount: 100,
      fromCurrency: "USD",
    });
    expect(result).toBe(375); // 100 × 3.75
  });

  it("should throw error for missing exchange rate", async () => {
    await expect(
      convertCurrency.execute({
        amount: 100,
        fromCurrency: "XXX", // Invalid currency
      })
    ).rejects.toThrow();
  });
});
```

#### Integration Tests

Test end-to-end flows:

```typescript
describe("Multi-Currency Asset Creation", () => {
  it("should create asset with USD currency", async () => {
    const asset = await createAsset({
      assetTag: "TEST-001",
      purchaseCost: 1000,
      currency: "USD",
      // ... other fields
    });

    expect(asset.purchaseCost).toBe(1000);
    expect(asset.currency).toBe("USD");
  });

  it("should display asset cost in dual currency format", async () => {
    // ... test UI display
  });
});
```

#### Manual Testing Checklist

- [ ] Create exchange rate for USD at 3.75
- [ ] Create asset with USD 100 cost
- [ ] Verify asset table shows "$100.00 (ر.س 375.00)"
- [ ] Hover over cost to see exchange rate tooltip
- [ ] Open asset detail page, verify dual currency display
- [ ] Update exchange rate to 3.80
- [ ] Refresh asset table, verify it shows "$100.00 (ر.س 380.00)"
- [ ] Check dashboard total value is in SAR
- [ ] Deactivate USD exchange rate
- [ ] Verify asset table shows "$100.00" (single currency, no conversion)
- [ ] Reactivate USD exchange rate
- [ ] Verify dual currency display returns

## RBAC Permissions

The following permissions control access to exchange rate management:

| Permission | Description |
|------------|-------------|
| `FX_RATES_VIEW` | View exchange rates |
| `FX_RATES_CREATE` | Create new exchange rates |
| `FX_RATES_UPDATE` | Update existing exchange rates |
| `FX_RATES_DELETE` | Deactivate exchange rates |
| `FX_RATES_MANAGE` | Full access to all FX rate operations |
| `FX_RATES_CONVERT` | Perform currency conversions |

**Default Assignments**:
- **System Administrator**: All permissions
- **Finance Manager**: All permissions
- **Asset Manager**: VIEW, CONVERT
- **Viewer**: VIEW, CONVERT

## Database Seeding

The system is seeded with realistic exchange rates for testing:

```typescript
export const EXCHANGE_RATES = [
  { currency: "SAR", rateToSAR: 1.0 },
  { currency: "USD", rateToSAR: 3.75 },      // Pegged rate
  { currency: "EUR", rateToSAR: 4.1 },
  { currency: "GBP", rateToSAR: 4.75 },
  { currency: "JPY", rateToSAR: 0.025 },
  { currency: "AUD", rateToSAR: 2.5 },
  { currency: "CAD", rateToSAR: 2.8 },
  { currency: "CHF", rateToSAR: 4.3 },
  { currency: "CNY", rateToSAR: 0.52 },
  { currency: "INR", rateToSAR: 0.045 },
  { currency: "AED", rateToSAR: 1.02 },      // Close to SAR
  { currency: "KWD", rateToSAR: 12.3 },
  { currency: "BHD", rateToSAR: 10.0 },
  { currency: "OMR", rateToSAR: 9.75 },
  { currency: "QAR", rateToSAR: 1.03 },
];
```

Run seed:
```bash
npm run reset
```

## Troubleshooting

### Issue: Currency displays as single format instead of dual

**Symptoms**: Shows "$100.00" instead of "$100.00 (ر.س 375.00)"

**Causes**:
1. Exchange rate not found for currency
2. Exchange rate is inactive
3. Component failed to fetch exchange rates

**Solutions**:
1. Check `/fx-rates` page - ensure rate exists and is active
2. Create exchange rate if missing
3. Check browser console for errors
4. Verify `listExchangeRatesAction` has proper permissions

### Issue: Dashboard shows incorrect total

**Symptoms**: Total value doesn't match sum of assets

**Causes**:
1. Some assets have currencies without exchange rates (excluded from total)
2. Exchange rates changed since last calculation
3. Caching issue

**Solutions**:
1. Check all assets have currencies with active exchange rates
2. Refresh the page to recalculate with latest rates
3. Verify exchange rates are correct at `/fx-rates`

### Issue: Exchange rate update doesn't reflect immediately

**Symptoms**: Changed exchange rate but conversions still use old rate

**Causes**:
1. Component state caching
2. Browser caching

**Solutions**:
1. Refresh the page (F5) to reload exchange rates
2. Hard refresh (Ctrl+F5 / Cmd+Shift+R) if soft refresh doesn't work

### Issue: Cannot create exchange rate

**Symptoms**: Error when trying to create exchange rate

**Causes**:
1. Duplicate currency code
2. Invalid rate value (must be > 0)
3. Missing permissions

**Solutions**:
1. Check if currency already exists (unique constraint)
2. Ensure rate is positive number
3. Verify user has `FX_RATES_CREATE` permission

## Best Practices

### Do ✅

- Always default new entities to "SAR" currency
- Use `CurrencyDisplay` component for consistent formatting
- Fetch exchange rates once per component mount (not per row)
- Convert to SAR before aggregating financial totals
- Show loading state while fetching conversions
- Handle missing exchange rates gracefully (show single currency)
- Use exchange rate tooltips for transparency

### Don't ❌

- Hardcode exchange rates in code
- Store SAR-converted amounts in database (store original + currency)
- Aggregate mixed currencies without conversion
- Use `console.log` for currency conversion errors
- Skip permission checks for exchange rate management
- Update exchange rates without considering impact on existing data

## Future Enhancements

The following enhancements are planned for future releases:

- **Historical Rate Tracking**: Track exchange rate changes over time with effective dates
- **Automated Rate Updates**: Integration with external API for daily rate updates
- **Currency Conversion Audit Trail**: Log all conversions for compliance
- **Multi-Currency Reports**: Financial reports with currency breakdown
- **Rate Change Notifications**: Alert users when exchange rates are updated
- **Bulk Currency Update**: Update currencies for multiple assets at once
- **Exchange Rate Graphs**: Visualize rate trends over time
- **Custom Base Currency**: Allow users to choose base currency (not just SAR)

## Related Documentation

- [DEVELOPER_GUIDE.md](../guides/DEVELOPER_GUIDE.md) - General development patterns
- [DATABASE_SCHEMA.md](../architecture/DATABASE_SCHEMA.md) - Schema design
- [ENTITY_REFERENCE.md](../guides/ENTITY_REFERENCE.md) - Entity validation standards
- [RBAC_DEVELOPER_GUIDE.md](../guides/RBAC_DEVELOPER_GUIDE.md) - Permission implementation

## Support

For questions or issues with multi-currency support:

1. Check this guide first
2. Review the [Troubleshooting](#troubleshooting) section
3. Check the codebase examples (Assets, Warranties, Disposals)
4. Report issues at https://github.com/anthropics/claude-code/issues

---

**Last Updated**: Current
**Version**: 1.0
**Author**: Multi-Currency Support Team
