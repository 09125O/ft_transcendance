import Panel from "../Panel";
import SecondaryButton from "../SecondaryButton";

type RulesPanelProps = {
  onClose: () => void;
};

const ruleSteps = [
  {
    label: "1",
    title: "Lis la question",
    text: "Chaque manche affiche une question et plusieurs choix de réponse.",
  },
  {
    label: "2",
    title: "Réponds vite",
    text: "Sélectionne une proposition avant la fin du timer pour valider ton choix.",
  },
  {
    label: "3",
    title: "Marque des points",
    text: "Une bonne réponse ajoute les points de la question à ton score.",
  },
];

const ruleHighlights = [
  "Une seule réponse possible par question.",
  "Le classement se met à jour pendant la partie.",
  "Le meilleur score gagne à la fin du quiz.",
];

export default function RulesPanel({ onClose }: RulesPanelProps) {
  return (
    <Panel className="relative h-full w-full overflow-hidden px-5 py-5 sm:px-7 sm:py-6 lg:px-9">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--color-primary)_24%,transparent),transparent_50%),radial-gradient(circle_at_bottom_right,color-mix(in_srgb,var(--color-urgency)_18%,transparent),transparent_44%)]"
      />

      <div className="relative flex items-center justify-between gap-4">
        <div>
          <p className="font-kicker uppercase tracking-[0.24em] m-0 text-xs font-semibold text-primary">
            Mode quiz live
          </p>
          <h1 className="m-0 mt-2 text-3xl font-semibold leading-tight text-text sm:text-4xl">
            Règles de la partie
          </h1>
        </div>
        <SecondaryButton className="shrink-0 px-4 py-2 text-sm" onClick={onClose}>
          Fermer
        </SecondaryButton>
      </div>

      <div className="relative grid flex-1 items-center gap-6 py-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
        <div className="space-y-4">
          {ruleSteps.map((step) => (
            <div
              className="grid gap-4 rounded-[24px] border border-primary/20 bg-background/78 px-5 py-5 shadow-[0_22px_54px_-42px_color-mix(in_srgb,var(--color-primary)_80%,transparent)] sm:grid-cols-[3.5rem_minmax(0,1fr)]"
              key={step.label}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/30 bg-primary/15 text-lg font-semibold text-primary">
                {step.label}
              </span>
              <div>
                <h2 className="m-0 text-xl font-semibold text-text">
                  {step.title}
                </h2>
                <p className="text-text-muted m-0 mt-2 text-sm leading-6 sm:text-base">
                  {step.text}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-[26px] border border-urgency/25 bg-background/82 px-6 py-10 shadow-[0_28px_70px_-46px_color-mix(in_srgb,var(--color-urgency)_70%,transparent)]">
          <p className="font-kicker uppercase tracking-[0.24em] m-0 text-xs font-semibold text-urgency">
            À retenir
          </p>
          <div className="mt-5 space-y-4">
            {ruleHighlights.map((highlight) => (
              <div className="flex gap-3" key={highlight}>
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-urgency" />
                <p className="m-0 text-sm leading-6 text-text/82 sm:text-base">
                  {highlight}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-[22px] border border-success/25 bg-success/10 px-4 py-4">
            <p className="m-0 text-lg font-semibold text-success">
              Objectif
            </p>
            <p className="m-0 mt-2 text-sm leading-6 text-text/78">
              Termine avec le plus de points pour remporter le quiz.
            </p>
          </div>
        </div>
      </div>
    </Panel>
  );
}
