import { useCallback, useEffect, useRef, useState } from "react";
import type { CoachMessage, CoachSession } from "@/types/englishCoach";
import { InputMode, MessageRole } from "@/types/englishCoach";
import { loadActiveSessionId, saveActiveSessionId, loadAutoPlay, saveAutoPlay } from "@/lib/englishCoachStorage";
import EnglishCoachApi from "@/services/englishCoachApi";
import { extractErrorCode } from "@/services/ApiService";
import { useTranslation } from "react-i18next";
import { notifier } from "@/services/NotificationService";

/* ───────── helpers ───────── */

type ChatStatus = "idle" | "transcribing" | "thinking" | "speaking";

interface UseEnglishCoachChatReturn {
  sessions: CoachSession[];
  currentSession: CoachSession | null;
  chatStatus: ChatStatus;
  isAutoPlayEnabled: boolean;

  /* session actions */
  createNewSession: (title?: string) => Promise<void>;
  switchSession: (sessionUuid: string) => void;
  deleteSession: (sessionUuid: string) => void;
  restoreSession: (sessionUuid: string) => void;
  renameSession: (sessionUuid: string, newTitle: string) => void;

  /* session state */
  isSessionFull: boolean;
  isSessionsLimitReached: boolean;
  sessionsLimit: number;
  sessionsLimitError: string | null;
  sessionTokenUsage: {
    used: number;
    limit: number;
    percentage: number;
  } | null;

  /* settings */
  toggleAutoPlay: () => void;

  /* messaging */
  sendTextMessage: (text: string) => Promise<void>;
  sendVoiceMessage: (audioBlob: Blob) => Promise<void>;
  retryLastAssistant: () => Promise<void>;

  /* TTS */
  retrySpeech: (messageUuid: string) => Promise<void>;
}

