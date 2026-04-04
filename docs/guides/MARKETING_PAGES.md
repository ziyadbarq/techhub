# Marketing Pages & Auth-Aware Navigation

**Last Updated**: Current

This guide covers the marketing homepage and authentication flow, including auth-aware navigation components.

---

## Overview

The TechHub application includes a public marketing homepage and authentication pages that intelligently adapt based on user authentication state.

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

### Design Principle: Static Links, Proxy-Handled Redirects

Marketing page components use **static links to `/login`** — they do not perform client-side session checks. Authenticated users are handled upstream by the proxy layer (`proxy.ts`), which redirects them to `/dashboard` before the marketing page ever renders.

This keeps the marketing page simple (no async session calls, no loading states, no flash) and avoids the server-to-self HTTP loopback problem that caused Docker crashes.

### Components

#### 1. Marketing Navigation (`MarketingNav`)

**File**: `src/components/marketing/marketing-nav.tsx`

**Features**:

- Logo (links to `/`)
- Theme toggle (light/dark mode)
- "Enter" button → always links to `/login`

```tsx
<Link href="/login">Enter</Link>
```

Authenticated users never reach this page — the proxy redirects them to `/dashboard` first.

#### 2. Hero Section (`HeroSection`)

**File**: `src/components/marketing/hero-section.tsx`

**Features**:

- Main headline and tagline
- Two CTA buttons (primary and secondary)
- Scroll indicator with animation

**Primary CTA**:

```tsx
<Link href="/login">
  <LayoutDashboard className="mr-2 h-5 w-5" />
  Go to Dashboard
</Link>
```

Always links to `/login`. Logged-in users are redirected to `/dashboard` by the proxy before seeing this button.

#### 3. Marketing Footer (`MarketingFooter`)

**File**: `src/components/marketing/marketing-footer.tsx`

**Features**:

- Quick links section (Login, Dashboard → both `/login`)
- Resources section
- About Barq section
- Copyright and compliance information

```tsx
<Link href="/login">Login</Link>
<Link href="/login">Dashboard</Link>
```

All quick links point to `/login`. The proxy handles authenticated users before they reach the footer.

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
2. Marketing nav shows "Enter" button → `/login`
3. Hero shows "Go to Dashboard" button → `/login`
4. Footer shows "Login" and "Dashboard" links → both `/login`
5. User clicks any button → arrives at login form

### Flow 2: Authenticated User Visits Homepage

1. User navigates to `/`
2. **Proxy layer** (`proxy.ts`) checks session cookie → redirects to `/dashboard`
3. User never sees marketing page (instant server-side redirect)

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

### 1. Keep Marketing Components Static

Marketing page components (nav, hero, footer) should use **static links to `/login`** — no client-side session checks. The proxy layer handles all authenticated redirects before the page renders. This avoids:
- Server-to-self HTTP loopback issues in Docker
- React error boundaries on login/signup pages
- Flash-of-wrong-content loading states

### 2. Use `router.replace()` for Auth Redirects

For auth/login pages that redirect logged-in users:

```typescript
router.replace("/dashboard"); // ✅ Good — no back-button loop
router.push("/dashboard"); // ❌ Bad
```

### 3. Handle Session Errors Gracefully

In auth pages that check session client-side:

```typescript
authClient
  .getSession()
  .then(/* ... */)
  .catch(() => {
    // Assume not logged in, show the form
    setIsCheckingAuth(false);
  });
```

---

## Testing

### Manual Testing Checklist

**Logged-Out User**:

- [ ] Visit `/` → see "Enter" button in nav (→ `/login`)
- [ ] Visit `/` → see "Go to Dashboard" in hero (→ `/login`)
- [ ] Visit `/` → footer "Login" and "Dashboard" links both go to `/login`
- [ ] Visit `/login` → see login form
- [ ] Visit `/register` → see registration form

**Logged-In User**:

- [ ] Visit `/` → redirected to `/dashboard` immediately (proxy)
- [ ] Visit `/login` → see loading spinner → redirected to `/dashboard`
- [ ] Visit `/register` → see loading spinner → redirected to `/dashboard`

**Navigation**:

- [ ] Click "Enter" when logged out → go to `/login`
- [ ] Click "Go to Dashboard" when logged out → go to `/login`
- [ ] Footer "Login"/"Dashboard" links → go to `/login`

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

The TechHub marketing pages and authentication flow provide:

✅ **Seamless UX** - No flashes, smooth transitions
✅ **Smart Navigation** - Buttons adapt to auth state
✅ **Defense in Depth** - 3 layers of protection
✅ **SSR Compatible** - No hydration errors
✅ **Production Ready** - Tested and documented

All components work together to provide an intuitive experience for both logged-in and logged-out users.
