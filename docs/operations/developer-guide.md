# Developer Guide

## Objectif

Ce document sert de reference rapide pour les developpeurs du projet `ft_transcendance`.

Il explique :

- la stack actuellement utilisee
- comment lancer et tester le projet
- les conventions d'equipe a respecter

## Stack actuelle

### Infrastructure

- Docker Compose pour orchestrer les services
- 4 services principaux :
  - `frontend`
  - `backend`
  - `db`
  - `backup`
- Volumes Docker pour conserver les donnees PostgreSQL
- Healthchecks sur les 4 services pour verifier qu'ils sont vraiment operationnels

### Frontend

- React
- TypeScript
- Webpack Dev Server
- Le frontend tourne dans un container Node
- Port par defaut : `3000`

Role actuel :

- gerer les routes `home`, `room`, `login`, `register`, `profile`, `friends`, `leaderboard`, `quiz-ready`, `quiz-create`, `status`, `privacy`, `terms`
- afficher le lobby, la room realtime, le chat et les ecrans social
- permettre la creation de quiz et la creation de room depuis un quiz
- proxifier les appels `/api`, `/health`, `/auth`, `/users`, `/rooms`, `/game`, `/scores`, `/quizzes`, `/friends` et `/notifications` vers le backend via Webpack Dev Server
- proxifier aussi `/socket.io` vers le backend
- laisser les navigations HTML de routes ecran comme `/friends` retomber sur React Router, meme si les `fetch` correspondants passent par le proxy

### Backend

- NestJS
- Node.js
- TypeScript
- Prisma ORM pour parler a PostgreSQL
- Port par defaut : `4000`

Role actuel :

- exposer un endpoint `/health`
- exposer un endpoint `/api`
- exposer les modules `auth`, `users`, `friends`, `notifications`, `rooms`, `game`, `scores`, `quizzes`
- verifier la disponibilite de PostgreSQL via Prisma
- orchestrer le temps reel Socket.IO sur `/ws`
- appliquer un rate limiting HTTP global et des throttles cibles sur certaines routes sensibles

### Base de donnees

- PostgreSQL 16 Alpine
- Port par defaut : `5432`
- Donnees persistees dans le volume Docker `postgres_volume`

## Architecture de dev

Le fonctionnement actuel est le suivant :

1. Le navigateur appelle le frontend sur `${FRONTEND_ORIGIN}`
2. Le frontend React TypeScript appelle le backend via des routes proxifiees comme `/health`, `/api`, `/auth/*`, `/users/*`, `/friends/*`, `/notifications/*`, `/quizzes/*` et `/socket.io`
3. Webpack Dev Server proxifie ces routes vers le backend `${APP_PROTOCOL}://backend:4000`
4. Le backend interroge PostgreSQL via `DATABASE_URL`

### Schema de communication

