# Sujet -> Conformite -> Preuves

Date: 2026-04-18
Sources:

- `srcs_subject/en.subject.pdf`
- `srcs_subject/Intra Projects ft_transcendence Edit.pdf`

Derniere verification: lecture interne du projet a partir des PDFs officiels et de l'etat courant de `dev`

Important:

- la verite officielle pour la liste des modules, leur nature `Major/Minor` et le cadre d'evaluation reste strictement dans :
  - `srcs_subject/en.subject.pdf`
  - `srcs_subject/Intra Projects ft_transcendence Edit.pdf`
- ce document est une matrice de travail
- les statuts ci-dessous decrivent l'etat estime du projet et les decisions internes de priorisation
- ils ne remplacent ni le texte du sujet, ni la decision finale des evaluateurs

## Legende

- `Fait`: implemente et demonstrable
- `Partiel`: implemente en partie ou couverture produit incomplete
- `Non vise`: module bien present dans le sujet officiel, mais non retenu dans le plan interne courant

## Regles de score

- `Major = 2 points`
- `Minor = 1 point`
- minimum requis pour valider: `14 points`
- seuls les modules pleinement fonctionnels et correctement implementes comptent
- module incomplet ou non demonstrable = `0 point`
- le bonus au-dela de `14` est plafonne a `+5`

## Score courant et cible

Estimation interne argumentee aujourd'hui: `14 / 14`

Modules actuellement revendicables sans sur-promesse:

- `[Major][2]` Framework frontend + backend
- `[Major][2]` Features temps reel
- `[Major][2]` Interaction utilisateurs
- `[Minor][1]` ORM
- `[Minor][1]` Remote auth OAuth2
- `[Major][2]` Web-based game realtime multiplayer
- `[Major][2]` Remote players
- `[Major][2]` Multiplayer >2

Total: `14`

Chemin interne retenu pour viser `19 / 14`:

- `[Minor][1]` Notifications create/update/delete
- `[Minor][1]` Support navigateurs additionnels
- `[Minor][1]` Stats + historique
- `[Minor][1]` Game customization options
- `[Minor][1]` Health check + status page

Ces 5 modules restent en statut `Partiel` tant qu'ils ne sont pas fermes et demonstrables.

## Matrice de conformite

| Exigence sujet | Type | Statut | Preuves techniques | Gap restant | Responsable | PR de reference |
|---|---|---|---|---|---|---|
| Framework frontend + backend | Major | Fait | React (`frontend/src`), NestJS (`backend/src`) | - | Fullstack | Historique |
| Features temps reel | Major | Fait | Socket.IO `/ws`, `frontend/src/hooks/useRoomRealtime.ts`, contrats `docs/ws-event-contract.md` | - | Backend Realtime | Historique + lot audit/remediation 2026-04-18 |
| Interaction utilisateurs (chat, profil, amis) | Major | Fait | chat room WS (`backend/src/modules/realtime`), `frontend/src/pages/ProfilePage.tsx`, `frontend/src/pages/FriendsPage.tsx`, APIs `friends/users` | - | Frontend + Backend Social | PR #12 + lot audit/remediation 2026-04-18 |
| ORM | Minor | Fait | Prisma schema + migrations (`backend/prisma`) | - | Backend Data | Historique |
| Notifications create/update/delete | Minor | Partiel | `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`, event `notification:new`, UI dans `frontend/src/pages/FriendsPage.tsx` | pas de suppression cote API/UI, pas de cloche navbar/toasts, pas d'ecoute front de `notification:new` | Frontend | lot audit/remediation 2026-04-18 |
| Support navigateurs additionnels | Minor | Partiel | verifications locales de flux et roadmap `docs/front-handover-roadmap.md` | recette formelle Chrome/Firefox/Safari a consigner | QA Front | A faire |
| User management (profile/avatar/friends/status) | Major | Partiel | `GET/PATCH /users/me`, `GET /users/:id`, `frontend/src/pages/ProfilePage.tsx`, `frontend/src/pages/FriendsPage.tsx`, status online/offline alimente par auth | pas d'edition manuelle du status, avatar par URL uniquement, pas d'upload natif | Frontend | PR #12 + lot audit/remediation 2026-04-18 |
| Stats + historique | Minor | Partiel | `GET /scores/leaderboard`, `GET /scores/users/:userId`, bloc stats profil `frontend/src/pages/ProfilePage.tsx` | pas de page leaderboard globale ni d'historique de parties dedie | Frontend | lot audit/remediation 2026-04-18 |
| Remote auth OAuth2 | Minor | Fait | OAuth 42 (`/auth/42/start`, `/auth/42/callback`) | - | Backend Auth | Historique |
| 2FA | Minor | Non vise | - | retire du plan interne courant | Backend Auth | Decision produit 2026-04-18 |
| Web-based game realtime multiplayer | Major | Fait | `rooms/game/ws` backend + `frontend/src/components/Quiz/GamePanel.tsx` + flux quiz -> room -> game | - | Fullstack Game | PR #4 + PR #12 + lot audit/remediation 2026-04-18 |
| Remote players (machines separees) | Major | Fait | architecture client/server + WS + smoke tests WebSocket | - | Fullstack Realtime | Historique + lot audit/remediation 2026-04-18 |
| Multiplayer >2 | Major | Fait | rooms multi-joueurs, protections metier, `scores/leaderboard` | - | Backend Game | Historique |
| Game customization options | Minor | Partiel | room privee/publique, rooms liees a un quiz (`quizId`), rounds bornes par quiz, creation de quiz cote front | le selecteur UI "temps par question" n'est pas encore branche au backend | Product + Frontend | PR #12 + lot audit/remediation 2026-04-18 |
| Spectator mode | Minor | Non vise | backend WS expose `room:spectate`, `room:spectated`, `room:spectators:update` avec protections metier | pas de parcours UI prevu dans le plan interne courant | Frontend Realtime | Decision produit 2026-04-18 |
| SSR | Minor | Non vise | - | retire du plan interne courant | Frontend | Decision produit 2026-04-18 |
| Health check + status page | Minor | Partiel | `/health`, `scripts/smoke-test.sh`, `make test-stack` | pas de vraie status page ni de doc ops/backup formalisee | DevOps | lot audit/remediation 2026-04-18 |

