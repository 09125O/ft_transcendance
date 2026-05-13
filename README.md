# ft_transcendance

README de soutenance et d'exploitation locale pour l'etat courant de `dev`.

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
- jouable en multijoueur local ou distant
- démonstrable sur les flux auth, social, room, game, stats et status

Services de la stack locale :

- `frontend`: React + TypeScript + Webpack Dev Server, `localhost:3000`
- `backend`: NestJS + TypeScript + Prisma, `localhost:4000`
- `db`: PostgreSQL, `localhost:5432`
- `backup`: sidecar de sauvegarde PostgreSQL automatisée, sans port exposé

Profils d'execution supportes :

- `HTTPS local` pour le developpement mono-poste et la demo locale avec certificat de dev
- `HTTP/LAN` pour tester plusieurs postes sur le meme reseau sans trust store local

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

### 2.1 Equipe, roles et contributions

Repartition retenue pour la soutenance Intra :

| Membre | Role Intra | Zone principale | Contributions a presenter |
|---|---|---|---|
| Driss | Developer backend | Backend NestJS, Prisma, API, realtime server | Auth locale/guest/OAuth 42, rooms, game loop, WebSocket, scores, tests backend et smoke tests |
| Tommy | Developer frontend | Frontend React, UX, pages et integration API/WS | Pages `login`, `profile`, `friends`, `leaderboard`, `status`, lobby quiz, room/game UI, responsive et parcours joueur |
| Bastien | Project Manager + QA/DevOps | Organisation, verification, exploitation locale | Coordination des lots, checklist de demo, Makefile/Docker/Podman, smoke tests, browser tests, status/backup et runbooks |
| Sofian | Product Owner + gameplay/content | Cadrage produit, modules, parcours de jeu | Choix des modules revendiques, parcours de demo, catalogue de quiz, regles de room, duree de question, scoring et experience joueur |
| Giovanni | Tech Lead integration | Architecture fullstack et coherence contrats | Contrats HTTP/WS, integration frontend-backend, coherence schema DB, revue des flux realtime, validation multi-joueurs et coherence documentation |

Organisation de travail defendable :

- decoupage par lots fonctionnels : auth, social, quiz/rooms/game, stats, status/backup, QA
- validation par preuves : smoke tests, tests WebSocket, tests sociaux, lint/build, tests navigateurs
- documentation synchronisee avec les contrats HTTP/WS et la matrice de conformite
- revue finale centree sur la grille Intra : README, modules, securite, responsive, deploiement et stabilite

Chaque membre doit pouvoir expliquer sa zone principale, mais aussi le parcours global : `frontend -> backend -> database -> websocket -> tests`.

### 2.2 Verification de reference

Verification de reference documentee pour `dev` :

- `make smoke-test` en `HTTPS local`
- `make smoke-test` en `HTTP/LAN`
- `make browser-test` en `HTTPS local`
- `make browser-test` en `HTTP/LAN`
- workflow GitHub Actions `CI` passe au vert sur `dev`

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
- [backend/src/modules/users/users.controller.ts](backend/src/modules/users/users.controller.ts)
- [frontend/src/pages/ProfilePage.tsx](frontend/src/pages/ProfilePage.tsx)
- [frontend/src/pages/FriendsPage.tsx](frontend/src/pages/FriendsPage.tsx)

Ce qui est effectivement démontrable :

- inscription
- login
- session anonyme ou authentifiee
- logout
- guest login
- édition de profil
- upload avatar natif
- retour a l'avatar par defaut
- affichage des amis et du statut en ligne / hors ligne
- nettoyage d'une session invalide sans erreur frontale

### 4.2 Health check and status page

Preuves techniques :

- `GET /health`
- page publique `/status`
- sidecar `backup` dans [docker-compose.yml](docker-compose.yml)
- script [scripts/ops/auto-backup.sh](scripts/ops/auto-backup.sh)
- scripts [scripts/ops/backup-db.sh](scripts/ops/backup-db.sh) et [scripts/ops/restore-db.sh](scripts/ops/restore-db.sh)
- runbook [status-backup-recovery-runbook.md](docs/operations/status-backup-recovery-runbook.md)

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

- [websocket-event-contract.md](docs/contracts/websocket-event-contract.md)
- [frontend-realtime-integration.md](docs/integration/frontend-realtime-integration.md)
- [quiz-room-game-flow.md](docs/integration/quiz-room-game-flow.md)

### 4.4 Stats and match history

Preuves techniques :

- `GET /scores/leaderboard`
- `GET /scores/users/:userId`
- `GET /scores/users/:userId/history`
- [frontend/src/pages/LeaderboardPage.tsx](frontend/src/pages/LeaderboardPage.tsx)
- [frontend/src/pages/ProfilePage.tsx](frontend/src/pages/ProfilePage.tsx)

### 4.5 Game customization options

Preuves techniques :

- `POST /rooms` accepte `questionDurationMs`
- room privée / publique
- room liée à un quiz via `quizId`
- affichage de la durée configurée dans le flux room / pre-match / game

Points d'entrée utiles :

- [frontend/src/components/Quiz/RoomCreateFromQuizPanel.tsx](frontend/src/components/Quiz/RoomCreateFromQuizPanel.tsx)
- [http-api-contract.md](docs/contracts/http-api-contract.md)

