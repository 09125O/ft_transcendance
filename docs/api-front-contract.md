# API Front Contract (Dev3)

Version: v1 (etat actuel de `dev` au 2026-04-18)
Scope: contrat front-back MVP pour auth, users, rooms, game, scores, friends, notifications

## Etat de persistance (important)

- Branche sur Prisma/PostgreSQL:
  - `auth` (login/register/session/logout via `User`)
  - `users` (`/users/me`, `/users/:id`, `/users/me` patch)
  - `friends` (`/friends`, `/friends/requests`, actions accept/decline/remove)
  - `notifications` (`/notifications`, `/notifications/:id/read`, `/notifications/read-all`)
  - `quizzes` (`/quizzes`, `/quizzes/:quizId`)
- `rooms`, `game` et `scores` sont egalement persistes via PostgreSQL/Prisma.

Consequence:
- Les routes `rooms/game/scores/friends/notifications` sont valides pour integration front MVP.
- La persistance est centralisee en base PostgreSQL via Prisma.

## Base URL et proxy

- Backend direct: `https://localhost:4000`
- Front dev server: `https://localhost:3000`
- Proxy Webpack actuellement configure sur:
  - `/api`, `/health`, `/auth`, `/users`, `/rooms`, `/game`, `/scores`, `/quizzes`, `/friends`, `/notifications`, `/socket.io`
- En dev, le front peut appeler directement:
  - `/auth`
  - `/users`
  - `/rooms`
  - `/game`
  - `/scores`
  - `/friends`
  - `/notifications`
  - `/quizzes`
  - `/api`
  - `/health`

Important:
- Toujours envoyer `credentials: "include"` cote front pour la session cookie.
- Les navigations HTML vers `/friends` et `/notifications` restent traitees par React Router; seules les requetes non HTML sont proxyfiees.

## Format de reponse (commun)

Succes:

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

Erreur:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

Codes d'erreur standards (selon statut HTTP):
- `BAD_REQUEST` (400)
- `UNAUTHORIZED` (401)
- `NOT_FOUND` (404)
- `CONFLICT` (409)
- `INTERNAL_SERVER_ERROR` (500)

## Session et cookie

- Cookie de session: `access_token` (JWT).
- Cree au login, supprime au logout.
- Options cookie:
  - `httpOnly: true`
  - `path: /`
  - `sameSite`: derive de `AUTH_COOKIE_SAMESITE` (defaut `lax`)
  - `secure`: derive de `AUTH_COOKIE_SECURE` (avec garde-fou `sameSite=none => secure=true`)

## Types utilises par le front

`SafeUser` (retour auth/session):

```ts
type SafeUser = {
  id: number;
  email: string;
  username: string;
  avatar_url: string | null;
  status: "online" | "offline";
  createdAt: string;
};
```

`PublicUser` (retour `GET /users/:id`):

```ts
type PublicUser = {
  id: number;
  username: string;
  avatar_url: string | null;
  status: "online" | "offline";
  createdAt: string;
};
```

`Room` public:

```ts
type Room = {
  id: number;
  name: string;
  ownerUserId?: number;
  quizId?: number;
  rounds: number;
  isPrivate: boolean;
  status: "waiting" | "playing" | "finished";
  players: Array<{ userId: number; joinedAt: string }>;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
};
```

`GameState`:

```ts
type GameState = {
  roomId: number;
  status: "waiting" | "playing" | "finished";
  currentQuestionId: number | null;
  currentQuestionNumber: number;
  totalQuestions: number;
  questionDurationMs: number | null;
  questionStartedAt: string | null;
  questionEndsAt: string | null;
  answersForCurrentQuestion: number;
  totalAnswers: number;
  leaderboard: Array<{ userId: number; score: number }>;
  winnerUserId: number | null;
  startedAt: string | null;
  endedAt: string | null;
  updatedAt: string;
};
```

`SubmitAnswerResult`:

```ts
type SubmitAnswerResult = {
  roomId: number;
  userId: number;
  questionId: number;
  selectedAnswerIndex: number;
  isCorrect: boolean;
  scoreDelta: number;
  userTotalScore: number;
  totalAnswers: number;
};
```

`UserScore`:

```ts
type UserScore = {
  userId: number;
  username: string;
  score: number;
  wins: number;
};
```

