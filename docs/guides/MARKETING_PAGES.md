# Marketing Pages & Auth-Aware Navigation

**Last Updated**: Current

This guide covers the marketing homepage and authentication flow, including auth-aware navigation components.

---

## Overview

The Barq Assets application includes a public marketing homepage and authentication pages that intelligently adapt based on user authentication state.

### Pages

- **Marketing Homepage** (`/`) - Public landing page showcasing system features
- **Login Page** (`/login`) - Email/password and Microsoft OAuth authentication
- **Register Page** (`/register`) - New user registration

---

## Marketing Homepage

### Location

- **Route**: `/`
- **Layout**: `src/app/(marketing)/layout.tsx` (minimal layout)
- **Page**: `src/app/(marketing)/page.tsx`

### Components

#### 1. Marketing Navigation (`MarketingNav`)

**File**: `src/components/marketing/marketing-nav.tsx`

**Features**:

- Logo (links to `/`)
- Theme toggle (light/dark mode)
- Auth-aware "Enter/Dashboard" button

**Auth-Aware Behavior**:

```tsx
// Checks session on mount
useEffect(() => {
  authClient.getSession().then((session) => {
    setIsLoggedIn(!!session?.data?.user);
    setIsLoading(false);
  });
}, []);

// Conditional rendering
<Link href={isLoggedIn ? "/dashboard" : "/login"}>
  {isLoading ? "..." : isLoggedIn ? "Dashboard" : "Enter"}
</Link>;
```

**States**:

- **Loading**: Shows "..." while checking session
- **Logged In**: Shows "Dashboard" button → links to `/dashboard`
- **Logged Out**: Shows "Enter" button → links to `/login`

#### 2. Hero Section (`HeroSection`)

**File**: `src/components/marketing/hero-section.tsx`

**Features**:

- Main headline and tagline
- Two CTA buttons (primary and secondary)
- Scroll indicator with animation

**Auth-Aware Primary CTA**:

```tsx
<Button href={isLoggedIn ? "/dashboard" : "/login"}>
  {isLoggedIn ? (
    <LayoutDashboard className="mr-2 h-5 w-5" />
  ) : (
    <LogIn className="mr-2 h-5 w-5" />
  )}
  {isLoading
    ? "Loading..."
    : isLoggedIn
      ? "Go to Dashboard"
      : "Login to Dashboard"}
</Button>
```

**States**:

- **Loading**: Shows "Loading..." with disabled state
- **Logged In**: Shows "Go to Dashboard" with dashboard icon
- **Logged Out**: Shows "Login to Dashboard" with login icon

#### 3. Marketing Footer (`MarketingFooter`)

**File**: `src/components/marketing/marketing-footer.tsx`

**Features**:

- Quick links section
- Resources section
- About Barq section
- Copyright and compliance information

**Auth-Aware Links**:

```tsx
// Both "Login" and "Dashboard" links adapt
<Link href={isLoggedIn ? "/dashboard" : "/login"}>Login</Link>
<Link href={isLoggedIn ? "/dashboard" : "/login"}>Dashboard</Link>
```

**Behavior**:

- **Logged In**: Both links go to `/dashboard`
- **Logged Out**: Both links go to `/login`

---

## Authentication Pages

### Login Page

**File**: `src/app/(auth)/login/page.tsx`

**Features**:

- Email/password authentication
- Microsoft OAuth login
- Split-screen design with branding
- Auth-aware redirect

**Auth Protection**:

```tsx
const [isCheckingAuth, setIsCheckingAuth] = useState(true);

useEffect(() => {
  authClient
    .getSession()
    .then((session) => {
      if (session?.data?.user) {
        router.replace("/dashboard"); // Redirect if logged in
      } else {
        setIsCheckingAuth(false); // Show login page
      }
    })
    .catch(() => {
      setIsCheckingAuth(false);
    });
}, [router]);

// Loading state prevents flash
if (isCheckingAuth) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Shield className="text-barq-yellow mx-auto h-12 w-12 animate-pulse" />
      <p>Checking authentication...</p>
    </div>
  );
}
```

**User Flow**:

1. **Logged-Out User**:
   - Shows loading spinner briefly
   - Displays login form
   - Can authenticate

2. **Logged-In User**:
   - Shows loading spinner
   - Automatically redirected to `/dashboard`
   - No flash of login form

### Register Page

**File**: `src/app/(auth)/register/page.tsx`

**Features**:

- Email/password registration
- Split-screen design with branding
- Auth-aware redirect (same as login page)

