import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-surface text-text">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-3 text-sm">
        <p className="m-0">Quiz Arena © 2026</p>
        <div className="flex flex-wrap items-center gap-4">
          <Link to="/status">Statut</Link>
          <Link to="/terms">Conditions d&apos;utilisation</Link>
          <Link to="/privacy">Politique de confidentialité</Link>
          <a
            href="https://github.com/09125O/ft_transcendance"
            rel="noreferrer noopener"
            target="_blank"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
