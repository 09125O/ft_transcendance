# WebSocket Event Contract (Back 3)

Version: `v1` (etat actuel de `dev` au 2026-04-18)
Namespace: `/ws`  
Transport: `socket.io`

## Authentification WS

- Le socket doit etre authentifie via cookie `access_token` (JWT) envoye au handshake.
- Si la session est invalide, le serveur emet `ws:auth:error` puis ferme le socket.

## Envelope commun

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
    "code": "CONFLICT",
    "message": "Question is not active"
  }
}
```

## Types de base

`Room`:

```json
{
  "id": 1,
  "name": "Lobby #1",
  "ownerUserId": 1,
  "quizId": 1,
  "rounds": 5,
  "isPrivate": false,
  "status": "waiting",
  "players": [{ "userId": 1, "joinedAt": "2026-04-08T10:00:00.000Z" }],
  "createdAt": "2026-04-08T10:00:00.000Z",
  "startedAt": null,
  "finishedAt": null
}
```

`GameState`:

```json
{
  "roomId": 1,
  "status": "playing",
  "currentQuestionId": 101,
  "currentQuestionNumber": 1,
  "totalQuestions": 5,
  "questionDurationMs": 10000,
  "questionStartedAt": "2026-04-08T10:00:00.000Z",
  "questionEndsAt": "2026-04-08T10:00:10.000Z",
  "answersForCurrentQuestion": 1,
  "totalAnswers": 3,
  "leaderboard": [{ "userId": 2, "score": 200 }],
  "winnerUserId": null,
  "startedAt": "2026-04-08T10:00:00.000Z",
  "endedAt": null,
  "updatedAt": "2026-04-08T10:00:00.000Z"
}
```

`LeaderboardEntry`:

```json
{
  "userId": 2,
  "score": 200
}
```

`RoomLeaderboard`:

```json
{
  "roomId": 1,
  "leaderboard": [{ "userId": 2, "score": 200 }]
}
```

## Client -> Server (inbound)

### `room:list`

Payload: none

### `room:create`

```json
{
  "name": "Lobby #1",
  "rounds": 5,
  "isPrivate": false,
  "password": "room1234",
  "quizId": 1,
  "userId": 1
}
```

Notes:
- `password` requis seulement si `isPrivate=true`.
- `quizId` optionnel, mais recommande pour les rooms creees depuis l'interface quiz.
- Si `quizId` est fourni, les questions de la partie viennent de ce quiz.
- `userId` optionnel; l'identite est derivee du socket JWT et verifiee.
- `quizId` invalide => `room:create:error` (`NOT_FOUND`), quiz vide => `CONFLICT`.

### `room:join`

```json
{
  "roomId": 1,
  "password": "room1234"
}
```

Notes:
- `room:join` reste autorise uniquement en `waiting`.
- Pour une room privee, le `password` est obligatoire.
- Pour une room privee, l'utilisateur doit etre ami avec le owner (`FriendRequests.status=accepted`), sauf le owner lui-meme.

### `room:leave`

```json
{
  "roomId": 1,
  "userId": 2
}
```

### `room:start`

```json
{
  "roomId": 1
}
```

Notes:
- `userId` peut etre omis sur tous les events: le backend derive l'identite depuis le socket JWT.
- Seul le owner de la room peut demarrer la partie.

### `room:spectate`

```json
{
  "roomId": 1
}
```

Notes:
- Join la room en mode lecture seule (spectateur).
- Un spectateur ne peut ni demarrer la partie, ni repondre.

### `game:answer`

```json
{
  "roomId": 1,
  "questionId": 101,
  "answerIndex": 1
}
```

### `chat:message`

```json
{
  "roomId": 1,
  "content": "Hello team"
}
```

## Server -> Client (outbound)

### Session

- `ws:connected`  
  Data:

```json
{
  "socketId": "socket-id",
  "userId": 2,
  "timestamp": "2026-04-08T10:00:00.000Z"
}
```

- `ws:auth:error`:

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

### Rooms

- `room:list`: `Room[]`
- `room:list-updated`: `Room[]`
- `room:created`: `Room`
- `room:joined`: `Room`
- `room:left`:

```json
{
  "roomId": 1,
  "userId": 2
}
```

- `room:state`: `Room`
- `room:started`: `Room`
- `room:closed`:

```json
{
  "roomId": 1,
  "reason": "room_empty"
}
```

Notes:
- `reason` vaut aujourd'hui `room_empty`, `socket_disconnect`, `room_waiting_ttl_expired` ou `room_finished_ttl_expired` selon le cas.

- `room:spectated`:

```json
{
  "roomId": 1,
  "spectatorCount": 3
}
```

- `room:spectators:update`:

```json
{
  "roomId": 1,
  "count": 3
}
```

### Game

- `game:started`:

```json
{
  "roomId": 1,
  "totalQuestions": 5,
  "questionDurationMs": 10000
}
```

- `game:question:started`:

```json
{
  "roomId": 1,
  "questionId": 101,
  "question": {
    "id": 101,
    "text": "Quel event WebSocket diffuse le compte a rebours ?",
    "options": ["game:start", "game:timer", "question:tick", "room:timer"]
  },
  "questionNumber": 1,
  "totalQuestions": 5,
  "durationMs": 10000,
  "startsAt": "2026-04-08T10:00:00.000Z",
  "endsAt": "2026-04-08T10:00:10.000Z"
}
```

Note:
- Le backend n'expose pas la bonne reponse dans ce payload.
- Si la room a un `quizId`, `question` correspond a une `QuizQuestion` persistante.
- Sinon, le code tente d'utiliser le quiz par defaut `"Culture générale"`.
- Le seed courant ne cree pas ce titre; sur une base seedee standard, omettre `quizId` peut donc mener a un echec de `room:start`.

- `game:timer`:

```json
{
  "roomId": 1,
  "questionId": 101,
  "questionNumber": 1,
  "totalQuestions": 5,
  "remainingMs": 7000,
  "endsAt": "2026-04-08T10:00:10.000Z"
}
```

- `game:question:timeout`:

```json
{
  "roomId": 1,
  "questionId": 101,
  "questionNumber": 1,
  "totalQuestions": 5
}
```

- `game:state`: `GameState`

- `game:answer:result`:

```json
{
  "roomId": 1,
  "userId": 2,
  "questionId": 101,
  "selectedAnswerIndex": 1,
  "correctAnswerIndex": 1,
  "isCorrect": true,
  "scoreDelta": 2,
  "userTotalScore": 4,
  "totalAnswers": 4
}
```

- `game:leaderboard`: `RoomLeaderboard`

- `game:ended`:

```json
{
  "roomId": 1,
  "reason": "timer_completed",
  "winnerUserId": 2,
  "leaderboard": [
    { "userId": 2, "score": 300 },
    { "userId": 1, "score": 100 }
  ]
}