```text
                    Navigateur
                         |
                         v
          ${FRONTEND_ORIGIN}
                  frontend
     React + TypeScript + Webpack Dev Server
                         |
proxy /api, /health, /auth, /users, /rooms, /game, /scores, /quizzes, /friends, /notifications, /socket.io
                         |
                         v
     ${APP_PROTOCOL}://backend:4000
                 backend NestJS
                         |
        DATABASE_URL -> postgresql://db:5432
                         |
                         v
                  PostgreSQL 16


Exposition des ports cote hote :

- frontend -> `${FRONTEND_ORIGIN}`
- backend  -> `${APP_PROTOCOL}://localhost:${BACKEND_PORT}`
- db       -> localhost:5432
```

En developpement, `nginx` n'est pas obligatoire car Docker publie deja les ports vers l'hote.

Un service `nginx` pourra etre ajoute plus tard si on veut :

- un point d'entree unique
- du reverse proxy plus propre
- servir un frontend build en statique
- preparer une architecture de production

## Arborescence utile

- `docker-compose.yml` : orchestration des services
- `Makefile` : commandes de travail rapides
- `backend/` : application backend
- `backend/prisma/` : schema Prisma et migrations SQL
- `backend/prisma.config.ts` : configuration Prisma CLI pour les migrations et la datasource
- `backend/test/scenarios/` : scenarios Node de verification backend et realtime
- `frontend/` : application frontend
- `scripts/test/smoke-test.sh` : test rapide de la stack
- `.local/` : artefacts locaux non versionnes (`certs`, `backups`, runtime backend, resultats Playwright)
- `.env` : variables locales
- `.env.example` : modele de configuration

## Profils d'execution

Le projet supporte 2 profils sans changement de code :

- `HTTPS local` : developpement mono-poste avec certificat de dev
- `HTTP/LAN` : test multi-postes sur le meme reseau sans trust store local

## Variables d'environnement

Les variables principales sont :

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

Regle d'equipe :

- ne jamais commit de secret reel
- garder `.env.example` a jour quand une nouvelle variable est ajoutee
- utiliser des valeurs locales simples pour le dev
- lancer `make env-check` avant un push si tu modifies la configuration

## GitHub Actions et secrets

Le workflow `.github/workflows/ci.yml` accepte des secrets GitHub optionnels.

Noms attendus si tu veux piloter la CI depuis l'interface GitHub :

- `CI_POSTGRES_USER`
- `CI_POSTGRES_PASSWORD`
- `CI_POSTGRES_DB`
- `CI_POSTGRES_PORT`
- `CI_DATABASE_URL`
- `CI_BACKEND_PORT`
- `CI_FRONTEND_PORT`
- `CI_JWT_SECRET`

Si ces secrets ne sont pas definis, la CI utilise des valeurs de secours dediees au test.

Les secrets GitHub ne sont jamais stockes dans le repo ni dans les branches.

Ce qui est versionne :

- le code source
- `.env.example`
- le workflow GitHub Actions

Ce qui n'est pas versionne :

- `.env`
- les vraies valeurs de base de donnees
- les tokens, mots de passe et secrets JWT

Cycle de fonctionnement :

- en local, le projet lit les variables depuis `.env`
- sur GitHub Actions, le runner lit les secrets configures dans `Settings > Secrets and variables > Actions`
- pendant le job CI, le workflow genere un `.env` temporaire a partir de ces secrets
- a la fin du job, le runner temporaire est detruit et ce `.env` disparait

Si tu merges sur `dev`, puis que tu crees une nouvelle branche depuis `dev` :

- la nouvelle branche recupere le code et `.env.example`
- elle ne recupere jamais les vraies valeurs secretes
- si quelqu'un clone cette branche, il devra creer son propre `.env` local

Pour faire fonctionner le projet apres un clone :

- cloner le repo
- remplir les vraies valeurs dans `.env`
- lancer `make`

`make` ne tente pas d'installer `docker`, `node` ou `npm` au niveau systeme.
Sur un nouveau poste, il distingue simplement trois cas :

- `Docker` + `Docker Compose` deja operationnels : lancement de la stack
- `Docker` detecte mais non exploitable : arret avec message explicite
- `Docker` absent mais `node` + `npm` presents : bascule en mode local manuel

Quand le profil `HTTPS local` est actif, `make` peut en revanche installer
`mkcert` localement sans `sudo` dans `.local/bin` si `go` est deja disponible,
puis tenter d'installer la CA locale dans le trust store navigateur utilisateur.

Pour un poste d'ecole sans droits `sudo`, il faut donc raisonner ainsi :

- soit utiliser une machine hote deja preparee avec Docker
- soit utiliser un serveur distant partage
- soit lancer hors Docker uniquement si `node`, `npm` et PostgreSQL existent deja localement

Conclusion :

- Git ne transporte pas les secrets
- GitHub Actions peut utiliser des secrets sans les ecrire dans le repo
- chaque machine locale doit avoir son propre `.env`

## Tutoriel de lancement

### 1. Choisir le bon contexte de travail

Avant de lancer le projet, il faut choisir entre 3 cas :

1. `Poste avec Docker deja operationnel`
   C'est le mode recommande pour travailler normalement sur le projet.
2. `Poste du meme reseau sans Docker`
   Ce poste ne doit pas lancer la stack. Il doit seulement ouvrir le frontend servi par une machine hote via `HTTP/LAN`.
3. `Poste sans Docker mais avec Node, npm et PostgreSQL deja installes`
   Ce mode est reserve au debug local ou a un usage contraint. Il est moins simple que la stack Docker.

### 2. Preparer le fichier `.env`

Si `.env` n'existe pas encore :

```bash
cp .env.example .env
```

Puis choisir le profil voulu.

Pour `HTTPS local` sur une machine de dev :

```env
APP_PROTOCOL=https
FRONTEND_ORIGIN=https://localhost:3000
AUTH_COOKIE_SECURE=true
FT_REDIRECT_URI=https://localhost:4000/auth/42/callback
```

Pour `HTTP/LAN` sur une machine hote partagee :

```env
APP_PROTOCOL=http
FRONTEND_ORIGIN=http://localhost:3000
AUTH_COOKIE_SECURE=auto
FT_REDIRECT_URI=http://localhost:4000/auth/42/callback
```

Verification rapide :

```bash
make env-check
```

### 3. Premier lancement sur une machine avec Docker

Commande de base :

```bash
make
```

Ce que fait `make` :

1. cree `.env` depuis `.env.example` si besoin
2. verifie la configuration
3. en mode `https`, installe ou retrouve `mkcert` localement si `go` est disponible
4. genere les certificats de dev sous `.local/certs/`
5. lance `docker compose up --build -d --wait`

Quand le lancement reussit, verifier ensuite :

```bash
make test-stack
make smoke-test
```

URLs a ouvrir :

- `https://localhost:3000` ou `http://localhost:3000` selon le profil
- `${APP_PROTOCOL}://localhost:4000/health`

