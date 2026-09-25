import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, fireEvent } from "@testing-library/react";
import { KeyboardHelpDialog } from "../components/document/keyboard-help-dialog";

describe("Keyboard Navigation & Help Dialog Accessibility", () => {
  it("does not render when isOpen is false", () => {
    const { queryByRole } = render(
      <KeyboardHelpDialog isOpen={false} onClose={() => {}} />
    );
    expect(queryByRole("dialog")).toBeNull();
  });

  it("renders with role='dialog', aria-modal='true', and accessible title when open", () => {
    const { getByRole, getByText } = render(
      <KeyboardHelpDialog isOpen={true} onClose={() => {}} />
    );

    const dialog = getByRole("dialog");
    expect(dialog).toBeDefined();
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.getAttribute("aria-labelledby")).toBe("keyboard-shortcuts-title");
    expect(getByText("Keyboard Navigation Shortcuts")).toBeDefined();
  });

  it("renders all keybindings including search, tabs, section jump and help", () => {
    const { getByText } = render(
      <KeyboardHelpDialog isOpen={true} onClose={() => {}} />
    );

    expect(getByText("Focus in-document search box")).toBeDefined();
    expect(getByText("Switch analysis tab (Clauses, Findings, Summary, Q&A, Fairness, Options)")).toBeDefined();
    expect(getByText("Scroll down to next document section")).toBeDefined();
    expect(getByText("Scroll up to previous document section")).toBeDefined();
    expect(getByText("Toggle this keyboard shortcuts dialog")).toBeDefined();
  });

  it("triggers onClose when clicking close button or backdrop", () => {
    const onCloseMock = vi.fn();
    const { getByRole, getByLabelText } = render(
      <KeyboardHelpDialog isOpen={true} onClose={onCloseMock} />
    );

    const closeBtn = getByLabelText("Close keyboard shortcuts dialog");
    fireEvent.click(closeBtn);
    expect(onCloseMock).toHaveBeenCalledTimes(1);

    const backdrop = getByRole("dialog");
    fireEvent.click(backdrop);
    expect(onCloseMock).toHaveBeenCalledTimes(2);
  });
});
