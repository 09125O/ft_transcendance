import { useEffect, useRef } from "react";
import type { Room } from "../services/quiz";
import type { PublicQuestion } from "../types/game";
import type { RoomLeaderboardPayload } from "./useRoomParticipants";
import {
  emitWs,
  offWs,
  onWs,
  type WsResponse,
} from "../services/ws";

type LeaderboardEntry = {
  userId: number;
  score: number;
};

type AnswerResultPayload = {
  roomId: number;
  userId: number;
  questionId: number;
  selectedAnswerIndex: number;
  correctAnswerIndex: number;
  isCorrect: boolean;
};

type TimerPayload = {
  roomId: number;
  questionId: number;
  questionNumber: number;
  totalQuestions: number;
  remainingMs: number;
  endsAt: string;
};

type UseRoomRealtimeOptions = {
  requestedRoomId: number | null;
  currentRoomId: number | null;
  userId: number | null;
  syncCurrentRoom: (room: Room) => void;
  clearCurrentRoom: () => void;
  onRoomClosed: () => void;
  onRoomJoined: () => void;
  onLeaderboard: (payload: LeaderboardEntry[] | RoomLeaderboardPayload) => void;
  onQuestionStarted: (payload: {
    question: PublicQuestion;
    durationMs: number;
    endsAt: string;
    questionId: number;
    questionNumber: number;
    totalQuestions: number;
  }) => void;
  onGameEnded: () => void;
  onAnswerResult: (payload: AnswerResultPayload) => void;
  onTimerTick: (payload: TimerPayload) => void;
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
  onGameEnded,
  onAnswerResult,
  onTimerTick,
}: UseRoomRealtimeOptions): void {
  const syncCurrentRoomRef = useRef(syncCurrentRoom);
  const clearCurrentRoomRef = useRef(clearCurrentRoom);
  const onRoomClosedRef = useRef(onRoomClosed);
  const onLeaderboardRef = useRef(onLeaderboard);
  const onQuestionStartedRef = useRef(onQuestionStarted);
  const onGameEndedRef = useRef(onGameEnded);
  const onAnswerResultRef = useRef(onAnswerResult);
  const onTimerTickRef = useRef(onTimerTick);

  useEffect(() => {
    syncCurrentRoomRef.current = syncCurrentRoom;
    clearCurrentRoomRef.current = clearCurrentRoom;
    onRoomClosedRef.current = onRoomClosed;
    onLeaderboardRef.current = onLeaderboard;
    onQuestionStartedRef.current = onQuestionStarted;
    onGameEndedRef.current = onGameEnded;
    onAnswerResultRef.current = onAnswerResult;
    onTimerTickRef.current = onTimerTick;
  }, [
    clearCurrentRoom,
    onAnswerResult,
    onGameEnded,
    onLeaderboard,
    onQuestionStarted,
    onRoomClosed,
    onTimerTick,
    syncCurrentRoom,
  ]);

  useEffect(() => {
    const handleRoomState = (response: WsResponse<Room>) => {
      if (!response.success || !response.data) {
        return;
      }

      if (requestedRoomId !== response.data.id) {
        return;
      }

      syncCurrentRoomRef.current(response.data);
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

      clearCurrentRoomRef.current();
      onRoomClosedRef.current();
    };

    onWs("room:state", handleRoomState);
    onWs("room:started", handleRoomState);
    onWs("room:closed", handleRoomClosed);

    return () => {
      offWs("room:state", handleRoomState);
      offWs("room:started", handleRoomState);
      offWs("room:closed", handleRoomClosed);
    };
  }, [requestedRoomId]);

  useEffect(() => {
    const handleLeaderboard = (
      response: WsResponse<LeaderboardEntry[] | RoomLeaderboardPayload>,
    ) => {
      if (!response.success || !response.data || requestedRoomId === null) {
        return;
      }

      if (!Array.isArray(response.data) && response.data.roomId !== requestedRoomId) {
        return;
      }

      onLeaderboardRef.current(response.data);
    };

    onWs("game:leaderboard", handleLeaderboard);

    return () => {
      offWs("game:leaderboard", handleLeaderboard);
    };
  }, [requestedRoomId]);

  useEffect(() => {
    const handleQuestionStarted = (
      response: WsResponse<{
        roomId: number;
        questionId: number;
        question: PublicQuestion;
        questionNumber: number;
        totalQuestions: number;
        durationMs: number;
        endsAt: string;
      }>,
    ) => {
      if (!response.success || !response.data || requestedRoomId === null) {
        return;
      }

      if (response.data.roomId !== requestedRoomId) {
        return;
      }

      onQuestionStartedRef.current({
        question: response.data.question,
        durationMs: response.data.durationMs,
        endsAt: response.data.endsAt,
        questionId: response.data.questionId,
        questionNumber: response.data.questionNumber,
        totalQuestions: response.data.totalQuestions,
      });
    };

    const handleGameEnded = (response: WsResponse<{ roomId: number }>) => {
      if (!response.success || !response.data || requestedRoomId === null) {
        return;
      }

      if (response.data.roomId !== requestedRoomId) {
        return;
      }

      onGameEndedRef.current();
    };

    const handleAnswerResult = (response: WsResponse<AnswerResultPayload>) => {
      if (!response.success || !response.data || requestedRoomId === null) {
        return;
      }

      if (response.data.roomId !== requestedRoomId) {
        return;
      }

      onAnswerResultRef.current(response.data);
    };

    const handleTimerTick = (response: WsResponse<TimerPayload>) => {
      if (!response.success || !response.data || requestedRoomId === null) {
        return;
      }

      if (response.data.roomId !== requestedRoomId) {
        return;
      }

      onTimerTickRef.current(response.data);
    };

    onWs("game:question:started", handleQuestionStarted);
    onWs("game:ended", handleGameEnded);
    onWs("game:answer:result", handleAnswerResult);
    onWs("game:timer", handleTimerTick);

    return () => {
      offWs("game:question:started", handleQuestionStarted);
      offWs("game:ended", handleGameEnded);
      offWs("game:answer:result", handleAnswerResult);
      offWs("game:timer", handleTimerTick);
    };
  }, [requestedRoomId]);

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