export function useEnglishCoachChat(): UseEnglishCoachChatReturn {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState<CoachSession[]>([]);
  const [currentSessionUuid, setCurrentSessionUuid] = useState<string | null>(() => loadActiveSessionId());
  const [chatStatus, setChatStatus] = useState<ChatStatus>("idle");
  const [isAutoPlayEnabled, setIsAutoPlayEnabled] = useState<boolean>(() => loadAutoPlay());

  const [sessionsLimit, setSessionsLimit] = useState<number>(Infinity);
  const [sessionsLimitError, setSessionsLimitError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const sendingRef = useRef(false);

  /* ── derived ── */

  const currentSession = sessions.find((s) => s.uuid === currentSessionUuid) ?? null;
  const effectiveLimit = currentSession ? Math.floor((currentSession.llmContextLimit || 16000) * 0.8) : 16000;

  const isSessionFull = currentSession
    ? currentSession.full || currentSession.totalTokensUsed >= effectiveLimit
    : false;
  const sessionTokenUsage = currentSession
    ? {
        used: currentSession.totalTokensUsed,
        limit: effectiveLimit,
        percentage: Math.min(100, Math.max(0, Math.round((currentSession.totalTokensUsed / effectiveLimit) * 100))),
      }
    : null;

  const activeSessionsCount = sessions.filter((s) => !s.deleted).length;
  const isSessionsLimitReached = activeSessionsCount >= sessionsLimit;

  /* ── helpers ── */

  const handleError = useCallback(
    (err: unknown) => {
      const errorCode = extractErrorCode(err);
      if (errorCode === "ENGLISH_COACH_SESSIONS_LIMIT_REACHED") {
        setSessionsLimitError("ENGLISH_COACH_SESSIONS_LIMIT_REACHED");
      }
      const msgKey = errorCode ? `errors.codes.${errorCode}` : "errors.codes.UNKNOWN";
      notifier.error(t(msgKey, { defaultValue: t("errors.codes.UNKNOWN") }));
    },
    [t]
  );

  /* ── persist ── */

  useEffect(() => {
    saveActiveSessionId(currentSessionUuid);
  }, [currentSessionUuid]);

  useEffect(() => {
    saveAutoPlay(isAutoPlayEnabled);
  }, [isAutoPlayEnabled]);

  /* ── fetch sessions and config from backend on mount ── */

  useEffect(() => {
    let cancelled = false;

    // Fetch config
    EnglishCoachApi.getEnglishCoachConfig()
      .then((config) => {
        if (cancelled) return;
        setSessionsLimit(config.activeSessionsLimit);
      })
      .catch((err) => {
        console.warn("[useEnglishCoachChat] Failed to fetch config", err);
      });

    EnglishCoachApi.getAllSessions()
      .then((backendSessions) => {
        if (cancelled) return;
        setSessions((prev) => {
          const existingIds = new Set(prev.map((s) => s.uuid));
          const toAdd = backendSessions.filter((s) => !existingIds.has(s.uuid));
          return [...prev, ...toAdd];
        });

        // Validate currentSessionUuid: if it's not found in backend sessions, clear it
        // Or default it to the first session found if we want to auto-select
        setCurrentSessionUuid((prev) => {
          if (!prev) return null;
          const session = backendSessions.find((s) => s.uuid === prev);

          // If session exists but is deleted, or doesn't exist at all in a non-empty list
          if (session?.deleted) return backendSessions.find((s) => !s.deleted)?.uuid ?? null;
          if (!session && backendSessions.length > 0) return backendSessions[0].uuid;

          return prev;
        });
      })
      .catch((err) => {
        console.warn("[useEnglishCoachChat] Failed to fetch sessions", err);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /* ── internal: append message ── */

  const appendMessage = useCallback((sessionUuid: string, message: CoachMessage) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.uuid === sessionUuid
          ? {
              ...s,
              messages: [...s.messages, message],
              updatedAt: new Date().toISOString(),
            }
          : s
      )
    );
  }, []);

  const updateMessage = useCallback((sessionUuid: string, messageUuid: string, patch: Partial<CoachMessage>) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.uuid === sessionUuid
          ? {
              ...s,
              messages: s.messages.map((m) => (m.uuid === messageUuid ? { ...m, ...patch } : m)),
              updatedAt: new Date().toISOString(),
            }
          : s
      )
    );
  }, []);

  /* ── session actions ── */

  const createNewSession = useCallback(
    async (title?: string) => {
      if (isSessionsLimitReached) return;
      try {
        setChatStatus("thinking");
        setSessionsLimitError(null);
        const newSession = await EnglishCoachApi.createSession(title);
        setSessions((prev) => [newSession, ...prev]);
        setCurrentSessionUuid(newSession.uuid);
      } catch (err) {
        console.error("Failed to create session", err);
        handleError(err);
      } finally {
        setChatStatus("idle");
      }
    },
    [isSessionsLimitReached, handleError]
  );

  const switchSession = useCallback(
    (sessionUuid: string) => {
      const session = sessions.find((s) => s.uuid === sessionUuid);
      if (session?.deleted) return;

      // Abort in-flight when switching
      abortRef.current?.abort();
      setChatStatus("idle");
      setSessionsLimitError(null);
      setCurrentSessionUuid(sessionUuid);
    },
    [sessions]
  );

  const deleteSession = useCallback(
    async (sessionUuid: string) => {
      try {
        const updatedSession = await EnglishCoachApi.deleteSession(sessionUuid);
        setSessions((prev) => prev.map((s) => (s.uuid === sessionUuid ? updatedSession : s)));

        // If capacity was freed, clear limit error
        setSessionsLimitError(null);

        // If the deleted session was the current one, immediately clear it
        setCurrentSessionUuid((prev) => (prev === sessionUuid ? null : prev));
      } catch (err) {
        console.error("Failed to delete session", err);
        handleError(err);
      }
    },
    [handleError]
  );

  const restoreSession = useCallback(
    async (sessionUuid: string) => {
      if (isSessionsLimitReached) return;
      try {
        setSessionsLimitError(null);
        const updatedSession = await EnglishCoachApi.restoreSession(sessionUuid);
        setSessions((prev) => prev.map((s) => (s.uuid === sessionUuid ? updatedSession : s)));
      } catch (err) {
        console.error("Failed to restore session", err);
        handleError(err);
      }
    },
    [isSessionsLimitReached, handleError]
  );

  const renameSession = useCallback(
    async (sessionUuid: string, newTitle: string) => {
      // Optimistic update
      setSessions((prev) =>
        prev.map((s) => (s.uuid === sessionUuid ? { ...s, title: newTitle, updatedAt: new Date().toISOString() } : s))
      );

      try {
        const updatedSession = await EnglishCoachApi.patchSession(sessionUuid, { title: newTitle });
        setSessions((prev) => prev.map((s) => (s.uuid === sessionUuid ? updatedSession : s)));
      } catch (err) {
        console.error("Failed to rename session", err);
        handleError(err);
      }
    },
    [handleError]
  );

  const toggleAutoPlay = useCallback(() => {
    setIsAutoPlayEnabled((prev) => !prev);
  }, []);

  /* ── data healing ── */
  const healSessionData = useCallback((sessionUuid: string) => {
    EnglishCoachApi.getSession(sessionUuid)
      .then((latest) => {
        setSessions((prev) =>
          prev.map((s) => {
            if (s.uuid === sessionUuid) {
              // Preserve locally generated fields that don't exist on backend
              const newMsgs = latest.messages.map((lm) => {
                const localMatch = s.messages.find((m) => m.uuid === lm.uuid);
                if (localMatch) {
                  return {
                    ...lm,
                    audioUrl: localMatch.audioUrl || lm.audioUrl,
                    nextPractice: localMatch.nextPractice || lm.nextPractice,
                    usage: localMatch.usage || lm.usage,
                  };
                }
                return lm;
              });
              return { ...latest, messages: newMsgs };
            }
            return s;
          })
        );
      })
      .catch((e) => console.error("Data healing failed", e));
  }, []);

  /* ── coach pipeline ── */

  const runCoachPipeline = useCallback(
    async (sessionUuid: string, messagesForApi: Pick<CoachMessage, "role" | "text">[]) => {
      const abort = new AbortController();
      abortRef.current = abort;

      try {
        // 1. Get coach reply
        setChatStatus("thinking");
        const reply = await EnglishCoachApi.createCoachReply({
          sessionId: sessionUuid,
          messages: messagesForApi,
        });

        if (abort.signal.aborted) return;

        const assistantMsg: CoachMessage = {
          ...reply.message,
          nextPractice: reply.nextPractice ?? undefined,
          usage: reply.usage ?? undefined,
        };

        appendMessage(sessionUuid, assistantMsg);

        // 2. TTS
        if (isAutoPlayEnabled) {
          setChatStatus("speaking");
          try {
            const audioUrl = await EnglishCoachApi.synthesizeSpeech({
              text: reply.message.text,
              sessionId: sessionUuid,
            });

            if (!abort.signal.aborted) {
              updateMessage(sessionUuid, assistantMsg.uuid, { audioUrl });
            }
          } catch {
            // TTS failure is non-fatal – text is already shown
            console.warn("[useEnglishCoachChat] TTS failed");
          }
        }

        // 3. Heal Data (background sync)
        if (!abort.signal.aborted) {
          healSessionData(sessionUuid);
        }
      } catch (err) {
        if (!abort.signal.aborted) {
          console.error("runCoachPipeline error", err);
          handleError(err);
        }
      } finally {
        if (!abort.signal.aborted) {
          setChatStatus("idle");
        }
      }
    },
    [appendMessage, updateMessage, healSessionData, isAutoPlayEnabled, handleError]
  );

  /* ── send text ── */

  const sendTextMessage = useCallback(
    async (text: string) => {
      if (sendingRef.current || !text.trim()) return;
      sendingRef.current = true;

      try {
        let activeSession = sessions.find((s) => s.uuid === currentSessionUuid) ?? null;

        // If no active session or it's deleted, create one first
        if (!activeSession || activeSession.deleted) {
          if (isSessionsLimitReached) {
            setSessionsLimitError("ENGLISH_COACH_SESSIONS_LIMIT_REACHED");
            notifier.error(t("englishCoach.sessions.limitReached"));
            return;
          }
          setChatStatus("thinking");
          setSessionsLimitError(null);
          const newSession = await EnglishCoachApi.createSession(text.slice(0, 40) || "New Conversation");
          setSessions((prev) => [newSession, ...prev]);
          setCurrentSessionUuid(newSession.uuid);
          activeSession = newSession;
        }

        const sessionUuid = activeSession.uuid;

        // Optimistic UI injects temp message
        const tempMsgId = `temp-${crypto.randomUUID()}`;
        const optimisticMsg: CoachMessage = {
          uuid: tempMsgId,
          role: MessageRole.USER,
          text: text.trim(),
          createdAt: new Date().toISOString(),
          inputMode: InputMode.TEXT,
        };
        appendMessage(sessionUuid, optimisticMsg);

        // API POST
        setChatStatus("thinking");
        try {
          const persistedMsg = await EnglishCoachApi.createMessage(sessionUuid, {
            role: MessageRole.USER,
            text: text.trim(),
          });

          // Swap out optimistic UUID
          updateMessage(sessionUuid, tempMsgId, { ...persistedMsg, inputMode: InputMode.TEXT });

          // Build context excluding the temp msg since we just swapped it
          const messageContext = (activeSession.messages ?? [])
            .filter((m) => m.uuid !== tempMsgId)
            .map((m) => ({ role: m.role, text: m.text }));

          messageContext.push({ role: persistedMsg.role, text: persistedMsg.text });

          await runCoachPipeline(sessionUuid, messageContext);
        } catch (apiErr) {
          // Remove optimistic message on failure
          setSessions((prev) =>
            prev.map((s) =>
              s.uuid === sessionUuid ? { ...s, messages: s.messages.filter((m) => m.uuid !== tempMsgId) } : s
            )
          );
          throw apiErr;
        }
      } catch (err) {
        console.error("sendTextMessage error", err);
        handleError(err);
      } finally {
        sendingRef.current = false;
      }
    },
    [
      currentSessionUuid,
      sessions,
      isSessionsLimitReached,
      appendMessage,
      updateMessage,
      runCoachPipeline,
      handleError,
      t,
    ]
  );

  /* ── send voice ── */

  const sendVoiceMessage = useCallback(
    async (audioBlob: Blob) => {
      if (sendingRef.current) return;
      sendingRef.current = true;

      try {
        let activeSession = sessions.find((s) => s.uuid === currentSessionUuid) ?? null;

        // If no active session or it's deleted, create one first
        if (!activeSession || activeSession.deleted) {
          if (isSessionsLimitReached) {
            setSessionsLimitError("ENGLISH_COACH_SESSIONS_LIMIT_REACHED");
            notifier.error(t("englishCoach.sessions.limitReached"));
            return;
          }
          setChatStatus("thinking");
          setSessionsLimitError(null);
          const newSession = await EnglishCoachApi.createSession("Voice Conversation");
          setSessions((prev) => [newSession, ...prev]);
          setCurrentSessionUuid(newSession.uuid);
          activeSession = newSession;
        }

        const sessionUuid = activeSession.uuid;

        // 1. Transcribe
        setChatStatus("transcribing");
        const { transcript } = await EnglishCoachApi.transcribeAudio(audioBlob, sessionUuid);

        // Optimistic UI
        const tempMsgId = `temp-${crypto.randomUUID()}`;
        const optimisticMsg: CoachMessage = {
          uuid: tempMsgId,
          role: MessageRole.USER,
          text: transcript,
          createdAt: new Date().toISOString(),
          inputMode: InputMode.VOICE,
        };
        appendMessage(sessionUuid, optimisticMsg);

        // API POST
        setChatStatus("thinking");
        try {
          const persistedMsg = await EnglishCoachApi.createMessage(sessionUuid, {
            role: MessageRole.USER,
            text: transcript,
          });

          updateMessage(sessionUuid, tempMsgId, { ...persistedMsg, inputMode: InputMode.VOICE });

          // Build context
          const messageContext = (activeSession.messages ?? [])
            .filter((m) => m.uuid !== tempMsgId)
            .map((m) => ({ role: m.role, text: m.text }));

          messageContext.push({ role: persistedMsg.role, text: persistedMsg.text });

          await runCoachPipeline(sessionUuid, messageContext);
        } catch (apiErr) {
          // Remove optimistic message on failure
          setSessions((prev) =>
            prev.map((s) =>
              s.uuid === sessionUuid ? { ...s, messages: s.messages.filter((m) => m.uuid !== tempMsgId) } : s
            )
          );
          throw apiErr;
        }
      } catch (err) {
        console.error("sendVoiceMessage error", err);
        handleError(err);
      } finally {
        sendingRef.current = false;
        setChatStatus("idle");
      }
    },
    [
      currentSessionUuid,
      sessions,
      isSessionsLimitReached,
      appendMessage,
      updateMessage,
      runCoachPipeline,
      handleError,
      t,
    ]
  );

  /* ── retry last assistant ── */

  const retryLastAssistant = useCallback(async () => {
    if (!currentSession || sendingRef.current) return;
    sendingRef.current = true;

    try {
      // Remove last assistant message and resend locally
      const msgs = [...currentSession.messages];
      while (msgs.length > 0 && msgs[msgs.length - 1].role === MessageRole.ASSISTANT) {
        msgs.pop();
      }
      setSessions((prev) => prev.map((s) => (s.uuid === currentSession.uuid ? { ...s, messages: msgs } : s)));

      const context = msgs.map((m) => ({ role: m.role, text: m.text }));
      await runCoachPipeline(currentSession.uuid, context);
    } catch (err) {
      handleError(err);
    } finally {
      sendingRef.current = false;
    }
  }, [currentSession, runCoachPipeline, handleError]);

  /* ── retry TTS for a specific message ── */

  const retrySpeech = useCallback(
    async (messageUuid: string) => {
      if (!currentSession) return;
      const msg = currentSession.messages.find((m) => m.uuid === messageUuid);
      if (!msg) return;

      setChatStatus("speaking");
      try {
        const audioUrl = await EnglishCoachApi.synthesizeSpeech({
          text: msg.text,
          sessionId: currentSession.uuid,
        });
        updateMessage(currentSession.uuid, messageUuid, { audioUrl });
      } catch (err) {
        console.warn("[useEnglishCoachChat] retrySpeech failed");
        handleError(err);
      } finally {
        setChatStatus("idle");
      }
    },
    [currentSession, updateMessage, handleError]
  );

  return {
    sessions,
    currentSession,
    chatStatus,
    isAutoPlayEnabled,
    toggleAutoPlay,
    createNewSession,
    switchSession,
    deleteSession,
    restoreSession,
    renameSession,
    isSessionFull,
    isSessionsLimitReached,
    sessionsLimit,
    sessionsLimitError,
    sessionTokenUsage,
    sendTextMessage,
    sendVoiceMessage,
    retryLastAssistant,
    retrySpeech,
  };
}
