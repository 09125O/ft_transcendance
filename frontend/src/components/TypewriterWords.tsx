import { useEffect, useMemo, useState } from "react";

type TypewriterWordsProps = {
  words: string[];
  typingSpeedMs?: number;
  deletingSpeedMs?: number;
  pauseMs?: number;
  className?: string;
};

const DEFAULT_TYPING_SPEED_MS = 95;
const DEFAULT_DELETING_SPEED_MS = 60;
const DEFAULT_PAUSE_MS = 1300;

export default function TypewriterWords({
  words,
  typingSpeedMs = DEFAULT_TYPING_SPEED_MS,
  deletingSpeedMs = DEFAULT_DELETING_SPEED_MS,
  pauseMs = DEFAULT_PAUSE_MS,
  className,
}: TypewriterWordsProps) {
  const safeWords = useMemo(
    () => words.filter((word) => word.trim().length > 0),
    [words],
  );
  const [wordIndex, setWordIndex] = useState(0);
  const [letterIndex, setLetterIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setWordIndex(0);
    setLetterIndex(0);
    setIsDeleting(false);
  }, [safeWords]);

  useEffect(() => {
    if (safeWords.length === 0) {
      return;
    }

    const currentWord = safeWords[wordIndex % safeWords.length];

    if (isDeleting && letterIndex === 0) {
      setIsDeleting(false);
      setWordIndex((current) => (current + 1) % safeWords.length);
      return;
    }

    let timeoutMs = isDeleting ? deletingSpeedMs : typingSpeedMs;
    if (!isDeleting && letterIndex === currentWord.length) {
      timeoutMs = pauseMs;
    }

    const timeoutId = window.setTimeout(() => {
      if (!isDeleting && letterIndex < currentWord.length) {
        setLetterIndex((current) => current + 1);
        return;
      }

      if (!isDeleting && letterIndex === currentWord.length) {
        setIsDeleting(true);
        return;
      }

      if (isDeleting && letterIndex > 0) {
        setLetterIndex((current) => current - 1);
      }
    }, timeoutMs);

    return () => window.clearTimeout(timeoutId);
  }, [
    deletingSpeedMs,
    isDeleting,
    letterIndex,
    pauseMs,
    safeWords,
    typingSpeedMs,
    wordIndex,
  ]);

  if (safeWords.length === 0) {
    return null;
  }

  const currentWord = safeWords[wordIndex % safeWords.length];
  const visibleText = currentWord.slice(0, letterIndex);
  const widestWord = safeWords.reduce(
    (widest, word) => (word.length > widest.length ? word : widest),
    safeWords[0],
  );

  return (
    <span
      aria-label={currentWord}
      className={["relative inline-grid align-middle", className]
        .filter(Boolean)
        .join(" ")}
    >
      <span aria-hidden="true" className="invisible [grid-area:1/1] whitespace-nowrap">
        {widestWord}
      </span>
      <span className="[grid-area:1/1] inline-flex items-center whitespace-nowrap">
        <span>{visibleText}</span>
        <span
          aria-hidden="true"
          className="ml-1 inline-block h-[1em] w-[2px] animate-pulse bg-primary align-middle"
        />
      </span>
    </span>
  );
}
