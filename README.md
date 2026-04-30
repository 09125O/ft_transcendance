# ft_transcendance

README de soutenance et d'exploitation locale pour l'état courant de `dev`.

## 1. Sources officielles

Les seules sources officielles pour la liste des modules, leur nature `Major` ou `Minor`, et le cadre d'évaluation sont :

- `srcs_subject/en.subject.pdf`
- `srcs_subject/Intra Projects ft_transcendence Edit.pdf`

Ce README ne remplace pas ces PDFs. Il sert à :

- décrire l'implémentation effectivement présente dans le repo
- expliciter la lecture interne retenue pour la soutenance
- fournir des parcours de démo reproductibles

## 2. État actuel du projet

Le projet est aujourd'hui :

- lançable en stack Docker locale
- jouable en multijoueur distant
- démonstrable sur les flux auth, social, room, game, stats et status

Services de la stack locale :

- `frontend`: React + TypeScript + Webpack Dev Server, `https://localhost:3000`
- `backend`: NestJS + TypeScript + Prisma, `https://localhost:4000`
- `db`: PostgreSQL, `localhost:5432`
- `backup`: sidecar de sauvegarde PostgreSQL automatisée, sans port exposé

Fonctionnalités produit démontrables :

- auth locale, guest et OAuth 42
- pages `profile`, `friends`, `leaderboard`, `status`
- upload natif d'avatar avec fallback par défaut
- demandes d'amis, acceptation, refus, suppression d'ami
- notifications sociales en temps réel avec lecture et suppression
- lobby quiz/rooms avec création, jointure et démarrage
- partie realtime avec timer serveur, réponses, leaderboard et chat
- création de quiz et création de room depuis un quiz
- historique de parties et stats joueur
- status page lisant `/health`
- sauvegarde PostgreSQL automatisée locale + restauration manuelle

Modules non implémentés ou non retenus dans le plan courant :

- `2FA`
- `SSR`
- mode spectateur côté UI

## 3. Lecture interne du score

Rappels issus des PDFs officiels :

- `Major = 2 points`
- `Minor = 1 point`
- minimum requis : `14 points`
- seul un module pleinement fonctionnel et correctement implémenté compte
- le bonus au-delà de `14` est plafonné à `+5`

Lecture interne retenue aujourd'hui :

- estimation interne defendable : `19 / 14`
- cette estimation n'est pas une vérité officielle
- la décision finale appartient aux évaluateurs

### 3.1 Chemin principal defendu vers `19`

Chemin que la documentation et la démo doivent privilégier :

- `[Major][2]` Use a framework for both frontend and backend
- `[Major][2]` Implement real-time features
- `[Major][2]` Allow users to interact with other users
- `[Major][2]` Standard user management and authentication
- `[Major][2]` Web-based game
- `[Major][2]` Remote players
- `[Major][2]` Multiplayer `> 2`
- `[Minor][1]` Use an ORM
- `[Minor][1]` Remote authentication
- `[Minor][1]` Game customization options
- `[Minor][1]` Game statistics and match history
- `[Minor][1]` Health check and status page

Total interne defendu par ce chemin : `19`

### 3.2 Modules implémentés mais non nécessaires à ce `19`

Ces modules existent dans le repo, mais ne sont pas indispensables à l'argumentaire principal :

- `[Minor][1]` Notification system
- `[Minor][1]` Support for additional browsers

### 3.3 Modules explicitement non revendiqués

- `[Minor][1]` Two-factor authentication
- `[Minor][1]` SSR
- `[Minor][1]` Spectator mode côté UI

## 4. Modules revendicables et preuves

### 4.1 Standard user management and authentication

Preuves techniques :

- `GET /users/me`
- `PATCH /users/me`
- `POST /users/me/avatar`
- service statique `/uploads`
- [backend/src/modules/users/users.controller.ts](/Users/d9125/Downloads/transcendance-dev/backend/src/modules/users/users.controller.ts)
- [frontend/src/pages/ProfilePage.tsx](/Users/d9125/Downloads/transcendance-dev/frontend/src/pages/ProfilePage.tsx)
- [frontend/src/pages/FriendsPage.tsx](/Users/d9125/Downloads/transcendance-dev/frontend/src/pages/FriendsPage.tsx)

Ce qui est effectivement démontrable :

- inscription
- login
- session
- logout
- guest login
- édition de profil
- upload avatar natif
- retour a l'avatar par defaut
- affichage des amis et du statut en ligne / hors ligne

### 4.2 Health check and status page

Preuves techniques :

- `GET /health`
- page publique `/status`
- sidecar `backup` dans [docker-compose.yml](/Users/d9125/Downloads/transcendance-dev/docker-compose.yml)
- script [scripts/auto-backup.sh](/Users/d9125/Downloads/transcendance-dev/scripts/auto-backup.sh)
- scripts [scripts/backup-db.sh](/Users/d9125/Downloads/transcendance-dev/scripts/backup-db.sh) et [scripts/restore-db.sh](/Users/d9125/Downloads/transcendance-dev/scripts/restore-db.sh)
- runbook [docs/ops-status-backup-recovery.md](/Users/d9125/Downloads/transcendance-dev/docs/ops-status-backup-recovery.md)

Ce qui est effectivement démontrable :

- frontend actif
- backend actif
- base joignable
- état de sauvegarde automatisée visible
- backup manuel
- restauration manuelle documentée

### 4.3 Realtime multiplayer web game

Preuves techniques :

- namespace Socket.IO `/ws`
- creation / join / leave / start de room
- timer de question serveur
- answers realtime
- leaderboard room
- smoke tests WebSocket et smoke global

Points d'entrée utiles :

