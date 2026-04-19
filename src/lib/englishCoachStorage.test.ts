import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  loadActiveSessionId,
  saveActiveSessionId,
  loadAutoPlay,
  saveAutoPlay,
  clearAllCoachData,
} from "@/lib/englishCoachStorage";

/* ───────── mock localStorage ───────── */

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("englishCoachStorage", () => {
  const ACTIVE_KEY = "english-coach:active-session-uuid";
  const AUTOPLAY_KEY = "english-coach:preferences:autoplay";

  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe("activeSessionId", () => {
    it("returns null when not set", () => {
      expect(loadActiveSessionId()).toBeNull();
    });

    it("saves and loads active session id", () => {
      saveActiveSessionId("test-uuid-123");
      expect(localStorageMock.setItem).toHaveBeenCalledWith(ACTIVE_KEY, "test-uuid-123");
      expect(loadActiveSessionId()).toBe("test-uuid-123");
    });

    it("removes key when null is passed", () => {
      localStorageMock.setItem(ACTIVE_KEY, "some-id");
      saveActiveSessionId(null);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(ACTIVE_KEY);
      expect(loadActiveSessionId()).toBeNull();
    });
  });

  describe("autoPlay preference", () => {
    it("defaults to false", () => {
      expect(loadAutoPlay()).toBe(false);
    });

    it("saves and loads true", () => {
      saveAutoPlay(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(AUTOPLAY_KEY, "true");
      expect(loadAutoPlay()).toBe(true);
    });

    it("saves and loads false", () => {
      saveAutoPlay(false);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(AUTOPLAY_KEY, "false");
      expect(loadAutoPlay()).toBe(false);
    });
  });

  describe("clearAllCoachData", () => {
    it("removes all related keys", () => {
      clearAllCoachData();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith("english-coach:sessions:v1");
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(ACTIVE_KEY);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(AUTOPLAY_KEY);
    });
  });
});
