# ft_transcendance quickstart

Base de travail actuelle pour lancer la stack locale, verifier les flux critiques et retrouver rapidement les documents de reference.

## Services

- `frontend`: React + TypeScript + Webpack Dev Server, accessible sur `https://localhost:3000`
- `backend`: NestJS + TypeScript + Prisma, accessible sur `https://localhost:4000`
- `db`: PostgreSQL, accessible sur `localhost:5432`

Le frontend proxifie les appels API et WebSocket vers le backend. En developpement, `nginx` n'est pas necessaire.

Le backend synchronise ses dependances, regenere le client Prisma et applique les migrations presentes dans `backend/prisma/migrations` au demarrage du conteneur.

## Etat actuel du produit

Disponible et demonstrable aujourd'hui :

- auth locale, guest et OAuth 42
- lobby quiz/rooms avec join, create et start
- partie realtime avec timer serveur, reponses, leaderboard et chat
- creation de quiz et creation de room depuis un quiz
- pages `profile` et `friends`
- centre de notifications minimal dans la page amis
- reconnexion room apres refresh/perte reseau courte grace a `ROOM_RECONNECT_GRACE_MS`

Points encore partiels ou non implementes :

- pas de route UI spectateur dediee, meme si le backend supporte `room:spectate`
- pas de page leaderboard globale ni d'historique de parties dedie
- le selecteur "temps par question" de creation de room n'est pas encore branche au backend
- pas de recette multi-browser formelle documentee
- `2FA` et `SSR` non implementes

## Demarrage local

```bash
make env-init
make tls-trust
make env-check
make up
make test-stack
make logs
```

Notes :

- `.env.example` contient des valeurs de dev directement utilisables
- si tu modifies les credentials Postgres apres la premiere initialisation, pense a reinitialiser le volume local avec `make fclean`
- la confiance TLS locale repose sur `mkcert`; `make tls-trust` est a lancer une fois par machine

## Qualite et verification

Commandes utiles :

- `cd backend && npm run lint`
- `cd frontend && npm run lint`
- `cd backend && npm run build`
- `cd frontend && npm run build`
- `bash scripts/lint-shell.sh`
- `bash scripts/smoke-test.sh`
- `docker exec quiz_backend npm run test:ws-smoke`
- `docker exec quiz_backend npm run test:ws-critical`
- `docker exec quiz_backend npm run test:rate-limit`
- `docker exec quiz_backend npm run test:integration:social`

La CI GitHub Actions verifie :

- lint backend/frontend
- shellcheck
- build backend/frontend
- demarrage Docker complet
- smoke test global
- smoke tests WebSocket
- test de rate limiting HTTP
- test d'integration social

Le workflow peut fonctionner :

- sans secret GitHub, avec des valeurs CI de secours
- avec des secrets de repo nommes `CI_POSTGRES_USER`, `CI_POSTGRES_PASSWORD`, `CI_POSTGRES_DB`, `CI_POSTGRES_PORT`, `CI_DATABASE_URL`, `CI_BACKEND_PORT`, `CI_FRONTEND_PORT`, `CI_JWT_SECRET`

## Secrets et variables

- Le projet charge ses variables depuis `.env`
- Le fichier versionne est `.env.example`
- Ne jamais commiter une vraie valeur secrete dans `.env`

Variables principales :

- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `POSTGRES_PORT`
- `DATABASE_URL`
- `BACKEND_PORT`
- `FRONTEND_PORT`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `FRONTEND_ORIGIN`
- `GAME_QUESTION_DURATION_MS`
- `ROOM_RECONNECT_GRACE_MS`
- `AUTH_COOKIE_SAMESITE`
- `AUTH_COOKIE_SECURE`
- `FT_CLIENT_ID`
- `FT_CLIENT_SECRET`
- `FT_REDIRECT_URI`
- `FT_SCOPE`
- `OAUTH_HTTP_TIMEOUT_MS`

## URLs utiles

- frontend : `https://localhost:3000`
- backend health : `https://localhost:4000/health`
- frontend health via proxy : `https://localhost:3000/health`
- page profil : `https://localhost:3000/profile`
- page amis : `https://localhost:3000/friends`

## API et temps reel

Le backend expose actuellement les blocs suivants :

- `auth`
- `users`
- `friends`
- `notifications`
- `rooms`
- `game`
- `scores`
- `quizzes`
- `ws` via Socket.IO sur `/ws`

Exemples de routes clefs :

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/guest`
- `GET /auth/42/start`
- `GET /auth/42/callback`
- `POST /auth/logout`
- `GET /auth/session`
- `GET /users/me`
- `PATCH /users/me`
- `GET /friends`
- `GET /friends/requests`
- `GET /notifications`
- `GET /rooms`
- `POST /rooms`
- `GET /game/:roomId/state`
- `GET /scores/leaderboard?limit=10`
- `GET /scores/users/:userId`
- `GET /quizzes`
- `GET /quizzes/:quizId`
- `POST /quizzes` avec cookie `access_token`

Important en dev :

- le proxy frontend couvre `/api`, `/health`, `/auth`, `/users`, `/rooms`, `/game`, `/scores`, `/quizzes`, `/friends`, `/notifications` et `/socket.io`
- les navigations HTML vers `/friends` et `/notifications` restent servies par React Router; seules les requetes non HTML sont proxyfiees vers le backend
- le front peut appeler ces routes directement sur `https://localhost:3000`
- utiliser `credentials: "include"` pour que la session cookie fonctionne
- l'auth OAuth exposee dans l'etat actuel est 42 uniquement
- `POST /quizzes` est protege par `AuthGuard` et throttle a `10` creations par minute
- le seed de dev charge maintenant un premier catalogue de quiz ancrés dans l'univers 42
- la duree par question reste globalement pilotee par `GAME_QUESTION_DURATION_MS`; elle n'est pas encore configurable par room

## Cartographie documentaire

Documents de reference a lire en priorite :

- `docs/api-front-contract.md`
- `docs/ws-event-contract.md`
- `docs/front2-realtime-integration.md`
- `docs/quiz-room-game-integration.md`
- `docs/backend-front-enablement-spec.md`
- `docs/front-handover-roadmap.md`
- `docs/design-system/transcendance-web-app/MASTER.md` (source design UI/UX)
- `docs/design-system/transcendance-web-app/pages/lobby.md` (overrides lobby)
- `docs/design-system/transcendance-web-app/pages/game-room.md` (overrides game room)
- `docs/sujet-conformite-matrice.md`
- `docs/codex-binome-guide.md`
- `dev.md`

## Conformite sujet

Etat documentaire courant :

- `8` lignes `Fait`
- `7` lignes `Partiel`
- `2` lignes `A faire`

La source de verite est `docs/sujet-conformite-matrice.md`.

## Quand ajouter nginx

Ajouter un service `nginx` plus tard si tu veux :

- un seul point d'entree public
- servir un build frontend statique
- faire du reverse proxy `/api`
- preparer une architecture de production