### 4. Redemarrer la stack apres un changement de profil

Si tu modifies `.env` ou si tu veux reconstruire proprement :

```bash
make restart
```

Cas typiques :

- passage `HTTPS local` -> `HTTP/LAN`
- changement de ports
- changement d'options de cookies ou d'OAuth
- besoin de regénérer les certifs de dev

### 5. Lancer le projet en `HTTP/LAN` pour plusieurs postes

La bonne logique est :

1. une seule machine hote lance la stack
2. les autres machines du meme reseau n'executent pas `make`
3. elles ouvrent seulement le frontend de la machine hote

Sur la machine hote :

```bash
make restart
```

Puis recuperer son IP locale, par exemple `192.168.1.42`.

Depuis les autres postes :

```text
http://192.168.1.42:3000
```

Important :

- les clients n'ont pas besoin d'acceder directement au port `4000`
- le frontend proxy relaie deja l'API et Socket.IO
- pour ce mode, privilegier auth locale ou guest
- l'auth OAuth 42 n'est pas le meilleur choix en LAN via IP privee

### 6. Lancement hors Docker

Ce mode n'est valable que si le poste a deja :

- `node`
- `npm`
- `postgresql`

Installation des dependances projet :

```bash
make setup-local-deps
```

Demarrage manuel :

```bash
cd backend && npm run start:dev
cd frontend && npm run dev
```

Si `make` affiche `node est requis pour l'installation locale`, cela signifie :

- Docker n'est pas exploitable sur le poste
- et le runtime Node local n'est pas disponible non plus

Dans ce cas, il faut soit :

- utiliser une machine Docker deja preparee
- utiliser un serveur distant
- ou installer les pre-requis systeme hors de ce repo

## Tutoriel de manipulation

### 1. Routine quotidienne minimale

Au debut d'une session :

```bash
git pull
make
make test-stack
```

Pendant le dev :

```bash
make logs
```

Ou par service :

