import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY;

if (!SHOPIFY_API_KEY) {
  console.log("SHOPIFY_API_KEY environment variable is required");
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key",
);

/**
 * POST /api/integrations/shopify/connect
 * Initiates OAuth flow with Shopify
 * Request body: { shopUrl: string }
 * Returns: { authUrl: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shopUrl, sellerId } = body;

    if (!shopUrl || typeof shopUrl !== "string") {
      console.log("no url needed");
      return NextResponse.json(
        { message: "Shop URL is required" },
        { status: 400 },
      );
    }

    // Normalize shop URL
    const normalizedShop = shopUrl.includes(".myshopify.com")
      ? shopUrl.split(".myshopify.com")[0] + ".myshopify.com"
      : shopUrl.endsWith(".myshopify.com")
        ? shopUrl
        : `${shopUrl.replace(/https?:\/\//, "")}.myshopify.com`;

    // Validate shop URL format
    if (!normalizedShop.match(/^[a-zA-Z0-9-]+\.myshopify\.com$/)) {
      return NextResponse.json(
        { message: "Invalid Shopify store URL" },
        { status: 400 },
      );
    }

    // Generate OAuth state for CSRF protection
    const state = await new SignJWT({ sellerId }) // we've signed user id to send as a state and then get at callback to identify which user initiated the flow
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("10m") // important
      .sign(JWT_SECRET); 

    // Define scopes needed for importing orders and syncing tracking
    const scopes = [
      "write_orders", // To update order metafields with tracking
      "read_orders", // To read/list orders for import
    ].join(",");

    // Construct redirect URI
    const redirectUri = `${request.nextUrl.origin}/api/auth/oauth/shopify/callback`;

    // Construct authorization URL
    const authUrl = new URL(`https://${normalizedShop}/admin/oauth/authorize`);
    authUrl.searchParams.append("client_id", SHOPIFY_API_KEY!);
    authUrl.searchParams.append("scope", scopes);
    authUrl.searchParams.append("redirect_uri", redirectUri);
    authUrl.searchParams.append("state", state);

    // Create response with auth URL
    const response = NextResponse.json({
      authUrl: authUrl.toString(),
      shop: normalizedShop,
    });

    // Store state in secure httpOnly cookie (expires in 10 minutes)
    response.cookies.set("shopify_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 600, // 10 minutes
    });

    // Store shop URL in cookie for reference
    response.cookies.set("shopify_oauth_shop", normalizedShop, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 600,
    });

    return response;
  } catch (error) {
    console.error("[OAuth Connect] Error:", error);
    return NextResponse.json(
      { message: "Failed to initiate OAuth flow" },
      { status: 500 },
    );
  }
}
