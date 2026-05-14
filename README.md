*This project has been created as part of the 42 curriculum by douzgane, trischma, besch, siligh, gicomlan.*

# ft_transcendance - Quiz Arena

## Description

`ft_transcendance` is a full-stack web application built for the 42 `ft_transcendence` project. Our project name is **Quiz Arena**: a real-time multiplayer quiz platform where users can create accounts, manage profiles, interact socially, create or join quiz rooms, chat, play timed matches, and track scores.

The goal of the project is to demonstrate a complete web application with authentication, a persistent database, real-time gameplay, user interaction, operational checks, and a reproducible local setup.

Key features:

- Local, guest, and OAuth 42 authentication.
- Profile management with avatar upload.
- Friends, friend requests, user status, and social notifications.
- Quiz catalogue, quiz creation, public/private rooms, configurable question duration.
- Real-time multiplayer game loop with Socket.IO, server-side timer, answers, chat, and room leaderboard.
- Global leaderboard, user statistics, and match history.
- Health/status page, PostgreSQL automated backup sidecar, smoke tests, and browser compatibility checks.

## Team Information

| Member | Assigned role(s) | Main responsibilities |
|---|---|---|
| douzgane | Backend Developer | NestJS modules, authentication, OAuth 42, Prisma data access, rooms, game loop, scores, backend tests, smoke tests. |
| trischma | Frontend Developer | React pages and components, user flows, API/WebSocket integration, responsive UI, login/profile/friends/leaderboard/status/game screens. |
| besch | Project Manager, QA, DevOps | Work coordination, demo checklist, Makefile, Docker/Podman workflow, smoke tests, browser tests, status/backup operations. |
| siligh | Product Owner, Gameplay/Content | Product scope, defended modules, quiz catalogue, gameplay rules, question duration, scoring, demo path and user experience. |
| gicomlan | Tech Lead, Integration | Full-stack architecture, HTTP/WebSocket contracts, schema consistency, realtime integration, multiplayer validation, README coherence. |

Each member is expected to understand the complete path `frontend -> backend -> database -> websocket -> tests`, even if they had a main ownership area.

## Project Management

The work was organized by functional blocks:

- Authentication and user management.
- Social interactions and notifications.
- Quiz catalogue, rooms, and real-time game loop.
- Scores, leaderboard, and match history.
- Operations, health checks, backups, and verification.
- Evaluation preparation.

Project management approach:

- Tasks were split by feature ownership and reviewed against the 42 subject modules.
- The team used GitHub branches/issues and shared checklists to track implementation and evaluation readiness.
- Coordination was done through regular team syncs, Discord/voice communication, and repository reviews.
- Verification was based on concrete evidence: endpoints, WebSocket events, tests, demo routes, and validated integration behavior.

## Technical Stack

| Area | Technologies | Justification |
|---|---|---|
| Frontend | React, TypeScript, Webpack Dev Server, React Router | React gives a component model suited to stateful pages. TypeScript improves API/WS contract safety. Webpack Dev Server provides local proxying for HTTP and Socket.IO. |
| Backend | Node.js, NestJS, TypeScript, Socket.IO | NestJS gives a modular backend architecture with controllers/services. Socket.IO is used for reliable real-time rooms, chat, reconnect handling, and gameplay events. |
| Database | PostgreSQL | PostgreSQL is robust, relational, easy to run locally with containers, and well suited for users, rooms, games, answers, scores, and relationships. |
| ORM | Prisma | Prisma provides a typed schema, migrations, generated client, and safer database access from TypeScript. |
| Infrastructure | Docker Compose or Podman-compatible Compose, Makefile, shell scripts | Compose keeps the frontend, backend, database, and backup sidecar reproducible. The Makefile provides a single entry point for setup, run, logs, tests, backups, and restore. |
| Security and auth | JWT HTTP-only cookie, bcrypt, OAuth 42, helmet, rate limiting | HTTP-only cookies reduce token exposure in JavaScript, bcrypt stores passwords safely, OAuth 42 supports remote authentication, and rate limiting protects sensitive endpoints. |
| Testing and QA | Jest, Playwright, smoke scripts, WebSocket scenarios | Unit and scenario tests cover backend logic, browser compatibility, authentication, social flows, WebSocket rooms, and stack health. |

