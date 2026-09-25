import { describe, it, expect } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import { RedlineViewer } from "../components/document/redline-viewer";

describe("RedlineViewer Component", () => {
  it("renders both original draft provision and proposed balanced revision", () => {
    const original = "Company may terminate this agreement immediately at any time without notice or cure.";
    const revised = "Either party may terminate upon thirty (30) days prior written notice with right to cure.";

    const { getByText } = render(
      <RedlineViewer originalText={original} revisedText={revised} />
    );

    expect(getByText(/Original Draft Provision/i)).toBeDefined();
    expect(getByText(original)).toBeDefined();
    expect(getByText(/Proposed Balanced Revision/i)).toBeDefined();
    expect(getByText(revised)).toBeDefined();
  });

  it("renders side-by-side indicators for additions and deletions", () => {
    const { getByText } = render(
      <RedlineViewer
        originalText="Old unilateral clause"
        revisedText="New bilateral mutual clause"
      />
    );

    expect(getByText(/Original Text/i)).toBeDefined();
    expect(getByText(/Counter-Proposal \/ Revision/i)).toBeDefined();
  });
});
