import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ParsePanel } from "./ParsePanel";
import type { EmailParseResultResponse } from "../model/types";
import { EmailParseSource, EmailParseStatus } from "../model/types";

const result = (providerMessageId: string): EmailParseResultResponse => ({
  uuid: "r1",
  providerMessageId,
  subject: "Invoice #4711",
  from: "alice@example.com",
  status: EmailParseStatus.COMPLETED,
  source: EmailParseSource.MANUAL,
  purpose: null,
  systemPrompt: null,
  expectedJsonSchema: null,
  aiProvider: "OPENAI",
  aiModel: "gpt-x",
  resultJson: { success: true },
  resultText: null,
  errorMessage: null,
  attachmentsProcessed: 0,
  attachmentsSkipped: 0,
  requestedByUserUuid: null,
  createdAt: "2026-07-01T00:00:00Z",
  completedAt: null,
});

const baseProps = {
  canParse: true,
  parsing: false,
  hasSelectedEmail: true,
  selectedMessageId: "m1" as string | null,
  aiModels: [] as string[],
  defaultAiModel: null as string | null,
  result: null as EmailParseResultResponse | null,
  onParse: vi.fn(),
};

describe("ParsePanel", () => {
  it("hides the model picker when no override models are configured", () => {
    render(<ParsePanel {...baseProps} />);

    expect(screen.queryByText("AI model")).not.toBeInTheDocument();
  });

  it("shows the model picker with the named default option", () => {
    render(<ParsePanel {...baseProps} aiModels={["gpt-x", "gpt-vision"]} defaultAiModel="gpt-default" />);

    expect(screen.getByText("AI model")).toBeInTheDocument();
    expect(screen.getByText("Default (gpt-default)")).toBeInTheDocument();
  });

  it("omits aiModel from the request when the default is selected", () => {
    const onParse = vi.fn();
    render(<ParsePanel {...baseProps} aiModels={["gpt-x"]} onParse={onParse} />);

    fireEvent.click(screen.getByRole("button", { name: /Parse with AI/ }));

    expect(onParse).toHaveBeenCalledWith(expect.objectContaining({ aiModel: undefined }));
  });

  it("sends a trimmed system prompt in the parse request", () => {
    const onParse = vi.fn();
    render(<ParsePanel {...baseProps} onParse={onParse} />);

    fireEvent.change(screen.getByLabelText("System prompt (optional)"), {
      target: { value: "  Extract the bid  " },
    });
    fireEvent.click(screen.getByRole("button", { name: /Parse with AI/ }));

    expect(onParse).toHaveBeenCalledWith(expect.objectContaining({ systemPrompt: "Extract the bid" }));
  });

  it("formats a schema and sends only the schema, not the local example", () => {
    const onParse = vi.fn();
    render(<ParsePanel {...baseProps} onParse={onParse} />);

    fireEvent.change(screen.getByLabelText("Expected JSON schema (optional)"), {
      target: { value: '{"type":"object","properties":{"id":{"type":"string"}}}' },
    });
    fireEvent.change(screen.getByLabelText("Expected JSON example (local only)"), {
      target: { value: '{"id":"invoice-1"}' },
    });
    fireEvent.click(screen.getByRole("button", { name: /Parse with AI/ }));

    expect(onParse).toHaveBeenCalledWith(
      expect.objectContaining({ expectedJsonSchema: { type: "object", properties: { id: { type: "string" } } } })
    );
    expect(onParse.mock.calls[0][0]).not.toHaveProperty("expectedJsonExample");
  });

  it("shows an inline error instead of submitting invalid JSON", () => {
    const onParse = vi.fn();
    render(<ParsePanel {...baseProps} onParse={onParse} />);

    fireEvent.change(screen.getByLabelText("Expected JSON schema (optional)"), { target: { value: "{" } });
    fireEvent.click(screen.getByRole("button", { name: /Parse with AI/ }));

    expect(screen.getByText(/Expected property name/, { selector: "p" })).toBeInTheDocument();
    expect(onParse).not.toHaveBeenCalled();
  });

  it("replaces the previous result with a progress block while parsing", () => {
    render(<ParsePanel {...baseProps} parsing result={result("m1")} />);

    expect(screen.getAllByText("Parsing…").length).toBeGreaterThan(0);
    expect(screen.queryByText("Completed")).not.toBeInTheDocument();
  });

  it("shows a hint when the displayed result belongs to a different email", () => {
    render(<ParsePanel {...baseProps} selectedMessageId="other-message" result={result("m1")} />);

    expect(screen.getByText(/This result belongs to a different email/)).toBeInTheDocument();
  });

  it("shows no hint when the result matches the selected email", () => {
    render(<ParsePanel {...baseProps} selectedMessageId="m1" result={result("m1")} />);

    expect(screen.queryByText(/This result belongs to a different email/)).not.toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });
});
