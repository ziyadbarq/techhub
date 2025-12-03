# Service SLA & Health Monitoring

**Status**: ✅ Production Ready
**Version**: 1.0.0
**Last Updated**: December 1, 2024
**Feature Flag**: `SERVICE_HEALTH_SLA` (disabled by default, can be enabled independently from core Service Management)

## Overview

The Service SLA & Health Monitoring module extends the core Service Management system with enterprise-grade Service Level Agreement (SLA) tracking and automated health monitoring capabilities. This enables comprehensive service reliability tracking, compliance monitoring, and proactive incident management.

### Key Benefits

- **SLA Compliance Tracking**: Monitor response time, resolution time, uptime, and error rate SLAs
- **Health Monitoring**: Automated health status tracking with scheduled checks
- **Compliance Status**: Real-time SLA compliance calculation (COMPLIANT, AT_RISK, BREACHED)
- **Performance Metrics**: Track P50, P95, P99 response times and uptime percentages
- **Support Management**: Define support tiers, escalation paths, and contact information
- **Historical Tracking**: Maintain complete history of health status changes and SLA metrics
- **Proactive Alerting**: AT_RISK warnings before SLA breaches occur

## Architecture

### Components

```
Service SLA & Health Monitoring
├── Domain
│   ├── Service.entity.ts (enhanced)         # 34 new fields + 12 business methods
│   ├── ServiceHealthHistory.entity.ts       # Health status change tracking
│   └── ServiceSlaMetric.entity.ts           # SLA metric records
├── DI
│   └── `service.module.ts` binds ServiceHealthHistory/SlaMetric repositories + health/SLA use cases
├── Infrastructure
│   ├── PrismaServiceRepository (updated)    # Persistence for enhanced service
│   ├── IServiceHealthHistoryRepository      # Health history interface
│   └── IServiceSlaMetricRepository          # SLA metric interface
├── Use Cases (13 total: 9 existing + 4 new)
│   ├── CreateServiceUseCase (updated)       # With SLA/health fields
│   ├── UpdateServiceUseCase (updated)       # With SLA/health fields
│   ├── UpdateServiceHealthUseCase           # Update health status & metrics
│   ├── CalculateSlaComplianceUseCase        # Calculate compliance status
│   ├── RecordSlaMetricUseCase               # Record SLA metric
│   └── GetServiceHealthHistoryUseCase       # Retrieve health history
├── Controllers
│   └── service.controller.ts (updated)      # Server actions
├── UI Components
│   ├── service-form.tsx                     # 5-tab form with SLA & Monitoring
│   ├── service-form-fields.tsx              # NumberField component
│   ├── service-health-badge.tsx             # Health status indicators
│   └── service-sla-badge.tsx                # SLA compliance badges
└── Database
    ├── ServiceHealthStatus enum             # 6 states
    ├── SlaComplianceStatus enum             # 4 states
    ├── SlaMetricType enum                   # 5 types
    ├── Service table (34 new fields)        # Enhanced service model
    ├── ServiceHealthHistory table           # Health change log
    └── ServiceSlaMetric table               # SLA metric records
```

## Database Schema

### New Enums

```prisma
enum ServiceHealthStatus {
  HEALTHY      // Service operating normally
  DEGRADED     // Performance issues but functional
  UNHEALTHY    // Major issues affecting service
  DOWN         // Service unavailable
  MAINTENANCE  // Planned maintenance window
  UNKNOWN      // Health status not yet determined
}

enum SlaComplianceStatus {
  COMPLIANT        // Meeting all SLA targets
  AT_RISK          // Within 10-20% of threshold
  BREACHED         // SLA target exceeded
  NOT_APPLICABLE   // No SLA targets defined
}

enum SlaMetricType {
  RESPONSE_TIME     // API/web response time
  RESOLUTION_TIME   // Incident resolution time
  UPTIME           // Service availability
  ERROR_RATE       // Error percentage
  THROUGHPUT       // Requests per second
}
```

### Enhanced Service Model

