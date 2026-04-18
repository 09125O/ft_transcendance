# Codex Binome Guide (Backend + Frontend)

Date: 2026-04-18
Scope: mode de travail pour 2 personnes avec Codex, sans blocage inter-scope.

## 1) Objectif

Ce guide definit un cadre simple:
- garder la vitesse de livraison,
- garder la conformite sujet,
- permettre a chacun de toucher le scope de l'autre si necessaire,
- imposer une trace documentaire claire a chaque changement.

## 2) Repartition des tickets (owner principal)

- Ticket A - Duree par question vraiment branchee end-to-end:
  - Owner principal: Backend
  - Support: Frontend
- Ticket B - Fermeture spectator + stats/historique:
  - Owner principal: Frontend
  - Support: Backend
- Ticket C - QA multi-browser + dossier de demo + hygiene doc:
  - Owner principal: Frontend
  - Support: Backend

Regle: un owner principal par ticket. Le support peut coder directement dans l'autre scope si cela debloque.

## 3) Regle cross-scope (obligatoire)

Chacun peut modifier backend ou frontend, meme hors scope principal, a condition de:

1. Documenter le changement dans la meme PR.
2. Mettre a jour les contrats si payload API/WS touche.
3. Mettre a jour la matrice sujet si statut impacte.
4. Ajouter une preuve de verification (test, script, scenario manuel).

## 4) Docs a mettre a jour selon impact

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

## 5) Template PR minimum (a copier dans la description)

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

## 6) Definition of Done (binome)

Une tache est terminee si:

1. Code compile et tests pertinents passent.
2. Contrat API/WS respecte.
3. Etats UI minimum couverts: loading, empty, error, ready.
4. Docs impactees mises a jour dans la meme PR.
5. Matrice sujet mise a jour avec preuve.

## 6bis) Regle commit binome

- Avant chaque commit `feature` ou `fix`, proposer le nom du commit et le valider.
- Garder des messages courts, explicites, en francais.

## 7) Prompt de depart Codex (recommande)

Utiliser ce prompt de base avant chaque ticket:

"""
Travaille avec ces contraintes:
- Respect strict des contrats docs/api-front-contract.md et docs/ws-event-contract.md.
- Si contrat change: update doc dans la meme PR.
- Update docs/sujet-conformite-matrice.md avec statut + preuve.
- Tu peux toucher backend et frontend pour debloquer, mais decris clairement l'impact cross-scope.
- Ne laisse aucun etat UI critique sans feedback: loading/empty/error/ready.
"""

## 8) Ordre de priorite commun

P0:
- Ticket A (duree par question vraiment branchee end-to-end)
- Ticket B (spectateur + stats/historique demonstrables)

P1:
- Ticket C (QA navigateurs + dossier de demo + hygiene doc)

P2:
- SSR
- 2FA

## 9) Anti-blocage

Si un blocage dure plus de 30 minutes:

1. Le support prend le scope bloque (cross-scope autorise).
2. Une note courte est ajoutee dans la PR: cause, correction, impacts.
3. Les docs de contrat sont alignees avant merge.

Ce guide est volontairement court: il doit accelerer l'execution, pas ajouter de bureaucratie.
