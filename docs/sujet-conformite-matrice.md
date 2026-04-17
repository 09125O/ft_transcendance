# Sujet -> Conformite -> Preuves

Date: 2026-04-17  
Source: `srcs_subject/module.txt`

## Legende

- `Fait`: implemente et demonstrable
- `Partiel`: base en place, couverture incomplete
- `A faire`: non implemente ou non demonstrable

## Matrice de conformite

| Exigence sujet | Type | Statut | Preuves techniques | Gap restant | Responsable | PR de reference |
|---|---|---|---|---|---|---|
| Framework frontend + backend | Major | Fait | React (`frontend/src`), NestJS (`backend/src`) | - | Fullstack | Historique (avant suivi PR) |
| Features temps reel | Major | Fait | Socket.IO `/ws`, contrats `docs/ws-event-contract.md` | - | Backend Realtime | Historique (avant suivi PR) |
| Interaction utilisateurs (chat, profil, amis) | Major | Partiel | chat room WS, profil API (`PATCH /users/me`), API amis | UI front amis/profil a finaliser | Frontend + Backend Social | A lier (prochaine PR front social) |
| ORM | Minor | Fait | Prisma schema + migrations (`backend/prisma`) | - | Backend Data | Historique (avant suivi PR) |
| Notifications create/update/delete | Minor | Partiel | API notifications + event `notification:new` | scenarios front UX a finaliser | Frontend | A lier (prochaine PR front notifications) |
| SSR | Minor | A faire | - | non prioritaire, non demarre | Frontend | N/A |
| Support navigateurs additionnels | Minor | Partiel | checklist mentionnee roadmap | execution QA multi-browser a formaliser | QA Front | A lier (prochaine PR QA front) |
| User management (profile/avatar/friends/status) | Major | Partiel | routes users/friends + modele user | vues front management a finir | Frontend | A lier (prochaine PR front profil/amis) |
| Stats + historique | Minor | Partiel | endpoints scores/leaderboard | ecran historique front a renforcer | Frontend | A lier (prochaine PR front stats) |
| Remote auth OAuth2 | Minor | Fait | OAuth 42 (`/auth/42/start`, `/auth/42/callback`) | - | Backend Auth | Historique (avant suivi PR) |
| 2FA | Minor | A faire | - | lot optionnel apres conformite principale | Backend Auth | N/A |
| Web-based game realtime multiplayer | Major | Fait | room/game/ws backend + ecran game front | - | Fullstack Game | Historique (avant suivi PR) |
| Remote players (machines separees) | Major | Fait | architecture client/server + WS | - | Fullstack Realtime | Historique (avant suivi PR) |
| Multiplayer >2 | Major | Fait | rooms multi-joueurs + leaderboard | - | Backend Game | Historique (avant suivi PR) |
| Game customization options | Minor | Partiel | rounds/rooms configurables | enrichissements gameplay optionnels | Product + Frontend | A lier (prochaine PR gameplay UX) |
| Spectator mode | Minor | Partiel | `room:spectate` + protections backend | parcours UI spectateur a finaliser | Frontend Realtime | A lier (prochaine PR front spectator) |
| Health check + status page | Minor | Partiel | `/health`, smoke scripts | formaliser backup/DR dans doc ops | DevOps | A lier (prochaine PR ops doc) |

## Plan d'action documentaire

1. Mettre a jour ce tableau a chaque merge impactant API/WS/front.
2. Exiger une preuve par ligne `Fait` (fichier, endpoint, event, test).
3. Garder les lignes `Partiel` explicites pour prioriser les lots front.

## Quick wins documentation

1. [Fait] Ajouter une section `Preuves de demo` avec parcours utilisateur cible.
2. [Fait] Ajouter une colonne `Responsable` pour accelerer le suivi equipe.
3. [Fait] Ajouter un lien vers la PR qui a valide chaque exigence majeure.
4. [Fait] Ajouter une date de derniere verification en haut du document.

## Preuves de demo (parcours cible)

1. Authentification locale ou OAuth 42 puis verification de session.
2. Creation ou jointure de room, puis verification des etats waiting/playing.
3. Demarrage de partie et reception question/timer en temps reel.
4. Soumission de reponse et mise a jour leaderboard.
5. Consultation leaderboard global et stats utilisateur.
6. Envoi d'une demande d'ami puis acceptation.
7. Reception d'une notification puis marquage lu.
8. Connexion spectateur sur une room active.
9. Verification qu'un spectateur ne peut pas lancer ni repondre.
10. Verification `/health` et execution smoke principal.