**Auth Protection**:

- Identical implementation to login page
- Redirects logged-in users to `/dashboard`
- Shows loading spinner to prevent flash

---

## Authentication Flow

### Multi-Layer Defense

The application uses a **defense-in-depth** approach with three layers:

#### 1. Proxy Layer (Server-Side)

**File**: `proxy.ts` (project root)

**Purpose**: First line of defense at network boundary

**Implementation**:

```typescript
// Redirect authenticated users from landing page
if (pathname === "/" && hasSessionCookie(request)) {
  return NextResponse.redirect(new URL("/dashboard", request.url));
}

// Redirect authenticated users from auth pages
if (
  (pathname === "/login" || pathname === "/register") &&
  hasSessionCookie(request)
) {
  return NextResponse.redirect(new URL("/dashboard", request.url));
}

// Redirect unauthenticated users from protected routes
if (!isPublicRoute(pathname) && !hasSessionCookie(request)) {
  const url = new URL("/login", request.url);
  url.searchParams.set("from", pathname);
  return NextResponse.redirect(url);
}
```

**Cookie Check**:

```typescript
function hasSessionCookie(request: NextRequest): boolean {
  const sessionToken = request.cookies.get("better-auth.session_token");
  return !!sessionToken?.value;
}
```

#### 2. Page Level (Client-Side)

**Purpose**: Secondary protection with loading states

**Implementation**:

- Login and register pages check `authClient.getSession()`
- Show loading spinner while checking
- Redirect if already authenticated
- Only render page content for unauthenticated users

#### 3. Component Level (Navigation)

**Purpose**: Smart UI that adapts to auth state

**Implementation**:

- Marketing nav, hero, and footer check session
- Conditional links and button text
- Seamless experience for logged-in users

---

## Technical Implementation

### Auth Client Usage

All components use `authClient.getSession()` (not `useSession()` hook) to avoid SSR issues:

```typescript
import { authClient } from "@/lib/auth/client";
import { useEffect, useState } from "react";

export function MyComponent() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    authClient
      .getSession()
      .then((session) => {
        setIsLoggedIn(!!session?.data?.user);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoggedIn(false);
        setIsLoading(false);
      });
  }, []);

  // Use isLoggedIn and isLoading states
}
```

### Why Not `useSession()` Hook on Marketing Pages?

The `useSession()` hook from better-auth/react causes SSR errors on marketing pages:

```
Cannot read properties of null (reading 'useRef')
```

**Solution for marketing pages**: Use the promise-based `authClient.getSession()` API in `useEffect` after component mounts.

**Note**: Inside the dashboard, use `useSessionContext()` from `@/contexts/session-context` instead. The dashboard has a `SessionProvider` that centralizes session fetching to prevent rate limiting issues.

### Router Navigation

All redirects use `router.replace()` (not `router.push()`):

```typescript
import { useRouter } from "next/navigation";

const router = useRouter();
router.replace("/dashboard"); // Replace instead of push
```

**Why `replace()`?**

- Prevents back-button issues
- User can't go back to login page after being redirected
- Cleaner navigation history

---

## User Experience Flows

### Flow 1: Unauthenticated User Visits Homepage

1. User navigates to `/`
2. Marketing nav shows "Enter" button (links to `/login`)
3. Hero shows "Login to Dashboard" button (links to `/login`)
4. Footer shows "Login" and "Dashboard" links (both → `/login`)
5. User clicks any button → redirected to `/login`

### Flow 2: Authenticated User Visits Homepage

1. User navigates to `/`
2. **Proxy layer** checks session cookie → redirects to `/dashboard`
3. User never sees marketing page (instant redirect)

