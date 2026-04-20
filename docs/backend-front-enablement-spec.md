# Backend Front Enablement Spec

Date: 2026-04-18
Statut: document de reference (mise a jour implementation)

## Objectif

Donner une vue rapide de ce qui est effectivement disponible cote backend pour debloquer le front, et ce qui reste hors scope MVP.

## Etat reel par bloc

### Bloc A - Profil editable

Statut: implemente

Endpoints:
- `GET /users/me`
- `PATCH /users/me`
- `POST /users/me/avatar`
- `GET /users/:id`

Notes:
- Auth cookie obligatoire sur `users/me`.
- `PATCH /users/me` impose au moins un champ (`username`, `avatar_url`, `status`).
- `POST /users/me/avatar` accepte un `multipart/form-data` avec image <= `2 Mo`, expose ensuite le fichier via `/uploads/avatars/...`.
- Le front actuel edite `username`, propose un upload natif d'avatar, garde une URL optionnelle et laisse le `status` surtout pilote par la session.

### Bloc B - API Amis

Statut: implemente

Endpoints:
- `GET /friends`
- `GET /friends/requests`
- `POST /friends/requests`
- `POST /friends/requests/:requestId/accept`
- `POST /friends/requests/:requestId/decline`
- `DELETE /friends/:userId`

Notes:
- Bloc protege par auth.
- Regles metier en place: pas d'auto-demande, pas de doublon pending, controle receiver sur accept/decline.
- Le front actuel consomme deja ces endpoints dans `frontend/src/pages/FriendsPage.tsx`.

### Bloc C - Notifications

Statut: implemente

Endpoints:
- `GET /notifications?limit=20&cursor=...`
- `PATCH /notifications/:id/read`
- `PATCH /notifications/read-all`
- `DELETE /notifications/:id`

Realtime:
- event WS `notification:new` emis a la creation d'une demande d'ami
- event WS `notification:new` emis aussi pour `FRIEND_REQUEST_ACCEPTED`, `FRIEND_REQUEST_DECLINED` et `FRIEND_REMOVED`

Notes:
- Les notifications `FRIEND_REQUEST_RECEIVED` restent derivees des demandes d'ami pending.
- Les notifications d'acceptation, refus et suppression d'ami sont persistees en base via `Notification`.
- Le front actuel ecoute `notification:new`, affiche les notifications, les marque comme lues et permet leur suppression.

### Bloc D - Quiz / room lies

Statut: implemente

Endpoints:
- `GET /quizzes`
- `GET /quizzes/:quizId`
- `POST /quizzes`
- `POST /rooms` avec `quizId`

Notes:
- `POST /quizzes` est protege par auth et throttle a `10/min`.
- Le front actuel peut creer un quiz puis creer une room depuis ce quiz.
- Le backend expose aussi `playCount` et `activeRoomCount` dans les quiz listés pour supporter une popularité implicite.
- Le seed de dev fournit désormais un catalogue de lancement orienté 42 au lieu d'un simple quiz générique.
- Si `quizId` est omis, le code tente d'utiliser un quiz par defaut `"Culture générale"`; ce titre n'est pas cree par le seed courant.
- `POST /rooms` accepte maintenant `questionDurationMs` pour configurer la duree par question au niveau room.
- Si `questionDurationMs` est absent, le backend applique la valeur par defaut `GAME_QUESTION_DURATION_MS`.

### Bloc E - Spectateur

Statut: capacite backend exposee, hors scope frontend courant

Events WS:
- inbound `room:spectate`
- outbound `room:spectated`
- outbound `room:spectators:update`

Regles:
- un spectateur ne peut pas faire `room:start` ni `game:answer` (`UNAUTHORIZED`)
- aucun parcours UI dedie n'est prevu dans le projet courant

### Bloc F - Health / status / backup

Statut: implemente

Endpoints:
- `GET /health`

Surface front:
- page `GET /status` cote frontend

Ops:
- sidecar `backup` dans `docker-compose.yml`
- backup automatise via `scripts/auto-backup.sh`
- backup manuel via `make backup-db`
- restauration manuelle via `make restore-db file=...`

Notes:
- `/health` expose maintenant l'etat de la base et de la sauvegarde automatisee
- la page `status` lit cette reponse et l'affiche sous une forme lisible
- la sauvegarde est locale a la stack Docker du projet
- il n'y a pas de monitoring externe ni de console d'incident dediee

## Contrats a utiliser

- REST: `docs/api-front-contract.md`
- WebSocket: `docs/ws-event-contract.md`
- Integration front realtime: `docs/front2-realtime-integration.md`
- Flux quiz -> room -> game: `docs/quiz-room-game-integration.md`

## Points hors scope ou partiels

- OAuth Google: non expose dans les routes backend actuelles
- 2FA: hors scope du projet courant
- SSR: hors scope du projet courant
- Mode spectateur UI: hors scope du projet courant, meme si la capacite WS backend est conservee

## Checklist front de branchement rapide

1. Authentifier l'utilisateur (`/auth/login`, `/auth/register` ou `/auth/guest`).
2. Envoyer `credentials: "include"` sur toutes les requetes REST.
3. Ouvrir Socket.IO sur `/ws` avec cookies (`withCredentials: true`).
4. Brancher les erreurs standard (`success/data/error`) cote UI.
5. Filtrer les payloads WS par `roomId` avant rendu.