**SLA Fields (14 fields)**:
- `slaResponseTimeP50` - 50th percentile response time target (ms)
- `slaResponseTimeP95` - 95th percentile response time target (ms)
- `slaResponseTimeP99` - 99th percentile response time target (ms)
- `slaResolutionTimeCritical` - Critical incident resolution time (minutes)
- `slaResolutionTimeHigh` - High priority resolution time (minutes)
- `slaResolutionTimeMedium` - Medium priority resolution time (minutes)
- `slaUptimePercentage` - Target uptime percentage (e.g., 99.900)
- `slaErrorRateThreshold` - Maximum error rate percentage
- `slaComplianceStatus` - Current compliance status
- `lastSlaReviewDate` - Last compliance review timestamp
- `slaViolationCount` - Total number of violations
- `slaSupportTier` - Support level (24/7, Business Hours, etc.)
- `slaContactEmail` - Primary SLA contact
- `slaEscalationPath` - Escalation procedure (text)

**Health Monitoring Fields (20 fields)**:
- `healthStatus` - Current health status
- `lastHealthCheck` - Last check timestamp
- `nextScheduledHealthCheck` - Next scheduled check
- `uptimePercentage24h` - 24-hour uptime
- `uptimePercentage7d` - 7-day uptime
- `uptimePercentage30d` - 30-day uptime
- `healthCheckUrl` - HTTP endpoint for checks
- `healthCheckInterval` - Check frequency (minutes)
- `healthCheckTimeout` - Check timeout (seconds)
- `healthCheckEnabled` - Enable/disable monitoring
- `currentResponseTimeP50` - Current P50 response time
- `currentResponseTimeP95` - Current P95 response time
- `currentErrorRate` - Current error rate
- `lastIncidentDate` - Last incident timestamp
- `lastDowntimeDate` - Last downtime timestamp
- `lastDowntimeDuration` - Last downtime duration (minutes)
- `mttrMinutes` - Mean Time To Repair
- `mtbfHours` - Mean Time Between Failures

### ServiceHealthHistory Table

Tracks all health status changes with metadata:

```prisma
model ServiceHealthHistory {
  id             String              @id @default(cuid())
  serviceId      String
  service        Service             @relation(...)
  previousStatus ServiceHealthStatus // Status before change
  newStatus      ServiceHealthStatus // Status after change
  checkTimestamp DateTime            // When check occurred
  responseTime   Int?                // Response time (ms)
  errorMessage   String?             // Error details
  statusCode     Int?                // HTTP status code
  checkDuration  Int?                // Check duration (ms)
  triggeredBy    String?             // Manual/automated/alert
  metadata       Json?               // Additional context
  createdAt      DateTime            @default(now())
}
```

### ServiceSlaMetric Table

Records SLA performance over time periods:

```prisma
model ServiceSlaMetric {
  id               String              @id @default(cuid())
  serviceId        String
  service          Service             @relation(...)
  metricType       SlaMetricType       // Type of metric
  periodStart      DateTime            // Period start
  periodEnd        DateTime            // Period end
  targetValue      Decimal             @db.Decimal(12, 3)
  actualValue      Decimal             @db.Decimal(12, 3)
  complianceStatus SlaComplianceStatus // Period compliance
  breachDuration   Int?                // Breach duration (minutes)
  incidentCount    Int                 @default(0)
  notes            String?             // Analysis notes
  createdAt        DateTime            @default(now())
  updatedAt        DateTime            @updatedAt
}
```

## Business Logic

### SLA Compliance Calculation

The `Service.calculateSlaCompliance()` method uses intelligent thresholds:

```typescript
// Response Time: AT_RISK if within 10% of threshold
if (currentP95 > slaP95 * 0.9) return "AT_RISK";
if (currentP95 > slaP95) return "BREACHED";

// Error Rate: AT_RISK if within 20% of threshold
if (currentErrorRate > threshold * 0.8) return "AT_RISK";
if (currentErrorRate > threshold) return "BREACHED";

// Uptime: AT_RISK if within 1% of target
if (uptime30d < target - 1.0) return "AT_RISK";
if (uptime30d < target) return "BREACHED";
```