**Fallback** (if proxy doesn't trigger):

1. Marketing nav shows "Dashboard" button (links to `/dashboard`)
2. Hero shows "Go to Dashboard" button (links to `/dashboard`)
3. Footer links both go to `/dashboard`

### Flow 3: Unauthenticated User Visits Login Page

1. User navigates to `/login`
2. Shows loading spinner ("Checking authentication...")
3. Session check completes → no session found
4. Login form renders
5. User can authenticate

### Flow 4: Authenticated User Visits Login Page

1. User navigates to `/login` (direct URL or bookmark)
2. Shows loading spinner ("Checking authentication...")
3. Session check completes → user is logged in
4. Immediately redirects to `/dashboard`
5. No flash of login form

### Flow 5: User Logs Out

1. User clicks "Sign Out" in dashboard
2. Session cleared
3. Redirected to `/login`
4. Marketing homepage nav/hero/footer now show "Enter"/"Login to Dashboard"

---

## Best Practices

### 1. Always Check Session Client-Side

For auth-aware components:

```typescript
useEffect(() => {
  authClient
    .getSession()
    .then((session) => setIsLoggedIn(!!session?.data?.user))
    .catch(() => setIsLoggedIn(false));
}, []);
```

### 2. Show Loading States

Prevent flash of content:

```typescript
if (isCheckingAuth) {
  return <LoadingSpinner />;
}
```

### 3. Use `router.replace()` for Redirects

Prevent back-button issues:

```typescript
router.replace("/dashboard"); // ✅ Good
router.push("/dashboard"); // ❌ Bad
```

### 4. Handle Errors Gracefully

Always have a fallback:

```typescript
authClient
  .getSession()
  .then(/* ... */)
  .catch(() => {
    // Assume not logged in
    setIsLoggedIn(false);
    setIsLoading(false);
  });
```

---

## Testing

### Manual Testing Checklist

**Logged-Out User**:

- [ ] Visit `/` → see "Enter" button in nav
- [ ] Visit `/` → see "Login to Dashboard" in hero
- [ ] Visit `/` → footer "Login" and "Dashboard" links go to `/login`
- [ ] Visit `/login` → see login form (no flash)
- [ ] Visit `/register` → see registration form (no flash)

**Logged-In User**:

- [ ] Visit `/` → redirected to `/dashboard` immediately
- [ ] Visit `/login` → see loading spinner → redirected to `/dashboard`
- [ ] Visit `/register` → see loading spinner → redirected to `/dashboard`
- [ ] Visit `/` (if proxy fails) → see "Dashboard" button in nav
- [ ] Visit `/` (if proxy fails) → see "Go to Dashboard" in hero
- [ ] Visit `/` (if proxy fails) → footer links go to `/dashboard`

**Navigation**:

- [ ] Click "Enter" when logged out → go to `/login`
- [ ] Click "Dashboard" when logged in → go to `/dashboard`
- [ ] Click "Login to Dashboard" when logged out → go to `/login`
- [ ] Click "Go to Dashboard" when logged in → go to `/dashboard`

### Automated Testing

Add tests to `AUTH_SECURITY_TESTING_GUIDE.md`:

```typescript
// Test auth-aware navigation
describe("Marketing Navigation", () => {
  it("shows 'Enter' when logged out", async () => {
    // ... test implementation
  });

  it("shows 'Dashboard' when logged in", async () => {
    // ... test implementation
  });
});

// Test page redirects
describe("Login Page", () => {
  it("redirects logged-in users to dashboard", async () => {
    // ... test implementation
  });

  it("shows login form for logged-out users", async () => {
    // ... test implementation
  });
});
```

---

## Troubleshooting

### Issue: "Cannot read properties of null (reading 'useRef')"

**Cause**: Using `useSession()` hook in SSR context

**Solution**: Use `authClient.getSession()` promise API instead

### Issue: Flash of Login Form Before Redirect

**Cause**: Not using loading state

**Solution**: Add `isCheckingAuth` state and show spinner

### Issue: Proxy Not Redirecting

**Cause**: Session cookie not being read correctly

**Debug**:

1. Check browser DevTools → Application → Cookies
2. Look for `better-auth.session_token`
3. Check proxy logs for cookie detection

**Solution**: Verify cookie name matches in `proxy.ts`

### Issue: Back Button Returns to Login Page

**Cause**: Using `router.push()` instead of `router.replace()`

**Solution**: Always use `router.replace()` for auth redirects

---

## Related Documentation

- [NEXTJS_16_GUIDE.md](NEXTJS_16_GUIDE.md) - Next.js 16 proxy convention
- [AUTH_SECURITY_TESTING_GUIDE.md](../testing/AUTH_SECURITY_TESTING_GUIDE.md) - Authentication testing
- [BRANDING.md](BRANDING.md) - Logo and branding assets
- [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) - General development guide

---

## Summary

The Barq Assets marketing pages and authentication flow provide:

✅ **Seamless UX** - No flashes, smooth transitions
✅ **Smart Navigation** - Buttons adapt to auth state
✅ **Defense in Depth** - 3 layers of protection
✅ **SSR Compatible** - No hydration errors
✅ **Production Ready** - Tested and documented

All components work together to provide an intuitive experience for both logged-in and logged-out users.