Notes:
- `game:answer:result.correctAnswerIndex` permet au front d'afficher la bonne reponse apres une tentative.
- la question suivante peut demarrer avant `game:question:timeout` si tous les joueurs actifs ont deja repondu.
- `game:ended.reason` peut valoir `all_answered` (en plus de `timer_completed`).
```

### Chat

- `chat:message`:

```json
{
  "roomId": 1,
  "userId": 2,
  "content": "Hello team",
  "sentAt": "2026-04-08T10:00:00.000Z"
}
```

### Notifications

- `notification:new`:

```json
{
  "id": 44,
  "type": "FRIEND_REQUEST_RECEIVED",
  "title": "Nouvelle demande d'ami",
  "payload": {
    "requestId": 44,
    "fromUserId": 7,
    "fromUsername": "alice"
  },
  "read": false,
  "createdAt": "2026-04-16T10:00:00.000Z",
  "dismissible": true
}
```

Autres valeurs possibles:
- `FRIEND_REQUEST_ACCEPTED`
- `FRIEND_REQUEST_DECLINED`
- `FRIEND_REMOVED`

Notes:
- `id > 0` represente une notification derivee d'une demande d'ami pending
- `id < 0` represente une notification persistée cote backend

- `friends:sync`:

```json
{
  "reason": "request_accepted",
  "requestId": 44,
  "actorUserId": 7
}
```

Notes:
- `reason` peut valoir `request_created`, `request_accepted`, `request_declined` ou `friend_removed`.
- Cet event est un signal de resynchronisation UI (recharger listes friends/requests/notifications), pas une source d'etat complete.

## Error events

- `room:create:error`
- `room:join:error`
- `room:leave:error`
- `room:start:error`
- `room:spectate:error`
- `game:answer:error`
- `chat:message:error`
- `ws:auth:error`

Codes d'erreur possibles:
- `BAD_REQUEST`
- `UNAUTHORIZED`
- `NOT_FOUND`
- `CONFLICT`
- `INTERNAL_SERVER_ERROR`

## Regles metier MVP

- `room:join` autorise seulement en `waiting`.
- `room:join` sur room privee exige un mot de passe valide et une relation d'amitie acceptee avec le owner (sauf owner).
- `room:start` autorise seulement en `waiting`.
- Minimum joueurs au start:
  - room liee a un `quizId`: solo ou multijoueur (>= 1 joueur)
  - room sans `quizId`: >= 3 joueurs
- `game:answer` autorise seulement en `playing`.
- Un user ne peut repondre qu'une seule fois par question.
- Un socket est lie au `userId` du JWT pour toute sa duree de vie.
- Si un `userId` est fourni dans le payload et ne correspond pas au socket, la requete est refusee.
- `room:leave`, `game:answer` et `chat:message` refusent toute action hors membership room.
- `room:start` est reserve au owner de la room.
- `room:spectate` place le socket en mode lecture seule pour la room cible.
- Un spectateur ne peut pas emettre `room:start` ni `game:answer` (UNAUTHORIZED).
- Score cumule par user publie via `game:leaderboard`.
- Les rooms peuvent etre liees a un quiz via `Room.quizId`; dans ce cas l'ordre, le texte, les options, la bonne reponse et les points viennent des `QuizQuestion`.
- Si `quizId` est absent, le runtime tente de lire un quiz par defaut `"Culture générale"`.
- Le seed courant ne cree pas ce titre; sur une base seedee standard, il ne faut pas supposer que ce fallback sera disponible.
- Timer serveur par question (defaut 10s via `GAME_QUESTION_DURATION_MS`).
- Timeout auto d'une question puis question suivante.
- Fin auto de partie a la fin du cycle de questions.
- Fermeture auto de room quand elle devient vide.
- Si un user se deconnecte (plus aucun socket actif pour ce user), il est retire automatiquement des rooms apres un delai de grace de reconnexion (`ROOM_RECONNECT_GRACE_MS`, defaut 10000 ms).
- Si le user se reconnecte avant la fin du delai de grace, il reste membre des rooms en cours.
- Fermeture auto des rooms en attente (`waiting`) apres `ROOM_WAITING_TTL_MS` (defaut 1800000 ms, base sur `createdAt`).
- Fermeture auto des rooms terminees (`finished`) apres `ROOM_FINISHED_TTL_MS` (defaut 300000 ms, base sur `finishedAt`).
- Le nettoyage TTL est execute periodiquement toutes les `ROOM_CLEANUP_INTERVAL_MS` (defaut 30000 ms).
- Mettre `ROOM_WAITING_TTL_MS`, `ROOM_FINISHED_TTL_MS` ou `ROOM_CLEANUP_INTERVAL_MS` a `0` desactive la fermeture TTL correspondante.

## Notes scope

- Cette version est compatible avec la persistance Prisma/PostgreSQL actuelle.
