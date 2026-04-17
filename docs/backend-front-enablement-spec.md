# Backend Front Enablement Spec

Date: 2026-04-17  
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

### Bloc C - Notifications minimales

Statut: implemente (MVP)

Endpoints:
- `GET /notifications?limit=20&cursor=...`
- `PATCH /notifications/:id/read`
- `PATCH /notifications/read-all`

Realtime:
- event WS `notification:new` emis a la creation d'une demande d'ami.

Notes:
- Les notifications sont derivees des demandes d'ami (`friendRequests`) en base.

### Bloc D - Spectateur

Statut: implemente

Events WS:
- inbound `room:spectate`
- outbound `room:spectated`
- outbound `room:spectators:update`

Regles:
- un spectateur ne peut pas faire `room:start` ni `game:answer` (`UNAUTHORIZED`).

## Contrats a utiliser

- REST: `docs/api-front-contract.md`
- WebSocket: `docs/ws-event-contract.md`
- Integration front realtime: `docs/front2-realtime-integration.md`
- Flux quiz -> room -> game: `docs/quiz-room-game-integration.md`

## Points hors scope ou partiels

- OAuth Google: non expose dans les routes backend actuelles.
- 2FA: non implemente.
- SSR: non implemente.

## Checklist front de branchement rapide

1. Authentifier l'utilisateur (`/auth/login`, `/auth/register` ou `/auth/guest`).
2. Envoyer `credentials: "include"` sur toutes les requetes REST.
3. Ouvrir Socket.IO sur `/ws` avec cookies (`withCredentials: true`).
4. Brancher les erreurs standard (`success/data/error`) cote UI.
5. Filtrer les payloads WS par `roomId` avant rendu.
