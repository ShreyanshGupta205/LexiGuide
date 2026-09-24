import { describe, it, expect } from "vitest";
import { verifyDocumentOwnership, DEMO_USER_ID } from "@/lib/security/auth";

describe("Authentication & Authorization Security Guard", () => {
  it("allows access when document owner matches user session exactly", () => {
    const isOwner = verifyDocumentOwnership("user-123", {
      userId: "user-123",
      email: "user@example.com",
      name: "Alice",
      isDemoUser: false,
    });
    expect(isOwner).toBe(true);
  });

  it("denies access to documents owned by another user (prevents IDOR)", () => {
    const isOwner = verifyDocumentOwnership("user-456", {
      userId: "user-123",
      email: "user@example.com",
      name: "Alice",
      isDemoUser: false,
    });
    expect(isOwner).toBe(false);
  });

  it("permits demo user to access seeded demo documents", () => {
    const isOwner = verifyDocumentOwnership(DEMO_USER_ID, {
      userId: DEMO_USER_ID,
      email: "demo@lexiguide.internal",
      name: "Demo Evaluator",
      isDemoUser: true,
    });
    expect(isOwner).toBe(true);
  });

  it("denies non-demo user access to other private documents", () => {
    const isOwner = verifyDocumentOwnership("private-user-789", {
      userId: DEMO_USER_ID,
      email: "demo@lexiguide.internal",
      name: "Demo Evaluator",
      isDemoUser: true,
    });
    expect(isOwner).toBe(false);
  });
});
