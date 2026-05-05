# Front Handover Roadmap

Date: 2026-04-18
Contexte: le frontend et le backend sont alignes sur les flux critiques. Ce document suit les surfaces frontend effectivement utiles pour la soutenance et le chemin interne retenu pour viser `19` points a partir des exigences officielles de `en.subject.pdf` et `Intra Projects ft_transcendence Edit.pdf`.

Important:

- les modules officiels et leur score viennent uniquement des 2 PDFs
- cette roadmap ne redefinit pas le sujet
- elle decrit seulement l'ordre interne de priorisation retenu par le projet

## 1) Resume executif

Le front couvre aujourd'hui :

- auth locale / guest / OAuth 42
- lobby / room / game / chat
- creation de quiz et creation de room depuis un quiz
- profil utilisateur
- amis + demandes + notifications create/update/delete
- stats utilisateur dans le profil
- page `status` publique lisant `/health`

Lecture actuelle :

- aucun delta front critique ne bloque la cible interne `19 / 14`
- le front doit maintenant surtout rester lisible pour la demo evaluateur

## 2) Modules non vises dans le plan interne courant

Les points suivants existent bien dans le sujet officiel, mais ne font plus partie du plan actif retenu :

- mode spectateur cote UI
- `2FA`
- `SSR`

Note:
- la capacite backend `room:spectate` reste documentee et disponible, mais aucun parcours frontend dedie n'est prevu

## 3) Etat actuel (factuel)

### Deja exploitable cote front

- Auth locale + session cookie
- Auth guest
- OAuth 42
- Lobby rooms + join/create + game panel
- Creation de quiz
- Creation de room depuis un quiz
- Chat room
- Realtime question/timer/answers/leaderboard
- Profil utilisateur
- Page amis + demandes + notifications
- Stats utilisateur dans le profil
- Page leaderboard globale + historique recent

References:
- docs/api-front-contract.md
- docs/front2-realtime-integration.md
- docs/ws-event-contract.md
- docs/archive/historical/backend-front-enablement-spec.md

### Gaps front visibles dans le scope courant

- Pas de cloche notifications en navbar ni de pattern toast unifie
- pas de monitoring externe ni d'historique d'incident

## 4) Lots fermes a valoriser en demo

### Ticket R1 - Game customization options (ferme)

- `questionDurationMs` est transporte dans `POST /rooms`
- la creation de room depuis `QuizReadyPage` passe par un panneau de configuration dedie
- la duree reste visible en lobby, dans la room et pendant le timer de partie
- une option par defaut reste disponible via `GAME_QUESTION_DURATION_MS`

Reference sujet:
- "Different maps or themes"
- "Customizable game settings"
- "Default options must be available"

Statut:
- ferme et demonstrable

### Ticket R2 - Game statistics and match history (ferme)

- page `LeaderboardPage` ajoutee au routing et a la navigation
- `GET /scores/leaderboard` expose maintenant score, wins, losses, games played, rank et level
- `GET /scores/users/:userId/history` expose l'historique de matchs avec date, resultat, rang et opposants
- le profil affiche maintenant stats enrichies + historique recent
- progression et achievements visibles sur la page leaderboard

Reference sujet:
- "Track user game statistics (wins, losses, ranking, level, etc.)"
- "Display match history (1v1 games, dates, results, opponents)"
- "Show achievements and progression"
- "Leaderboard integration"

Statut:
- ferme et demonstrable

### Ticket R3 - Support for additional browsers (ferme)

- suite Playwright ajoutee dans `frontend/tests/browser-compat.spec.ts`
- config versionnee dans `frontend/playwright.config.ts`
- commande repo `make browser-test`
- matrice de preuve `docs/browser-compatibility-matrix.md`
- parcours verifies sur `chromium`, `firefox` et `webkit`

Reference sujet:
- "Full compatibility with at least 2 additional browsers (Firefox, Safari, Edge, etc.)"
- "Test and fix all features in each browser"
- "Document any browser-specific limitations"
- "Consistent UI/UX across all supported browsers"

