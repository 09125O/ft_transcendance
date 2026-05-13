# Documentation Map

Date: 2026-05-13
Statut: index de navigation du dossier `docs` pour l'etat courant de `dev`

## 1. Ordre de lecture recommande

Si tu dois comprendre rapidement le projet :

1. `README.md`
2. `docs/product/evaluation-conformity-matrix.md`
3. `docs/product/demo-checklist.md`
4. `docs/contracts/http-api-contract.md`
5. `docs/contracts/websocket-event-contract.md`

## 2. Organisation par usage

### Product

Docs de soutenance, perimetre et argumentaire d'evaluation :

- `docs/product/evaluation-conformity-matrix.md`
- `docs/product/demo-checklist.md`

### Contracts

Source de verite sur les interfaces HTTP et WebSocket :

- `docs/contracts/http-api-contract.md`
- `docs/contracts/websocket-event-contract.md`

### Integration

Docs de branchement entre les surfaces frontend, realtime et gameplay :

- `docs/integration/frontend-realtime-integration.md`
- `docs/integration/quiz-room-game-flow.md`

### Operations

Docs pour lancer, tester, exploiter et verifier la stack :

- `docs/operations/developer-guide.md`
- `docs/operations/status-backup-recovery-runbook.md`
- `docs/operations/browser-compatibility-matrix.md`

### Design

Intentions UI/UX et overrides de pages :

- `docs/design/system-guidelines.md`
- `docs/design/visual-direction.md`
- `docs/design/lobby-page.md`
- `docs/design/game-room-page.md`

### Archive

Historique projet et process internes, a ne pas traiter comme source de verite implementation :

- `docs/archive/historical/backend-front-enablement-spec.md`
- `docs/archive/historical/front-handover-roadmap.md`
- `docs/archive/process/codex-binome-guide.md`

## 3. Regles de verite

- si `docs/archive/` contredit le code, l'archive a tort
- si `docs/contracts/` contredit le code, le contrat ou le code doit etre corrige dans la meme PR
- si `docs/product/` contredit les PDFs officiels, les PDFs ont raison
- la verite officielle du sujet reste dans `srcs_subject/*.pdf`
