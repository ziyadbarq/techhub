# localStorage and Hydration Patterns

This guide documents best practices for using `localStorage` in React applications, with a focus on avoiding race conditions during client-side hydration.

## Table of Contents

- [Overview](#overview)
- [The useLocalStorage Hook](#the-uselocalstorage-hook)
- [Common Pitfalls](#common-pitfalls)
- [Correct Patterns](#correct-patterns)
- [Real-World Examples](#real-world-examples)
- [Testing](#testing)

## Overview

Client-side hydration in Next.js (and React in general) presents unique challenges when working with `localStorage`:

1. **SSR Compatibility**: `localStorage` is not available during server-side rendering
2. **Hydration Mismatch**: Initial render must match server output, then hydrate with client state
3. **Race Conditions**: Multiple effects trying to initialize/sync state can interfere with each other
4. **Async Data Dependencies**: When localStorage state depends on async data (permissions, features, etc.)

Our `useLocalStorage` hook solves problems #1 and #2. This guide focuses on solving #3 and #4.

## The useLocalStorage Hook

**Location**: `src/hooks/use-local-storage.ts`

### How It Works

```typescript
const [value, setValue] = useLocalStorage<T>("storage-key", initialValue);
```

**Initialization Flow**:
1. **First render**: Returns `initialValue` (prevents hydration mismatch)
2. **Effect runs**: Reads from localStorage and updates state
3. **Subsequent renders**: Returns localStorage value

**Storage Key**: `"storage-key"` in localStorage

**Features**:
- SSR-safe (no crashes during server rendering)
- Auto-sync across browser tabs/windows
- Safe JSON parsing with error handling
- TypeScript typed
- Stable setter function (memoized with `useCallback`)

### Basic Usage

```typescript
// Simple boolean state
const [isDark, setIsDark] = useLocalStorage("theme-dark", false);

// Object state
const [settings, setSettings] = useLocalStorage("user-settings", {
  notifications: true,
  language: "en"
});

// Update like regular useState
setIsDark(true);
setSettings(prev => ({ ...prev, notifications: false }));
```

## Common Pitfalls

### ❌ Pitfall 1: Initializing with Computed State

**Problem**: Passing computed state as initial value causes unnecessary computation on every render.

```typescript
// BAD: buildState() runs on every render
const [state, setState] = useLocalStorage(
  "key",
  buildState(data) // ⚠️ Computed on every render!
);
```

**Solution**: Use empty state or a stable default.

```typescript
// GOOD: Simple initial value
const [state, setState] = useLocalStorage("key", {});
```

### ❌ Pitfall 2: Race Condition with Async Data

**Problem**: Effect syncs state when async data changes, overwriting localStorage before hydration completes.

```typescript
// BAD: Race condition during initial load
const [collapsedGroups, setCollapsedGroups] = useLocalStorage(
  "groups",
  buildGroupStates(navGroups) // navGroups starts as []
);

// This effect runs when navGroups changes from [] → actual groups
useEffect(() => {
  // ⚠️ Overwrites localStorage during hydration!
  setCollapsedGroups(buildGroupStates(navGroups));
}, [navGroups, setCollapsedGroups]);
```

**Timeline**:
```
T0: Component mounts, navGroups = []
T1: useLocalStorage initializes with buildGroupStates([]) = {}
T2: useLocalStorage effect queued (will read from localStorage)
T3: Permissions load, navGroups changes to [group1, group2, ...]
T4: Sync effect runs, calls setCollapsedGroups(buildGroupStates([group1, group2]))
    → Writes { group1: false, group2: false } to localStorage
T5: useLocalStorage effect runs, reads localStorage
    → Already overwritten with defaults!
```

### ❌ Pitfall 3: Including Setter in Dependencies

**Problem**: Causes unnecessary re-runs of effects and can trigger React Compiler warnings.

```typescript
// BAD: Unnecessary dependency
useEffect(() => {
  setState(newValue);
}, [data, setState]); // ⚠️ setState is stable, doesn't need to be in deps
```

**Solution**: Setter functions from `useLocalStorage` and `useState` are stable—omit them from dependencies.

```typescript
// GOOD: Only include actual dependencies
useEffect(() => {
  setState(newValue);
}, [data]); // ✅ setState is stable
```

## Correct Patterns

### ✅ Pattern 1: Simple State (No Async Dependencies)

For simple state that doesn't depend on async data:

```typescript
const [isCollapsed, setIsCollapsed] = useLocalStorage("sidebar-collapsed", false);
const [theme, setTheme] = useLocalStorage("theme", "light");

// Effects can read from state, but don't rebuild it
useEffect(() => {
  if (!hasPreference) {
    const shouldCollapse = window.innerWidth < 768;
    setIsCollapsed(shouldCollapse);
  }
}, []);
```

**Characteristics**:
- Initial value is stable primitive or object
- No async data dependencies
- Effects only update on specific events, not on data changes

### ✅ Pattern 2: State with Async Dependencies (Initialization Ref)

For state that depends on async data (permissions, features, etc.):

```typescript
const [state, setState] = useLocalStorage<StateType>("key", {});
const initializedRef = useRef(false);

useEffect(() => {
  // Guard 1: Only when async data is available
  if (asyncData.length === 0) return;

  // Guard 2: Only initialize once OR when data structure changes
  const currentCount = Object.keys(state).length;
  const newCount = asyncData.filter(condition).length;

  if (!initializedRef.current || currentCount !== newCount) {
    setState(prev => buildState(asyncData, prev)); // Merge with localStorage
    initializedRef.current = true;
  }
}, [asyncData, state]);
```

**Characteristics**:
- Initialize with empty state `{}`
- Use ref to track initialization
- Only sync when data is ready AND (not initialized OR structure changed)
- Merge new data with existing localStorage state

### ✅ Pattern 3: One-Time Hydration

For state that should hydrate once from async data, then only update manually:

```typescript
const [roleId, setRoleId] = useLocalStorage<string | null>("role-id", null);
const [permissions, setPermissions] = useState<Permission[] | null>(null);

// Re-apply stored role when roles load
useEffect(() => {
  // Guard: Only if we have a stored roleId, permissions not set, and roles loaded
  if (!roleId || permissions || roles.length === 0) return;

  const role = roles.find(r => r.id === roleId);
  if (role) {
    setPermissions(role.permissions);
  } else {
    // Stored role no longer exists, clear it
    setRoleId(null);
  }
}, [roleId, permissions, roles]);
```

**Characteristics**:
- Multiple guards prevent re-running
- Only hydrates once when all conditions met
- Cleanup (clear invalid data) built in

### ✅ Pattern 4: Debounced Updates

For frequently changing state that should persist:

```typescript
const [searchTerm, setSearchTerm] = useLocalStorage("search", "");
const debouncedSearchTerm = useDebounce(searchTerm, 500);

// User types → searchTerm updates → debounced value persists
// This prevents writing to localStorage on every keystroke
```

## Real-World Examples

### Example 1: Sidebar Navigation Groups (Fixed)

**File**: `src/hooks/use-sidebar-navigation.ts`

**Problem**: Navigation groups depend on permissions/features loading asynchronously. Race condition was overwriting localStorage with defaults.

**Solution**:

```typescript
const [collapsedGroups, setCollapsedGroups] = useLocalStorage<SidebarGroupState>(
  "sidebar-groups-collapsed",
  {} // Empty initial state
);

const initializedRef = useRef(false);

useEffect(() => {
  const currentGroupCount = Object.keys(collapsedGroups).length;
  const newGroupCount = navGroups.filter(g => g.collapsible).length;

  // Only sync when:
  // 1. navGroups are loaded (length > 0)
  // 2. AND either not initialized yet OR group count changed
  if (navGroups.length > 0 && (!initializedRef.current || currentGroupCount !== newGroupCount)) {
    setCollapsedGroups(prev => buildGroupStates(navGroups, prev));
    initializedRef.current = true;
  }
}, [navGroups, collapsedGroups]);
```

**Key Points**:
- Starts with empty state `{}`
- Waits for `navGroups` to load (from permissions/features)
- Only initializes once, or when number of groups changes (permission change)
- Merges with existing localStorage state via `prev => buildGroupStates(navGroups, prev)`

### Example 2: Role Preview Context (Correct)

**File**: `src/contexts/role-preview-context.tsx`

**Already Correct** ✅

```typescript
const [previewRoleId, setPreviewRoleId] = useLocalStorage<string | null>(
  "role-preview:id",
  null
);

const [previewPermissions, setPreviewPermissions] = useState<PermissionKey[] | null>(null);

// Re-apply stored preview when roles are loaded
useEffect(() => {
  // Multiple guards prevent re-running
  if (!previewRoleId || previewPermissions || roles.length === 0) return;

  const role = roles.find(r => r.id === previewRoleId);
  if (role) {
    setPreviewPermissions(role.permissions);
  } else {
    setPreviewRoleId(null);
    setPreviewRoleName(null);
  }
}, [previewRoleId, previewPermissions, roles]);
```

**Why it's correct**:
- Simple `null` initial value
- Guards prevent effect from running multiple times
- Only hydrates once when all conditions met
- Cleans up invalid data (role no longer exists)

### Example 3: Sidebar Collapse State (Simple)

**File**: `src/hooks/use-sidebar-state.ts`

**Already Correct** ✅

```typescript
const [isCollapsed, setIsCollapsed] = useLocalStorage("sidebar-collapsed", false);

// Auto-collapse on tablet screens (only if no user preference exists)
useEffect(() => {
  const hasPreference = localStorage.getItem("sidebar-collapsed") !== null;

  if (!hasPreference) {
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    setIsCollapsed(isTablet);
  }
}, []);
```

**Why it's correct**:
- Simple boolean initial value
- Effect only runs once (empty deps)
- Only sets value if no preference exists (doesn't overwrite)

## Testing

### Testing localStorage Hydration

```typescript
describe("useLocalStorage hydration", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should hydrate from localStorage on mount", () => {
    // Pre-populate localStorage
    localStorage.setItem("test-key", JSON.stringify({ foo: "bar" }));

    const { result } = renderHook(() =>
      useLocalStorage("test-key", { foo: "default" })
    );

    // First render: default value (prevents hydration mismatch)
    expect(result.current[0]).toEqual({ foo: "default" });

    // After effect runs: localStorage value
    waitFor(() => {
      expect(result.current[0]).toEqual({ foo: "bar" });
    });
  });

  it("should not overwrite localStorage during async data load", async () => {
    // Pre-populate localStorage with user preference
    localStorage.setItem("groups-collapsed", JSON.stringify({
      group1: true,  // User collapsed group1
      group2: false
    }));

    const { result, rerender } = renderHook(
      ({ data }) => {
        const [state, setState] = useLocalStorage("groups-collapsed", {});
        const initRef = useRef(false);

        useEffect(() => {
          if (data.length > 0 && !initRef.current) {
            setState(prev => buildState(data, prev));
            initRef.current = true;
          }
        }, [data]);

        return state;
      },
      { initialProps: { data: [] } }
    );

    // Initial render: empty data
    expect(result.current).toEqual({});

    // After hydration: localStorage value
    await waitFor(() => {
      expect(result.current).toEqual({ group1: true, group2: false });
    });

    // Async data loads
    rerender({ data: [{ id: "group1" }, { id: "group2" }] });

    // State should preserve user's preference from localStorage
    await waitFor(() => {
      expect(result.current).toEqual({ group1: true, group2: false });
    });
  });
});
```

### Testing Race Conditions

```typescript
it("should handle rapid permission changes without race conditions", async () => {
  const { result } = renderHook(() => {
    const [navGroups, setNavGroups] = useState([]);
    const [state, setState] = useLocalStorage("groups", {});
    const initRef = useRef(false);

    useEffect(() => {
      if (navGroups.length > 0 && !initRef.current) {
        setState(prev => buildState(navGroups, prev));
        initRef.current = true;
      }
    }, [navGroups]);

    return { state, setNavGroups };
  });

  // Simulate rapid permission changes
  act(() => {
    result.current.setNavGroups([{ id: "g1" }]);
  });

  await waitFor(() => {
    expect(result.current.state).toHaveProperty("g1");
  });

  act(() => {
    result.current.setNavGroups([{ id: "g1" }, { id: "g2" }]);
  });

  await waitFor(() => {
    expect(Object.keys(result.current.state)).toHaveLength(2);
  });

  // Should only initialize once, not on every change
  expect(initRef.current).toBe(true);
});
```

## Summary

### Key Takeaways

1. **Initialize with stable values**: Use empty objects/arrays or primitives, not computed state
2. **Use refs to track initialization**: Prevent effects from running multiple times
3. **Guard against async races**: Check data availability before syncing
4. **Merge with previous state**: Use updater functions to preserve existing localStorage data
5. **Omit stable setters from deps**: Setter functions don't change, don't include them
6. **Test hydration behavior**: Verify localStorage values aren't overwritten during load

### When to Use Each Pattern

| Scenario | Pattern | Example |
|----------|---------|---------|
| Simple state, no async deps | Pattern 1: Simple State | Sidebar collapsed, theme preference |
| State depends on async data | Pattern 2: Initialization Ref | Navigation groups (depends on permissions) |
| One-time hydration from async | Pattern 3: One-Time Hydration | Role preview (hydrate from stored ID) |
| Frequently changing state | Pattern 4: Debounced Updates | Search terms, form drafts |

### Checklist for localStorage Implementation

- [ ] Initial value is stable (not computed on every render)
- [ ] No race conditions with async data dependencies
- [ ] Setter functions omitted from effect dependencies
- [ ] Guards prevent effects from running multiple times
- [ ] State merges with previous localStorage value (uses updater functions)
- [ ] Tests verify localStorage isn't overwritten during hydration
- [ ] SSR-safe (no direct localStorage access outside effects/event handlers)

## Related Documentation

- [Sidebar Features Guide](./SIDEBAR_FEATURES.md) - Advanced sidebar implementation
- [Developer Guide](./DEVELOPER_GUIDE.md) - General development patterns
- [Next.js 16 Guide](./NEXTJS_16_GUIDE.md) - Async APIs and hydration
