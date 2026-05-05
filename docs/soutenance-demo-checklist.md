# Soutenance Demo Checklist

Date: 2026-05-05
Statut: checklist de demonstration liee a l'etat courant de `dev`

## 1. Rappel

Cette checklist est une aide de demonstration.

- les modules officiels et leur score viennent uniquement de `srcs_subject/en.subject.pdf` et `srcs_subject/Intra Projects ft_transcendence Edit.pdf`
- cette checklist decrit seulement ce qui est effectivement montrable avec l'implementation actuelle

## 2. Pre-flight

Choisir d'abord le profil voulu dans `.env` :

- `HTTPS local` pour une demo sur un seul poste
- `HTTP/LAN` pour tester plusieurs postes sur le meme reseau

Puis :

```bash
make env-check
make restart
make test-stack
make smoke-test
```

Verifier :

- `${FRONTEND_ORIGIN}`
- `${FRONTEND_ORIGIN}/status`
- `${APP_PROTOCOL}://localhost:${BACKEND_PORT}/health`

Notes :

- pour un test multi-postes, les clients ouvrent `http://IP_DE_LA_MACHINE_HOTE:3000`
- dans ce mode, utiliser de preference auth locale ou guest
- OAuth 42 n'est pertinent que si vous disposez d'une URL partagee et d'une `FT_REDIRECT_URI` cohérente

## 3. Parcours 1 - Auth

Objectif :

- montrer auth locale, guest ou OAuth 42
- montrer que la session existe

Chemin :

1. ouvrir `/login` ou utiliser guest
2. se connecter
3. verifier que la navbar n'affiche plus un etat anonyme
4. ouvrir `/profile`
5. verifier qu'un refresh conserve la session

Preuves modules :

- framework frontend + backend
- standard user management and authentication
- remote authentication si OAuth 42 est montre depuis une vraie URL partagee

## 4. Parcours 2 - User management

Objectif :

- montrer edition du profil
- montrer upload avatar natif

Chemin :

1. ouvrir `/profile`
2. changer le pseudo
3. choisir un fichier image
4. enregistrer
5. verifier l'avatar sur `/profile`
6. verifier le meme avatar sur `/friends`
7. montrer le bouton de retour a l'avatar par defaut

Preuves modules :

- standard user management and authentication
- interaction utilisateurs

## 5. Parcours 3 - Social

Objectif :

- montrer le flux amis
- montrer la notification associee

Chemin :

1. depuis un second compte, envoyer une demande
2. sur le premier compte, ouvrir `/friends`
3. accepter ou refuser
4. montrer la notification
5. marquer lu puis supprimer

Preuves modules :

- interaction utilisateurs
- notification system si vous choisissez de le revendiquer aussi

## 6. Parcours 4 - Realtime game

Objectif :

- montrer le coeur room -> game -> leaderboard

Chemin :

1. ouvrir `/quiz-ready`
2. choisir un quiz
3. creer une room
4. configurer `questionDurationMs`
5. faire rejoindre un autre joueur
6. lancer la partie
7. repondre a une question
8. montrer le leaderboard de room

Preuves modules :

- realtime features
- web-based game
- remote players
- multiplayer `>2`
- game customization options

## 7. Parcours 5 - Stats

Objectif :

- montrer stats et historique

Chemin :

1. ouvrir `/leaderboard`
2. montrer classement global
3. ouvrir `/profile`
4. montrer historique recent et stats

Preuves modules :

- game statistics and match history

## 8. Parcours 6 - Health and backup

Objectif :

- montrer que la stack et la sauvegarde sont observables

Chemin :

1. ouvrir `/status`
2. montrer `Interface`, `API NestJS`, `PostgreSQL`, `Sauvegarde automatisee`
3. lancer `make test-stack`
4. lancer `make backup-db`
5. montrer le dump cree dans `backups/`

Preuves modules :

- health check and status page

## 9. Modules a ne pas sur-promettre

Ne pas faire reposer la demo principale sur :

- `2FA`
- `SSR`
- spectator mode cote UI

Vous pouvez aussi garder en reserve :

- notification system
- support for additional browsers

Ces 2 points existent, mais ne sont pas necessaires au chemin principal interne vers `19 / 14`.
