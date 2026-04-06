import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Allow public routes
  if (pathname.startsWith("/login") || pathname.startsWith("/api/auth")) {
    if (user) {
      // Already logged in — redirect to dashboard
      return NextResponse.redirect(new URL("/", request.url));
    }
    return supabaseResponse;
  }

  // Unauthenticated users go to login
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Get user type from DB for role-based routing
  const { data: profile } = await supabase
    .from("User")
    .select("user_type")
    .eq("email", user.email)
    .single();

  const userType = profile?.user_type as "ADMIN" | "STAFF" | "PLAYER" | undefined;

  // Root redirect based on role
  if (pathname === "/") {
    if (userType === "ADMIN") return NextResponse.redirect(new URL("/admin", request.url));
    if (userType === "STAFF") return NextResponse.redirect(new URL("/staff", request.url));
    if (userType === "PLAYER") return NextResponse.redirect(new URL("/player", request.url));
  }

  // Protect role-specific routes
  if (pathname.startsWith("/admin") && userType !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (pathname.startsWith("/staff") && userType !== "STAFF" && userType !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (pathname.startsWith("/player") && userType !== "PLAYER" && userType !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