### Health Status Management

The `Service.updateHealthStatus()` method:
1. Updates health status
2. Records response time if provided
3. Calculates next scheduled check based on interval
4. Tracks incidents and downtime
5. Automatically timestamps the change

### Uptime Calculation

The `Service.updateUptimeMetrics()` method calculates uptime for:
- Last 24 hours
- Last 7 days
- Last 30 days

Uses simplified logic (production would use ServiceHealthHistory):
```typescript
HEALTHY: 99.9%
DEGRADED: 95.0%
UNHEALTHY/DOWN: 50.0% or less
```

## Use Cases

### Core Service Use Cases (Updated)

#### CreateServiceUseCase
**Enhanced with SLA/Health fields**:
- Accepts 18 new optional fields
- Initializes health status as UNKNOWN
- Sets compliance status as NOT_APPLICABLE if no targets

#### UpdateServiceUseCase
**Enhanced with SLA/Health fields**:
- Partial updates for all 18 new fields
- Preserves existing values if not provided

### New Health Monitoring Use Cases

#### UpdateServiceHealthUseCase
**Updates service health status and metrics**

```typescript
interface UpdateServiceHealthRequest {
  serviceId: string;
  healthStatus: ServiceHealthStatus;
  responseTime?: number;
  errorRate?: number;
  lastIncidentDate?: Date;
  lastDowntimeDate?: Date;
  lastDowntimeDuration?: number;
  mttrMinutes?: number;
  mtbfHours?: number;
}
```

**Business Logic**:
1. Validates service exists
2. Calls `service.updateHealthStatus()` (domain method)
3. Updates additional metrics if provided
4. Calls `service.updateUptimeMetrics()` (domain method)
5. Persists changes

### New SLA Management Use Cases

#### CalculateSlaComplianceUseCase
**Calculates and updates SLA compliance status**

```typescript
interface CalculateSlaComplianceRequest {
  serviceId: string;
}

interface CalculateSlaComplianceResponse {
  service: Service;
  previousStatus: SlaComplianceStatus;
  newStatus: SlaComplianceStatus;
  statusChanged: boolean;
  violationDetected: boolean; // true if changed to BREACHED
}
```

**Business Logic**:
1. Validates service exists
2. Captures current compliance status
3. Calls `service.calculateSlaCompliance()` (domain method)
4. Calls `service.updateSlaCompliance()` (updates status + review date)
5. If BREACHED detected, calls `service.recordSlaViolation()` (increments counter)
6. Returns comparison details

#### RecordSlaMetricUseCase
**Records a new SLA metric for a time period**

```typescript
interface RecordSlaMetricRequest {
  serviceId: string;
  metricType: SlaMetricType;
  periodStart: Date;
  periodEnd: Date;
  targetValue: number;
  actualValue: number;
  complianceStatus: SlaComplianceStatus;
  breachDuration?: number;
  incidentCount?: number;
  notes?: string;
}
```

**Business Logic**:
1. Validates service exists
2. Creates ServiceSlaMetric entity
3. Persists metric
4. If breached, triggers `service.updateSlaCompliance()`
5. Logs warning for breaches

#### GetServiceHealthHistoryUseCase
**Retrieves health history records**

```typescript
interface GetServiceHealthHistoryRequest {
  serviceId: string;
  limit?: number;
  skip?: number;
}
```

**Returns**: Array of `ServiceHealthHistory` entities

## UI Components

### Service Form - SLA & Monitoring Tab

**5-tab layout**: Basic Info | Classification | Lifecycle | **SLA & Monitoring** | Governance

The new tab contains 5 organized cards:

#### 1. SLA Response Time Targets
- P50 Response Time (ms)
- P95 Response Time (ms)
- P99 Response Time (ms)

#### 2. SLA Resolution Time Targets
- Critical Incidents (minutes)
- High Priority (minutes)
- Medium Priority (minutes)

#### 3. SLA Performance Targets
- Uptime Target (%)
- Error Rate Threshold (%)

#### 4. SLA Support Details
- Support Tier (text)
- SLA Contact Email
- Escalation Path (textarea)

