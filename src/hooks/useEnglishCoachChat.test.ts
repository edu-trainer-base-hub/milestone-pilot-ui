import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useEnglishCoachChat } from "@/hooks/useEnglishCoachChat";
import EnglishCoachApi from "@/services/englishCoachApi";
import { MessageRole } from "@/types/englishCoach";
import { ApiError } from "@/services/ApiService";
import { notifier } from "@/services/NotificationService";

/* ───────── mock dependencies ───────── */

vi.mock("@/lib/englishCoachStorage", () => ({
  loadActiveSessionId: vi.fn(() => null),
  saveActiveSessionId: vi.fn(),
  loadAutoPlay: vi.fn(() => false),
  saveAutoPlay: vi.fn(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/services/NotificationService", () => ({
  notifier: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    message: vi.fn(),
  },
}));

vi.mock("@/services/englishCoachApi", () => ({
  default: {
    getAllSessions: vi.fn(async () => []),
    getEnglishCoachConfig: vi.fn(async () => ({ activeSessionsLimit: 100 })),
    getSession: vi.fn(),
    createSession: vi.fn(),
    createMessage: vi.fn(),
    createCoachReply: vi.fn(),
    synthesizeSpeech: vi.fn(),
    transcribeAudio: vi.fn(),
    deleteSession: vi.fn(),
    restoreSession: vi.fn(),
    patchSession: vi.fn(),
    deleteMessage: vi.fn(),
    patchMessage: vi.fn(),
  },
}));

