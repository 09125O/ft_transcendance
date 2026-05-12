import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import WsStatusBanner from "./components/WsStatusBanner";

const HomePage = lazy(() => import("./pages/HomePage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const StatusPage = lazy(() => import("./pages/StatusPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const FriendsPage = lazy(() => import("./pages/FriendsPage"));
const LeaderboardPage = lazy(() => import("./pages/LeaderboardPage"));
const QuizReadyPage = lazy(() => import("./pages/QuizReadyPage"));
const QuizCreatePage = lazy(() => import("./pages/QuizCreatePage"));

function RouteFallback() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-xl rounded-3xl border border-text/10 bg-surface/90 px-6 py-8 text-center text-sm text-text/70 shadow-[0_30px_80px_-45px_color-mix(in_srgb,var(--color-background)_85%,transparent)] backdrop-blur">
        Chargement de l&apos;interface...
      </div>
    </main>
  );
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/room/:roomId" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:userId" element={<ProfilePage />} />
          <Route path="/friends" element={<FriendsPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/quiz-ready" element={<QuizReadyPage />} />
          <Route path="/quiz-create" element={<QuizCreatePage />} />
          <Route path="/status" element={<StatusPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
        </Routes>
      </Suspense>
      <Footer />
      <WsStatusBanner />
    </div>
  );
}