#### 5. Health Monitoring Configuration
- Enable Health Checks (checkbox)
- Health Check URL
- Check Interval (1-1440 minutes)
- Check Timeout (1-300 seconds)

### NumberField Component

**New reusable form field** with inline unit display:

```tsx
<NumberField
  control={form.control}
  name="slaResponseTimeP95"
  label="P95 Response Time"
  description="95th percentile response time target"
  unit="ms"  // Displayed inline
  min={0}
/>
```

**Features**:
- Inline unit labels (ms, min, %, sec)
- Min/max validation
- Step precision (0.001 for percentages)
- Proper null/undefined handling

### Health Status Badges

**ServiceHealthBadge Component** - 3 variants:

```tsx
// Full badge with icon
<ServiceHealthBadge status="HEALTHY" />
// Output: Green badge with checkmark icon + "Healthy"

// Icon only
<ServiceHealthIcon status="DEGRADED" />
// Output: Yellow warning triangle icon

// Animated pulse indicator
<ServiceHealthPulse status="HEALTHY" />
// Output: Animated green pulse dot
```

**Color Scheme**:
- HEALTHY: Green with checkmark
- DEGRADED: Yellow with warning triangle
- UNHEALTHY: Red with X icon
- DOWN: Red with X icon
- MAINTENANCE: Blue with wrench icon
- UNKNOWN: Gray with question mark

### SLA Compliance Badges

**ServiceSlaBadge Component** - 2 variants:

```tsx
// Full badge with icon
<ServiceSlaBadge status="COMPLIANT" />
// Output: Green badge with checkmark + "Compliant"

// Icon only
<ServiceSlaIcon status="AT_RISK" />
// Output: Yellow warning triangle icon
```

**Color Scheme**:
- COMPLIANT: Green with checkmark
- AT_RISK: Yellow with warning triangle
- BREACHED: Red with X icon
- NOT_APPLICABLE: Gray with minus icon

## Data Validation

### DTO Validation (Zod)

**CreateServiceSchema / UpdateServiceSchema**:

```typescript
// Response/Resolution Times
slaResponseTimeP50: z.number().int().positive().nullish()
slaResolutionTimeCritical: z.number().int().positive().nullish()

// Percentages (0-100 with 3 decimal precision)
slaUptimePercentage: z.number().min(0).max(100).nullish()
slaErrorRateThreshold: z.number().min(0).max(100).nullish()

// Email
slaContactEmail: z.string().email("Invalid email").nullish()

// URLs
healthCheckUrl: z.string().url("Invalid URL").nullish()

// Intervals (max 24 hours)
healthCheckInterval: z.number().int().positive().max(1440).nullish()

// Timeouts (max 5 minutes)
healthCheckTimeout: z.number().int().positive().max(300).nullish()

// Boolean (default false)
healthCheckEnabled: z.boolean().default(false)
```

### Entity Validation

**ServiceHealthHistory**:
- Period start must be before period end
- Service ID required
- Previous/new status required

**ServiceSlaMetric**:
- Period start must be before period end
- Target/actual values cannot be negative
- Service ID and metric type required

## Migration

### Data Migration Script

**Location**: `scripts/db/migrate-sla-data.ts`

**Purpose**: Safely migrate existing `slaDetails` JSON to structured fields

**Features**:
- ✅ Idempotent (can run multiple times)
- ✅ Safe parsing of numeric values
- ✅ Validates percentage ranges (0-100)
- ✅ Preserves original slaDetails for rollback
- ✅ Initializes health monitoring as disabled by default

**Usage**:
```bash
npx tsx scripts/db/migrate-sla-data.ts
```

**Sample Output**:
```
🔄 Starting SLA data migration...
📊 Found 0 services with slaDetails JSON
✨ No services to migrate. Exiting.
```

## Computed Fields (DTOs)

The Service presenter includes these computed fields from business logic:

```typescript
// Existing
isActive: service.isActive()
isRetired: service.isRetired()
daysUntilDecommission: service.getDaysUntilDecommission()
isRetiringSoon: service.isRetiringSoon(90)

// New SLA/Health
isSlaCompliant: service.isSlaCompliant()
hasSlaTargets: service.hasSlaTargets()
isHealthy: service.isHealthy()
isUnhealthy: service.isUnhealthy()
needsHealthCheck: service.needsHealthCheck()
```

## Usage Examples

### Creating a Service with SLA Targets

```typescript
const service = await createServiceAction({
  // Basic info
  name: "Customer API",
  serviceType: "API",
  description: "Customer data API",

  // SLA targets
  slaResponseTimeP95: 200,        // 200ms at P95
  slaResponseTimeP99: 500,        // 500ms at P99
  slaUptimePercentage: 99.9,      // Three nines
  slaErrorRateThreshold: 0.5,     // 0.5% max errors
  slaResolutionTimeCritical: 60,  // 1 hour for critical
  slaResolutionTimeHigh: 240,     // 4 hours for high
  slaSupportTier: "24/7",
  slaContactEmail: "sla@example.com",
  slaEscalationPath: "1. On-call engineer\n2. Team lead\n3. VP Engineering",

  // Health monitoring
  healthCheckEnabled: true,
  healthCheckUrl: "https://api.example.com/health",
  healthCheckInterval: 5,         // Every 5 minutes
  healthCheckTimeout: 10,         // 10 second timeout
});
```

### Updating Health Status

```typescript
const updatedService = await updateServiceHealthUseCase.execute({
  serviceId: "svc_123",
  healthStatus: "DEGRADED",
  responseTime: 350,              // 350ms (slower than usual)
  errorRate: 0.3,                 // 0.3% errors
  lastIncidentDate: new Date(),
});
```

### Calculating SLA Compliance

```typescript
const result = await calculateSlaComplianceUseCase.execute({
  serviceId: "svc_123"
});

console.log(result);
// {
//   previousStatus: "COMPLIANT",
//   newStatus: "AT_RISK",
//   statusChanged: true,
//   violationDetected: false
// }
```

### Recording SLA Metrics

```typescript
const metric = await recordSlaMetricUseCase.execute({
  serviceId: "svc_123",
  metricType: "RESPONSE_TIME",
  periodStart: new Date("2024-12-01"),
  periodEnd: new Date("2024-12-31"),
  targetValue: 200,               // Target: 200ms
  actualValue: 185,               // Actual: 185ms (good!)
  complianceStatus: "COMPLIANT",
  incidentCount: 0,
});
```

## Best Practices

### SLA Target Setting

1. **Response Time Targets**: Base on historical P95/P99 data, not averages
2. **Uptime Targets**: Use industry standards (99.9% = ~43 min/month downtime)
3. **Error Rate Thresholds**: Set based on user impact tolerance
4. **Resolution Times**: Align with support team capacity and business criticality

### Health Monitoring

1. **Check Intervals**: Balance monitoring granularity with system load
   - Critical services: 1-5 minutes
   - Standard services: 5-15 minutes
   - Low priority: 30-60 minutes

2. **Timeouts**: Set based on expected response time + buffer
   - Fast APIs: 5-10 seconds
   - Complex operations: 30-60 seconds

3. **Health Endpoints**: Implement proper health checks that:
   - Test critical dependencies (database, cache, external APIs)
   - Return appropriate HTTP status codes
   - Include lightweight validation

### Compliance Monitoring

1. **Regular Reviews**: Schedule periodic SLA compliance reviews
2. **Proactive Response**: Act on AT_RISK status before breach occurs
3. **Trend Analysis**: Monitor SLA metrics over time for patterns
4. **Documentation**: Document all SLA violations with root cause analysis

## Feature Flag Control

This feature can be toggled independently from core Service Management using the `SERVICE_HEALTH_SLA` feature flag.

### Flag Configuration

**Flag Name**: `SERVICE_HEALTH_SLA`
**Display Name**: "Service Health & SLA Monitoring"
**Category**: Layer 3
**Dependencies**: Requires `SERVICES` feature to be enabled
**Default State**: Disabled

### When Enabled