Definition of Done:
- checklist versionnee
- limitations explicites
- aucun bug critique bloqueur sur les browsers annonces

Statut:
- ferme et demonstrable

### Ticket R4 - Notification system (ferme)

- `notification:new` consomme cote front
- lecture individuelle et globale (`markRead`, `markAllRead`)
- suppression disponible dans l'UI (`DELETE /notifications/:id`)
- notifications derivees des demandes pending + notifications persistees pour accept/refuse/remove

Reference sujet:
- "A complete notification system for all creation, update, and deletion actions"

Definition of Done:
- create/update/delete demonstrables
- comportement front documente
- pas de claim ambigu entre HTTP seul et WS
- surface UI suffisante pour une demo evaluateur

### Ticket R5 - Health check & status page (ferme)

- route `/status` ajoutee cote front
- lecture de `/health` via `frontend/src/services/health.ts`
- etats visuels `Interface`, `API NestJS`, `PostgreSQL`, `Sauvegarde automatisee`
- sidecar `backup` versionne dans `docker-compose.yml`
- commandes `make backup-db`, `make restore-db` et `make logs-backup`
- runbook `docs/ops-status-backup-recovery.md`

Reference sujet:
- "Health check and status page system with automated backups and disaster recovery procedures"

Definition of Done:
- status page accessible
- sauvegarde automatisee visible dans `/status` et `/health`
- preuves de sauvegarde / recovery documentees
- module revendicable sans extrapolation

Statut:
- ferme et demonstrable

## 5) Contrats techniques pour le dev front

### API / Auth

- Toujours envoyer `credentials: include`
- Gerer les erreurs standard `success/data/error`
- Rediriger vers login sur `UNAUTHORIZED` quand la session est expiree

### Realtime

- Filtrer strictement les payloads par `roomId`
- Ne jamais faire confiance a `userId` fourni par l'UI
- Traiter `ws:auth:error` comme une invalidation session
- Respecter le delai de grace de reconnexion documente dans `docs/front2-realtime-integration.md`

### Etats UI minimaux par vue

- `loading`
- `empty`
- `error`
- `ready`

## 6) Priorites restantes hors score cible

P2:
- accessibilite / a11y de finition
- polish visuel secondaire

## 7) Risques et dependances

- Risque principal: sur-promettre dans la soutenance plus que dans la demo
- Dependance: rester strictement aligne avec les contrats API/WS deja exposes cote backend
- Mitigation: centrer le discours sur les parcours montrables et sur le chemin principal interne vers `19`
- Spec backend de rattrapage: docs/archive/historical/backend-front-enablement-spec.md

## 8) Commandes utiles front

- Lancer stack: `make up`
- Smoke global: `make smoke-test`
- WS smoke backend: `make smoke-test-ws`
- Lint front: `cd frontend && npm run lint`
- Build front: `cd frontend && npm run build`

## 9) Livrables attendus

- Navigation front enrichie: home, login, register, profil, amis, leaderboard
- UX realtime stabilisee (erreurs, etats, feedback)
- Status page minimale et preuves ops
- runbook status / backup / restore
- Checklist QA navigateurs (`docs/browser-compatibility-matrix.md`)
- Dossier de demo oriente sujet (preuves fonctionnelles)
- Checklist de soutenance [docs/soutenance-demo-checklist.md](/Users/d9125/Downloads/transcendance-dev/docs/soutenance-demo-checklist.md)

## 10) Hygiene documentaire

- A chaque PR: verifier que les sections API/WS impactees sont a jour
- Verifier que README pointe vers les bons documents
- Refuser merge si l'ecart doc/impl existe sur un flux critique
- Mettre a jour la matrice apres chaque lot ferme ou changement de claim

## 11) Quick wins doc

1. Maintenir les 2 PDFs comme source de verite sujet et `docs/sujet-conformite-matrice.md` comme lecture de travail derivee.
2. Garder une mini checklist de demo executable sans connaissance interne du code.
3. Verifier que cette roadmap reste descriptive du reel et non du plan passe.
