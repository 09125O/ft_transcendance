import { useCallback, useEffect, useState } from "react";
import { isPlayerVisibleQuiz } from "../content/quizCatalog";
import {
  createQuiz,
  getQuizzes,
  type CreateQuizPayload,
  type Quiz,
} from "../services/quizzes";
import type { Room } from "../services/quiz";
import {
  offWs,
  onWs,
  type WsResponse,
} from "../services/ws";

export function useQuizLibrary() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [quizzesLoading, setQuizzesLoading] = useState(false);
  const [quizzesError, setQuizzesError] = useState<string | null>(null);
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);

  const loadQuizzes = useCallback(async () => {
    setQuizzesLoading(true);
    setQuizzesError(null);

    try {
      setQuizzes((await getQuizzes()).filter(isPlayerVisibleQuiz));
    } catch (error) {
      setQuizzesError(
        error instanceof Error ? error.message : "Impossible de charger les quiz",
      );
    } finally {
      setQuizzesLoading(false);
    }
  }, []);

  const createQuizAndRefresh = useCallback(
    async (payload: CreateQuizPayload) => {
      setIsCreatingQuiz(true);
      setQuizzesError(null);

      try {
        const quiz = await createQuiz(payload);
        if (isPlayerVisibleQuiz(quiz)) {
          setQuizzes((previous) => [quiz, ...previous]);
        }
        return quiz;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Impossible de créer le quiz";
        setQuizzesError(message);
        throw error;
      } finally {
        setIsCreatingQuiz(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadQuizzes();
  }, [loadQuizzes]);

  useEffect(() => {
    const handleRoomListUpdated = (response: WsResponse<Room[]>) => {
      if (!response.success || !response.data) {
        return;
      }

      const activeRoomsByQuizId = new Map<number, number>();
      for (const room of response.data) {
        if (typeof room.quizId !== "number") {
          continue;
        }
        activeRoomsByQuizId.set(
          room.quizId,
          (activeRoomsByQuizId.get(room.quizId) ?? 0) + 1,
        );
      }

      setQuizzes((previous) =>
        previous.map((quiz) => ({
          ...quiz,
          activeRoomCount: activeRoomsByQuizId.get(quiz.id) ?? 0,
        })),
      );
    };

    onWs("room:list-updated", handleRoomListUpdated);

    return () => {
      offWs("room:list-updated", handleRoomListUpdated);
    };
  }, []);

  return {
    quizzes,
    quizzesLoading,
    quizzesError,
    isCreatingQuiz,
    createQuizAndRefresh,
  };
}
