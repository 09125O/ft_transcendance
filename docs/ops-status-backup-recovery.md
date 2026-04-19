# Ops Runbook: Status, Backup, Recovery

Date: 2026-04-19
Scope: runbook minimal pour la stack locale `ft_transcendance`.

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

## 2. Sauvegarder la base locale

Créer un dump SQL dans `backups/`:

```bash
make backup-db
```

Résultat attendu:

- un fichier du type `backups/quiz_db-YYYYMMDD-HHMMSS.sql`

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

## 5. Démonstration évaluateur

Parcours court:

1. ouvrir `https://localhost:3000/status`
2. montrer `Interface`, `API NestJS`, `PostgreSQL`
3. lancer `make test-stack`
4. lancer `make smoke-test`
5. lancer `make backup-db`
6. montrer le fichier créé dans `backups/`

Ce runbook documente une procédure locale simple et exécutable, sans infrastructure externe.
