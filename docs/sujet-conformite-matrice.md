# Sujet -> Conformite -> Preuves

Date: 2026-04-18
Source: `srcs_subject/module.txt`

Derniere verification: apres merge du lot audit/remediation/perf/doc sur `dev`

## Legende

- `Fait`: implemente et demonstrable
- `Partiel`: base en place, couverture incomplete
- `A faire`: non implemente ou non demonstrable

## Matrice de conformite

| Exigence sujet | Type | Statut | Preuves techniques | Gap restant | Responsable | PR de reference |
|---|---|---|---|---|---|---|
| Framework frontend + backend | Major | Fait | React (`frontend/src`), NestJS (`backend/src`) | - | Fullstack | Historique |
| Features temps reel | Major | Fait | Socket.IO `/ws`, `frontend/src/hooks/useRoomRealtime.ts`, contrats `docs/ws-event-contract.md` | - | Backend Realtime | Historique + lot audit/remediation 2026-04-18 |
| Interaction utilisateurs (chat, profil, amis) | Major | Fait | chat room WS (`backend/src/modules/realtime`), `frontend/src/pages/ProfilePage.tsx`, `frontend/src/pages/FriendsPage.tsx`, APIs `friends/users` | - | Frontend + Backend Social | PR #12 + lot audit/remediation 2026-04-18 |
| ORM | Minor | Fait | Prisma schema + migrations (`backend/prisma`) | - | Backend Data | Historique |
| Notifications create/update/delete | Minor | Partiel | `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`, event `notification:new`, UI dans `frontend/src/pages/FriendsPage.tsx` | pas de suppression cote API/UI, pas de cloche navbar/toasts | Frontend | lot audit/remediation 2026-04-18 |
| SSR | Minor | A faire | - | non demarre | Frontend | N/A |
| Support navigateurs additionnels | Minor | Partiel | verifications locales de flux et roadmap `docs/front-handover-roadmap.md` | recette formelle Chrome/Firefox/Safari a consigner | QA Front | A faire |
| User management (profile/avatar/friends/status) | Major | Partiel | `GET/PATCH /users/me`, `GET /users/:id`, `frontend/src/pages/ProfilePage.tsx`, `frontend/src/pages/FriendsPage.tsx`, status online/offline alimente par auth | pas d'edition manuelle du status, avatar par URL uniquement, pas d'upload natif | Frontend | PR #12 + lot audit/remediation 2026-04-18 |
| Stats + historique | Minor | Partiel | `GET /scores/leaderboard`, `GET /scores/users/:userId`, bloc stats profil `frontend/src/pages/ProfilePage.tsx` | pas de page leaderboard globale ni d'historique de parties dedie | Frontend | lot audit/remediation 2026-04-18 |
| Remote auth OAuth2 | Minor | Fait | OAuth 42 (`/auth/42/start`, `/auth/42/callback`) | - | Backend Auth | Historique |
| 2FA | Minor | A faire | - | non implemente | Backend Auth | N/A |
| Web-based game realtime multiplayer | Major | Fait | `rooms/game/ws` backend + `frontend/src/components/Quiz/GamePanel.tsx` + flux quiz -> room -> game | - | Fullstack Game | PR #4 + PR #12 + lot audit/remediation 2026-04-18 |
| Remote players (machines separees) | Major | Fait | architecture client/server + WS + smoke tests WebSocket | - | Fullstack Realtime | Historique + lot audit/remediation 2026-04-18 |
| Multiplayer >2 | Major | Fait | rooms multi-joueurs, protections metier, `scores/leaderboard` | - | Backend Game | Historique |
| Game customization options | Minor | Partiel | room privee/publique, rooms liees a un quiz (`quizId`), rounds bornes par quiz, creation de quiz cote front | le selecteur UI "temps par question" n'est pas encore branche au backend | Product + Frontend | PR #12 + lot audit/remediation 2026-04-18 |
| Spectator mode | Minor | Partiel | `room:spectate`, `room:spectated`, `room:spectators:update`, protections backend contre `room:start` et `game:answer` | pas de parcours UI spectateur dedie cote frontend | Frontend Realtime | A faire |
| Health check + status page | Minor | Partiel | `/health`, `scripts/smoke-test.sh`, `make test-stack` | pas de vraie status page ni de doc ops/backup formalisee | DevOps | lot audit/remediation 2026-04-18 |

## Plan d'action documentaire

1. Mettre a jour ce tableau a chaque merge impactant API/WS/front.
2. Exiger une preuve par ligne `Fait` (fichier, endpoint, event, test).
3. Garder les lignes `Partiel` explicites pour prioriser les lots restants.

## Quick wins documentation

1. [Fait] Ajouter une section `Preuves de demo` avec parcours utilisateur cible.
2. [Fait] Ajouter une colonne `Responsable` pour accelerer le suivi equipe.
3. [Fait] Ajouter un lien vers la reference de validation quand elle existe.
4. [Fait] Ajouter une date de derniere verification en haut du document.

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