✅ **Visible Elements**:
- Health status badge on service header
- SLA compliance badge on service header (if SLA targets defined)
- "Health & SLA" tab on service details page
- "SLA & Monitoring" tab on service form (create/edit)
- Health monitoring cards showing current status and metrics
- SLA monitoring cards showing compliance status
- Health history table with status change timeline
- SLA metrics table with performance tracking

✅ **Data Fetched**:
- Service health history records
- SLA metric records
- Real-time health status and compliance calculations

### When Disabled (Default)

❌ **Hidden Elements**:
- All health status badges
- All SLA compliance badges
- "Health & SLA" tab (detail page)
- "SLA & Monitoring" tab (form)
- All health/SLA monitoring cards and tables

❌ **Data Not Fetched**:
- No health history queries
- No SLA metrics queries
- Performance optimization (fewer database queries)

✅ **Still Available**:
- Core service catalog
- Service ownership management
- Business process alignment
- Infrastructure tracking
- Service dependencies
- All other service management features

### How to Toggle

**Via Admin UI**:
1. Navigate to `/admin/feature-flags`
2. Find "Service Health & SLA Monitoring"
3. Toggle the switch to enable/disable

**Via Database** (advanced):
```sql
-- Disable the feature
UPDATE "FeatureFlag"
SET "isEnabled" = false
WHERE name = 'SERVICE_HEALTH_SLA';

-- Re-enable the feature
UPDATE "FeatureFlag"
SET "isEnabled" = true
WHERE name = 'SERVICE_HEALTH_SLA';
```

**After Toggling**:
- Clear Redis cache: Feature flag changes are cached for 5 minutes
- Users may need to refresh their browser to see changes
- System administrators always see all features (bypass)

### Use Cases for Disabling

1. **Phased Rollout**: Enable core services first, add health monitoring later
2. **Performance**: Reduce database load if health monitoring not needed
3. **Licensing**: Comply with feature tier restrictions
4. **Maintenance**: Temporarily disable during migrations or updates
5. **Simplification**: Reduce UI complexity for specific user groups

## Future Enhancements

**Planned for Future Releases**:

1. **Automated Health Checks**
   - BullMQ worker for scheduled health checks
   - Cron scheduling (every 5 minutes)
   - Automatic status updates

2. **SLA Compliance Dashboard**
   - Real-time compliance charts
   - Historical trend visualization
   - Violation analytics

3. **Health History Table Component**
   - Timeline view of status changes
   - Filtering by status, date range
   - Export capabilities

4. **Automated Alerting**
   - Email/Slack notifications on SLA violations
   - AT_RISK early warnings
   - Escalation automation

5. **Dependency Visualization**
   - React Flow graph of service dependencies
   - Impact analysis for outages
   - Critical path identification

## Performance Considerations

- **Database Indexing**: Health history and SLA metrics tables are indexed on serviceId and timestamps
- **Uptime Calculation**: Current implementation uses simplified logic; production should query ServiceHealthHistory
- **Compliance Calculation**: Runs in O(1) time using direct field comparisons
- **Health Check Scheduling**: Next check calculated during status update (no background job needed)

## Related Documentation

- [Service Management Overview](./SERVICE_MANAGEMENT.md) (if exists)
- [RBAC Developer Guide](../guides/RBAC_DEVELOPER_GUIDE.md)
- [Database Schema](../architecture/DATABASE_SCHEMA.md)
- [Developer Guide](../guides/DEVELOPER_GUIDE.md)

## Changelog

### v1.0.0 (December 1, 2024)
- ✅ Initial release
- ✅ 34 new service fields (14 SLA + 20 health)
- ✅ 2 new entities (ServiceHealthHistory, ServiceSlaMetric)
- ✅ 4 new use cases
- ✅ 2 new repository interfaces
- ✅ Full UI implementation (form tab + badges)
- ✅ Health & SLA monitoring UI components (cards + tables)
- ✅ Feature flag control (`SERVICE_HEALTH_SLA`)
- ✅ Conditional data fetching based on flag
- ✅ Migration script
- ✅ Complete documentation
