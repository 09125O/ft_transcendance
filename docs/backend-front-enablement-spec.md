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
- `GET /users/:id`

Notes:
- Auth cookie obligatoire sur `users/me`.
- `PATCH /users/me` impose au moins un champ (`username`, `avatar_url`, `status`).
- Le front actuel edite surtout `username` et `avatar_url`; le `status` est surtout pilote par la session.

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

### Bloc C - Notifications minimales

Statut: implemente (MVP)

Endpoints:
- `GET /notifications?limit=20&cursor=...`
- `PATCH /notifications/:id/read`
- `PATCH /notifications/read-all`

Realtime:
- event WS `notification:new` emis a la creation d'une demande d'ami

Notes:
- Les notifications sont derivees des demandes d'ami (`friendRequests`) en base.
- Le front actuel les affiche et les marque comme lues.
- Il n'existe pas encore de suppression de notification ni de cloche navbar dediee.

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
- Le backend ne supporte pas encore une duree par question configurable par room; le timer reste global via `GAME_QUESTION_DURATION_MS`.

### Bloc E - Spectateur

Statut: implemente cote backend

Events WS:
- inbound `room:spectate`
- outbound `room:spectated`
- outbound `room:spectators:update`

Regles:
- un spectateur ne peut pas faire `room:start` ni `game:answer` (`UNAUTHORIZED`)
- la route UI spectateur dediee n'est pas encore exposee cote front

## Contrats a utiliser

- REST: `docs/api-front-contract.md`
- WebSocket: `docs/ws-event-contract.md`
- Integration front realtime: `docs/front2-realtime-integration.md`
- Flux quiz -> room -> game: `docs/quiz-room-game-integration.md`

## Points hors scope ou partiels

- OAuth Google: non expose dans les routes backend actuelles
- 2FA: non implemente
- SSR: non implemente
- Mode spectateur UI: pas encore implemente cote front, meme si le backend est pret
- Notifications delete/archive: non implemente

## Checklist front de branchement rapide

1. Authentifier l'utilisateur (`/auth/login`, `/auth/register` ou `/auth/guest`).
2. Envoyer `credentials: "include"` sur toutes les requetes REST.
3. Ouvrir Socket.IO sur `/ws` avec cookies (`withCredentials: true`).
4. Brancher les erreurs standard (`success/data/error`) cote UI.
5. Filtrer les payloads WS par `roomId` avant rendu.