Local services:

| Service | Purpose | Default URL/port |
|---|---|---|
| `frontend` | React application and dev proxy | `https://localhost:3000` or `http://localhost:3000` |
| `backend` | NestJS API and WebSocket server | `https://localhost:4000` or `http://localhost:4000` |
| `db` | PostgreSQL database | `localhost:5432` |
| `backup` | PostgreSQL automated backup sidecar | no public port |

## Database Schema

The persistence layer is PostgreSQL managed through Prisma. Main relationships:

```text
User
 |--< FriendRequests >-- User
 |--< Notification
 |--< RoomPlayer >-- Room --< Messages
 |                    |--< RoomGameState
 |                    |--< Game >-- Quiz --< QuizQuestion
 |                              |--< GameQuestion >-- QuizQuestion
 |                              |--< PlayerAnswer >-- User
 |                              |--< Leaderboard >-- User
 |--< UserAggregateScore
```

Main tables:

| Table | Key fields | Purpose |
|---|---|---|
| `User` | `id Int`, `email String @unique`, `username String`, `password String`, `avatar_url String?`, `status UserStatus`, `createdAt DateTime` | Accounts, profile data, auth identity, online/offline status. |
| `FriendRequests` | `senderId Int`, `receiverId Int`, `status FriendshipStatus`, `receiverReadAt DateTime?`, `receiverDeletedAt DateTime?` | Friend request lifecycle. |
| `Notification` | `userId Int`, `type NotificationType`, `title String`, `payload Json`, `readAt DateTime?` | User-facing social notifications. |
| `Room` | `id Int`, `name String`, `ownerId Int?`, `quizId Int?`, `status RoomStatus`, `rounds Int`, `questionDurationMs Int`, `isPrivate Boolean`, `passwordHash String?` | Public/private multiplayer rooms linked optionally to a quiz. |
| `RoomPlayer` | composite key `[userId, roomId]`, `score Int`, `joinedAt DateTime` | Players currently associated with a room. |
| `Messages` | `senderId Int`, `roomId Int`, `content String`, `sendAt DateTime`, `read Boolean` | Room chat messages. |
| `RoomGameState` | `roomId Int`, `status RoomStatus`, `currentQuestionId Int?`, `questionStartedAt DateTime?`, `questionEndsAt DateTime?`, `scoresByUser Json?` | Runtime state persisted for active/recent games. |
| `Quiz` | `id Int`, `title String`, `createdAt DateTime` | Quiz catalogue and custom quizzes. |
| `QuizQuestion` | `quizId Int`, `questionText String`, `answers Json`, `correctAnswer String`, `position Int`, `points Int` | Questions and answers for a quiz. |
| `Game` | `roomId Int`, `quizId Int`, `status GameStatus`, `winnerUserId Int?`, `startedAt DateTime?`, `finishedAt DateTime?` | Persisted match instance. |
| `GameQuestion` | `gameId Int`, `questionId Int`, `position Int`, `startedAt DateTime?`, `endedAt DateTime?` | Questions selected for a match. |
| `PlayerAnswer` | `gameId Int`, `gameQuestionId Int`, `userId Int`, `answer String`, `isCorrect Boolean`, `pointsEarned Int` | Player answers and scoring. |
| `Leaderboard` | `gameId Int`, `userId Int`, `finalScore Int`, `rank Int?`, `isWinner Boolean` | Final per-game results. |
| `UserAggregateScore` | `userId Int`, `score Int`, `wins Int` | Aggregated user statistics. |

The full schema is available in [backend/prisma/schema.prisma](backend/prisma/schema.prisma).

## Features List