```bash
make logs-back
make logs-front
make logs-db
make logs-backup
```

### 2. Verifier que tout fonctionne apres une modif

Verification rapide recommandee :

```bash
make test-stack
make smoke-test
```

Si tu touches surtout le realtime :

```bash
make smoke-test-ws
docker exec quiz_backend npm run test:ws-critical
```

Si tu touches surtout le front :

```bash
make browser-test
```

### 3. Manipuler la base de donnees

Entrer dans `psql` :

```bash
make shell-db
```

Faire un backup manuel :

```bash
make backup-db
```

Restaurer un backup :

```bash
make restore-db file=.local/backups/quiz_db-YYYYMMDD-HHMMSS.sql
```

### 4. Nettoyer ou reconstruire

Arret simple :

```bash
make down
```

Suppression containers + images :

```bash
make clean
```

Reinitialisation complete avec volumes :

```bash
make fclean
```

Attention :

- `make clean` garde les volumes PostgreSQL
- `make fclean` supprime aussi les volumes, donc les donnees locales

### 5. Parcours de verification manuelle utile avant une demo

Ordre conseille :

1. ouvrir `/login` ou utiliser une session guest
2. verifier `/profile`
3. verifier `/friends`
4. creer ou rejoindre une room
5. lancer une partie
6. verifier le leaderboard et l'historique
7. ouvrir `/status`
8. lancer `make smoke-test`

## Commandes utiles

### Lancer le projet

```bash
make
```

### Voir l'etat des containers

```bash
make ps
make test-stack
```

### Voir les logs

```bash
make logs
make logs-back
make logs-front
make logs-db
```

### Qualite et verifications

```bash
cd backend && npm run lint
cd frontend && npm run lint
cd backend && npm run build
cd frontend && npm run build
bash scripts/test/lint-shell.sh
make smoke-test
make smoke-test-ws
docker exec quiz_backend npm run test:ws-critical
docker exec quiz_backend npm run test:rate-limit
docker exec quiz_backend npm run test:integration:social
```

### Base de donnees

Connexion directe a PostgreSQL :

```bash
make shell-db
```

Une fois dans `psql`, commandes utiles :

```sql
\l
\c nom_de_la_base
\dt
\d "User"
SELECT current_database();
SELECT current_user;
SELECT now();
SELECT * FROM "User";
SELECT COUNT(*) FROM "User";
```

Commandes pratiques `psql` :

- `\l` : lister les bases de donnees
- `\c nom_base` : se connecter a une base
- `\dt` : lister les tables
- `\d nom_table` : decrire une table
- `\dn` : lister les schemas
- `\du` : lister les roles
- `\q` : quitter `psql`

Important :

- `SHOW DATABASES;` n'existe pas en PostgreSQL
- pour lister les bases, utiliser `\l`
- les noms sensibles a la casse comme `"User"` doivent etre entre guillemets

### Tester rapidement la stack

```bash
make smoke-test
```

Ce test verifie :

- que les 3 containers sont `healthy`
- que le backend repond sur `/health`
- que le frontend atteint bien `/health`
- que le frontend atteint bien `/api`
- que `register -> login -> session -> /users/me -> logout` fonctionne
- que les erreurs d'auth utilisent bien le format API standard

### Arreter et nettoyer

```bash
make down
make clean
make fclean
```

## URLs de verification

- `https://localhost:3000`
- `https://localhost:3000/health`
- `https://localhost:3000/api`
- `https://localhost:4000/health`

## Module auth backend

### Vue d'ensemble

Le module auth gere une session JWT stockee dans le cookie `access_token`.

Flux principal :

1. `POST /auth/register` cree un user en base avec mot de passe hash, pose le cookie et passe le user en `online`
2. `POST /auth/login` verifie les credentials, signe un JWT, pose le cookie et passe le user en `online`
3. `GET /auth/session` lit le cookie, verifie le token et recharge le user courant
4. `GET /users/me` reutilise le meme guard pour exposer le profil connecte
5. `POST /auth/logout` supprime le cookie et repasse le user en `offline`

