# Front2 Realtime Integration (Back3)

Version: etat actuel Back3
Namespace WS: `/ws`
Transport: `socket.io`

## Prerequis front

- Etre authentifie via `POST /auth/login` avant ouverture du socket.
- Ouvrir le socket avec `withCredentials: true` pour envoyer le cookie `access_token`.
- Si reception de `ws:auth:error`, forcer retour login.

## Handshake

- Event recu a la connexion:
  - `ws:connected`
  - `data`: `{ socketId, userId, timestamp }`

## Flux Lobby

1. Au mount lobby:
- emit `room:list`
- listen `room:list` (initial)
- listen `room:list-updated` (diffusions globales)

2. Creation room:
- emit `room:create` `{ name, rounds, isPrivate, quizId?, password? }`
- listen `room:created`
- listen `room:create:error`
- quand la room est creee depuis un quiz, envoyer `quizId` pour lier la partie aux questions persistantes

3. Rejoindre room:
- emit `room:join` `{ roomId, password? }`
- listen `room:joined`
- listen `room:join:error`

4. Quitter room:
- emit `room:leave` `{ roomId }`
- listen `room:left`
- listen `room:closed` (si room vide)
- listen `room:leave:error`

5. Spectateur:
- emit `room:spectate` `{ roomId }`
- listen `room:spectated`
- listen `room:spectators:update`
- un spectateur ne peut pas lancer `room:start` ni `game:answer`

## Flux Game

1. Start (owner only):
- emit `room:start` `{ roomId }`
- listen `room:started`
- listen `room:start:error`

2. Question / timer:
- listen `game:started`
- listen `game:question:started`
- payload contient:
  - `questionId`
  - `question: { id, text, options[] }`
  - `questionNumber`, `totalQuestions`, `durationMs`, `startsAt`, `endsAt`
- si la room a un `quizId`, `question` provient des `QuizQuestion` du quiz
- listen `game:timer`
- listen `game:question:timeout`
- listen `game:state` pour l'etat agrege de la partie

3. Reponse:
- emit `game:answer` `{ roomId, questionId, answerIndex }`
- listen `game:answer:result`
- listen `game:state`
- listen `game:leaderboard`
  - payload: `{ roomId, leaderboard: [{ userId, score }] }`
  - filtrer strictement sur `roomId` cote front avant mise a jour UI
- listen `game:answer:error`

4. Fin:
- listen `game:ended`
- `GET /scores/leaderboard` reflète maintenant le resultat cumule des parties terminees

## Flux Chat

- emit `chat:message` `{ roomId, content }`
- listen `chat:message`
- listen `chat:message:error`

## Flux Notifications

- listen `notification:new` pour nouvelles demandes d'amis
- fallback HTTP: `GET /notifications`

## Erreurs a gerer cote front

- `UNAUTHORIZED`:
  - session expiree
  - user hors room
  - start sans etre owner
- `CONFLICT`:
  - reponse double
  - question inactive
  - room non joinable
- `BAD_REQUEST`:
  - payload invalide

## Etat minimal UI recommande

- Lobby:
  - `roomsLoading`, `roomsError`, `rooms[]`
- Room:
  - `roomState`, `roomError`
- Game:
  - `currentQuestion`, `timerMs`, `leaderboard`, `answerError`
- Chat:
  - `messages[]`, `chatError`

## Notes integration

- Ne pas faire confiance au `userId` UI seul: le backend valide contre le socket authentifie.
- Les services `rooms/game/scores` sont persistes via Prisma/PostgreSQL.
- Le front doit utiliser `POST /rooms` avec `quizId` pour les rooms creees depuis un quiz; le backend stocke ce lien dans `Room.quizId`.
- Le backend limite `rounds` au nombre de questions disponibles dans le quiz.
- Pour la recette, lancer:
  - `make up`
  - `cd backend && npm run test:ws-smoke`