## 5. Parcours de démo recommandés

Checklist de démo détaillée :

- [demo-checklist.md](docs/product/demo-checklist.md)

Parcours courts à préparer :

1. `Auth`
   connexion locale, guest ou OAuth 42, puis verification de session.
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

## 6. Profils d'execution

Deux modes sont supportes sans changement de code :

### 6.1 `HTTPS local`

Cas d'usage :

- developpement perso sur une machine
- demo locale avec certificat de dev

Variables cle :

```env
APP_PROTOCOL=https
FRONTEND_ORIGIN=https://localhost:3000
AUTH_COOKIE_SECURE=true
FT_REDIRECT_URI=https://localhost:4000/auth/42/callback
```

### 6.2 `HTTP/LAN`

Cas d'usage :

- test a plusieurs postes sur le meme reseau
- pas de trust store local ni `mkcert` cote clients

Variables cle :

```env
APP_PROTOCOL=http
FRONTEND_ORIGIN=http://localhost:3000
AUTH_COOKIE_SECURE=auto
FT_REDIRECT_URI=http://localhost:4000/auth/42/callback
```

Important :

- pour un test LAN, les autres postes ouvrent `http://IP_DE_LA_MACHINE_HOTE:3000`
- dans ce mode, le frontend proxy relaie deja l'API et Socket.IO
- OAuth 42 n'est pas le bon mode de test sur une IP locale `localhost`; privilegier auth locale ou guest

## 7. Demarrage local et verification

Démarrage :

```bash
make
```

La commande utilise le mode courant de `.env` :

- Docker operationnel : creation de `.env` si besoin, installation locale de `mkcert` si besoin, generation TLS locale en mode `https`, build et demarrage de la stack complete
- Docker detecte mais non exploitable : `make` s'arrete avec un message clair
- Docker absent : `make` bascule en mode local seulement si `node` et `npm` sont deja presents sur le poste

Si vous changez de profil dans `.env`, relancer :

```bash
make restart
```

Après `make` :

- en mode Docker : `make test-stack`
- en mode local : lancer `cd backend && npm run start:dev` puis `cd frontend && npm run dev`

Installation locale hors Docker :

```bash
make setup-local-deps
make setup-local-browsers
```

Notes :

- ce repo n'installe pas `docker`, `node` ou `npm` au niveau systeme
- sur un poste d'ecole sans `sudo`, la voie recommandee reste :
  - une machine hote deja preparee avec Docker pour les tests `HTTP/LAN`
  - ou un serveur distant partage
- hors Docker, `node`, `npm` et PostgreSQL doivent deja etre disponibles localement

Commandes utiles :

- `make logs`
- `make logs-back`
- `make logs-front`
- `make logs-db`
- `make logs-backup`
- `make smoke-test`
- `make smoke-test-ws`
- `make backup-db`
- `make restore-db file=.local/backups/quiz_db-YYYYMMDD-HHMMSS.sql`
- `make browser-test`

Verification code :

- `cd backend && npm run lint`
- `cd frontend && npm run lint`
- `cd backend && npm run build`
- `cd frontend && npm run build`

URLs utiles :

- frontend : `${FRONTEND_ORIGIN}`
- login : `${FRONTEND_ORIGIN}/login`
- profile : `${FRONTEND_ORIGIN}/profile`
- friends : `${FRONTEND_ORIGIN}/friends`
- leaderboard : `${FRONTEND_ORIGIN}/leaderboard`
- status : `${FRONTEND_ORIGIN}/status`
- backend health : `${APP_PROTOCOL}://localhost:${BACKEND_PORT}/health`

Notes d'exploitation :

- les certificats de dev dans `.local/certs/` sont generes localement et ne doivent pas etre consideres comme des artefacts de release
- le mode `HTTP/LAN` sert au test multi-postes ; le mode `HTTPS local` sert au dev local et a la demo sur une machine

## 8. Cartographie documentaire

Documents de reference a utiliser pour la soutenance :

- [docs/README.md](docs/README.md)
- [evaluation-conformity-matrix.md](docs/product/evaluation-conformity-matrix.md)
- [demo-checklist.md](docs/product/demo-checklist.md)
- [status-backup-recovery-runbook.md](docs/operations/status-backup-recovery-runbook.md)
- [http-api-contract.md](docs/contracts/http-api-contract.md)
- [websocket-event-contract.md](docs/contracts/websocket-event-contract.md)
- [frontend-realtime-integration.md](docs/integration/frontend-realtime-integration.md)
- [quiz-room-game-flow.md](docs/integration/quiz-room-game-flow.md)
- [developer-guide.md](docs/operations/developer-guide.md)

## 9. Elements Intra encore a completer manuellement

Le repo documente l'état technique, les modules revendiqués, la répartition d'équipe et les parcours de démonstration.

A personnaliser avant soutenance pour un dossier Intra encore plus solide :

- noms complets exacts des membres, si vous voulez les afficher au format administratif 42
- exemples personnels precis par membre : une feature, un bug difficile, un choix technique assume
- captures ou schema visuel DB si vous voulez une piece projetable pendant la soutenance

Important :

- les roles ci-dessus sont une repartition de soutenance coherente avec l'implementation
- chaque membre doit pouvoir expliquer concretement sa zone et le flux global