| Feature | Member(s) | Description |
|---|---|---|
| Local authentication | douzgane, trischma | Register, login, logout, session check, JWT HTTP-only cookie, password hashing. |
| Guest authentication | douzgane, trischma | One-click guest session for demos and local multiplayer testing. |
| OAuth 42 authentication | douzgane | OAuth 42 start/callback flow, state cookie, token exchange, profile creation/update. |
| Profile management | trischma, douzgane | View/update profile, user status, avatar upload, default avatar fallback. |
| Friends system | trischma, douzgane | Send, accept, decline, and remove friend requests. |
| Notifications | trischma, douzgane | Social notifications, read/delete actions, realtime sync event. |
| Quiz catalogue | siligh, trischma, douzgane | Seeded quiz content, quiz listing, quiz detail, play count and active room count. |
| Custom quiz creation | trischma, douzgane, siligh | Authenticated users can create quizzes and questions. |
| Room creation and joining | douzgane, trischma, siligh | Public/private rooms, optional password, room owner, quiz-linked rooms. |
| Game customization | siligh, douzgane, trischma | Configurable question duration, room privacy, quiz selection, rounds bounded by quiz. |
| Real-time game loop | douzgane, gicomlan, trischma | Socket.IO room events, start game, server-side timer, submit answers, state broadcasts. |
| Room chat | douzgane, trischma | WebSocket chat messages scoped to a room. |
| Multiplayer and remote players | gicomlan, douzgane, trischma | Multiple clients can join from the same host or LAN clients through the exposed frontend. |
| Leaderboard and history | douzgane, trischma | Global leaderboard, user score, wins/losses, match history and recent games. |
| Health and status page | besch, trischma, douzgane | `/health`, frontend `/status`, DB status, backup status, periodic refresh. |
| Backup and restore | besch | Automated backup sidecar, manual backup, restore command. |
| Smoke tests and browser tests | besch, douzgane, trischma | Stack smoke test, WebSocket smoke test, social integration test, Playwright browser compatibility. |
| Evaluation and demo preparation | besch, siligh, gicomlan | README, evaluation checklist, demo path, verification commands. |

## Chosen Modules and Points

Official scoring reminder:

- Major module = 2 points.
- Minor module = 1 point.
- Required minimum = 14 points.
- Only fully functional and demonstrable modules should be counted by evaluators.

Defended internal score: **19 / 14**.

| Module | Type | Points | Status | Justification and implementation | Member(s) |
|---|---:|---:|---|---|---|
| Use a framework for frontend and backend | Major | 2 | Done | React frontend and NestJS backend, both in TypeScript. | trischma, douzgane, gicomlan |
| Real-time features | Major | 2 | Done | Socket.IO events for room list, room create/join/leave/start, answer submission, chat, notifications, reconnect handling. | douzgane, gicomlan, trischma |
| User interaction | Major | 2 | Done | Profiles, friends, requests, status, chat, notifications. | trischma, douzgane |
| Standard user management and authentication | Major | 2 | Done | Register, login, logout, session, guest login, avatar/profile management, password hashing, JWT cookie. | douzgane, trischma |
| Web-based game | Major | 2 | Done | Browser-based quiz game, realtime state, timer, answers, scores, results. | douzgane, trischma, siligh |
| Remote players | Major | 2 | Done | Client/server architecture supports players from separate browsers or LAN machines through the frontend proxy and WebSocket server. | gicomlan, douzgane, besch |
| Multiplayer greater than 2 players | Major | 2 | Done | Rooms support several players, room leaderboard, game state and answer tracking per player. | douzgane, trischma |
| Use an ORM | Minor | 1 | Done | Prisma schema, migrations, generated typed client, PostgreSQL datasource. | douzgane |
| Remote authentication | Minor | 1 | Done | OAuth 42 flow using `/auth/42/start` and `/auth/42/callback`. | douzgane |
| Game customization options | Minor | 1 | Done | Private/public rooms, optional password, quiz-linked rooms, configurable `questionDurationMs`. | siligh, douzgane, trischma |
| Game statistics and match history | Minor | 1 | Done | Global leaderboard, aggregate score, wins/losses, user history endpoints and UI. | douzgane, trischma |
| Health check and status page | Minor | 1 | Done | `/health`, `/status`, DB check, backup check, stack verification commands. | besch, trischma, douzgane |

Total defended: `7 Major * 2 + 5 Minor * 1 = 19 points`.