Variables importantes du module :

- `JWT_SECRET` : cle de signature et de verification du JWT
- `JWT_EXPIRES_IN` : duree de vie du token, `7d` par defaut
- `FRONTEND_ORIGIN` : sert a regler le comportement du cookie (`sameSite` / `secure`)
- `access_token` : nom du cookie httpOnly contenant le JWT

### Fichiers du module auth

#### `backend/src/modules/auth/auth.module.ts`

Role :

- assemble le module auth NestJS
- branche `UsersModule` pour acceder aux users Prisma
- configure `JwtModule`
- expose `AuthService` aux autres modules

Elements importants :

- `JwtModule.registerAsync(...)` :
  - lit `process.env.JWT_SECRET`
  - jette une erreur si la variable est absente
  - configure `signOptions.expiresIn` avec `process.env.JWT_EXPIRES_IN || "7d"`
- `controllers: [AuthController]` : enregistre les routes `/auth/*`
- `providers: [AuthService, AuthGuard]` : rend le service et le guard injectables
- `exports: [AuthService]` : permet a un autre module d'injecter `AuthService` si besoin plus tard

#### `backend/src/modules/auth/auth.controller.ts`

Role :

- expose les endpoints HTTP du module auth
- fait le lien entre les DTO / decorators NestJS et `AuthService`
- garde le controller tres fin : presque toute la logique metier est deleguee au service

Fonctions importantes :

- `login(dto, res)` :
  - appelle `authService.validateUser(dto)` pour verifier email + password
  - appelle `authService.login(user, res)` pour poser le cookie
  - retourne `ApiResponse<SafeUser>`
- `register(dto, res)` :
  - appelle `authService.register(dto, res)`
  - pose le cookie de session comme `login`
  - retourne le user sans mot de passe
- `logout(req, res)` :
  - passe la `Request` et la `Response` au service
  - la `Request` sert a lire le cookie courant
  - la `Response` sert a effacer le cookie
- `session(auth)` :
  - protege la route avec `@UseGuards(AuthGuard)`
  - lit `auth.sub` injecte par `@CurrentUser()`
  - recharge le user courant via `authService.getSessionUser(...)`

Variables / types utiles :

- `req: Request` : acces aux cookies recus
- `res: Response` : necessaire pour `res.cookie(...)` et `res.clearCookie(...)`
- `AuthPayload` : contenu decode du JWT
- `SafeUser` : user renvoye au client sans le champ `password`

#### `backend/src/modules/auth/auth.service.ts`

Role :

- contient toute la logique metier d'authentification
- parle a `UsersService`, `JwtService` et `bcrypt`
- centralise la construction du cookie auth

Fonctions importantes :

- `validateUser(dto)` :
  - cherche le user avec `usersService.findUserByEmail(dto.email)`
  - compare le mot de passe avec `bcrypt.compare(dto.password, user.password)`
  - renvoie `UnauthorizedException("Invalid email or password")` si les credentials sont faux
- `sanitizeUser(user)` :
  - retire `password` de l'objet avant de l'envoyer au client
  - base commune de tous les retours `SafeUser`
- `getAuthCookieOptions()` :
  - calcule les options du cookie `access_token`
  - `httpOnly: true` pour empecher la lecture JS cote navigateur
  - `path: "/"` pour rendre le cookie valable sur toute l'app
  - `sameSite` vient de `AUTH_COOKIE_SAMESITE` avec defaut `"lax"` et garde seulement les valeurs `lax`, `strict` ou `none`
  - `secure` vient de `AUTH_COOKIE_SECURE`; en mode `auto`, il est active si `sameSite="none"`, si `FRONTEND_ORIGIN` est en `https://`, ou si `APP_PROTOCOL=https`
