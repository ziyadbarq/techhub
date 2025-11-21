# Asset Workflow Wizards

This directory contains wizard components for common asset workflows.

## Components

### 1. AssignAssetWizard

Multi-step wizard for assigning assets to employees.

**Location**: `src/components/assets/assign-asset-wizard.tsx`

**Props**:

- `assetId: string` - ID of the asset to assign
- `assetTag: string` - Asset tag for display
- `currentStockLocationId?: string | null` - Current stock location of the asset
- `open: boolean` - Dialog open state
- `onOpenChange: (open: boolean) => void` - Dialog state handler
- `onSuccess: () => void` - Callback on successful assignment

**Usage Example**:

```tsx
import { AssignAssetWizard } from "@/components/assets/assign-asset-wizard";

function AssetDetailPage({ asset }) {
  const [isAssignOpen, setIsAssignOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsAssignOpen(true)}>Assign to Employee</Button>

      <AssignAssetWizard
        assetId={asset.id}
        assetTag={asset.assetTag}
        currentStockLocationId={asset.currentStockLocationId}
        open={isAssignOpen}
        onOpenChange={setIsAssignOpen}
        onSuccess={() => {
          // Refresh asset data
          refreshAssetData();
        }}
      />
    </>
  );
}
```

**Workflow Steps**:

1. **Step 1**: Select employee and optional source location
2. **Step 2**: Confirm assignment and add notes

**Server Action**: `assignAssetToEmployeeAction` from `asset-workflow.controller.ts`

### 2. ReturnAssetWizard

Wizard for returning assets from employees back to stock.

**Location**: `src/components/assets/return-asset-wizard.tsx`

**Props**:

- `assetId: string` - ID of the asset to return
- `assetTag: string` - Asset tag for display
- `assignmentId: string` - ID of the current assignment to end
- `assignedToName?: string` - Name of person currently assigned (for display)
- `open: boolean` - Dialog open state
- `onOpenChange: (open: boolean) => void` - Dialog state handler
- `onSuccess: () => void` - Callback on successful return

**Usage Example**:

```tsx
import { ReturnAssetWizard } from "@/components/assets/return-asset-wizard";

function AssetDetailPage({ asset, assignment }) {
  const [isReturnOpen, setIsReturnOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsReturnOpen(true)}>Return to Stock</Button>

      <ReturnAssetWizard
        assetId={asset.id}
        assetTag={asset.assetTag}
        assignmentId={assignment.id}
        assignedToName={`${assignment.person.firstName} ${assignment.person.lastName}`}
        open={isReturnOpen}
        onOpenChange={setIsReturnOpen}
        onSuccess={() => {
          // Refresh asset data
          refreshAssetData();
        }}
      />
    </>
  );
}
```

**Workflow**:

- Select return location (stock location)
- Add optional notes (condition, reason, etc.)
- Confirms the return operation

**Server Action**: `returnAssetAction` from `asset-workflow.controller.ts`

## Features

Both wizards include:

- Form validation with Zod schemas
- React Hook Form integration
- Loading states
- Error handling with toast notifications
- Permission checks (via server actions)
- Responsive design
- Follows shadcn/ui patterns
- TypeScript strict mode

## TODO

- [ ] Integrate session management to get current user ID for `performedById`
- [ ] Add confirmation dialog for return operation
- [ ] Add asset condition tracking on return
- [ ] Consider adding bulk assignment/return functionality

## Related Files

**Controllers**:

- `src/interface-adapters/controllers/asset-workflow.controller.ts` - Workflow actions
- `src/interface-adapters/controllers/person.controller.ts` - Person data
- `src/interface-adapters/controllers/stock-location.controller.ts` - Location data

**Presenters**:

- `src/interface-adapters/presenters/person.presenter.ts`
- `src/interface-adapters/presenters/stock-location.presenter.ts`
- `src/interface-adapters/presenters/asset-assignment.presenter.ts`
- `src/interface-adapters/presenters/stock-movement.presenter.ts`
