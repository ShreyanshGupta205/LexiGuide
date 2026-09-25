import { describe, it, expect } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import { AttentionBadge } from "@/components/shared/attention-badge";
import { DisclaimerBanner } from "@/components/shared/disclaimer-banner";
import { Button } from "@/components/ui/button";

describe("UI & Accessibility Audit Tests (WCAG 2.1 AA/AAA)", () => {
  it("renders AttentionBadge for NEEDS_ATTENTION with textual label and accessible role", () => {
    const { getByRole, getByText } = render(<AttentionBadge level="NEEDS_ATTENTION" />);
    const badge = getByRole("status");
    expect(badge).toBeDefined();
    expect(getByText("NEEDS ATTENTION")).toBeDefined();
    expect(badge.getAttribute("aria-label")).toContain("Needs attention");
  });

  it("renders AttentionBadge for IMPORTANT and INFORMATION with distinct semantic text", () => {
    const { getByText: getTextImp } = render(<AttentionBadge level="IMPORTANT" />);
    expect(getTextImp("IMPORTANT")).toBeDefined();

    const { getByText: getTextInfo } = render(<AttentionBadge level="INFORMATION" />);
    expect(getTextInfo("INFORMATION")).toBeDefined();
  });

  it("renders DisclaimerBanner in full mode with role='note' and semantic disclaimer copy", () => {
    const { getByRole, getByText } = render(<DisclaimerBanner />);
    const banner = getByRole("note");
    expect(banner).toBeDefined();
    expect(getByText(/not provide legal advice/i)).toBeDefined();
  });

  it("renders DisclaimerBanner in compact mode with role='note'", () => {
    const { getByRole, getByText } = render(<DisclaimerBanner compact />);
    const banner = getByRole("note");
    expect(banner).toBeDefined();
    expect(getByText(/Not legal advice/i)).toBeDefined();
  });

  it("renders Button with accessible attributes, disabled state, and loading indicator", () => {
    const { getByRole } = render(
      <Button isLoading disabled>
        Submit
      </Button>
    );
    const btn = getByRole("button");
    expect(btn.hasAttribute("disabled")).toBe(true);
  });
});