## Cible 19 points

Les 5 modules actifs a fermer en priorite sont:

1. `Notifications create/update/delete`
Ce que demande le sujet: "A complete notification system for all creation, update, and deletion actions."

2. `Support navigateurs additionnels`
Ce que demande le sujet: compatibilite complete avec au moins `2` navigateurs additionnels, test/fix des features dans chaque navigateur, limitations documentees, UI/UX coherente.

3. `Stats + historique`
Ce que demande le sujet: statistiques de jeu, historique de matchs, progression/achievements et integration leaderboard. Ce module exige deja un jeu fonctionnel.

4. `Game customization options`
Ce que demande le sujet: differents maps ou themes, reglages de jeu personnalisables et options par defaut disponibles. Ce module exige deja un jeu fonctionnel.

5. `Health check + status page`
Ce que demande le sujet: health/status page avec sauvegardes automatisees et procedures de reprise/disaster recovery.

## Plan d'action documentaire

1. Mettre a jour ce tableau a chaque merge impactant API/WS/front.
2. Exiger une preuve par ligne `Fait` (fichier, endpoint, event, test).
3. Garder les lignes `Partiel` explicites pour prioriser les lots restants.
4. Garder les lignes `Non vise` explicites pour eviter de confondre sujet officiel et priorisation interne.
5. Maintenir `docs/design-system/transcendance-web-app/MASTER.md` synchronise avec l'implementation front.
6. Maintenir `docs/design-system/transcendance-web-app/pages/lobby.md` synchronise avec la page lobby reelle.
7. Maintenir `docs/design-system/transcendance-web-app/pages/game-room.md` synchronise avec le flux room reel.

## Preuves de demo (parcours cible)

1. Authentification locale, guest ou OAuth 42 puis verification de session.
2. Creation ou jointure de room, puis verification des etats `waiting` / `playing`.
3. Demarrage de partie et reception question/timer en temps reel.
4. Soumission de reponse et mise a jour du leaderboard room.
5. Consultation des stats utilisateur dans le profil.
6. Envoi d'une demande d'ami puis acceptation.
7. Reception d'une notification puis marquage lu.
8. Verification que le refresh d'une room conserve la place pendant le delai de grace.
9. Verification que `POST /quizzes` refuse sans session et accepte avec session.
10. Verification `/health` et execution smoke principal.
