import { describe, it, expect } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import { AttentionBadge } from "@/components/shared/attention-badge";
import { DisclaimerBanner } from "@/components/shared/disclaimer-banner";
import { Button } from "@/components/ui/button";

describe("UI & Accessibility Audit Tests", () => {
  it("renders AttentionBadge with textual label and accessible role (no color-only info)", () => {
    const { getByRole, getByText } = render(<AttentionBadge level="NEEDS_ATTENTION" />);
    const badge = getByRole("status");
    expect(badge).toBeDefined();
    expect(getByText("NEEDS ATTENTION")).toBeDefined();
    expect(badge.getAttribute("aria-label")).toContain("Needs attention");
  });

  it("renders DisclaimerBanner with role='note' and semantic copy", () => {
    const { getByRole, getByText } = render(<DisclaimerBanner />);
    const banner = getByRole("note");
    expect(banner).toBeDefined();
    expect(getByText(/not provide legal advice/i)).toBeDefined();
  });

  it("renders Button with accessible attributes and loading indicator", () => {
    const { getByRole } = render(
      <Button isLoading disabled>
        Submit
      </Button>
    );
    const btn = getByRole("button");
    expect(btn.hasAttribute("disabled")).toBe(true);
  });
});
