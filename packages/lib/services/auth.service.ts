/**
 * Unified Authentication Service
 * Handles authentication across all three apps: Driver, Seller, Business
 */

const TOKEN_KEY = "auth_token";
const USER_KEY = "user";
const REFRESH_TOKEN_KEY = "refresh_token";

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: "DRIVER" | "SELLER" | "BUSINESS";
  createdAt: string;
}

export class AuthService {
  /**
   * Save tokens to localStorage
   */
 static saveTokens(tokens: AuthTokens): void {
  try {
    console.log('[AuthService.saveTokens] Called with:', { 
      accessToken: tokens.accessToken ? `${tokens.accessToken.substring(0, 20)}...` : 'EMPTY/NULL',
      refreshToken: tokens.refreshToken ? 'yes' : 'no',
      expiresIn: tokens.expiresIn
    });

    if (typeof window === "undefined") {
      console.error('[AuthService.saveTokens] window is undefined - aborting save');
      return;
    }

    console.log('[AuthService.saveTokens] window exists, attempting to save...');

    // Save access token
    console.log('[AuthService.saveTokens] Setting TOKEN_KEY (auth_token)...');
    localStorage.setItem(TOKEN_KEY, tokens.accessToken);
    
    // Verify it was saved
    const saved = localStorage.getItem(TOKEN_KEY);
    console.log('[AuthService.saveTokens] Verification - TOKEN_KEY exists:', !!saved);
    console.log('[AuthService.saveTokens] Saved token length:', saved?.length);

    if (tokens.refreshToken) {
      console.log('[AuthService.saveTokens] Setting REFRESH_TOKEN_KEY...');
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    }

    // Save expiration time
    const expiresIn = tokens.expiresIn || 86400;
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
    localStorage.setItem("auth_token_expires", expiresAt);
    console.log('[AuthService.saveTokens] Token expiration set to:', expiresAt);
    
    console.log('[AuthService.saveTokens] SUCCESS - All tokens saved');
  } catch (error) {
    console.error("[AuthService.saveTokens] FAILED with error:", error);
    console.error("[AuthService.saveTokens] Error type:", error instanceof Error ? error.message : 'Unknown');
  }
}

  /**
   * Get access token from localStorage
   */
  static getAccessToken(): string | null {
    try {
      if (typeof window === "undefined") return null;
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith(TOKEN_KEY + "="))
        ?.split("=")[1];
      return localStorage.getItem(TOKEN_KEY) || token || null;
    } catch (error) {
      console.error("[AuthService] Failed to get access token:", error);
      return null;
    }
  }

  /**
   * Get refresh token from localStorage
   */
  static getRefreshToken(): string | null {
    try {
      if (typeof window === "undefined") return null;
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error("[AuthService] Failed to get refresh token:", error);
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(): boolean {
    try {
      if (typeof window === "undefined") return true;

      const expiresAt = localStorage.getItem("auth_token_expires");
      if (!expiresAt) return true;

      return new Date(expiresAt) <= new Date();
    } catch (error) {
      console.error("[AuthService] Failed to check token expiration:", error);
      return true;
    }
  }

  /**
   * Save user info to localStorage
   */
  static saveUser(user: AuthUser): void {
    try {
      if (typeof window === "undefined") return;
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error("[AuthService] Failed to save user:", error);
    }
  }

  /**
   * Get user info from localStorage
   */
  static getUser(): AuthUser | null {
    try {
      if (typeof window === "undefined") return null;

      const userStr = localStorage.getItem(USER_KEY);
      if (!userStr) return null;

      return JSON.parse(userStr);
    } catch (error) {
      console.error("[AuthService] Failed to get user:", error);
      return null;
    }
  }

  /**
   * Clear all auth data from localStorage
   */
  static clearAuth(): void {
    try {
      if (typeof window === "undefined") return;

      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem("auth_token_expires");
    } catch (error) {
      console.error("[AuthService] Failed to clear auth:", error);
    }
  }

  /**
   * Get the redirect URL based on user role
   */
  static getRedirectUrl(role: "DRIVER" | "SELLER" | "BUSINESS"): string {
    const baseUrls = {
      DRIVER:
        process.env.NEXT_PUBLIC_DRIVER_BASE_URL || "http://localhost:3001",
      SELLER:
        process.env.NEXT_PUBLIC_SELLER_BASE_URL || "http://localhost:3002",
      BUSINESS:
        process.env.NEXT_PUBLIC_BUSINESS_BASE_URL || "http://localhost:3003",
    };

    return `${baseUrls[role]}/overview`;
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    const token = this.getAccessToken();
    return !!token && !this.isTokenExpired();
  }

  /**
   * Get authorization header
   */
  static getAuthorizationHeader(): Record<string, string> {
    const token = this.getAccessToken();
    if (!token) return {};

    return {
      Authorization: `Bearer ${token}`,
    };
  }

  /**
   * Get all auth headers (including CSRF if available)
   */
  static getAuthHeaders(csrfToken?: string): Record<string, string> {
    const headers = {
      "Content-Type": "application/json",
      ...this.getAuthorizationHeader(),
    };

    if (csrfToken) {
      headers["x-csrf-token"] = csrfToken;
    }

    return headers;
  }
}

export default AuthService;