`Quiz`:

```ts
type Quiz = {
  id: number;
  title: string;
  createdAt: string;
  playCount: number;
  activeRoomCount: number;
  questionCount: number;
};
```

## Endpoints (contrat)

### Auth

Note:
- OAuth expose cote backend actuel: `42` uniquement (`/auth/42/start`, `/auth/42/callback`).
- Pas de route OAuth Google dans l'etat actuel de `dev`.

`POST /auth/register`
- Body:

```json
{
  "email": "user@example.com",
  "username": "player1",
  "password": "longsecuredpassword123!"
}
```

- Validation:
  - `email`: email valide
  - `username`: string min 2
  - `password`: string min 12
- Reponse: `201` avec `ApiResponse<SafeUser>` + cookie `access_token`
- Erreurs:
  - `409 CONFLICT` si email deja existant
  - `400 BAD_REQUEST` si body invalide

`POST /auth/login`
- Body:

```json
{
  "email": "user@example.com",
  "password": "longsecuredpassword123!"
}
```

- Reponse: `201` (ou `200` selon config future), `ApiResponse<SafeUser>`, + cookie `access_token`
- Erreurs:
  - `401 UNAUTHORIZED` si credentials invalides
  - `400 BAD_REQUEST` si body invalide

`POST /auth/guest`
- Body: vide (ou `{}` tolere)
- Reponse: `201`, `ApiResponse<SafeUser>`, + cookie `access_token`
- Effet: cree un utilisateur guest (`guest+...@guest.local`) et ouvre une session.

`GET /auth/42/start`
- Reponse: `302` redirect vers `https://api.intra.42.fr/oauth/authorize...`
- Erreur de config: redirect vers `${FRONTEND_ORIGIN}/login?oauth_error=...`

`GET /auth/42/callback?code=...&state=...`
- Reponse succes: `302` vers `${FRONTEND_ORIGIN}/` + cookie `access_token`
- Reponse erreur: `302` vers `${FRONTEND_ORIGIN}/login?oauth_error=...`

`POST /auth/logout`
- Body: vide (ou `{}` tolere)
- Reponse: `201` (ou `200` selon config future), `ApiResponse<{ loggedOut: true }>`
- Effet: suppression cookie `access_token`

`GET /auth/session`
- Auth: cookie `access_token` requis
- Reponse: `200`, `ApiResponse<SafeUser>`
- Erreurs:
  - `401 UNAUTHORIZED` si pas de cookie
  - `401 UNAUTHORIZED` si token invalide/expire
  - `404 NOT_FOUND` si user du token introuvable

### Users

`GET /users/me`
- Auth: cookie `access_token` requis
- Reponse: `200`, `ApiResponse<SafeUser>`
- Erreurs:
  - `401 UNAUTHORIZED`
  - `404 NOT_FOUND`

`GET /users/:id`
- Auth: cookie `access_token` requis
- Reponse: `200`, `ApiResponse<PublicUser>`
- Erreurs:
  - `401 UNAUTHORIZED`
  - `400 BAD_REQUEST` si `id` non numerique
  - `404 NOT_FOUND` si user absent

`PATCH /users/me`
- Auth: cookie `access_token` requis
- Body (au moins un champ):

```json
{
  "username": "new_name",
  "avatar_url": "https://example.com/avatar.png",
  "status": "online"
}
```

- Validation:
  - `username`: string 2..32
  - `avatar_url`: URL valide ou `null`
  - `status`: `online | offline`
- Reponse: `200`, `ApiResponse<SafeUser>`
- Erreurs:
  - `400 BAD_REQUEST` si payload vide/invalide
  - `401 UNAUTHORIZED`
  - `409 CONFLICT` si username deja pris

Note front actuelle:
- L'ecran profil edite actuellement `username` et `avatar_url`.
- Le champ `status` existe dans le contrat backend, mais le front affiche surtout le statut derive de la session (`online` / `offline`).

### Friends

`GET /friends`
- Auth: cookie `access_token` requis
- Reponse: `200`, `ApiResponse<FriendListEntry[]>`

```ts
type FriendListEntry = {
  userId: number;
  username: string;
  avatar_url: string | null;
  status: "online" | "offline";
  since: string;
};
```

