import { useEffect, useState } from "react";
import Panel from "../Panel";
import PrimaryButton from "../PrimaryButton";
import PrivacySwitch from "./PrivacySwitch";
import {
  QUIZ_ROOM_NAME_MIN_LENGTH,
  QUIZ_ROOM_PASSWORD_MIN_LENGTH,
  QUIZ_ROOM_QUESTION_DURATION_DEFAULT_MS,
  type CreateRoomPayload,
} from "../../services/quiz";
import type { Quiz } from "../../services/quizzes";

type QuestionDurationSeconds = 5 | 10 | 15 | 20 | 25 | 30;

type RoomCreateFromQuizPanelProps = {
  quiz: Quiz;
  onBack: () => void;
  onCreateRoom: (payload: CreateRoomPayload) => Promise<void>;
};

type CounterFieldProps = {
  label: string;
  helper: string;
  value: number;
  formatValue: (value: number) => string;
  formatUnit?: (value: number) => string;
  canDecrement: boolean;
  canIncrement: boolean;
  onDecrement: () => void;
  onIncrement: () => void;
};

const questionDurations: QuestionDurationSeconds[] = [5, 10, 15, 20, 25, 30];
const QUIZ_ROOM_ROUNDS_TARGET = 10;

function AnimatedCounterField({
  label,
  helper,
  value,
  formatValue,
  formatUnit,
  canDecrement,
  canIncrement,
  onDecrement,
  onIncrement,
}: CounterFieldProps) {
  const [previousValue, setPreviousValue] = useState(value);
  const [direction, setDirection] = useState<"up" | "down">("up");

  useEffect(() => {
    if (value === previousValue) {
      return;
    }

    setDirection(value > previousValue ? "up" : "down");
    setPreviousValue(value);
  }, [formatValue, previousValue, value]);

  const currentValueText = formatValue(value);
  const currentUnitText = formatUnit?.(value);

  return (
    <div className="quiz-counter-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <label className="block text-sm font-medium text-text/70">{label}</label>
          <p className="mt-1 text-sm text-text/50">{helper}</p>
        </div>
      </div>

      <div className="quiz-counter-display mt-4">
        <button
          aria-label={`Réduire ${label.toLowerCase()}`}
          className="quiz-counter-button"
          disabled={!canDecrement}
          type="button"
          onClick={onDecrement}
        >
          -
        </button>

        <div className="quiz-counter-readout">
          <div aria-live="polite" className="quiz-counter-value-shell">
            <span
              className={[
                "quiz-counter-value",
                direction === "up"
                  ? "quiz-counter-value-enter-up"
                  : "quiz-counter-value-enter-down",
              ].join(" ")}
              key={`current-${currentValueText}`}
            >
              {currentValueText}
            </span>
          </div>
          {currentUnitText ? (
            <span className="quiz-counter-unit">{currentUnitText}</span>
          ) : null}
        </div>

        <button
          aria-label={`Augmenter ${label.toLowerCase()}`}
          className="quiz-counter-button"
          disabled={!canIncrement}
          type="button"
          onClick={onIncrement}
        >
          +
        </button>
      </div>
    </div>
  );
}