- `login(user, res)` :
  - met le user en `status: "online"`
  - construit le payload JWT `{ sub, email, username }`
  - signe le token avec `jwtService.signAsync(payload)`
  - ecrit le cookie via `res.cookie("access_token", accessToken, ...)`
  - retourne le user nettoye
- `register(dto)` :
  - hash le password avec `bcrypt.hash(dto.password, 10)`
  - cree le user avec `usersService.createUser(...)`
  - attrape `PrismaClientKnownRequestError` code `P2002` pour transformer le doublon email en `409 Conflict`
- `logout(req, res)` :
  - lit le cookie `req.cookies?.access_token`
  - si le token est valide, repasse le user en `status: "offline"`
  - ignore volontairement les tokens invalides ou expires
  - efface le cookie avec `res.clearCookie(...)`
- `getSessionUser(userId)` :
  - recharge le user par son id depuis la base
  - leve `NotFoundException` si le user du token n'existe plus

Variables importantes :

- `usersService` : acces aux operations CRUD Prisma sur `User`
- `jwtService` : signature et verification des JWT
- `payload.sub` : id du user porte par le token
- `accessToken` : JWT final ecrit dans le cookie

#### `backend/src/modules/auth/guards/auth.guard.ts`

Role :

- protege les routes qui exigent une session
- verifie le cookie `access_token`
- injecte le payload decode dans `request.user`

Fonction importante :

- `canActivate(context)` :
  - lit `request.cookies?.access_token`
  - si absent : `UnauthorizedException("Authentication required")`
  - si present : verifie le JWT avec `jwtService.verifyAsync<AuthPayload>(token)`
  - si OK : stocke le resultat dans `request.user`
  - si KO : `UnauthorizedException("Invalid or expired session")`

Variable importante :

- `request.user` : payload auth partage ensuite avec les controllers via le decorator `@CurrentUser()`

#### `backend/src/modules/auth/decorators/current-user.decorator.ts`

Role :

- expose un decorator NestJS simple pour recuperer le payload auth deja place dans la requete par `AuthGuard`

Element important :

- `CurrentUser` :
  - lit `ctx.switchToHttp().getRequest<AuthenticatedRequest>()`
  - retourne `request.user`
  - evite de reparser les cookies ou le JWT dans chaque controller

#### `backend/src/modules/auth/types/auth-payload.type.ts`

Role :

- decrit la forme du payload JWT une fois decode

Champs importants :

- `sub` : id du user, champ principal pour recharger la session
- `email` : email au moment du login
- `username` : username au moment du login

#### `backend/src/modules/auth/types/authenticated-request.type.ts`

Role :

- etend le type `express.Request` avec la propriete `user`

Champ important :

- `user?: AuthPayload` : payload ajoute par `AuthGuard`

#### `backend/src/modules/auth/types/safe-user.type.ts`

Role :

- type de sortie pour ne jamais exposer le `password` au front

Definition importante :

- `Omit<User, "password">` : tous les champs Prisma de `User` sauf le mot de passe hash

### Fichiers relies au module auth

#### `backend/src/modules/users/dto/register.dto.ts`

Role :

- definit le body attendu par `POST /auth/register`

Regles importantes :

- `email` doit etre un email valide
- `username` doit etre une string d'au moins 2 caracteres
- `password` doit etre une string d'au moins 12 caracteres

#### `backend/src/modules/users/dto/login.dto.ts`

Role :

- definit le body attendu par `POST /auth/login`

Regles importantes :

- `email` doit etre un email valide
- `password` doit etre une string d'au moins 12 caracteres

#### `backend/src/modules/users/users.service.ts`

Role :

- encapsule les acces Prisma au modele `User`
- sert de couche d'acces aux donnees pour `AuthService` et `UsersController`

Fonctions importantes pour auth :

- `findUserByEmail(email)` : point d'entree principal du login
- `findUser(where)` : recharge le user par `id` ou `email`
- `createUser(data)` : utilise par le register
- `updateUser({ where, data })` : utilise pour passer `status` a `online` / `offline`

