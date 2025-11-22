# Inline-Editable Code Fields UI Enhancement

**Status**: Planned
**Priority**: Medium
**Complexity**: Small
**Estimated Effort**: 4-6 hours (11 forms)
**Layer**: UI/UX Enhancement (Cross-cutting)

---

## Overview

**Business Requirements:**
Currently, all entity forms display code/tag fields as prominent input fields in the form body, even though these fields are rarely edited after initial creation. This creates visual clutter and poor UX:

- Code fields take up valuable form real estate
- Users must scroll past code fields to reach frequently-edited data
- The "Manually set code" toggle pattern (create mode) is inconsistent with edit mode
- Focus management issues cause forms to jump to incorrect fields on open

**Proposed Solution:**
Move code/tag fields from the form body to inline-editable fields in the DialogTitle. Users can click the code to edit it in-place, keeping it accessible but non-intrusive.

**Reference Implementation:**
✅ Asset form (completed) - [asset-form.tsx](../src/components/assets/asset-form.tsx)

---

## Technical Design

### Components Affected

**11 forms require updates:**

| Form Component               | Entity           | Code Field Name | Location                             |
| ---------------------------- | ---------------- | --------------- | ------------------------------------ |
| ✅ `asset-form.tsx`          | Asset            | `assetTag`      | **COMPLETED**                        |
| `asset-category-form.tsx`    | AssetCategory    | `code`          | `src/components/asset-categories/`   |
| `asset-model-form.tsx`       | AssetModel       | `code`          | `src/components/asset-models/`       |
| `kit-form.tsx`               | AssetKit         | `code`          | `src/components/asset-kits/`         |
| `ci-class-form.tsx`          | CIClass          | `code`          | `src/components/ci-classes/`         |
| `contract-type-form.tsx`     | ContractType     | `code`          | `src/components/contract-types/`     |
| `lifecycle-state-form.tsx`   | LifecycleState   | `code`          | `src/components/lifecycle-states/`   |
| `location-form.tsx`          | Location         | `code`          | `src/components/locations/`          |
| `organization-unit-form.tsx` | OrganizationUnit | `code`          | `src/components/organization-units/` |
| `relationship-type-form.tsx` | RelationshipType | `code`          | `src/components/relationship-types/` |
| `stock-location-form.tsx`    | StockLocation    | `code`          | `src/components/stock-locations/`    |
| `vendor-form.tsx`            | Vendor           | `code`          | `src/components/vendors/`            |

### Reusable Component

**Already Created:**

- ✅ `InlineEditableField` - [src/components/ui/inline-editable-field.tsx](../src/components/ui/inline-editable-field.tsx)

**Features:**

- Click-to-edit behavior
- Integrates with react-hook-form via `FormProvider`
- Supports text transformations (uppercase, lowercase, capitalize)
- Validation and error display
- Keyboard support (Enter to save, Escape to cancel)
- `tabIndex={-1}` to exclude from tab order

### Pattern for Each Form

**1. Add FormProvider Wrapper:**

```tsx
<DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
  <FormProvider {...form}>
    <DialogHeader>
      <DialogTitle className="flex flex-wrap items-center gap-2">
        <span>{isEditing ? "Edit Entity:" : "Create Entity:"}</span>
        <InlineEditableField
          name="code"
          placeholder={isEditing ? "Code" : "Auto-generated"}
          transform="uppercase"
          optional={!isEditing}
        />
      </DialogTitle>
    </DialogHeader>
    <Form {...form}>{/* Rest of form */}</Form>
  </FormProvider>
</DialogContent>
```

**2. Remove Code Field from Form Body:**

- Delete the code field `<FormField>` block
- Remove `showCodeField` state (if present)
- Remove toggle button logic (create mode)

**3. Add Focus Management:**

```tsx
// Focus the first field when dialog opens
useEffect(() => {
  if (open && !loading) {
    const timer = setTimeout(() => {
      const firstField =
        document.querySelector<HTMLButtonElement>('[role="combobox"]');
      if (firstField) {
        firstField.focus();
      }
    }, 100);
    return () => clearTimeout(timer);
  }
}, [open, loading]);
```

