# Front2 Realtime Integration

Version: etat actuel de `dev` au 2026-05-13, rafraichi par lecture statique code/doc
Namespace WS: `/ws`
Transport: `socket.io`

## Prerequis front

- Etre authentifie via `POST /auth/login`, `POST /auth/register` ou `POST /auth/guest` avant ouverture du socket.
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
- emit `room:create` `{ name, rounds, questionDurationMs?, isPrivate, quizId?, password? }`
- listen `room:created`
- listen `room:create:error`
- quand la room est creee depuis un quiz, envoyer `quizId` pour lier la partie aux questions persistantes
- `questionDurationMs` permet de personnaliser la duree par question de la room
- `questionDurationMs` est borne cote backend entre `5000` et `30000` ms; si absent, le backend utilise `GAME_QUESTION_DURATION_MS`
- sans `quizId`, le code tente d'utiliser un quiz par defaut `"Culture générale"`
- le seed courant ne cree pas ce titre; en pratique il faut fournir `quizId` ou accepter un echec possible au `room:start`

3. Rejoindre room:
- emit `room:join` `{ roomId, password? }`
- listen `room:joined`
- listen `room:join:error`
- si la room est privee: `password` requis + membre oblige d'etre ami accepte du owner (sauf owner)

4. Quitter room:
- emit `room:leave` `{ roomId }`
- listen `room:left`
- listen `room:closed` (si room vide)
- listen `room:leave:error`
- `room:leave` est une sortie volontaire immediate.

4bis. Disconnect/reconnect navigateur:
- une coupure socket (refresh, perte reseau courte) ne retire pas immediatement le joueur de la room
- le backend attend un delai de grace (`ROOM_RECONNECT_GRACE_MS`, defaut 10000 ms)
- si la reconnexion a lieu avant expiration, le joueur conserve son membership room
- si le delai expire sans reconnexion, le backend emet les mises a jour `room:state` / `room:list-updated` correspondantes

4ter. Fermeture auto room (TTL):
- une room `waiting` peut etre fermee automatiquement apres `ROOM_WAITING_TTL_MS`
- une room `finished` peut etre fermee automatiquement apres `ROOM_FINISHED_TTL_MS`
- ecouter `room:closed` (reasons possibles: `room_waiting_ttl_expired`, `room_finished_ttl_expired`)

5. Spectateur:
- emit `room:spectate` `{ roomId }`
- listen `room:spectated`
- listen `room:spectators:update`
- un spectateur ne peut pas lancer `room:start` ni `game:answer`
- une room privee ne peut pas etre spectatee par un tiers hors room
- cette capacite reste exposee cote backend, mais aucun parcours UI dedie n'est prevu dans le scope frontend courant

## Flux Game

1. Start (owner only):
- emit `room:start` `{ roomId }`
- listen `room:started`
- listen `room:start:error`
- precondition metier:
  - room liee a un `quizId`: solo ou multijoueur (>= 1 joueur)
  - room sans `quizId`: au moins 3 joueurs dans la room

2. Question / timer:
- listen `game:started`
- listen `game:question:started`
- payload contient:
  - `questionId`
  - `question: { id, text, options[] }`
  - `questionNumber`, `totalQuestions`, `durationMs`, `startsAt`, `endsAt`
- si la room a un `quizId`, `question` provient des `QuizQuestion` du quiz
- l'ordre de partie est melange au lancement, puis persiste pour la room en cours
- listen `game:timer`
- listen `game:question:timeout`
- attention: la question suivante peut aussi partir immediatement si tous les joueurs ont repondu (sans attendre le timeout)
- listen `game:state` pour l'etat agrege de la partie

3. Reponse:
- emit `game:answer` `{ roomId, questionId, answerIndex }`
- listen `game:answer:result`
  - event emis uniquement au joueur qui vient de repondre
  - payload peut inclure `correctAnswerIndex` pour le feedback individuel, mais cette donnee n'est pas diffusee a toute la room
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

- capacite backend disponible: `notification:new` pour nouvelles demandes d'amis, acceptations, refus et suppressions d'amis
- implementation frontend actuelle: ecoute WS (`notification:new`, `friends:sync`) + refresh HTTP via `GET /notifications`, `GET /friends`, `GET /friends/requests`
- `friends:sync` sert de signal pour rendre instantanees les mises a jour de demandes et relations (create/accept/decline/remove)

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
- Si le quiz par defaut est absent et qu'aucun `quizId` n'est fourni, `room:start` echoue (`CONFLICT`).
- Pour la recette, lancer:
  - `make restart`
  - `cd backend && npm run test:ws-smoke`
