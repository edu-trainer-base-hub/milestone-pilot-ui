import React, { useMemo } from "react";
import CoachChatLayout from "@/components/english-coach/CoachChatLayout";
import SessionList from "@/components/english-coach/SessionList";
import { useEnglishCoachChat } from "@/hooks/useEnglishCoachChat";
import { useSidebarContent } from "@/contexts/SidebarContext";

const EnglishCoachPage: React.FC = () => {
  const {
    sessions,
    currentSession,
    chatStatus,
    createNewSession,
    switchSession,
    deleteSession,
    renameSession,
    sendTextMessage,
    sendVoiceMessage,
    retryLastAssistant,
    retrySpeech,
    isAutoPlayEnabled,
    toggleAutoPlay,
    isSessionFull,
    isSessionsLimitReached,
    sessionsLimit,
    sessionsLimitError,
    sessionTokenUsage,
    restoreSession,
  } = useEnglishCoachChat();

  /* Inject English-Coach session list into the global AppSidebar.
       Memoised to keep a stable reference and avoid an infinite
       setState → re-render loop inside useSidebarContent. */
  const sessionListNode = useMemo(
    () => (
      <SessionList
        sessions={sessions}
        currentSessionUuid={currentSession?.uuid ?? null}
        onSelect={switchSession}
        onCreate={createNewSession}
        onDelete={deleteSession}
        onRestore={restoreSession}
        onRename={renameSession}
        isSessionsLimitReached={isSessionsLimitReached}
        sessionsLimit={sessionsLimit}
      />
    ),
    [
      sessions,
      currentSession?.uuid,
      switchSession,
      createNewSession,
      deleteSession,
      restoreSession,
      renameSession,
      isSessionsLimitReached,
      sessionsLimit,
    ]
  );

  useSidebarContent(sessionListNode);

  return (
    <CoachChatLayout
      currentSession={currentSession}
      chatStatus={chatStatus}
      onSendText={sendTextMessage}
      onSendVoice={sendVoiceMessage}
      onRetryAssistant={retryLastAssistant}
      onRetrySpeech={retrySpeech}
      isAutoPlayEnabled={isAutoPlayEnabled}
      onToggleAutoPlay={toggleAutoPlay}
      isSessionFull={isSessionFull}
      isSessionsLimitReached={isSessionsLimitReached}
      sessionsLimitError={sessionsLimitError}
      sessionTokenUsage={sessionTokenUsage}
      className="h-full"
    />
  );
};

export default EnglishCoachPage;
