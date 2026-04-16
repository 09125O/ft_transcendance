import { useEffect } from "react";
import type { Room } from "../services/quiz";
import type { RoomLeaderboardPayload } from "./useRoomParticipants";
import {
  emitWs,
  offWs,
  onWs,
  type WsResponse,
} from "../services/ws";

export type GameQuestionStartedPayload = {
  roomId: number;
  questionId: number;
  question: {
    id: number;
    text: string;
    options: string[];
  };
  questionNumber: number;
  totalQuestions: number;
  durationMs: number;
  startsAt: string;
  endsAt: string;
};

export type GameTimerPayload = {
  roomId: number;
  questionId: number;
  questionNumber: number;
  totalQuestions: number;
  remainingMs: number;
  endsAt: string;
};

export type GameQuestionTimeoutPayload = {
  roomId: number;
  questionId: number;
  questionNumber: number;
  totalQuestions: number;
};

export type GameAnswerResultPayload = {
  roomId: number;
  userId: number;
  questionId: number;
  selectedAnswerIndex: number;
  isCorrect: boolean;
  scoreDelta: number;
  userTotalScore: number;
  totalAnswers: number;
};

export type GameEndedPayload = {
  roomId: number;
  reason: string;
  winnerUserId: number | null;
  leaderboard: Array<{
    userId: number;
    score: number;
  }>;
};

type UseRoomRealtimeOptions = {
  requestedRoomId: number | null;
  currentRoomId: number | null;
  userId: number | null;
  syncCurrentRoom: (room: Room) => void;
  clearCurrentRoom: () => void;
  onRoomClosed: () => void;
  onRoomJoined: () => void;
  onLeaderboard: (payload: RoomLeaderboardPayload) => void;
  onQuestionStarted?: (payload: GameQuestionStartedPayload) => void;
  onTimer?: (payload: GameTimerPayload) => void;
  onQuestionTimeout?: (payload: GameQuestionTimeoutPayload) => void;
  onAnswerResult?: (payload: GameAnswerResultPayload) => void;
  onGameEnded?: (payload: GameEndedPayload) => void;
  onRealtimeError?: (message: string) => void;
};

export function useRoomRealtime({
  requestedRoomId,
  currentRoomId,
  userId,
  syncCurrentRoom,
  clearCurrentRoom,
  onRoomClosed,
  onRoomJoined,
  onLeaderboard,
  onQuestionStarted,
  onTimer,
  onQuestionTimeout,
  onAnswerResult,
  onGameEnded,
  onRealtimeError,
}: UseRoomRealtimeOptions): void {
  useEffect(() => {
    const handleRoomState = (response: WsResponse<Room>) => {
      if (!response.success || !response.data) {
        return;
      }

      if (requestedRoomId !== response.data.id) {
        return;
      }

      syncCurrentRoom(response.data);
    };

    const handleRoomClosed = (
      response: WsResponse<{ roomId: number; reason: string }>,
    ) => {
      if (!response.success || !response.data) {
        return;
      }

      if (requestedRoomId !== response.data.roomId) {
        return;
      }

      clearCurrentRoom();
      onRoomClosed();
    };

    onWs("room:state", handleRoomState);
    onWs("room:started", handleRoomState);
    onWs("room:closed", handleRoomClosed);

    return () => {
      offWs("room:state", handleRoomState);
      offWs("room:started", handleRoomState);
      offWs("room:closed", handleRoomClosed);
    };
  }, [clearCurrentRoom, onRoomClosed, requestedRoomId, syncCurrentRoom]);

  useEffect(() => {
    const handleLeaderboard = (response: WsResponse<RoomLeaderboardPayload>) => {
      if (!response.success || !response.data || requestedRoomId === null) {
        return;
      }

      if (response.data.roomId !== requestedRoomId) {
        return;
      }

      onLeaderboard(response.data);
    };

    onWs("game:leaderboard", handleLeaderboard);

    return () => {
      offWs("game:leaderboard", handleLeaderboard);
    };
  }, [onLeaderboard, requestedRoomId]);

  useEffect(() => {
    const handleQuestionStarted = (
      response: WsResponse<GameQuestionStartedPayload>,
    ) => {
      if (!response.success || !response.data || requestedRoomId === null) {
        return;
      }
      if (response.data.roomId !== requestedRoomId) {
        return;
      }
      onQuestionStarted?.(response.data);
    };

    const handleTimer = (response: WsResponse<GameTimerPayload>) => {
      if (!response.success || !response.data || requestedRoomId === null) {
        return;
      }
      if (response.data.roomId !== requestedRoomId) {
        return;
      }
      onTimer?.(response.data);
    };

    const handleQuestionTimeout = (
      response: WsResponse<GameQuestionTimeoutPayload>,
    ) => {
      if (!response.success || !response.data || requestedRoomId === null) {
        return;
      }
      if (response.data.roomId !== requestedRoomId) {
        return;
      }
      onQuestionTimeout?.(response.data);
    };

    const handleAnswerResult = (response: WsResponse<GameAnswerResultPayload>) => {
      if (!response.success || !response.data || requestedRoomId === null) {
        return;
      }
      if (response.data.roomId !== requestedRoomId) {
        return;
      }
      onAnswerResult?.(response.data);
    };

    const handleGameEnded = (response: WsResponse<GameEndedPayload>) => {
      if (!response.success || !response.data || requestedRoomId === null) {
        return;
      }
      if (response.data.roomId !== requestedRoomId) {
        return;
      }
      onGameEnded?.(response.data);
    };

    const handleRoomStartError = (response: WsResponse<never>) => {
      if (response.success) {
        return;
      }
      onRealtimeError?.(response.error?.message ?? "Erreur room:start");
    };

    const handleGameAnswerError = (response: WsResponse<never>) => {
      if (response.success) {
        return;
      }
      onRealtimeError?.(response.error?.message ?? "Erreur game:answer");
    };

    onWs("game:question:started", handleQuestionStarted);
    onWs("game:timer", handleTimer);
    onWs("game:question:timeout", handleQuestionTimeout);
    onWs("game:answer:result", handleAnswerResult);
    onWs("game:ended", handleGameEnded);
    onWs("room:start:error", handleRoomStartError);
    onWs("game:answer:error", handleGameAnswerError);

    return () => {
      offWs("game:question:started", handleQuestionStarted);
      offWs("game:timer", handleTimer);
      offWs("game:question:timeout", handleQuestionTimeout);
      offWs("game:answer:result", handleAnswerResult);
      offWs("game:ended", handleGameEnded);
      offWs("room:start:error", handleRoomStartError);
      offWs("game:answer:error", handleGameAnswerError);
    };
  }, [
    onAnswerResult,
    onGameEnded,
    onQuestionStarted,
    onQuestionTimeout,
    onRealtimeError,
    onTimer,
    requestedRoomId,
  ]);

  useEffect(() => {
    if (currentRoomId === null || userId === null) {
      return;
    }

    emitWs("room:join", {
      roomId: currentRoomId,
      userId,
    });
    onRoomJoined();
  }, [currentRoomId, onRoomJoined, userId]);
}
