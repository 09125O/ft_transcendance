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
- centre de notifications dans la page amis avec lecture, suppression et temps reel
- reconnexion room apres refresh/perte reseau courte grace a `ROOM_RECONNECT_GRACE_MS`

Points encore partiels ou non implementes :

- pas de page leaderboard globale ni d'historique de parties dedie
- pas de recette multi-browser formelle documentee

Decisions internes de priorisation pour le projet courant :

- mode spectateur UI
- `2FA`
- `SSR`

Important :
- ces modules existent bien dans `srcs_subject/en.subject.pdf`
- cette liste n'est pas une reinterpretation du sujet, seulement une priorisation interne

## References evaluation

Sources officielles pour le barème et la revue :

- `srcs_subject/en.subject.pdf`
- `srcs_subject/Intra Projects ft_transcendence Edit.pdf`

Rappels issus de ces PDFs :

- `Major = 2 points`
- `Minor = 1 point`
- minimum requis pour valider : `14 points`
- seuls les modules pleinement fonctionnels comptent
- un module incomplet ou non demonstrable vaut `0 point`
- le bonus au-dela de `14` est plafonne a `+5`

Regle de lecture documentaire :

- verite officielle `sujet + evaluation` = `srcs_subject/en.subject.pdf` et `srcs_subject/Intra Projects ft_transcendence Edit.pdf`
- verite `implementation` = le code dans `frontend/`, `backend/` et les contrats techniques dans `docs/api-front-contract.md`, `docs/ws-event-contract.md`, `docs/front2-realtime-integration.md`
- les sections ci-dessous sont une lecture de pilotage interne, pas un remplacement des PDFs

## Modules claimed

Estimation interne argumentee aujourd'hui : `16 / 14`

Modules que le projet peut revendiquer aujourd'hui sans sur-promesse :

- `[Major][2]` Use a framework for both frontend and backend
- `[Major][2]` Implement real-time features
- `[Major][2]` Allow users to interact with other users
- `[Minor][1]` Use an ORM
- `[Minor][1]` Notification system
- `[Minor][1]` Remote authentication
- `[Minor][1]` Game customization options
- `[Major][2]` Web-based game
- `[Major][2]` Remote players
- `[Major][2]` Multiplayer (>2 players)

Total estime revendicable aujourd'hui : `16 points`

## Path to 19

Chemin interne retenu pour viser `19 / 14` avec le moins de risque :

- `[Minor][1]` Support for additional browsers
- `[Minor][1]` Game statistics and match history
- `[Minor][1]` Health check & status page

Ces 3 modules sont **vises**, mais pas encore revendiques comme valides tant qu'ils ne sont pas fermes et demonstrables.

Regle pratique pour la revue Intra :

- preferer `5` modules `Minor` fermes proprement plutot qu'un `Major` partiel
- ne pas rouvrir `mode spectateur UI`, `2FA` ou `SSR` dans ce plan interne vers `19`
- garder le README honnete : only claim what can actually be demonstrated

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
- `GAME_ANSWER_GRACE_MS`
- `ROOM_RECONNECT_GRACE_MS`
- `ROOM_CLEANUP_INTERVAL_MS`
- `ROOM_WAITING_TTL_MS`
- `ROOM_FINISHED_TTL_MS`
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
- `DELETE /notifications/:id`
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
- si `quizId` est omis a la creation d'une room, le code tente de demarrer avec un quiz par defaut nomme `"Culture générale"`; ce quiz n'est pas cree par le seed courant, donc fournir `quizId` est recommande
- `questionDurationMs` peut etre fourni a la creation d'une room; sans valeur explicite, le backend retombe sur `GAME_QUESTION_DURATION_MS`

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

La source de verite pour le barème reste les 2 PDFs du dossier `srcs_subject/`.
`docs/sujet-conformite-matrice.md` est une matrice de travail derivee de ces PDFs et de l'etat du code.

Pour la cible produit actuelle :

- score valide aujourd'hui : `14`
- score vise a terme : `19`
- score interne estime aujourd'hui : `15`
- modules actifs pour passer de `15` a `19` : `additional browsers`, `stats/history`, `game customization`, `health/status`

## Quand ajouter nginx

Ajouter un service `nginx` plus tard si tu veux :

- un seul point d'entree public
- servir un build frontend statique
- faire du reverse proxy `/api`
- preparer une architecture de production