**4. Update Imports:**

```tsx
import { useForm, FormProvider } from "react-hook-form";
import { InlineEditableField } from "@/components/ui/inline-editable-field";
```

**5. Set First Field TabIndex:**
Add `tabIndex={1}` to the first Select field in the form body to ensure proper focus order.

---

## Implementation Checklist

### Phase 1: Foundation Layer Forms (3 forms)

**Estimated: 1.5 hours**

- [ ] **Location Form** (`location-form.tsx`)
  - [ ] Add FormProvider wrapper
  - [ ] Add InlineEditableField to DialogTitle
  - [ ] Remove code field from form body
  - [ ] Add focus management
  - [ ] Test create/edit flows

- [ ] **Organization Unit Form** (`organization-unit-form.tsx`)
  - [ ] Add FormProvider wrapper
  - [ ] Add InlineEditableField to DialogTitle
  - [ ] Remove code field from form body
  - [ ] Add focus management
  - [ ] Test create/edit flows

- [ ] **Lifecycle State Form** (`lifecycle-state-form.tsx`)
  - [ ] Add FormProvider wrapper
  - [ ] Add InlineEditableField to DialogTitle
  - [ ] Remove code field from form body
  - [ ] Add focus management
  - [ ] Test create/edit flows

### Phase 2: Asset Layer Forms (4 forms)

**Estimated: 2 hours**

- [ ] **Asset Category Form** (`asset-category-form.tsx`)
  - [ ] Add FormProvider wrapper
  - [ ] Add InlineEditableField to DialogTitle
  - [ ] Remove code field from form body
  - [ ] Add focus management
  - [ ] Test create/edit flows

- [ ] **Asset Model Form** (`asset-model-form.tsx`)
  - [ ] Add FormProvider wrapper
  - [ ] Add InlineEditableField to DialogTitle
  - [ ] Remove code field from form body
  - [ ] Add focus management
  - [ ] Test create/edit flows

- [ ] **Stock Location Form** (`stock-location-form.tsx`)
  - [ ] Add FormProvider wrapper
  - [ ] Add InlineEditableField to DialogTitle
  - [ ] Remove code field from form body
  - [ ] Add focus management
  - [ ] Test create/edit flows

- [ ] **Vendor Form** (`vendor-form.tsx`)
  - [ ] Add FormProvider wrapper
  - [ ] Add InlineEditableField to DialogTitle
  - [ ] Remove code field from form body
  - [ ] Add focus management
  - [ ] Test create/edit flows

### Phase 3: Advanced ITAM Forms (4 forms)

**Estimated: 2 hours**

- [ ] **Asset Kit Form** (`kit-form.tsx`)
  - [ ] Add FormProvider wrapper
  - [ ] Add InlineEditableField to DialogTitle
  - [ ] Remove code field from form body
  - [ ] Add focus management
  - [ ] Test create/edit flows

- [ ] **CI Class Form** (`ci-class-form.tsx`)
  - [ ] Add FormProvider wrapper
  - [ ] Add InlineEditableField to DialogTitle
  - [ ] Remove code field from form body
  - [ ] Add focus management
  - [ ] Test create/edit flows

- [ ] **Contract Type Form** (`contract-type-form.tsx`)
  - [ ] Add FormProvider wrapper
  - [ ] Add InlineEditableField to DialogTitle
  - [ ] Remove code field from form body
  - [ ] Add focus management
  - [ ] Test create/edit flows

- [ ] **Relationship Type Form** (`relationship-type-form.tsx`)
  - [ ] Add FormProvider wrapper
  - [ ] Add InlineEditableField to DialogTitle
  - [ ] Remove code field from form body
  - [ ] Add focus management
  - [ ] Test create/edit flows

### Phase 4: Testing & Polish

**Estimated: 0.5 hours**

- [ ] Verify consistent behavior across all forms
- [ ] Test tab order on all forms
- [ ] Test validation errors display correctly
- [ ] Test auto-generation still works (create mode)
- [ ] Test code uniqueness validation
- [ ] Browser testing (Chrome, Safari, Firefox)
- [ ] Mobile responsive check

---

## Testing Strategy

