import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import EmailParsingLabPage from "./EmailParsingLabPage";
import type { EmailMessageResponse, EmailParseResultResponse, SearchEmailsRequest } from "../model/types";
import { EmailParseSource, EmailParseStatus } from "../model/types";
import { getAiModels, getParseResults, searchEmails } from "../api/emailParsingLab";
import { getEmailConnectors } from "@/features/tenant-email-connectors/api/emailConnectors";

vi.mock("../api/emailParsingLab");
vi.mock("@/features/tenant-email-connectors/api/emailConnectors");
vi.mock("@/contexts/AuthContext", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/contexts/AuthContext")>()),
  useAuth: () => ({
    principal: {
      activeTenantUuid: "tenant-1",
      authorities: ["TENANT_INTEGRATIONS_READ", "TENANT_INTEGRATIONS_MANAGE"],
    },
  }),
}));

const email = (id: string, subject: string): EmailMessageResponse => ({
  providerMessageId: id,
  threadId: "t1",
  historyId: "h1",
  internalDate: 1700000000000,
  labelIds: null,
  from: "alice@example.com",
  to: null,
  cc: null,
  subject,
  dateHeader: null,
  snippet: "snippet",
  contentType: null,
  content: "body",
  contentTruncated: false,
  attachments: null,
});

const historyResult: EmailParseResultResponse = {
  uuid: "rA",
  providerMessageId: "mA",
  subject: "History A",
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
  attachmentsProcessed: null,
  attachmentsSkipped: null,
  requestedByUserUuid: null,
  createdAt: "2026-07-01T00:00:00Z",
  completedAt: null,
};

const renderPage = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <EmailParsingLabPage />
    </QueryClientProvider>
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getEmailConnectors).mockResolvedValue([
    {
      uuid: "c1",
      provider: "GMAIL",
      displayName: "Main",
      emailAddress: "main@example.com",
      scopeMode: "READONLY",
      status: "ACTIVE",
      default: true,
      lastConnectedAt: null,
      lastSuccessAt: null,
      lastErrorAt: null,
      lastErrorMessage: null,
    } as never,
  ]);
  vi.mocked(getParseResults).mockResolvedValue({
    results: [historyResult],
    page: 0,
    size: 10,
    totalElements: 1,
  });
  vi.mocked(getAiModels).mockResolvedValue({
    models: [],
    defaultModel: null,
    maxSystemPromptChars: 20000,
    maxSchemaChars: 20000,
  });
  vi.mocked(searchEmails).mockImplementation((_uuid: string, request: SearchEmailsRequest) => {
    if (request.pageToken === "tok2") {
      return Promise.resolve({
        messages: [email("mC", "Email C")],
        nextPageToken: null,
        resultSizeEstimate: 40,
      });
    }
    return Promise.resolve({
      messages: [email("mA", "Email A"), email("mB", "Email B")],
      nextPageToken: "tok2",
      resultSizeEstimate: 40,
    });
  });
});

const runSearch = async () => {
  fireEvent.click(await screen.findByRole("button", { name: /Search/ }));
  await screen.findByText("Email A");
};

describe("EmailParsingLabPage", () => {
  it("walks email pages with the token stack and shows page info", async () => {
    renderPage();
    await runSearch();

    expect(screen.getByText("Page 1")).toBeInTheDocument();
    expect(screen.getByText(/2 emails loaded/)).toBeInTheDocument();
    expect(screen.getByText(/~40 total \(estimate\)/)).toBeInTheDocument();

    fireEvent.click(screen.getAllByLabelText("Next page")[0]);
    await screen.findByText("Email C");
    expect(screen.getByText("Page 2")).toBeInTheDocument();
    expect(vi.mocked(searchEmails).mock.lastCall?.[1]).toMatchObject({ pageToken: "tok2" });

    fireEvent.click(screen.getAllByLabelText("Previous page")[0]);
    await screen.findByText("Email A");
    expect(screen.getByText("Page 1")).toBeInTheDocument();
    expect(vi.mocked(searchEmails).mock.lastCall?.[1].pageToken).toBeUndefined();
  });

  it("clears the displayed result when a different email is selected, keeps it for the same one", async () => {
    renderPage();
    await runSearch();

    // Load a parse result (belongs to email mA) from the history table.
    fireEvent.click(await screen.findByText("History A"));
    expect(await screen.findByText(/"success": true/)).toBeInTheDocument();

    // Selecting the matching email keeps the result and shows no hint.
    fireEvent.click(screen.getByText("Email A"));
    expect(screen.getByText(/"success": true/)).toBeInTheDocument();
    expect(screen.queryByText(/This result belongs to a different email/)).not.toBeInTheDocument();

    // Selecting another email clears the stale result.
    fireEvent.click(screen.getAllByText("Email B")[0]);
    await waitFor(() => expect(screen.queryByText(/"success": true/)).not.toBeInTheDocument());

    // Re-loading the result for mA while mB is selected shows the different-email hint.
    fireEvent.click(screen.getByText("History A"));
    expect(await screen.findByText(/This result belongs to a different email/)).toBeInTheDocument();
  });

  it("clears selection and displayed result on a new search", async () => {
    renderPage();
    await runSearch();

    fireEvent.click(await screen.findByText("History A"));
    expect(await screen.findByText(/"success": true/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Search/ }));
    await waitFor(() => expect(screen.queryByText(/"success": true/)).not.toBeInTheDocument());
  });
});
