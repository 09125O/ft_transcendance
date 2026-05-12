import Panel from "../components/Panel";

export default function PrivacyPage() {
  return (
    <main className="flex flex-1 justify-center px-4 sm:px-6 lg:px-10 py-10">
      <Panel className="w-full max-w-3xl gap-6 p-8 text-sm leading-relaxed">
        <h1 className="text-2xl font-semibold">Politique de confidentialité</h1>
        <p className="text-text/70">Dernière mise à jour : 17 avril 2026</p>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">1. Responsable du traitement</h2>
          <p>
            Quiz Arena est un projet pédagogique réalisé dans le cadre du cursus
            42. Il n&apos;a pas de finalité commerciale. Les données collectées
            servent uniquement au fonctionnement du service de quiz en ligne.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">2. Données collectées</h2>
          <ul className="list-disc pl-6">
            <li>
              Compte : adresse email, nom d&apos;utilisateur, mot de passe (haché
              via bcrypt, jamais stocké en clair), avatar optionnel.
            </li>
            <li>
              Authentification OAuth 42 : identifiant 42, login, image de profil
              publique retournée par l&apos;API de 42.
            </li>
            <li>
              Jeu : rooms rejointes, scores, historique de parties, réponses
              soumises.
            </li>
            <li>
              Interactions : messages de chat de room, demandes d&apos;ami,
              notifications.
            </li>
            <li>
              Session : cookie d&apos;authentification JWT (HttpOnly, Secure),
              valable 7 jours.
            </li>
          </ul>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">3. Finalité</h2>
          <p>
            Les données permettent d&apos;authentifier l&apos;utilisateur,
            d&apos;orchestrer le jeu en temps réel, de calculer le classement et
            d&apos;assurer la modération des échanges.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">4. Conservation</h2>
          <p>
            Les données de compte sont conservées tant que le compte existe. Les
            scores et historiques de parties restent liés au compte. Les cookies
            de session expirent après 7 jours d&apos;inactivité.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">5. Droits RGPD</h2>
          <p>
            Vous pouvez à tout moment consulter ou modifier vos données depuis
            votre profil. Pour toute demande d&apos;accès, de rectification ou de
            suppression complète du compte, contactez l&apos;équipe via
            l&apos;adresse indiquée dans les mentions légales.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">6. Cookies</h2>
          <p>
            Un unique cookie d&apos;authentification est déposé après connexion.
            Aucun cookie de mesure d&apos;audience, aucun tracker tiers.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">7. Partage</h2>
          <p>
            Aucune donnée n&apos;est cédée ni revendue à un tiers. Les seules
            communications sortantes sont l&apos;API OAuth de 42 pour la
            connexion sociale.
          </p>
        </section>
      </Panel>
    </main>
  );
}