Additional implemented work not claimed for the defended 19-point module path:

| Area | Status | Notes |
|---|---|---|
| Social notifications | Implemented, not claimed as a module | Implemented through `Notification` table, HTTP routes, realtime `notification:new`, and UI. It supports the user interaction feature but is not counted as an additional Minor module in the defended score. |
| Support for additional browsers | Implemented, not claimed as a module | Playwright browser compatibility checks are present, but this is not counted in the defended score. |

Explicitly not claimed:

- Two-factor authentication.
- Server-side rendering.
- Spectator mode in the user interface.

## Individual Contributions

### douzgane

- Implemented the NestJS backend structure and main modules.
- Implemented local, guest, and OAuth 42 authentication.
- Added Prisma/PostgreSQL persistence for users, rooms, game state, scores, friends, notifications, and quizzes.
- Implemented the WebSocket game runtime: room lifecycle, server timer, answer handling, chat, and score updates.
- Added backend tests and smoke scenarios.
- Challenge: keeping HTTP session auth and WebSocket auth consistent. Solution: centralized cookie/JWT validation and shared HTTP/WebSocket test coverage.

### trischma

- Built the React/TypeScript user interface.
- Implemented login, register, profile, friends, leaderboard, status, lobby, room, game, and quiz creation screens.
- Integrated frontend services with backend HTTP routes and Socket.IO events.
- Added responsive states for loading, empty, error, and ready screens.
- Challenge: making real-time game state understandable in the UI. Solution: dedicated hooks and room/game components aligned with the backend event contract.

### besch

- Coordinated planning, demo readiness, and verification.
- Built and maintained the Makefile-driven workflow.
- Documented Docker/Podman-compatible local execution.
- Added smoke tests, browser test commands, stack status checks, and backup/restore scripts.
- Challenge: supporting different school machines and developer environments. Solution: two runtime profiles, `HTTPS local` and `HTTP/LAN`, with `.env` validation and clear commands.

### siligh

- Defined product scope and the demo path.
- Selected the modules defended for evaluation.
- Prepared quiz catalogue direction, gameplay rules, room settings, question timing, and scoring expectations.
- Helped validate the player experience from lobby to results.
- Challenge: keeping the scope demonstrable within the subject constraints. Solution: focus on a clear real-time quiz game and keep non-claimed modules explicit.

### gicomlan

- Led full-stack integration and technical consistency.
- Reviewed HTTP routes and WebSocket events.
- Helped align frontend, backend, database schema, realtime flows, and the README.
- Validated multiplayer behavior and cross-module dependencies.
- Challenge: avoiding drift between UI, API, WebSocket events, and tests. Solution: route/event review during integration changes and smoke-test validation.

## Instructions

### Prerequisites

Recommended setup:

- Git.
- GNU Make.
- Docker Compose plugin, Docker Desktop, or a Podman setup exposing a compatible `docker compose` command.
- A modern browser.

The project can also run partly outside containers, but then you need:

- Node.js and npm.
- PostgreSQL.
- The same environment variables as the containerized setup.

Default ports:

- Frontend: `3000`.
- Backend: `4000`.
- PostgreSQL: `5432`.

### Environment setup

Create `.env` from the example if it does not already exist:

```bash
make env-init
```

Then edit `.env`.

Required important variables:

```env
POSTGRES_USER=...
POSTGRES_PASSWORD=...
POSTGRES_DB=...
POSTGRES_PORT=5432
DATABASE_URL=postgresql://...

APP_PROTOCOL=https
FRONTEND_ORIGIN=https://localhost:3000
BACKEND_PORT=4000
FRONTEND_PORT=3000

JWT_SECRET=...
JWT_EXPIRES_IN=1d
AUTH_COOKIE_SAMESITE=lax
AUTH_COOKIE_SECURE=true

FT_CLIENT_ID=...
FT_CLIENT_SECRET=...
FT_REDIRECT_URI=https://localhost:4000/auth/42/callback
FT_SCOPE=public
```

Never commit real secrets from `.env`.

Validate the configuration:

```bash
make env-check
```