- [docs/ws-event-contract.md](/Users/d9125/Downloads/transcendance-dev/docs/ws-event-contract.md)
- [docs/front2-realtime-integration.md](/Users/d9125/Downloads/transcendance-dev/docs/front2-realtime-integration.md)
- [docs/quiz-room-game-integration.md](/Users/d9125/Downloads/transcendance-dev/docs/quiz-room-game-integration.md)

### 4.4 Stats and match history

Preuves techniques :

- `GET /scores/leaderboard`
- `GET /scores/users/:userId`
- `GET /scores/users/:userId/history`
- [frontend/src/pages/LeaderboardPage.tsx](/Users/d9125/Downloads/transcendance-dev/frontend/src/pages/LeaderboardPage.tsx)
- [frontend/src/pages/ProfilePage.tsx](/Users/d9125/Downloads/transcendance-dev/frontend/src/pages/ProfilePage.tsx)

### 4.5 Game customization options

Preuves techniques :

- `POST /rooms` accepte `questionDurationMs`
- room privée / publique
- room liée à un quiz via `quizId`
- affichage de la durée configurée dans le flux room / pre-match / game

Points d'entrée utiles :

- [frontend/src/components/Quiz/RoomCreateFromQuizPanel.tsx](/Users/d9125/Downloads/transcendance-dev/frontend/src/components/Quiz/RoomCreateFromQuizPanel.tsx)
- [docs/api-front-contract.md](/Users/d9125/Downloads/transcendance-dev/docs/api-front-contract.md)

## 5. Parcours de démo recommandés

Checklist de démo détaillée :

- [docs/soutenance-demo-checklist.md](/Users/d9125/Downloads/transcendance-dev/docs/soutenance-demo-checklist.md)

Parcours courts à préparer :

1. `Auth`
   connexion locale, guest ou OAuth 42, puis vérification de session.
2. `User management`
   profil, upload avatar, avatar visible sur profil et amis.
3. `Social`
   demande d'ami, acceptation, notification, suppression.
4. `Game`
   quiz -> room -> join -> start -> réponse -> leaderboard.
5. `Stats`
   leaderboard globale + historique utilisateur.
6. `Status`
   page `/status`, `make test-stack`, `make smoke-test`, backup auto visible, `make backup-db`.

## 6. Démarrage local et vérification

Démarrage minimal :

```bash
make env-init
make tls-trust
make env-check
make up
make test-stack
```

Démarrage recommandé, quelle que soit la machine :

```bash
make bootstrap
```

La commande détecte automatiquement le mode le plus adapté :

- Docker disponible : génération TLS locale, build et démarrage de la stack complète
- Docker absent : installation locale des dépendances `frontend` et `backend`

Après `make bootstrap` :

- en mode Docker : `make test-stack`
- en mode local : lancer `cd backend && npm run start:dev` puis `cd frontend && npm run dev`

Installation locale hors Docker :

```bash
make setup-local-deps
make setup-local-browsers
```

Commandes utiles :

- `make logs`
- `make logs-back`
- `make logs-front`
- `make logs-db`
- `make logs-backup`
- `make smoke-test`
- `make smoke-test-ws`
- `make backup-db`
- `make restore-db file=backups/quiz_db-YYYYMMDD-HHMMSS.sql`
- `make browser-test`

Verification code :

- `cd backend && npm run lint`
- `cd frontend && npm run lint`
- `cd backend && npm run build`
- `cd frontend && npm run build`

URLs utiles :

- frontend : `https://localhost:3000`
- login : `https://localhost:3000/login`
- profile : `https://localhost:3000/profile`
- friends : `https://localhost:3000/friends`
- leaderboard : `https://localhost:3000/leaderboard`
- status : `https://localhost:3000/status`
- backend health : `https://localhost:4000/health`

## 7. Cartographie documentaire

Documents de reference a utiliser pour la soutenance :

- [docs/sujet-conformite-matrice.md](/Users/d9125/Downloads/transcendance-dev/docs/sujet-conformite-matrice.md)
- [docs/soutenance-demo-checklist.md](/Users/d9125/Downloads/transcendance-dev/docs/soutenance-demo-checklist.md)
- [docs/ops-status-backup-recovery.md](/Users/d9125/Downloads/transcendance-dev/docs/ops-status-backup-recovery.md)
- [docs/api-front-contract.md](/Users/d9125/Downloads/transcendance-dev/docs/api-front-contract.md)
- [docs/backend-front-enablement-spec.md](/Users/d9125/Downloads/transcendance-dev/docs/backend-front-enablement-spec.md)
- [docs/front-handover-roadmap.md](/Users/d9125/Downloads/transcendance-dev/docs/front-handover-roadmap.md)
- [docs/ws-event-contract.md](/Users/d9125/Downloads/transcendance-dev/docs/ws-event-contract.md)
- [docs/front2-realtime-integration.md](/Users/d9125/Downloads/transcendance-dev/docs/front2-realtime-integration.md)
- [docs/quiz-room-game-integration.md](/Users/d9125/Downloads/transcendance-dev/docs/quiz-room-game-integration.md)

## 8. Elements Intra encore a completer manuellement

Le repo permet aujourd'hui de documenter l'état technique et les modules revendiqués, mais certains éléments demandés par l'Intra ne sont pas encore tracés de façon complète ici.

A completer avant soutenance si vous voulez un dossier Intra propre :

- noms exacts des membres du groupe
- roles explicites par membre
- organisation du travail / methode de coordination
- contribution individuelle par feature
- schema DB lisible a joindre si vous voulez une piece visuelle dediee

Important :

- cette section est volontairement explicite
- elle signale ce qui manque encore au dossier
- elle n'invente aucune information absente du repo
