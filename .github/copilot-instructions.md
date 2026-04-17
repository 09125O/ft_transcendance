# Repository Copilot Instructions

Objectif: garantir la conformite sujet et la stabilite du produit, sans bloquer la creativite front.

## Non negociable rules

1. Respecter les contrats:
- docs/api-front-contract.md
- docs/ws-event-contract.md
- docs/front2-realtime-integration.md
- docs/front-handover-roadmap.md
- docs/sujet-conformite-matrice.md

2. Ne jamais casser les flux critiques:
- auth/session
- room join/start
- game answer loop
- websocket auth

3. Si un changement modifie un contrat API/WS:
- mettre a jour la documentation dans la meme PR.
- decrire l'impact dans le resume PR.

4. Toute PR qui ferme un gap sujet doit mettre a jour:
- docs/sujet-conformite-matrice.md
- statut: Fait / Partiel / A faire
- preuve technique (endpoint, event, test, ecran)

## Creativity zone (allowed and encouraged)

1. Liberté sur:
- architecture de composants
- organisation hooks/services
- design system, UI layout, animations
- micro-interactions UX

2. Garder la compatibilite:
- ne pas changer les payloads API/WS sans mise a jour contrat
- ne pas introduire de comportement opaque pour l'utilisateur

3. Pour chaque ticket front:
- proposer au moins 1 amelioration UX creative non bloquante
- expliciter le compromis (simplicite, performance, lisibilite)

## Definition of Done

Une tache est terminee si:
- code compile et tests pertinents passent
- comportement conforme aux docs
- matrice sujet mise a jour si impact
- etats UI minimum couverts: loading, empty, error, ready

## Collaboration mode

1. Revue 1: conformite fonctionnelle (bloquante)
2. Revue 2: qualite UX/code (discussion, bloquante seulement si risque reel)

Ce cadre fixe le minimum qualite, mais laisse la solution technique et le style visuel libres.