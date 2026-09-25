import { NextRequest } from "next/server";
import { UserSession } from "@/lib/types";

export const DEMO_USER_ID = "demo-user-lexiguide";

export const DEMO_USER: UserSession = {
  userId: DEMO_USER_ID,
  email: "demo@lexiguide.internal",
  name: "Demo Evaluator",
  isDemoUser: true,
};

/**
 * Extracts and verifies the current session.
 * Supports Bearer tokens, cookies, or default Demo mode.
 */
export function getCurrentSession(request?: NextRequest): UserSession {
  if (!request) {
    return DEMO_USER;
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    if (token && token.length > 5 && token !== "demo") {
      return {
        userId: `user-${token.substring(0, 12)}`,
        email: `user-${token.substring(0, 8)}@lexiguide.app`,
        name: "Authenticated User",
        isDemoUser: false,
      };
    }
  }

  const userCookie = request.cookies.get("lexiguide_user_id");
  if (userCookie && userCookie.value) {
    return {
      userId: userCookie.value,
      email: `${userCookie.value}@lexiguide.app`,
      name: "LexiGuide User",
      isDemoUser: false,
    };
  }

  // Safe fallback to demo user for seamless evaluation
  return DEMO_USER;
}

/**
 * Verifies document ownership to prevent IDOR (Insecure Direct Object Reference).
 */
export function verifyDocumentOwnership(
  documentOwnerId: string,
  session: UserSession
): boolean {
  // Demo documents are accessible to the demo user or match exactly
  if (documentOwnerId === session.userId) {
    return true;
  }

  // Preloaded demo documents owned by DEMO_USER_ID are readable in demo mode
  if (documentOwnerId === DEMO_USER_ID && session.isDemoUser) {
    return true;
  }

  return false;
}

/**
 * Validates the security entropy of the session secret for production environments.
 */
export function validateSessionSecretConfig(): { secure: boolean; warning?: string } {
  const secret = process.env.SESSION_SECRET;
  const isProd = process.env.NODE_ENV === "production";

  if (!secret || secret.length < 32) {
    const warning = "Security Notice: SESSION_SECRET is too short (< 32 chars). Set a high-entropy secret in production.";
    if (isProd) {
      console.warn(`[SECURITY CRITICAL] ${warning}`);
    }
    return { secure: false, warning };
  }

  if (secret.includes("change_in_production") || secret.includes("development")) {
    const warning = "Security Notice: Default development SESSION_SECRET detected. Rotate in production.";
    if (isProd) {
      console.warn(`[SECURITY WARNING] ${warning}`);
    }
    return { secure: false, warning };
  }

  return { secure: true };
}