export default function RoomCreateFromQuizPanel({
  quiz,
  onBack,
  onCreateRoom,
}: RoomCreateFromQuizPanelProps) {
  const defaultQuestionCount = Math.min(
    quiz.questionCount,
    QUIZ_ROOM_ROUNDS_TARGET,
  );
  const questionCountOptions = Array.from(
    { length: quiz.questionCount },
    (_, index) => index + 1,
  );
  const [roomName, setRoomName] = useState(quiz.title);
  const [selectedQuestionCount, setSelectedQuestionCount] = useState(
    defaultQuestionCount,
  );
  const [questionDurationSeconds, setQuestionDurationSeconds] =
    useState<QuestionDurationSeconds>(
      (QUIZ_ROOM_QUESTION_DURATION_DEFAULT_MS / 1000) as QuestionDurationSeconds,
    );
  const [isPrivateRoom, setIsPrivateRoom] = useState(false);
  const [password, setPassword] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  useEffect(() => {
    setRoomName(quiz.title);
    setSelectedQuestionCount(defaultQuestionCount);
    setQuestionDurationSeconds(
      (QUIZ_ROOM_QUESTION_DURATION_DEFAULT_MS / 1000) as QuestionDurationSeconds,
    );
    setIsPrivateRoom(false);
    setPassword("");
    setCreateError(null);
  }, [defaultQuestionCount, quiz]);

  const selectedQuestionCountIndex = questionCountOptions.findIndex(
    (count) => count === selectedQuestionCount,
  );
  const selectedDurationIndex = questionDurations.findIndex(
    (duration) => duration === questionDurationSeconds,
  );

  const handleQuestionCountStep = (delta: -1 | 1) => {
    const nextIndex = selectedQuestionCountIndex + delta;
    const nextValue = questionCountOptions[nextIndex];
    if (typeof nextValue === "number") {
      setSelectedQuestionCount(nextValue);
    }
  };

  const handleDurationStep = (delta: -1 | 1) => {
    const nextIndex = selectedDurationIndex + delta;
    const nextValue = questionDurations[nextIndex];
    if (typeof nextValue === "number") {
      setQuestionDurationSeconds(nextValue);
    }
  };

  const handleCreateRoom = async () => {
    setCreateError(null);

    if (roomName.trim().length < QUIZ_ROOM_NAME_MIN_LENGTH) {
      setCreateError(
        `Le nom doit contenir au moins ${QUIZ_ROOM_NAME_MIN_LENGTH} caractères.`,
      );
      return;
    }

    if (isPrivateRoom && password.length < QUIZ_ROOM_PASSWORD_MIN_LENGTH) {
      setCreateError(
        `Le mot de passe doit contenir au moins ${QUIZ_ROOM_PASSWORD_MIN_LENGTH} caractères.`,
      );
      return;
    }

    if (quiz.questionCount < 1) {
      setCreateError("Impossible de créer une room avec un quiz vide.");
      return;
    }

    if (selectedQuestionCount < 1 || selectedQuestionCount > quiz.questionCount) {
      setCreateError(
        `Le nombre de questions doit être compris entre 1 et ${quiz.questionCount}.`,
      );
      return;
    }

    setIsCreatingRoom(true);

    try {
      await onCreateRoom({
        name: roomName.trim(),
        rounds: selectedQuestionCount,
        questionDurationMs: questionDurationSeconds * 1000,
        isPrivate: isPrivateRoom,
        quizId: quiz.id,
        ...(isPrivateRoom ? { password } : {}),
      });
    } catch (error) {
      setCreateError(
        error instanceof Error ? error.message : "Erreur de création de room.",
      );
    } finally {
      setIsCreatingRoom(false);
    }
  };

  return (
    <Panel className="min-h-[80vh] w-full px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="m-0 text-3xl font-semibold text-text">Créer une room</h1>
        <button
          className="w-full rounded-md border border-text/10 bg-background px-4 py-2 text-sm font-semibold text-text sm:w-auto"
          type="button"
          onClick={onBack}
        >
          Retour aux quiz
        </button>
      </div>

      <div className="grid flex-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
        <div className="space-y-6">
          <div>
            <label
              className="mb-2 block text-sm font-medium text-text/70"
              htmlFor="room-quiz"
            >
              Quiz sélectionné
            </label>
            <input
              className="w-full rounded-xl border border-text/10 bg-background px-4 py-3 text-text/70 outline-none"
              id="room-quiz"
              readOnly
              type="text"
              value={quiz.title}
            />
          </div>

          <div>
            <label
              className="mb-2 block text-sm font-medium text-text/70"
              htmlFor="room-name"
            >
              Nom de la room
            </label>
            <input
              className="w-full rounded-xl border border-text/10 bg-background px-4 py-3 text-text outline-none placeholder:text-text/40"
              id="room-name"
              type="text"
              placeholder="Nom de la room"
              value={roomName}
              onChange={(event) => setRoomName(event.target.value)}
            />
          </div>

          <AnimatedCounterField
            canDecrement={selectedQuestionCountIndex > 0}
            canIncrement={selectedQuestionCountIndex < questionCountOptions.length - 1}
            formatValue={(value) => `${value}`}
            helper={`Choisis entre 1 et ${quiz.questionCount} questions pour cette partie.`}
            label="Nombre de questions"
            value={selectedQuestionCount}
            onDecrement={() => handleQuestionCountStep(-1)}
            onIncrement={() => handleQuestionCountStep(1)}
          />

          <AnimatedCounterField
            canDecrement={selectedDurationIndex > 0}
            canIncrement={selectedDurationIndex < questionDurations.length - 1}
            formatValue={(value) => `${value}s`}
            helper="Ajuste le rythme sans perdre le côté live."
            label="Temps par question"
            value={questionDurationSeconds}
            onDecrement={() => handleDurationStep(-1)}
            onIncrement={() => handleDurationStep(1)}
          />

          <div>
            <p className="mb-2 text-sm font-medium text-text/70" id="room-privacy-label">
              Salon privé
            </p>
            <PrivacySwitch
              checked={isPrivateRoom}
              labelId="room-privacy-label"
              onChange={setIsPrivateRoom}
            />
          </div>

          {isPrivateRoom ? (
            <div>
              <label
                className="mb-2 block text-sm font-medium text-text/70"
                htmlFor="room-password"
              >
                Mot de passe
              </label>
              <input
                className="w-full rounded-xl border border-text/10 bg-background px-4 py-3 text-text outline-none placeholder:text-text/40"
                id="room-password"
                placeholder="Mot de passe"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
          ) : null}

          {createError ? (
            <p className="m-0 text-sm text-danger" role="alert">
              {createError}
            </p>
          ) : null}

          <PrimaryButton
            className="w-full px-6 py-3 text-base sm:w-auto"
            disabled={isCreatingRoom}
            onClick={() => {
              void handleCreateRoom();
            }}
          >
            {isCreatingRoom ? "Création..." : "Créer et jouer"}
          </PrimaryButton>
        </div>

        <div className="rounded-2xl border border-text/10 bg-background px-5 py-5">
          <p className="m-0 text-lg font-semibold text-text">Résumé du quiz</p>
          <div className="mt-5 rounded-xl border border-text/10 bg-background/70 px-4 py-4 text-sm text-text/70">
            <p className="m-0">
              Cette partie proposera {selectedQuestionCount} question{selectedQuestionCount > 1 ? "s" : ""}, avec {questionDurationSeconds} secondes par question.
            </p>
            <p className="m-0 mt-2">
              {isPrivateRoom ? "Salon privé protégé par mot de passe." : "Salon public accessible immédiatement."}
            </p>
          </div>
        </div>
      </div>
    </Panel>
  );
}
