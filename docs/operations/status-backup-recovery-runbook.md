# Ops Runbook: Status, Backup, Recovery

Date: 2026-05-05
Scope: runbook minimal pour la stack locale `ft_transcendance`.

Important :

- ce runbook documente une sauvegarde automatisee locale embarquee dans la stack Docker
- il ne decrit pas un monitoring externe ni une strategie d'infrastructure distante
- il doit etre presente comme une preuve locale executable, pas comme une plateforme ops enterprise

## 0. Principe

La stack locale embarque 2 niveaux de sauvegarde :

- un sidecar `backup` qui cree automatiquement des dumps PostgreSQL dans `.local/backups/`
- des commandes manuelles `make backup-db` et `make restore-db` pour provoquer une sauvegarde ou restaurer un dump choisi

Le backend lit l'etat de l'automatisation depuis `.local/backend-runtime/backup-status.json` et l'expose dans `/health`. La page `${FRONTEND_ORIGIN}/status` affiche ce meme etat.

Le runbook vaut pour les 2 profils supportes :

- `HTTPS local`
- `HTTP/LAN`

## 1. Verifier l'etat de la stack

Commandes de base :

```bash
make test-stack
make smoke-test
```

Points de controle :

- frontend : `${FRONTEND_ORIGIN}`
- page status : `${FRONTEND_ORIGIN}/status`
- backend health : `${APP_PROTOCOL}://localhost:${BACKEND_PORT}/health`

Lecture attendue de `/status` :

- `Interface` active si la page s'affiche
- `API NestJS` OK si `/health` repond avec `ok: true`
- `PostgreSQL` OK si `database.configured = true` et `database.ok = true`
- `Sauvegarde automatisee` OK si le sidecar `backup` publie un dernier succes recent dans `/health`

Variables de pilotage :

- `BACKUP_INTERVAL_SECONDS` : frequence des dumps automatiques
- `BACKUP_RETENTION_COUNT` : nombre de dumps gardes dans `.local/backups/`

## 2. Sauvegarder la base locale

Automatique :

- un premier dump est tente au demarrage de la stack
- puis un dump est retente toutes les `BACKUP_INTERVAL_SECONDS`
- seuls les `BACKUP_RETENTION_COUNT` dumps les plus recents sont conserves

Manuel :

Creer un dump SQL dans `.local/backups/` :

```bash
make backup-db
```

Resultat attendu :

- un fichier du type `.local/backups/quiz_db-YYYYMMDD-HHMMSS.sql`
- le sidecar `backup` met a jour `.local/backend-runtime/backup-status.json`
- la page `/status` affiche `Dernier succes` et `Dernier dump`

Le dump contient des `DROP` / `CREATE` pour permettre une restauration complete de la base locale.

## 3. Restaurer une sauvegarde

Restaurer un dump :

```bash
make restore-db file=.local/backups/quiz_db-YYYYMMDD-HHMMSS.sql
```

Notes :

- la restauration cible la base PostgreSQL locale du conteneur `quiz_db`
- elle interrompt logiquement les donnees en cours et remplace l'etat courant par celui du dump
- apres restauration, relancer un controle avec `make test-stack` puis `make smoke-test`

## 4. Si `/health` echoue

1. verifier les conteneurs :

```bash
docker compose ps
```

2. verifier la config :

```bash
make env-check
```

3. redemarrer proprement :

```bash
make restart
```

4. si la base semble incoherente apres changement de credentials `.env` :

```bash
make fclean
make up
```

5. si seul le backup est en attention :

```bash
make logs-backup
make backup-db
```

Verifier ensuite que `/status` remonte un `Dernier succes` coherent.

## 5. Demonstration evaluateur

Parcours court :

1. ouvrir `${FRONTEND_ORIGIN}/status`
2. montrer `Interface`, `API NestJS`, `PostgreSQL`
3. lancer `make test-stack`
4. lancer `make smoke-test`
5. montrer l'etat `Sauvegarde automatisee` dans `/status`
6. lancer `make backup-db`
7. montrer le fichier cree dans `.local/backups/`

Ce runbook documente une procedure locale simple et executable, avec sauvegarde automatisee locale et reprise manuelle.
