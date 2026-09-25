import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, fireEvent } from "@testing-library/react";
import { ReadabilityMeter } from "@/components/document/readability-meter";
import { DeadlinesTimeline } from "@/components/document/deadlines-timeline";
import { JargonBusterModal } from "@/components/document/jargon-buster";
import { NegotiationEmailModal } from "@/components/document/negotiation-email-modal";

describe("New Intelligence & Assistance Features", () => {
  beforeEach(() => {
    // Mock URL methods for jsdom environment if not present
    if (!window.URL.createObjectURL) {
      window.URL.createObjectURL = vi.fn(() => "blob:mock-url");
    }
    if (!window.URL.revokeObjectURL) {
      window.URL.revokeObjectURL = vi.fn();
    }
  });

  describe("ReadabilityMeter Component", () => {
    it("renders default fallback metrics cleanly when raw text is minimal", () => {
      const { getByText } = render(<ReadabilityMeter rawText="" />);
      expect(getByText("Contract Readability & Complexity Score")).toBeDefined();
      expect(getByText(/Flesch-Kincaid/i)).toBeDefined();
      expect(getByText("Avg Words/Sentence")).toBeDefined();
    });

    it("calculates reading time and sentence metrics for substantive text", () => {
      const sampleContract =
        "The Executive shall perform all duties faithfully and to the best of their ability. Notwithstanding the foregoing, the Company reserves the unconditional right to terminate this agreement without cause upon thirty days prior written notice. All proprietary materials and intellectual property created during the employment term remain exclusive property of the Company in perpetuity.";
      const { getByText } = render(<ReadabilityMeter rawText={sampleContract} />);
      expect(getByText("Contract Readability & Complexity Score")).toBeDefined();
      expect(getByText(/min/i)).toBeDefined();
    });
  });

  describe("DeadlinesTimeline Component", () => {
    it("renders milestone timeline with effective date and duration", () => {
      const { getByText } = render(
        <DeadlinesTimeline
          documentName="Master Services Agreement"
          effectiveDate="October 1, 2026"
          duration="24 Months"
        />
      );
      expect(getByText("Critical Deadlines & Obligations Timeline")).toBeDefined();
      expect(getByText("Export to Calendar (.ics)")).toBeDefined();
      expect(getByText("Contract Execution & Inception")).toBeDefined();
    });

    it("triggers .ics export without crashing", () => {
      const { getByText } = render(
        <DeadlinesTimeline
          documentName="Master Services Agreement"
          effectiveDate="October 1, 2026"
          duration="24 Months"
        />
      );
      const downloadBtn = getByText("Export to Calendar (.ics)");
      expect(() => fireEvent.click(downloadBtn)).not.toThrow();
    });
  });

  describe("JargonBusterModal Component", () => {
    it("does not render when isOpen is false", () => {
      const { queryByText } = render(
        <JargonBusterModal isOpen={false} onClose={() => {}} />
      );
      expect(queryByText("Interactive Legal Jargon Buster")).toBeNull();
    });

    it("renders terms and allows filtering when isOpen is true", () => {
      const { getByText, getByPlaceholderText } = render(
        <JargonBusterModal isOpen={true} onClose={() => {}} />
      );
      expect(getByText("Interactive Legal Jargon Buster")).toBeDefined();
      expect(getByText("Indemnification")).toBeDefined();

      const searchInput = getByPlaceholderText(/Search legal term/i);
      fireEvent.change(searchInput, { target: { value: "Severability" } });
      expect(getByText("Severability")).toBeDefined();
    });

    it("calls onClose when Close button is clicked", () => {
      const onCloseMock = vi.fn();
      const { getByLabelText } = render(
        <JargonBusterModal isOpen={true} onClose={onCloseMock} />
      );
      const closeBtn = getByLabelText("Close Jargon Buster");
      fireEvent.click(closeBtn);
      expect(onCloseMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("NegotiationEmailModal Component", () => {
    const mockProposals = [
      {
        clauseTitle: "Indemnification",
        suggestedWording: "Both parties shall reciprocally indemnify each other.",
        talkingPoints: ["Market standard reciprocity", "Caps excessive exposure"],
      },
    ];

    it("does not render when isOpen is false", () => {
      const { queryByText } = render(
        <NegotiationEmailModal
          isOpen={false}
          onClose={() => {}}
          documentName="SaaS Agreement"
          counterProposals={mockProposals}
        />
      );
      expect(queryByText("AI Negotiation Email Generator")).toBeNull();
    });

    it("renders pre-populated email with counter-proposals", () => {
      const { getByText } = render(
        <NegotiationEmailModal
          isOpen={true}
          onClose={() => {}}
          documentName="SaaS Agreement"
          counterProposals={mockProposals}
        />
      );
      expect(getByText("AI Negotiation Email Generator")).toBeDefined();
      expect(getByText(/Regarding Indemnification/i)).toBeDefined();
      expect(getByText("Copy to Clipboard")).toBeDefined();
      expect(getByText("Open in Email App")).toBeDefined();
    });
  });
});