`GET /friends/requests`
- Auth: cookie `access_token` requis
- Reponse: `200`, `ApiResponse<{ received: FriendRequestEntry[]; sent: FriendRequestEntry[] }>`

```ts
type FriendRequestEntry = {
  requestId: number;
  userId: number;
  username: string;
  avatar_url: string | null;
  status: "online" | "offline";
  createdAt: string;
};
```

`POST /friends/requests`
- Auth: cookie `access_token` requis
- Body:

```json
{
  "receiverUserId": 22
}
```

- Reponse: `201` (ou `200`), `ApiResponse<FriendRequestCreated>`
- Erreurs:
  - `400 BAD_REQUEST`
  - `401 UNAUTHORIZED`
  - `404 NOT_FOUND` si user cible absent
  - `409 CONFLICT` si self-request/deja ami/deja pending

`POST /friends/requests/:requestId/accept`
`POST /friends/requests/:requestId/decline`
- Auth: cookie `access_token` requis
- Reponse: `200`, `ApiResponse<{ requestId: number; status: "accepted" | "declined" }>`
- Erreurs:
  - `400 BAD_REQUEST`
  - `401 UNAUTHORIZED` si action non autorisee
  - `404 NOT_FOUND`
  - `409 CONFLICT` si request non pending

`DELETE /friends/:userId`
- Auth: cookie `access_token` requis
- Reponse: `200`, `ApiResponse<{ removed: true }>`
- Erreurs:
  - `400 BAD_REQUEST`
  - `401 UNAUTHORIZED`
  - `404 NOT_FOUND`

### Rooms

`GET /rooms`
- Reponse: `200`, `ApiResponse<Room[]>`

`GET /rooms/:roomId`
- Reponse: `200`, `ApiResponse<Room>`
- Erreurs:
  - `400 BAD_REQUEST` si `roomId` non numerique
  - `404 NOT_FOUND` si room absente

`POST /rooms`
- Auth: cookie `access_token` requis
- Body:

```json
{
  "name": "Lobby #1",
  "rounds": 5,
  "isPrivate": false,
  "quizId": 1
}
```

- Variante room privee:

```json
{
  "name": "Private room",
  "rounds": 3,
  "isPrivate": true,
  "quizId": 1,
  "password": "room1234"
}
```

- Validation:
  - `name`: string 2..40
  - `rounds`: int 1..20
  - `isPrivate`: boolean optionnel
  - `quizId`: int optionnel, lie la room aux questions du quiz
  - `password`: requis si `isPrivate=true`, string 4..64
- Reponse: `201`, `ApiResponse<Room>`
- Notes:
  - Si `quizId` est fourni, le backend verifie que le quiz existe et contient au moins une question.
  - Le nombre de manches effectif est limite au nombre de questions disponibles dans le quiz.
  - Si `quizId` est omis, le code tente d'utiliser un quiz par defaut nomme `"Culture générale"` au demarrage.
  - Le seed courant ne cree pas ce titre par defaut; sur une base seedee standard, omettre `quizId` peut donc faire echouer `room:start` avec `409 CONFLICT`.
  - La duree par question n'est pas configurable par room dans le contrat actuel; elle reste globale via `GAME_QUESTION_DURATION_MS`.

`POST /rooms/:roomId/join`
- Auth: cookie `access_token` requis
- Body:

```json
{
  "password": "room1234"
}
```

- `password` est optionnel pour room publique
- Pour une room privee:
  - `password` est obligatoire
  - l'utilisateur doit etre ami avec le owner de la room (`FriendRequests.status=accepted`), sauf le owner lui-meme
- Reponse: `201`, `ApiResponse<Room>`
- Erreurs:
  - `400 BAD_REQUEST`
  - `401 UNAUTHORIZED` si mauvais mot de passe
  - `401 UNAUTHORIZED` si room privee restreinte aux amis du owner
  - `409 CONFLICT` si room non joinable (etat different de `waiting`)
  - `404 NOT_FOUND` si room absente

### Game

`GET /game/:roomId/state`
- Auth: cookie `access_token` requis
- Reponse: `200`, `ApiResponse<GameState>`
- Erreurs:
  - `400 BAD_REQUEST`
  - `401 UNAUTHORIZED` si user hors room
  - `404 NOT_FOUND` si room absente

`POST /game/answer`
- Auth: cookie `access_token` requis
- Body:

