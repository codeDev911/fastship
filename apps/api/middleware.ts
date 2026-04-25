import { NextRequest, NextResponse } from "next/server";
import { csrfErrorResponse, validateCSRFMiddleware } from "@/lib/csrf-middleware";
import { jwtVerify } from "jose";

export const runtime = "nodejs";

/**
 * Get allowed origins from environment
 */
function getAllowedOrigins(): string[] {
  const env = process.env.ALLOWED_ORIGINS || "";
  if (!env.trim()) {
    return [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
      "http://localhost:3003",
      "http://localhost:3004",
    ];
  }
  return env
    .split(",")
    .map((o) => o.trim())
    .filter((o) => o);
}

/**
 * Check if origin is allowed
 */
function isOriginAllowed(origin: string | null | undefined): boolean {
  if (!origin) return true;
  const allowed = getAllowedOrigins();
  return allowed.some((a) => {
    if (a.includes("*")) {
      const regex = new RegExp("^" + a.replace(/\*/g, "[a-z0-9.-]*") + "$");
      return regex.test(origin);
    }
    return a === origin;
  });
}

/**
 * Get CORS headers
 */
function getCORSHeaders(origin: string | null | undefined) {
  if (!isOriginAllowed(origin)) {
    return {};
  }
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-CSRF-Token, X-Requested-With",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
  };
}

/**
 * Public API routes that don't require authentication or CSRF
 */
const publicRoutes = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/exchangeRates",
  "/api/auth/business",
  "/api/register/business/apply",
  "/api/register/business/complete",
  "/api/register/driver/apply",
  "/api/register/driver/complete",
  "/api/register/check-approva",
  "/api/auth/driver",
  "/api/auth/seller",
  "/api/locations",
  "/api/rate-cards",
  "/api/cron/reconciliation",
  "/api/rate/calculate",
  "/api/distance/calculate",
  "/api/locations/cities",
  "/api/locations/distance",
  "/api/locations/districts",
  "/api/locations/in-city-distance",
  "/api/locations/states",
  "/api/auth/csrf-token", // Allow CSRF token refresh without token
  "/api/admin" // alow all /api/admin routes to be public to aviod auth and CSRF requirement
];
/**
 * Check if route is public
 */
function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some((route) => pathname.startsWith(route));
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const origin = request.headers.get("origin");

  // Only handle /api routes
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Handle preflight
  if (request.method === "OPTIONS") {
    const corsHeaders = getCORSHeaders(origin);
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders,
    });
  }   

  // For public routes, just add CORS headers
  if (isPublicRoute(pathname) || pathname.includes("/api/admin")) {
    const response = NextResponse.next();
    const corsHeaders = getCORSHeaders(origin);

    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  }

  // =============== AUTHENTICATE ALL PROTECTED ROUTES ===============
  // Check authentication for ALL methods (GET, POST, PUT, DELETE, PATCH)
  
  let userId: any = "";

  // Get authentication token from cookies
  let token = request.cookies.get("auth_token")?.value || "";

  // If no cookie, try Authorization header (cross-origin requests)
  if (!token) {
    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
    }
  }

  if (!token) {
    // If no token, return 401 with CORS headers
    let errorResponse = NextResponse.json(
      { message: "Unauthorized - No authentication token provided" },
      { status: 401 },
    );

    const corsHeaders = getCORSHeaders(origin);

    Object.entries(corsHeaders).forEach(([key, value]) => {
      errorResponse.headers.set(key, value);
    });

    return errorResponse;
  }

  // Verify token
  const secret = new TextEncoder().encode(
    process.env.JWT_SECRET || "your-secret-key",
  );

  try {
    const verified = await jwtVerify(token, secret);
    userId = (verified.payload as any).jobId;
    (request as NextRequest & { user?: string }).user = userId;
  } catch (error) {
    // Invalid token
    let errorResponse = NextResponse.json(
      { message: "Unauthorized - Invalid token" },
      { status: 401 },
    );

    const corsHeaders = getCORSHeaders(origin);

    Object.entries(corsHeaders).forEach(([key, value]) => {
      errorResponse.headers.set(key, value);
    });

    return errorResponse;
  }

  // =============== VALIDATE CSRF FOR STATE-CHANGING METHODS ===============
  const isStateChangingMethod = ["POST", "PUT", "DELETE", "PATCH"].includes(
    request.method.toUpperCase(),
  );

  if (isStateChangingMethod) {
    if (!(await validateCSRFMiddleware(request))) {
      const corsHeaders = getCORSHeaders(origin);
      const errorResponse = csrfErrorResponse();
      
      Object.entries(corsHeaders).forEach(([key, value]) => {
        errorResponse.headers.set(key, value);
      });
      
      return errorResponse;
    }
    console.log("CSRF checked: TRUE");
  }
  
  // =============== CONTINUE WITH AUTHENTICATED REQUEST ===============
  const response = NextResponse.next();
  response.headers.set("X-User-Id", userId);
  const corsHeaders = getCORSHeaders(origin);

  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
