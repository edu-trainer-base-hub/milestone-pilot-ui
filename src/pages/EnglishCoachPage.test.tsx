import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import EnglishCoachPage from "@/pages/EnglishCoachPage";

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en" },
  }),
}));

vi.mock("@/lib/englishCoachStorage", () => ({
  loadSessions: vi.fn(() => []),
  saveSessions: vi.fn(),
  loadActiveSessionId: vi.fn(() => null),
  saveActiveSessionId: vi.fn(),
}));

vi.mock("@/services/englishCoachApi", () => ({
  default: {
    transcribeAudio: vi.fn(),
    createCoachReply: vi.fn(),
    synthesizeSpeech: vi.fn(),
    syncSessions: vi.fn(),
  },
}));

describe("EnglishCoachPage", () => {
  it("renders page title", () => {
    render(
      <MemoryRouter>
        <EnglishCoachPage />
      </MemoryRouter>
    );

    expect(screen.getByText("englishCoach.pageTitle")).toBeInTheDocument();
  });

  it("renders empty chat message when no messages", () => {
    render(
      <MemoryRouter>
        <EnglishCoachPage />
      </MemoryRouter>
    );

    expect(screen.getByText("englishCoach.emptyChat")).toBeInTheDocument();
  });

  it("renders composer placeholder", () => {
    render(
      <MemoryRouter>
        <EnglishCoachPage />
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText("englishCoach.composer.placeholder")).toBeInTheDocument();
  });

  it("renders sessions sidebar title on desktop", () => {
    render(
      <MemoryRouter>
        <EnglishCoachPage />
      </MemoryRouter>
    );

    expect(screen.getByText("englishCoach.sessions.title")).toBeInTheDocument();
  });
});