describe("useEnglishCoachChat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(EnglishCoachApi.getEnglishCoachConfig).mockResolvedValue({ activeSessionsLimit: 100 });
  });

  /* ── session management ── */

  describe("session management", () => {
    it("starts with empty sessions", () => {
      const { result } = renderHook(() => useEnglishCoachChat());
      expect(result.current.sessions).toEqual([]);
      expect(result.current.currentSession).toBeNull();
    });

    it("creates a new session via API", async () => {
      const mockSession = {
        uuid: "new-uuid",
        title: "My Session",
        deleted: false,
        inputTokensUsed: 0,
        outputTokensUsed: 0,
        totalTokensUsed: 0,
        llmContextLimit: 16000,
        full: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
      };
      vi.mocked(EnglishCoachApi.createSession).mockResolvedValue(mockSession);

      const { result } = renderHook(() => useEnglishCoachChat());

      await act(async () => {
        await result.current.createNewSession("My Session");
      });

      expect(EnglishCoachApi.createSession).toHaveBeenCalledWith("My Session");
      expect(result.current.sessions).toHaveLength(1);
      expect(result.current.sessions[0].uuid).toBe("new-uuid");
      expect(result.current.currentSession?.uuid).toBe("new-uuid");
    });

    it("switches sessions", async () => {
      const s1 = {
        uuid: "uuid-1",
        title: "S1",
        messages: [],
        createdAt: "",
        updatedAt: "",
        deleted: false,
        totalTokensUsed: 0,
        full: false,
      };
      const s2 = {
        uuid: "uuid-2",
        title: "S2",
        messages: [],
        createdAt: "",
        updatedAt: "",
        deleted: false,
        totalTokensUsed: 0,
        full: false,
      };
      vi.mocked(EnglishCoachApi.getAllSessions).mockResolvedValue([s1, s2] as any);

      const { result } = renderHook(() => useEnglishCoachChat());

      // Wait for initial fetch
      await act(async () => {});

      act(() => {
        result.current.switchSession("uuid-1");
      });

      expect(result.current.currentSession?.uuid).toBe("uuid-1");
    });

    it("deletes a session (calls deleteSession API)", async () => {
      const s1 = {
        uuid: "uuid-1",
        title: "S1",
        messages: [],
        deleted: false,
        totalTokensUsed: 0,
        full: false,
        createdAt: "",
        updatedAt: "",
      };
      vi.mocked(EnglishCoachApi.getAllSessions).mockResolvedValue([s1] as any);
      vi.mocked(EnglishCoachApi.deleteSession).mockResolvedValue({ ...s1, deleted: true } as any);

      const { result } = renderHook(() => useEnglishCoachChat());
      await act(async () => {});

      await act(async () => {
        result.current.deleteSession("uuid-1");
      });

      expect(EnglishCoachApi.deleteSession).toHaveBeenCalledWith("uuid-1");
      expect(result.current.sessions[0].deleted).toBe(true);
    });

    it("clears currentSessionUuid if the active session is deleted", async () => {
      const s1 = {
        uuid: "uuid-active",
        title: "Active",
        messages: [],
        deleted: false,
        totalTokensUsed: 0,
        full: false,
        createdAt: "",
        updatedAt: "",
      };
      vi.mocked(EnglishCoachApi.getAllSessions).mockResolvedValue([s1] as any);
      vi.mocked(EnglishCoachApi.deleteSession).mockResolvedValue({ ...s1, deleted: true } as any);

      const { result } = renderHook(() => useEnglishCoachChat());
      await act(async () => {});
      act(() => {
        result.current.switchSession("uuid-active");
      });
      expect(result.current.currentSession?.uuid).toBe("uuid-active");

      await act(async () => {
        await result.current.deleteSession("uuid-active");
      });

      expect(result.current.currentSession).toBeNull();
    });

    it("clears/defaults currentSessionUuid on mount if it refers to a deleted session", async () => {
      const { loadActiveSessionId } = await import("@/lib/englishCoachStorage");
      vi.mocked(loadActiveSessionId).mockReturnValue("uuid-deleted");

      const sDeleted = {
        uuid: "uuid-deleted",
        title: "Deleted",
        messages: [],
        deleted: true,
        totalTokensUsed: 0,
        full: false,
        createdAt: "",
        updatedAt: "",
      };
      const sActive = {
        uuid: "uuid-active",
        title: "Active",
        messages: [],
        deleted: false,
        totalTokensUsed: 0,
        full: false,
        createdAt: "",
        updatedAt: "",
      };
      vi.mocked(EnglishCoachApi.getAllSessions).mockResolvedValue([sDeleted, sActive] as any);

      const { result } = renderHook(() => useEnglishCoachChat());

      // Wait for initial fetch validation
      await act(async () => {});

      // Should have switched to the first non-deleted one or cleared
      expect(result.current.currentSession?.uuid).toBe("uuid-active");
    });

    it("renames a session", async () => {
      const s1 = {
        uuid: "uuid-1",
        title: "Old Name",
        messages: [],
        deleted: false,
        totalTokensUsed: 0,
        full: false,
        createdAt: "",
        updatedAt: "",
      };
      vi.mocked(EnglishCoachApi.getAllSessions).mockResolvedValue([s1] as any);
      vi.mocked(EnglishCoachApi.patchSession).mockResolvedValue({ ...s1, title: "New Name" } as any);

      const { result } = renderHook(() => useEnglishCoachChat());
      await act(async () => {});

      await act(async () => {
        result.current.renameSession("uuid-1", "New Name");
      });

      expect(result.current.sessions[0].title).toBe("New Name");
      expect(EnglishCoachApi.patchSession).toHaveBeenCalledWith("uuid-1", { title: "New Name" });
    });

    it("calculates isSessionFull correctly", async () => {
      const s1 = {
        uuid: "uuid-1",
        title: "Full",
        messages: [],
        deleted: false,
        totalTokensUsed: 13000,
        llmContextLimit: 16000,
        full: false,
        createdAt: "",
        updatedAt: "",
      };
      vi.mocked(EnglishCoachApi.getAllSessions).mockResolvedValue([s1] as any);

      const { result } = renderHook(() => useEnglishCoachChat());
      await act(async () => {});

      act(() => {
        result.current.switchSession("uuid-1");
      });

      // 13000 > 12800 (80% of 16000)
      expect(result.current.isSessionFull).toBe(true);
    });

    it("enforces session limit", async () => {
      vi.mocked(EnglishCoachApi.getEnglishCoachConfig).mockResolvedValue({ activeSessionsLimit: 1 });
      const s1 = {
        uuid: "uuid-1",
        title: "S1",
        messages: [],
        deleted: false,
        totalTokensUsed: 0,
        llmContextLimit: 16000,
        full: false,
        createdAt: "",
        updatedAt: "",
      };
      vi.mocked(EnglishCoachApi.getAllSessions).mockResolvedValue([s1] as any);

      const { result } = renderHook(() => useEnglishCoachChat());
      await act(async () => {});

      expect(result.current.isSessionsLimitReached).toBe(true);

      // Try to create new session
      await act(async () => {
        await result.current.createNewSession("S2");
      });

      expect(EnglishCoachApi.createSession).not.toHaveBeenCalled();
    });

    it("handles backend session limit error", async () => {
      vi.mocked(EnglishCoachApi.getEnglishCoachConfig).mockResolvedValue({ activeSessionsLimit: 10 });
      vi.mocked(EnglishCoachApi.getAllSessions).mockResolvedValue([]);

      // Mock API error using ApiError class
      const apiError = new ApiError("ENGLISH_COACH_SESSIONS_LIMIT_REACHED", "Limit reached");
      vi.mocked(EnglishCoachApi.createSession).mockRejectedValue(apiError);

      const { result } = renderHook(() => useEnglishCoachChat());
      await act(async () => {});

      await act(async () => {
        await result.current.createNewSession("S1");
      });

      expect(result.current.sessionsLimitError).toBe("ENGLISH_COACH_SESSIONS_LIMIT_REACHED");
      expect(notifier.error).toHaveBeenCalledWith("errors.codes.ENGLISH_COACH_SESSIONS_LIMIT_REACHED");
    });

    it("falls back to unknown error for unspecified error codes", async () => {
      vi.mocked(EnglishCoachApi.getEnglishCoachConfig).mockResolvedValue({ activeSessionsLimit: 10 });
      vi.mocked(EnglishCoachApi.getAllSessions).mockResolvedValue([]);

      // Mock API error without errorCode
      vi.mocked(EnglishCoachApi.createSession).mockRejectedValue(new Error("Generic error"));

      const { result } = renderHook(() => useEnglishCoachChat());
      await act(async () => {});

      await act(async () => {
        await result.current.createNewSession("S1");
      });

      expect(notifier.error).toHaveBeenCalledWith("errors.codes.UNKNOWN");
    });
  });

  /* ── text messaging ── */

  describe("text messaging", () => {
    it("sends a text message and gets coach reply", async () => {
      const sessionUuid = "sess-123";
      const userMsgUuid = "user-msg-uuid";
      const assistantMsgUuid = "asst-msg-uuid";

      vi.mocked(EnglishCoachApi.createSession).mockResolvedValue({
        uuid: sessionUuid,
        title: "Hello coach!",
        deleted: false,
        totalTokensUsed: 0,
        full: false,
        messages: [],
        createdAt: "",
        updatedAt: "",
      } as any);
      vi.mocked(EnglishCoachApi.createMessage).mockResolvedValue({
        uuid: userMsgUuid,
        role: MessageRole.USER,
        text: "Hello coach!",
        createdAt: "",
      });
      vi.mocked(EnglishCoachApi.createCoachReply).mockResolvedValue({
        message: {
          uuid: assistantMsgUuid,
          role: MessageRole.ASSISTANT,
          text: "Great job!",
          createdAt: "",
        },
      });
      vi.mocked(EnglishCoachApi.getSession).mockResolvedValue({
        uuid: sessionUuid,
        title: "...",
        deleted: false,
        totalTokensUsed: 0,
        full: false,
        messages: [
          { uuid: userMsgUuid, role: MessageRole.USER, text: "Hello coach!", createdAt: "" },
          { uuid: assistantMsgUuid, role: MessageRole.ASSISTANT, text: "Great job!", createdAt: "" },
        ],
        createdAt: "",
        updatedAt: "",
      } as any);

      const { result } = renderHook(() => useEnglishCoachChat());

      await act(async () => {
        await result.current.sendTextMessage("Hello coach!");
      });

      // Expect API interactions
      expect(EnglishCoachApi.createSession).toHaveBeenCalled();
      expect(EnglishCoachApi.createMessage).toHaveBeenCalledWith(sessionUuid, {
        role: MessageRole.USER,
        text: "Hello coach!",
      });
      expect(EnglishCoachApi.createCoachReply).toHaveBeenCalled();

      const messages = result.current.sessions[0].messages;
      // Note: in optimistic UI, we might have multiple messages if healSessionData hasn't finished or if we check during act
      // But let's verify the final state or presence of key messages
      expect(messages.some((m) => m.text === "Hello coach!" && m.role === MessageRole.USER)).toBe(true);
      expect(messages.some((m) => m.text === "Great job!" && m.role === MessageRole.ASSISTANT)).toBe(true);
    });

    it("creates a new session if sending a message in a deleted session", async () => {
      const deletedUuid = "sess-deleted";
      const newUuid = "sess-new";

      const sDeleted = {
        uuid: deletedUuid,
        title: "Deleted",
        messages: [],
        deleted: true,
        totalTokensUsed: 0,
        full: false,
        createdAt: "",
        updatedAt: "",
      };

      vi.mocked(EnglishCoachApi.getAllSessions).mockResolvedValue([sDeleted] as any);
      vi.mocked(EnglishCoachApi.createSession).mockResolvedValue({
        uuid: newUuid,
        title: "New",
        deleted: false,
        totalTokensUsed: 0,
        full: false,
        messages: [],
        createdAt: "",
        updatedAt: "",
      } as any);
      vi.mocked(EnglishCoachApi.createMessage).mockResolvedValue({
        uuid: "m1",
        role: MessageRole.USER,
        text: "Hi",
        createdAt: "",
      });
      vi.mocked(EnglishCoachApi.createCoachReply).mockResolvedValue({
        message: { uuid: "m2", role: MessageRole.ASSISTANT, text: "Ho", createdAt: "" },
      });
      vi.mocked(EnglishCoachApi.getSession).mockResolvedValue({
        uuid: newUuid,
        messages: [],
        deleted: false,
      } as any);

      const { result } = renderHook(() => useEnglishCoachChat());
      await act(async () => {});

      // Force state to point to deleted session (even if hook tries to clear it)
      // Actually, onSelect would normally block it, but let's say it was current

      await act(async () => {
        await result.current.sendTextMessage("Hi");
      });

      expect(EnglishCoachApi.createSession).toHaveBeenCalled();
      expect(result.current.currentSession?.uuid).toBe(newUuid);
    });
  });

  /* ── voice messaging ── */

  describe("voice messaging", () => {
    it("transcribes audio and sends as voice message", async () => {
      const sessionUuid = "sess-voice";
      vi.mocked(EnglishCoachApi.createSession).mockResolvedValue({
        uuid: sessionUuid,
        title: "Voice",
        deleted: false,
        totalTokensUsed: 0,
        full: false,
        messages: [],
        createdAt: "",
        updatedAt: "",
      } as any);
      vi.mocked(EnglishCoachApi.transcribeAudio).mockResolvedValue({
        transcript: "Hello from voice",
      });
      vi.mocked(EnglishCoachApi.createMessage).mockResolvedValue({
        uuid: "msg-123",
        role: MessageRole.USER,
        text: "Hello from voice",
        createdAt: "",
      });
      vi.mocked(EnglishCoachApi.createCoachReply).mockResolvedValue({
        message: { uuid: "asst-123", role: MessageRole.ASSISTANT, text: "Reply", createdAt: "" },
      });
      vi.mocked(EnglishCoachApi.getSession).mockResolvedValue({
        uuid: sessionUuid,
        title: "Voice",
        deleted: false,
        totalTokensUsed: 0,
        full: false,
        messages: [
          { uuid: "msg-123", role: MessageRole.USER, text: "Hello from voice", createdAt: "" },
          { uuid: "asst-123", role: MessageRole.ASSISTANT, text: "Reply", createdAt: "" },
        ],
        createdAt: "",
        updatedAt: "",
      } as any);

      const { result } = renderHook(() => useEnglishCoachChat());
      const blob = new Blob(["fake-audio"], { type: "audio/webm" });

      await act(async () => {
        await result.current.sendVoiceMessage(blob);
      });

      expect(EnglishCoachApi.transcribeAudio).toHaveBeenCalled();
      const messages = result.current.sessions[0].messages;
      expect(messages.some((m) => m.text === "Hello from voice")).toBe(true);
    });
  });
});
