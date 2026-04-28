import Panel from "../components/Panel";

export default function TermsPage() {
  return (
    <main className="flex flex-1 justify-center px-[10%] py-10">
      <Panel className="w-full max-w-3xl gap-6 p-8 text-sm leading-relaxed">
        <h1 className="text-2xl font-semibold">Conditions d&apos;utilisation</h1>
        <p className="text-text/70">Dernière mise à jour : 17 avril 2026</p>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">1. Objet</h2>
          <p>
            Quiz Arena est une plateforme de quiz en ligne multijoueur temps
            réel. L&apos;accès au service est gratuit et nécessite la création
            d&apos;un compte ou une connexion via OAuth 42.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">2. Compte utilisateur</h2>
          <ul className="list-disc pl-6">
            <li>
              Le mot de passe doit comporter au moins 12 caractères et reste
              confidentiel.
            </li>
            <li>
              Un compte est personnel. Le partage d&apos;identifiants est
              interdit.
            </li>
            <li>
              Les informations renseignées doivent être exactes et non
              diffamatoires.
            </li>
          </ul>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">3. Comportement attendu</h2>
          <p>
            Les messages de chat, pseudonymes et avatars doivent rester
            respectueux. Sont interdits : propos haineux, harcèlement, spam,
            usurpation, tentative de triche ou d&apos;exploitation technique du
            service. L&apos;équipe peut suspendre un compte en cas de
            manquement.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">4. Propriété intellectuelle</h2>
          <p>
            Le code source du projet est disponible sur GitHub sous les termes
            du dépôt. Les questions de quiz, graphismes et textes de
            l&apos;interface appartiennent à l&apos;équipe du projet. Les
            marques et logos de tiers (42, etc.) restent la propriété de leurs
            ayants droit.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">5. Disponibilité</h2>
          <p>
            Le service est fourni « en l&apos;état », sans garantie de
            disponibilité ni d&apos;absence d&apos;erreur. Il peut être
            interrompu pour maintenance ou suspendu définitivement à
            l&apos;issue du projet académique.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">6. Responsabilité</h2>
          <p>
            L&apos;équipe ne saurait être tenue responsable des contenus postés
            par les utilisateurs ni de l&apos;usage qui est fait du service en
            dehors de sa finalité pédagogique. Aucune donnée sensible ne doit
            être publiée dans les chats ou les profils.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">7. Résiliation</h2>
          <p>
            L&apos;utilisateur peut demander la suppression de son compte à
            tout moment. Les scores et contributions passées peuvent rester
            anonymisés dans les classements agrégés.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">8. Droit applicable</h2>
          <p>
            Les présentes conditions sont régies par le droit français. En cas
            de litige, une résolution amiable sera privilégiée avant toute
            action judiciaire.
          </p>
        </section>
      </Panel>
    </main>
  );
}
