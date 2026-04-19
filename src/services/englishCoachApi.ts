import { get, post, del, patch } from "@/services/ApiService";
import type {
  CoachFeedback,
  CoachReplyRequest,
  CoachReplyResponse,
  CoachSession,
  SynthesizeSpeechRequest,
  TranscribeResponse,
  CoachMessage,
} from "@/types/englishCoach";

/* ───────── Backend response shapes ───────── */

interface ChatMessageDto {
  uuid: string;
  role: string;
  text: string;
  createdAt: string; // ISO 8601 from Instant
  feedback?: CoachFeedback;
}

interface ChatSessionResponse {
  uuid: string;
  title: string;
  deleted: boolean;
  progressState?: any;
  userPreferences?: any;
  analytics?: any;
  inputTokensUsed: number;
  outputTokensUsed: number;
  totalTokensUsed: number;
  llmContextLimit: number | null;
  full: boolean;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessageDto[];
}

function mapSessionResponse(s: ChatSessionResponse): CoachSession {
  return {
    uuid: s.uuid,
    title: s.title,
    deleted: s.deleted ?? false,
    progressState: s.progressState,
    userPreferences: s.userPreferences,
    analytics: s.analytics,
    inputTokensUsed: s.inputTokensUsed ?? 0,
    outputTokensUsed: s.outputTokensUsed ?? 0,
    totalTokensUsed: s.totalTokensUsed ?? 0,
    llmContextLimit: s.llmContextLimit ?? null,
    full: s.full ?? false,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    messages: (s.messages || []).map((m) => ({
      uuid: m.uuid,
      role: m.role as CoachSession["messages"][number]["role"],
      text: m.text,
      createdAt: m.createdAt,
      feedback: m.feedback,
    })),
  };
}

const BASE = "/api/english-coach";

class EnglishCoachApi {
  /**
   * Send an audio blob to the backend for speech-to-text transcription.
   */
  static async transcribeAudio(audioBlob: Blob, sessionId: string): Promise<TranscribeResponse> {
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");
    formData.append("sessionId", sessionId);

    return post<TranscribeResponse>(`${BASE}/transcribe`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }

  /**
   * Request a coaching reply from the LLM backend.
   */
  static async createCoachReply(req: CoachReplyRequest): Promise<CoachReplyResponse> {
    return post<CoachReplyResponse>(`${BASE}/reply`, req);
  }

  /**
   * Generate TTS audio for the given text. Returns an audio blob URL.
   */
  static async synthesizeSpeech(req: SynthesizeSpeechRequest): Promise<string> {
    const response = await post<Blob>(`${BASE}/speak`, req, {
      responseType: "blob",
    });
    console.log("[EnglishCoachApi] TTS response:", response); // Expect Blob
    console.log("[EnglishCoachApi] TTS size:", response.size, "type:", response.type);
    return URL.createObjectURL(response);
  }

  /**
   * Fetch all user sessions from the backend.
   */
  static async getAllSessions(): Promise<CoachSession[]> {
    const data = await get<ChatSessionResponse[]>(`${BASE}/sessions`);
    return data.map(mapSessionResponse);
  }

  /**
   * Fetch a single session explicitly (for syncing).
   */
  static async getSession(sessionUuid: string): Promise<CoachSession> {
    const s = await get<ChatSessionResponse>(`${BASE}/sessions/${sessionUuid}`);
    return mapSessionResponse(s);
  }

  /**
   * Create a new session on the backend.
   */
  static async createSession(title?: string): Promise<CoachSession> {
    const body = title ? { title } : {};
    const s = await post<ChatSessionResponse>(`${BASE}/sessions`, body);
    return mapSessionResponse(s);
  }

  /**
   * Soft-delete a session.
   */
  static async deleteSession(sessionUuid: string): Promise<CoachSession> {
    const s = await del<ChatSessionResponse>(`${BASE}/sessions/${sessionUuid}`);
    return mapSessionResponse(s);
  }

  /**
   * Restore a soft-deleted session.
   */
  static async restoreSession(sessionUuid: string): Promise<CoachSession> {
    const s = await post<ChatSessionResponse>(`${BASE}/sessions/${sessionUuid}/restore`);
    return mapSessionResponse(s);
  }

  /**
   * Patch session metadata.
   */
  static async patchSession(sessionUuid: string, data: Partial<CoachSession>): Promise<CoachSession> {
    const s = await patch<ChatSessionResponse>(`${BASE}/sessions/${sessionUuid}`, data);
    return mapSessionResponse(s);
  }

  /**
   * Create a single message on the backend.
   */
  static async createMessage(
    sessionUuid: string,
    message: { role: string; text: string; createdAt?: string }
  ): Promise<CoachMessage> {
    const m = await post<ChatMessageDto>(`${BASE}/sessions/${sessionUuid}/messages`, message);
    return {
      uuid: m.uuid,
      role: m.role as CoachSession["messages"][number]["role"],
      text: m.text,
      createdAt: m.createdAt,
      feedback: m.feedback,
    };
  }

  /**
   * Delete a single message.
   */
  static async deleteMessage(sessionUuid: string, messageUuid: string): Promise<void> {
    await del(`${BASE}/sessions/${sessionUuid}/messages/${messageUuid}`);
  }

  /**
   * Patch a single message.
   */
  static async patchMessage(
    sessionUuid: string,
    messageUuid: string,
    data: Partial<CoachMessage>
  ): Promise<CoachMessage> {
    const m = await patch<ChatMessageDto>(`${BASE}/sessions/${sessionUuid}/messages/${messageUuid}`, data);
    return {
      uuid: m.uuid,
      role: m.role as CoachSession["messages"][number]["role"],
      text: m.text,
      createdAt: m.createdAt,
      feedback: m.feedback,
    };
  }

  /**
   * Fetch English Coach configuration (mocked for now).
   */
  static async getEnglishCoachConfig(): Promise<{ activeSessionsLimit: number }> {
    // In a real implementation this would call an endpoint like /api/english-coach/config
    return { activeSessionsLimit: 5 };
  }
}

export default EnglishCoachApi;
