# Ops Runbook: Status, Backup, Recovery

Date: 2026-04-19
Scope: runbook minimal pour la stack locale `ft_transcendance`.

Important:

- ce runbook documente une sauvegarde automatisee locale embarquee dans la stack Docker
- il ne decrit pas un monitoring externe ni une strategie d'infrastructure distante
- il doit etre presente comme une preuve locale executable, pas comme une plateforme ops enterprise

## 0. Principe

La stack locale embarque maintenant 2 niveaux de sauvegarde:

- un sidecar `backup` qui cree automatiquement des dumps PostgreSQL dans `backups/`
- des commandes manuelles `make backup-db` et `make restore-db` pour provoquer une sauvegarde ou restaurer un dump choisi

Le backend lit l'etat de l'automatisation depuis `backend/.runtime/backup-status.json` et l'expose dans `/health`. La page `https://localhost:3000/status` affiche ce meme etat.

## 1. Vérifier l'état de la stack

Commandes de base:

```bash
make test-stack
make smoke-test
```

Points de contrôle:

- frontend: `https://localhost:3000`
- page status: `https://localhost:3000/status`
- backend health: `https://localhost:4000/health`

Lecture attendue de `/status`:

- `Interface` active si la page s'affiche
- `API NestJS` OK si `/health` répond avec `ok: true`
- `PostgreSQL` OK si `database.configured = true` et `database.ok = true`
- `Sauvegarde automatisee` OK si le sidecar backup publie un dernier succes recent dans `/health`

Variables de pilotage:

- `BACKUP_INTERVAL_SECONDS`: frequence des dumps automatiques
- `BACKUP_RETENTION_COUNT`: nombre de dumps gardes dans `backups/`

## 2. Sauvegarder la base locale

Automatique:

- un premier dump est tente au demarrage de la stack
- puis un dump est retente toutes les `BACKUP_INTERVAL_SECONDS`
- seuls les `BACKUP_RETENTION_COUNT` dumps les plus recents sont conserves

Manuel:

Creer un dump SQL dans `backups/`:

```bash
make backup-db
```

Résultat attendu:

- un fichier du type `backups/quiz_db-YYYYMMDD-HHMMSS.sql`
- le sidecar `backup` met a jour `backend/.runtime/backup-status.json`
- la page `/status` affiche `Dernier succes` et `Dernier dump`

Le dump contient des `DROP` / `CREATE` pour permettre une restauration complète de la base locale.

## 3. Restaurer une sauvegarde

Restaurer un dump:

```bash
make restore-db file=backups/quiz_db-YYYYMMDD-HHMMSS.sql
```

Notes:

- la restauration cible la base PostgreSQL locale du conteneur `quiz_db`
- elle interrompt logiquement les données en cours et remplace l'état courant par celui du dump
- après restauration, relancer un contrôle avec `make test-stack` puis `make smoke-test`

## 4. Si `/health` échoue

1. vérifier les conteneurs:

```bash
docker compose ps
```

2. vérifier la config:

```bash
make env-check
```

3. redémarrer proprement:

```bash
make restart
```

4. si la base semble incohérente après changement de credentials `.env`:

```bash
make fclean
make up
```

5. si seul le backup est en attention:

```bash
make logs-backup
make backup-db
```

Verifier ensuite que `/status` remonte un `Dernier succes` coherent.

## 5. Démonstration évaluateur

Parcours court:

1. ouvrir `https://localhost:3000/status`
2. montrer `Interface`, `API NestJS`, `PostgreSQL`
3. lancer `make test-stack`
4. lancer `make smoke-test`
5. montrer l'etat `Sauvegarde automatisee` dans `/status`
6. lancer `make backup-db`
7. montrer le fichier créé dans `backups/`

Ce runbook documente une procedure locale simple et executable, avec sauvegarde automatisee locale et reprise manuelle.
