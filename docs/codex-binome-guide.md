# Codex Binome Guide (Backend + Frontend)

Date: 2026-04-18
Scope: mode de travail pour 2 personnes avec Codex, sans blocage inter-scope.

## 1) Objectif

Ce guide definit un cadre simple:
- garder la vitesse de livraison,
- garder la conformite sur le scope retenu,
- permettre a chacun de toucher le scope de l'autre si necessaire,
- imposer une trace documentaire claire a chaque changement.

## 2) Repartition des tickets (owner principal)

- Ticket A - Game customization options:
  - Owner principal: Backend
  - Support: Frontend
- Ticket B - Stats / historique demonstrables:
  - Owner principal: Frontend
  - Support: Backend
- Ticket C - Support navigateurs additionnels + dossier de demo:
  - Owner principal: Frontend
  - Support: Backend
- Ticket D - Notification system:
  - Owner principal: Frontend
  - Support: Backend
- Ticket E - Health check + status page:
  - Owner principal: Backend
  - Support: Frontend

Regle: un owner principal par ticket. Le support peut coder directement dans l'autre scope si cela debloque.

Statut courant:
- Ticket A ferme le 2026-04-18
- Ticket B ferme le 2026-04-18
- Ticket C ferme le 2026-04-18
- Ticket D ferme le 2026-04-18
- Ticket E ferme le 2026-04-19

## 3) Modules non vises dans le plan interne courant

Ne pas rouvrir ces sujets sans decision explicite:

- mode spectateur cote UI
- `2FA`
- `SSR`

Important:
- ces modules existent bien dans les PDFs officiels
- cette liste ne change pas le sujet, elle borne seulement le plan interne courant

## 3bis) Rappel evaluation

References officielles:

- `srcs_subject/en.subject.pdf`
- `srcs_subject/Intra Projects ft_transcendence Edit.pdf`

Rappels:

- `Major = 2 points`
- `Minor = 1 point`
- minimum requis: `14`
- bonus pris en compte: `+5` max
- seuls les modules pleinement fonctionnels comptent
- un module incomplet vaut `0`
- le README doit lister clairement les modules revendiques et leur total

## 4) Regle cross-scope (obligatoire)

Chacun peut modifier backend ou frontend, meme hors scope principal, a condition de:

1. Documenter le changement dans la meme PR.
2. Mettre a jour les contrats si payload API/WS touche.
3. Mettre a jour la matrice sujet si statut impacte.
4. Ajouter une preuve de verification (test, script, scenario manuel).

## 5) Docs a mettre a jour selon impact

Toujours verifier ces fichiers:
- docs/sujet-conformite-matrice.md
- docs/front-handover-roadmap.md

Si HTTP API change:
- docs/api-front-contract.md

Si WebSocket change:
- docs/ws-event-contract.md
- docs/front2-realtime-integration.md

Si flux quiz -> room -> game change:
- docs/quiz-room-game-integration.md

## 6) Template PR minimum (a copier dans la description)

Summary:
- What changed:
- Why:

Cross-scope:
- Scope touched: Backend | Frontend | Both
- Owner ticket: Backend | Frontend

Contracts and docs:
- [ ] docs/api-front-contract.md updated (if HTTP changed)
- [ ] docs/ws-event-contract.md updated (if WS changed)
- [ ] docs/front2-realtime-integration.md updated (if realtime front flow changed)
- [ ] docs/quiz-room-game-integration.md updated (if quiz-room-game flow changed)
- [ ] docs/sujet-conformite-matrice.md updated (if status/proof changed)

Validation:
- Automated checks:
- Manual scenario:
- Risks and rollback:

## 7) Definition of Done (binome)

Une tache est terminee si:

1. Code compile et tests pertinents passent.
2. Contrat API/WS respecte.
3. Etats UI minimum couverts: loading, empty, error, ready.
4. Docs impactees mises a jour dans la meme PR.
5. Matrice sujet mise a jour avec preuve.

## 7bis) Regle commit binome

- Avant chaque commit `feature` ou `fix`, proposer le nom du commit et le valider.
- Garder des messages courts, explicites, en francais.

## 8) Prompt de depart Codex (recommande)

Utiliser ce prompt de base avant chaque ticket:

"""
Travaille avec ces contraintes:
- Respect strict des contrats docs/api-front-contract.md et docs/ws-event-contract.md.
- Si contrat change: update doc dans la meme PR.
- Update docs/sujet-conformite-matrice.md avec statut + preuve.
- Tu peux toucher backend et frontend pour debloquer, mais decris clairement l'impact cross-scope.
- Ne laisse aucun etat UI critique sans feedback: loading/empty/error/ready.
"""

## 9) Ordre de priorite commun

P0:
- Ticket C (support navigateurs additionnels + dossier de demo)
- Ticket E (health check + status page)

## 10) Anti-blocage

Si un blocage dure plus de 30 minutes:

1. Le support prend le scope bloque (cross-scope autorise).
2. Une note courte est ajoutee dans la PR: cause, correction, impacts.
3. Les docs de contrat sont alignees avant merge.

Ce guide est volontairement court: il doit accelerer l'execution, pas ajouter de bureaucratie.
