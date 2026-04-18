import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import { logout } from "../services/auth";
import PrimaryButton from "./PrimaryButton";

export default function Navbar() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  return (
    <nav className="bg-surface text-text">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Link
          className="text-sm font-medium uppercase tracking-[0.18em]"
          to="/"
        >
          Transcendance
        </Link>
        <div className="flex flex-wrap items-center gap-3 sm:justify-end sm:gap-5">
          {currentUser !== null ? (
            <>
              <Link className="text-sm font-medium text-text" to="/profile">
                Profil
              </Link>
              <Link className="text-sm font-medium text-text" to="/friends">
                Amis
              </Link>
              <PrimaryButton
                className="px-4 py-2 text-sm"
                onClick={() => {
                  void (async () => {
                    await logout();
                  })();
                }}
              >
                Se déconnecter
              </PrimaryButton>
            </>
          ) : (
            <>
              <Link className="text-sm font-medium text-text" to="/login">
                Se connecter
              </Link>
              <PrimaryButton
                className="px-4 py-2 text-sm"
                onClick={() => {
                  navigate("/register");
                }}
              >
                S'inscrire
              </PrimaryButton>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
