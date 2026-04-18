# Front Handover Roadmap

Date: 2026-04-18
Contexte: le frontend et le backend sont maintenant largement alignes sur les flux principaux. Ce document suit surtout les ecarts restants avant cloture sujet.

## 1) Resume executif

Le front couvre maintenant les flux critiques :

- auth locale / guest / OAuth 42
- lobby / room / game / chat
- creation de quiz et creation de room depuis un quiz
- profil utilisateur
- amis + demandes + notifications minimales

Le travail restant n'est plus un rattrapage global. C'est une fermeture cible des gaps suivants :

- mode spectateur cote UI
- page leaderboard globale / historique
- recette multi-browser formelle
- branchement end-to-end de la duree par question

## 2) Etat actuel (factuel)

### Deja exploitable cote front

- Auth locale + session cookie
- Auth guest
- OAuth 42
- Lobby rooms + join/create + game panel
- Creation de quiz
- Creation de room depuis un quiz
- Chat room
- Realtime question/timer/answers/leaderboard
- Profil utilisateur
- Page amis + demandes + notifications
- Stats utilisateur dans le profil

References:
- docs/api-front-contract.md
- docs/front2-realtime-integration.md
- docs/ws-event-contract.md
- docs/backend-front-enablement-spec.md

### Gaps front visibles

- Pas de route spectateur en lecture seule dediee
- Pas de page leaderboard globale ni d'historique de parties
- Pas de cloche notifications en navbar ni de pattern toast unifie
- Pas de recette multi-browser formalisee dans la doc
- Le selecteur "temps par question" du front n'est pas encore branche au backend

## 3) Cibles "sujet" a fermer cote front

Priorite de fermeture (ordre recommande) :

1. Spectator mode
- vue lecture seule d'une room en cours
- navigation claire depuis une room active

2. Stats + historique
- page leaderboard globale
- historique de parties ou vue "derniers resultats"

3. Multi-browser readiness
- checklist recette Chrome / Firefox / Safari

4. Duree par question
- soit brancher le choix par room
- soit retirer le selecteur UI pour rester honnete

5. Notifications UX
- cloche navbar ou pattern de surfacing plus visible
- eviter de cacher toute la surface notif dans la seule page amis

Notes:
- SSR reste mineur et non prioritaire tant que les points ci-dessus ne sont pas clos.
- 2FA reste hors scope front tant que le backend n'expose rien.

## 4) Backlog restant recommande

### Ticket R1 - Mode spectateur UI

- Ajouter une entree claire vers le mode spectateur
- Afficher timer / question / leaderboard sans action joueur
- Montrer explicitement l'etat lecture seule

Definition of Done:
- `room:spectate` branche cote UI
- pas de bouton de reponse ni de start pour un spectateur
- pas de regression sur le mode joueur

### Ticket R2 - Leaderboard globale et historique

- Ajouter une page dediee aux scores
- Reutiliser `GET /scores/leaderboard`
- Ajouter un bloc "historique" ou "resultats recents" si la source existe

Definition of Done:
- navigation visible depuis le front
- etats `loading`, `empty`, `error`, `ready`

### Ticket R3 - QA multi-browser

- Rediger une vraie recette Chrome / Firefox / Safari
- Rejouer les flows auth -> room -> game -> social

Definition of Done:
- checklist versionnee dans la doc
- ecarts critiques consignes

### Ticket R4 - Duree par question

- Soit brancher la valeur choisie dans `RoomCreateFromQuizPanel`
- Soit retirer temporairement le selecteur de l'UI

Definition of Done:
- plus aucun ecart entre UI et backend sur ce parametre

### Ticket R5 - Notifications UX

- Sortir les notifications du seul ecran amis
- Ajouter un point d'entree plus visible (navbar, badge, toast ou autre pattern unique)

Definition of Done:
- pas de duplication des signaux
- l'utilisateur voit rapidement qu'un evenement social l'attend

## 5) Contrats techniques pour le dev front

### API / Auth

- Toujours envoyer `credentials: include`
- Gerer les erreurs standard `success/data/error`
- Rediriger vers login sur `UNAUTHORIZED` quand la session est expiree

### Realtime

- Filtrer strictement les payloads par `roomId`
- Ne jamais faire confiance a `userId` fourni par l'UI
- Traiter `ws:auth:error` comme une invalidation session
- Respecter le delai de grace de reconnexion documente dans `docs/front2-realtime-integration.md`

### Etats UI minimaux par vue

- `loading`
- `empty`
- `error`
- `ready`

## 6) Backlog priorise (copier-coller en issues)

P0:
- R1 Mode spectateur UI
- R3 QA front multi-browser
- R4 Duree par question end-to-end

P1:
- R2 Leaderboard / historique
- R5 Notifications UX

P2:
- accessibilite / a11y de finition
- polish visuel secondaire

## 7) Risques et dependances

- Risque principal: donner l'impression d'une conformite sujet fermee alors que spectateur / historique / multi-browser ne sont pas encore demontrables
- Dependance: rester strictement aligne avec les contrats API/WS deja exposes cote backend
- Mitigation: traiter les deltas restants sans reouvrir l'architecture
- Spec backend de rattrapage: docs/backend-front-enablement-spec.md

## 8) Commandes utiles front

- Lancer stack: `make up`
- Smoke global: `make smoke-test`
- WS smoke backend: `make smoke-test-ws`
- Lint front: `cd frontend && npm run lint`
- Build front: `cd frontend && npm run build`

## 9) Livrables attendus

- Navigation front enrichie: home, login, register, profil, amis, leaderboard, spectateur
- UX realtime stabilisee (erreurs, etats, feedback)
- Checklist QA navigateurs
- Dossier de demo oriente sujet (preuves fonctionnelles)

## 10) Hygiene documentaire

- A chaque PR: verifier que les sections API/WS impactees sont a jour
- Verifier que README pointe vers les bons documents
- Refuser merge si l'ecart doc/impl existe sur un flux critique
- Mettre a jour la matrice apres chaque lot front restant (spectateur, stats, QA multi-browser)

## 11) Quick wins doc

1. Maintenir `docs/sujet-conformite-matrice.md` comme source de verite sujet.
2. Garder une mini checklist de demo executable sans connaissance interne du code.
3. Verifier que cette roadmap reste descriptive du reel et non du plan passe.