### Manual Testing Checklist (Per Form)

**Create Mode:**

1. ✅ Dialog opens with Asset Category focused (not code field)
2. ✅ Code field shows "(optional)" placeholder in title
3. ✅ Clicking code field opens inline editor
4. ✅ Entering code and pressing Enter/Escape works
5. ✅ Leaving code empty auto-generates on submit
6. ✅ Entering duplicate code shows validation error
7. ✅ Tab order flows naturally through form

**Edit Mode:**

1. ✅ Dialog opens with Asset Category focused (not code field)
2. ✅ Code field shows current value in title
3. ✅ Clicking code opens inline editor with current value selected
4. ✅ Editing code validates (required, unique, uppercase)
5. ✅ Validation errors appear below inline field
6. ✅ Changes sync with form state
7. ✅ Tab order flows naturally through form

**Focus Management:**

1. ✅ No "jump" from Serial Number (or first input) to first Select
2. ✅ Code field does not receive auto-focus
3. ✅ First Select field receives focus immediately
4. ✅ Tab navigates through fields in correct order

---

## Lessons Learned from Asset Form Implementation

### Key Discoveries

**1. Dialog Auto-Focus Issue:**

- shadcn/ui Dialog auto-focuses the first native `<input>` element
- Select components (rendered as buttons) are skipped
- **Solution**: Add `onOpenAutoFocus={(e) => e.preventDefault()}` to DialogContent

**2. Tab Order Management:**

- Using explicit `tabIndex` values (1, 2, 3...) is **bad practice**
- Browser follows natural DOM order by default
- Only use `tabIndex={-1}` to exclude elements (inline editable button)
- Only use `tabIndex={1}` on first field to prioritize focus

**3. FormProvider Requirement:**

- `InlineEditableField` uses `useFormContext()` to access form state
- Must wrap DialogContent with `<FormProvider {...form}>`
- Place FormProvider **inside** DialogContent but **outside** `<Form>`

**4. Focus Timing:**

- Dialog needs 100ms to fully render before focusing first field
- Use `setTimeout` in `useEffect` to ensure DOM is ready
- Wait for both `open` and `!loading` states

**5. Serial Number Focus Issue:**

- First `<Input>` field always received auto-focus
- Even with `tabIndex={-1}` on Input, Dialog would try to focus it first
- **Solution**: Prevent Dialog auto-focus entirely, then manually focus first Select

---

## Risk & Considerations

### Low Risk

**✅ Proven Pattern:**

- Asset form implementation validates the approach
- InlineEditableField is fully tested and reusable
- Focus management solution is confirmed working

**✅ No Breaking Changes:**

- Code generation logic remains unchanged
- Validation rules remain the same
- Backend APIs unaffected
- Only UI/UX presentation changes

**✅ Incremental Rollout:**

- Can implement per-form without dependencies
- Easy to test and validate each form individually
- Can pause/resume implementation at any phase

### Considerations

**⚠️ Consistency:**

- All forms must follow the exact same pattern
- Ensure InlineEditableField styling is consistent
- Verify placeholder text matches entity naming

**⚠️ Mobile UX:**

- Inline editing on small screens may be challenging
- Test touch interactions carefully
- May need responsive adjustments for title wrapping

**⚠️ Accessibility:**

- Ensure keyboard navigation works perfectly
- Screen readers must announce inline edit mode
- Error messages must be accessible

---

## Success Criteria

✅ **Completed when:**

1. All 11 forms use inline-editable code fields in DialogTitle
2. No code fields remain in form body
3. Focus management works correctly on all forms
4. Tab order is natural and consistent
5. Create and edit modes work as expected
6. Validation and error handling unchanged
7. Mobile experience is acceptable
8. No TypeScript errors
9. All manual tests pass

✅ **User Experience:**

- Forms feel cleaner and less cluttered
- Code fields are accessible but not intrusive
- Focus always starts on the most important field
- Tab navigation flows logically
- Editing codes is quick and intuitive

---

**Maintained By**: Development Team
**Created**: 2025-11-22
**Reference Implementation**: [asset-form.tsx](../src/components/assets/asset-form.tsx)
