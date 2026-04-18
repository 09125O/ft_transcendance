import { useNavigate } from "react-router-dom";
import QuizCreatePanel from "../components/Quiz/QuizCreatePanel";
import { useQuizLibrary } from "../hooks/useQuizLibrary";
import { useAuth } from "../providers/AuthProvider";

export default function QuizCreatePage() {
  const navigate = useNavigate();
  const { user: sessionUser, isLoading: isSessionLoading } = useAuth();
  const { isCreatingQuiz, createQuizAndRefresh } = useQuizLibrary();
  const actionsDisabled = isSessionLoading || sessionUser === null;

  return (
    <main className="flex flex-1 px-4 py-6 sm:px-6 lg:px-[8%]">
      <QuizCreatePanel
        isCreatingQuiz={isCreatingQuiz}
        actionsDisabled={actionsDisabled}
        onBack={() => navigate("/quiz-ready")}
        onCreateQuiz={createQuizAndRefresh}
        onRequireAuth={() => navigate("/login")}
      />
    </main>
  );
}