### Runtime profiles

`HTTPS local` is recommended for single-machine development and OAuth 42 tests:

```env
APP_PROTOCOL=https
FRONTEND_ORIGIN=https://localhost:3000
AUTH_COOKIE_SECURE=true
FT_REDIRECT_URI=https://localhost:4000/auth/42/callback
```

`HTTP/LAN` is recommended for multi-machine tests on the same local network:

```env
APP_PROTOCOL=http
FRONTEND_ORIGIN=http://localhost:3000
AUTH_COOKIE_SECURE=auto
FT_REDIRECT_URI=http://localhost:4000/auth/42/callback
```

For LAN tests, other machines open:

```text
http://HOST_MACHINE_IP:3000
```

OAuth 42 is usually not the best LAN test path unless the OAuth redirect URI is configured for the exact shared URL. Prefer local auth or guest auth for LAN demos.

### Run the project

Start the full stack:

```bash
make
```

This command:

- creates `.env` from `.env.example` if missing;
- validates the environment;
- prepares local TLS certificates when HTTPS is enabled;
- starts `frontend`, `backend`, `db`, and `backup`;
- waits for service health when supported by the Compose implementation.

If you changed `.env`, restart:

```bash
make restart
```

Open:

```text
https://localhost:3000
```

or, in HTTP mode:

```text
http://localhost:3000
```

Useful routes:

- `/login`
- `/profile`
- `/friends`
- `/leaderboard`
- `/quiz-ready`
- `/quiz-create`
- `/status`

### Useful commands

```bash
make ps
make logs
make logs-back
make logs-front
make logs-db
make test-stack
make smoke-test
make smoke-test-ws
make browser-test
make backup-db
make restore-db file=.local/backups/quiz_db-YYYYMMDD-HHMMSS.sql
```

Code checks:

```bash
cd backend && npm run lint
cd backend && npm run build
cd backend && npm run test

cd frontend && npm run lint
cd frontend && npm run build
```

### Demo path

Recommended evaluation demo:

1. Open `/login` and authenticate with local, guest, or OAuth 42 login.
2. Open `/profile`, update the profile, and upload an avatar.
3. Open `/friends`, send/accept a friend request, and show notifications.
4. Open `/quiz-ready`, create or join a room, configure question duration, and start a game.
5. Answer questions in real time from at least two clients, ideally more than two.
6. Show room leaderboard, global `/leaderboard`, and user match history.
7. Open `/status` and run `make test-stack` or `make smoke-test`.

## Resources

### External references

- 42 ft_transcendence subject, provided through the 42 intranet.
- React documentation: https://react.dev/
- TypeScript documentation: https://www.typescriptlang.org/docs/
- NestJS documentation: https://docs.nestjs.com/
- Prisma documentation: https://www.prisma.io/docs/
- PostgreSQL documentation: https://www.postgresql.org/docs/
- Socket.IO documentation: https://socket.io/docs/v4/
- Docker Compose documentation: https://docs.docker.com/compose/
- OAuth 2.0 overview: https://oauth.net/2/
- 42 API documentation: https://api.intra.42.fr/apidoc

### AI usage disclosure

AI tools were used as occasional support during the project.

AI was used for:

- Improving the wording and organization of the README.
- Helping reason about configuration and debugging issues during development.
- Reviewing clarity, consistency, and reproducibility of the instructions.

All implementation choices, module claims, credentials, and submitted code remain the responsibility of the team. No secret values or production credentials were provided to AI tools.

## Known Limitations

- Two-factor authentication is not implemented and is not claimed.
- Server-side rendering is not implemented and is not claimed.
- Spectator mode exists only partially at backend/event level and is not claimed as a UI module.
- OAuth 42 requires exact redirect URI configuration and valid `FT_CLIENT_ID` / `FT_CLIENT_SECRET`.
- LAN demos should usually use local or guest authentication unless a correct public/shared OAuth callback URL is configured.

## License and Credits

This project was created for educational purposes as part of the 42 curriculum.

Third-party technologies and documentation are credited in the Resources section. 42 names, APIs, and marks belong to their respective owners.