```json
{
  "roomId": 1,
  "questionId": 101,
  "answerIndex": 1
}
```

- Validation:
  - `roomId`: int >= 1
  - `questionId`: int >= 1
  - `answerIndex`: int 0..3
- Reponse: `201`, `ApiResponse<SubmitAnswerResult>`
- Erreurs:
  - `400 BAD_REQUEST`
  - `404 NOT_FOUND` si room absente

### Scores

`GET /scores/leaderboard?limit=10`
- `limit` par defaut: `10`
- Reponse: `200`, `ApiResponse<UserScore[]>`
- Erreurs:
  - `400 BAD_REQUEST` si `limit` non numerique

`GET /scores/users/:userId`
- Reponse: `200`, `ApiResponse<UserScore>`
- Erreurs:
  - `400 BAD_REQUEST`
  - `404 NOT_FOUND` si score absent

Note front actuelle:
- Le profil consomme deja `GET /scores/users/:userId`.
- Il n'existe pas encore de page leaderboard globale dediee dans l'UI.

### Notifications

`GET /notifications?limit=20&cursor=...`
- Auth: cookie `access_token` requis
- Reponse: `200`, `ApiResponse<NotificationList>`

```ts
type NotificationItem = {
  id: number;
  type: "FRIEND_REQUEST_RECEIVED";
  title: string;
  payload: {
    requestId: number;
    fromUserId: number;
    fromUsername: string;
  };
  read: boolean;
  createdAt: string;
};

type NotificationList = {
  items: NotificationItem[];
  nextCursor: string | null;
};
```

`PATCH /notifications/:id/read`
- Auth: cookie `access_token` requis
- Reponse: `200`, `ApiResponse<{ read: true }>`

`PATCH /notifications/read-all`
- Auth: cookie `access_token` requis
- Reponse: `200`, `ApiResponse<{ readAll: true }>`

Limite actuelle:
- aucun endpoint de suppression n'est expose dans l'etat actuel

### Quizzes

`GET /quizzes`
- Reponse: `200`, `ApiResponse<Quiz[]>`
- Notes:
  - chaque quiz remonte maintenant `playCount` (nombre de parties historisées) et `activeRoomCount` (rooms actuellement ouvertes)
  - le contenu des questions n'est pas expose par l'API publique quiz avant le demarrage d'une partie (fair-play)
  - utiliser `questionCount` pour l'affichage du volume de questions
  - l'UI peut s'appuyer sur ces champs pour afficher `Les plus joués` sans système de note publique
  - le seed de lancement fournit un premier catalogue orienté `Code & Algo`, `Gaming`, `Startup & Tech` et `Stages & Carrière`

`GET /quizzes/:quizId`
- Reponse: `200`, `ApiResponse<Quiz>`
- Note: meme contrat masque que `GET /quizzes` (metadata + `questionCount`, sans contenu de questions)
- Erreurs:
  - `400 BAD_REQUEST`
  - `404 NOT_FOUND` si quiz absent

`POST /quizzes`
- Auth: cookie `access_token` requis
- Body:

```json
{
  "title": "Culture generale",
  "questions": [
    {
      "questionText": "Capitale de la France ?",
      "answers": ["Berlin", "Paris", "Rome", "Madrid"],
      "correctAnswerIndex": 1,
      "points": 2
    }
  ]
}
```

- Validation:
  - `title`: string 2..120
  - `questions`: array 1..50
  - `questionText`: string 1..500
  - `answers`: array 2..4 de strings non vides
  - `correctAnswerIndex`: int 0..3 et inferieur a `answers.length`
  - `points`: int 1..1000 optionnel
- Reponse: `201`, `ApiResponse<Quiz>`
- Erreurs:
  - `401 UNAUTHORIZED`
  - `429 TOO_MANY_REQUESTS` apres abus de creation

Notes:
- route protegee par `AuthGuard`
- throttle dedie: `10` creations par minute
- le front actuel expose un ecran de creation de quiz dans le lobby

## Notes de stabilite

- Ce contrat est la reference front pour cloturer Dev3 semaine 1.
- Tant qu'il n'y a pas de RFC d'equipe, on ne change pas:
  - enveloppe `success/data/error`
  - noms des routes ci-dessus
  - champs `email/username/password` pour register