### Flux d'execution concret

Exemple `GET /auth/session` :

1. la requete arrive sur `AuthController.session`
2. `AuthGuard.canActivate()` lit le cookie `access_token`
3. le guard verifie le JWT et stocke le resultat dans `request.user`
4. `@CurrentUser()` recupere ce payload
5. `AuthService.getSessionUser(auth.sub)` recharge le user depuis PostgreSQL
6. le controller retourne `ok(safeUser)`

Exemple `POST /auth/login` :

1. `LoginDto` valide le body
2. `AuthService.validateUser()` verifie email + password
3. `AuthService.login()` met le user `online`, signe le JWT et pose le cookie
4. la reponse renvoie `SafeUser` dans le format API standard

## Auth API pour le front

### Point important sur le proxy dev

Aujourd'hui, Webpack Dev Server proxifie :

- `/api`
- `/health`
- `/auth`
- `/users`
- `/rooms`
- `/game`
- `/scores`

Pour le front en dev, on peut donc appeler ces routes directement depuis `https://localhost:3000`.

Le backend direct `https://localhost:4000` reste utile pour du debug ou pour les tests shell.

### Regle obligatoire

Pour que la session JWT en cookie fonctionne depuis le navigateur :

- toujours appeler le backend avec `credentials: "include"`
- ne jamais essayer de lire le cookie `access_token` en JavaScript : il est `httpOnly`
- utiliser `/auth/session` ou `/users/me` pour savoir si l'utilisateur est connecte

### Endpoints utiles

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/session`
- `GET /users/me`
- `GET /users/:id`

### Mini checklist manuelle auth

Avec `curl` :

```bash
EMAIL="manual-$(date +%s)@test.com"
PASS="longsecuredpassword123!"
COOKIE_JAR=/tmp/register-cookie.txt

curl -i -c "$COOKIE_JAR" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"username\":\"manual\",\"password\":\"$PASS\"}" \
  https://localhost:4000/auth/register

cat "$COOKIE_JAR"

curl -k -i -b "$COOKIE_JAR" https://localhost:4000/auth/session
curl -k -i -b "$COOKIE_JAR" https://localhost:4000/users/me
curl -k -i -b "$COOKIE_JAR" -c "$COOKIE_JAR" -H 'Content-Type: application/json' -d '{}' https://localhost:4000/auth/logout
curl -k -i -b "$COOKIE_JAR" https://localhost:4000/auth/session
```

Ce qu'il faut verifier :

- `POST /auth/register` repond `201`
- la reponse de `register` contient `Set-Cookie: access_token=...`
- le cookie est present dans le fichier `COOKIE_JAR`
- `GET /auth/session` repond `200` juste apres `register`
- `GET /users/me` repond `200` avec le meme user
- `POST /auth/logout` efface le cookie
- `GET /auth/session` repasse en `401` apres logout

Avec Postman ou Insomnia :

1. creer une requete `POST https://localhost:4000/auth/register`
2. envoyer un body JSON avec `email`, `username`, `password`
3. verifier dans les headers de reponse qu'il y a `Set-Cookie`
4. verifier que le cookie jar de l'outil contient `access_token`
5. appeler `GET https://localhost:4000/auth/session`
6. appeler `GET https://localhost:4000/users/me`
7. appeler `POST https://localhost:4000/auth/logout`
8. rejouer `GET https://localhost:4000/auth/session` et verifier le `401`

### Reponse de succes standard

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

### Reponse d'erreur standard

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

### Exemples front simples

Exemple de base :

```ts
const API_BASE = "";

async function apiFetch(path: string, init: RequestInit = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  return response.json();
}
```

Login :

```ts
await apiFetch("/auth/login", {
  method: "POST",
  body: JSON.stringify({
    email: "user@test.com",
    password: "longsecuredpassword123!",
  }),
});
```

Lire la session courante :

```ts
const session = await apiFetch("/auth/session");
```

Lire le vrai profil connecte :

```ts
const me = await apiFetch("/users/me");
```

Logout :

```ts
await apiFetch("/auth/logout", {
  method: "POST",
});
```

## Regles d'equipe

### 1. Regle de base

Chaque changement doit :

- etre comprehensible
- etre testable rapidement
- ne pas casser le demarrage Docker

Si une fonctionnalite est ajoutee, elle doit idealement etre verifiable soit par navigateur, soit par commande simple.

### 2. Branchements Git

Conventions deja presentes dans le `Makefile` :

- on ne pousse pas directement sur `main`
- on ne pousse pas directement sur `dev`
- on travaille sur des branches dediees

Formats conseilles :

- `issue_<n>/feature/nom-court`
- `issue_<n>/fix/nom-court`
- `issue_<n>/chore/nom-court`

Commandes utiles :

```bash
make branch-create name=issue_4/feature/ma-feature
make branch-create-push name=issue_4/feature/ma-feature
make rebase-dev
make push m="feat: message clair"
```

### 3. Commits

Regles recommandees :

- faire des commits petits et lisibles
- un commit = une intention claire
- message court, explicite, en francais, et coherent dans toute l'equipe
- dans le binome actuel, valider le nom du commit avant chaque commit `feature` ou `fix`

Exemples :

- `feat: ajouter la page profil`
- `fix: corriger le proxy frontend`
- `chore: mettre a jour le workflow docker`

### 4. Docker et dev local

Regles :

- si tu modifies le code frontend ou backend, verifie que la stack redemarre toujours
- si tu modifies `backend/prisma/schema.prisma`, pense a regenerer une migration adaptee
- avant de pousser, lancer au minimum `make smoke-test`
- ne pas modifier les ports par defaut sans bonne raison
- si tu modifies `docker-compose.yml`, documenter l'impact dans `docs/operations/developer-guide.md` ou dans le `README.md`

### 5. Variables d'environnement

Regles :

- toute nouvelle variable doit etre ajoutee a `.env.example`
- toute variable utilisee par le frontend doit etre explicitement documentee
- les noms doivent rester simples et coherents

### 6. API et endpoints

Regles :

- chaque nouvel endpoint doit avoir un but clair
- ajouter un test simple ou une commande de verification quand c'est possible
- en cas de route critique, prevoir un retour d'erreur lisible
- garder `/health` fiable et rapide

### 7. Frontend

Regles :

- eviter les composants trop gros
- separer affichage, logique reseau, et styles quand la complexite augmente
- garder une interface testable rapidement
- si un appel API est ajoute, verifier qu'il fonctionne en environnement Docker

### 8. Backend

Regles :

- garder les routes simples et previsible
- valider les entrees quand de vraies routes metier seront ajoutees
- isoler la logique metier quand le projet grandit
- preparer une structure evolutive plutot que de tout laisser dans un seul fichier

### 9. Base de donnees

Regles :

- ne pas casser la connexion `DATABASE_URL`
- si un schema ou un ORM est ajoute plus tard, documenter les migrations
- toute evolution base de donnees doit etre reproductible

### 10. Definition of done

Une tache est consideree comme terminee si :

- le code est lisible
- la stack demarre
- `make smoke-test` passe
- les logs ne montrent pas d'erreur evidente
- la doc minimale est mise a jour si necessaire

## Prochaines evolutions recommandees

Pour faire grandir le projet proprement, les prochaines etapes logiques sont :

- structurer davantage le backend
- ajouter un ORM
- ajouter une vraie gestion des routes frontend
- ajouter des tests applicatifs
- ajouter un service `nginx` seulement quand un besoin clair apparait
- preparer un mode production distinct du mode developpement

## Resume equipe

Le principe a retenir :

- on privilegie un demarrage rapide
- on garde Docker fonctionnel en permanence
- on teste souvent
- on documente les changements structurants
