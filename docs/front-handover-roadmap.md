# Front Handover Roadmap

Date: 2026-04-16
Contexte: le backend est plus avance que le frontend. Ce document sert de plan de rattrapage pour la personne en charge du front.

## 1) Resume executif

Le socle backend est deja solide (auth, rooms, game, realtime, scores, CI, securite).
Le front couvre bien le flux principal (login/register/lobby/game), mais pas encore les modules "produit" attendus par le sujet.

Objectif: faire converger le front vers les modules a valider sans reouvrir la conception backend.

## 2) Etat actuel (factuel)

### Deja exploitable cote front

- Auth locale + session cookie
- OAuth 42
- Lobby rooms + join/create + game panel
- Chat room
- Realtime question/timer/answers/leaderboard
- Endpoints scores/leaderboard

References:
- docs/api-front-contract.md
- docs/front2-realtime-integration.md
- docs/ws-event-contract.md
- docs/backend-front-enablement-spec.md

### Gaps front visibles

- Pas d'ecran dedie profil joueur
- Pas d'UI amis (liste, demandes, actions)
- Pas de centre de notifications UX
- Pas de mode spectateur cote interface
- Pas de matrice QA navigateurs visible

## 3) Cibles "sujet" a fermer cote front

Priorite de fermeture (ordre recommande):

1. User management visible en UI
- profil
- avatar
- statut
- historique simple

2. Interaction utilisateurs
- amis/demandes (si API prete) ou fallback visible "bientot" + specs UX terminees

3. Spectator mode
- vue lecture seule d'une room en cours

4. OAuth complet cote UX
- bouton 42 deja present
- ajouter etats loading/erreur/retry robustes

5. Multi-browser readiness
- checklist recette Chrome/Firefox/Safari

Notes:
- SSR est une demande mineure du sujet. A traiter seulement si les points majeurs ci-dessus sont clos.
- 2FA est mineur mais a forte valeur percue: prevoir au moins la structure UI si backend non livre.

## 4) Plan en 2 sprints (front-first)

## Sprint F1 (MVP demo-ready)

Objectif: rendre visible en UI les capacites deja disponibles backend.

### Ticket F1-01 - Ecran Profil

- Creer une page Profil (route dediee)
- Afficher user courant: username, avatar, status, createdAt
- Afficher mini bloc "stats" (score/wins depuis endpoint scores user)

Definition of Done:
- Route accessible depuis navbar
- Etats loading/empty/error geres
- Donnees chargees avec credentials include

### Ticket F1-02 - Historique/Leaderboard UX

- Ajouter page leaderboard globale
- Ajouter bloc "mes stats" dans profil
- Lien rapide depuis Home

Definition of Done:
- Tri et pagination simple (ou limit progressif)
- Fallback quand aucune partie

### Ticket F1-03 - Stabilisation UX realtime game

- Uniformiser les etats: waiting/playing/finished
- Rendre explicites les erreurs realtime (unauthorized/conflict)
- Ajouter confirmations UI sur actions owner (start room)

Definition of Done:
- Aucune action silencieuse en echec
- Message utilisateur clair pour chaque code d'erreur principal

### Ticket F1-04 - QA front de base

- Ecrire scenarios manuels reproductibles
- Valider flows login -> join room -> game -> leaderboard
- Recette sur Chrome + Firefox + Safari

Definition of Done:
- Checklist committee dans docs/
- Defauts critiques traces

## Sprint F2 (modules sujet visibles)

Objectif: fermer les ecarts sujet cote experience utilisateur.

### Ticket F2-01 - UI Amis (si API disponible)

- Vue liste amis
- Vue demandes recues/envoyees
- Actions: envoyer/accepter/refuser

Fallback si API pas encore exposee:
- Ecran "Amis" avec maquette fonctionnelle + contrat API attendu

Definition of Done:
- Navigation complete
- Etats vides et erreurs couverts

### Ticket F2-02 - Notifications UX

- Cloche de notifications en navbar
- Toasts evenements critiques (invite room, game start, etc.)

Definition of Done:
- Pattern unique de notification
- Pas de duplication de toasts

### Ticket F2-03 - Mode Spectateur

- Route spectateur en lecture seule
- Affichage timer/question/leaderboard sans emission de reponse

Definition of Done:
- Role spectateur isole des actions joueur
- Pas de regression sur mode joueur

### Ticket F2-04 - Accessibilite et finition

- Focus states clavier
- Contrastes minimums
- Labels/formulaires coherents

Definition of Done:
- Audit manuel a11y de base valide

## 5) Contrats techniques pour le dev front

### API / Auth

- Toujours envoyer credentials: include
- Gerer les erreurs standard success/data/error
- Redirect login sur UNAUTHORIZED session expiree

### Realtime

- Filtrer strictement les payloads par roomId
- Ne jamais faire confiance a userId fourni par UI
- Traiter ws:auth:error comme invalidation session

### Etats UI minimaux par vue

- loading
- empty
- error
- ready

## 6) Backlog priorise (copier-coller en issues)

P0:
- F1-01 Ecran Profil
- F1-03 Stabilisation UX realtime game
- F1-04 QA front multi-browser

P1:
- F1-02 Leaderboard UX
- F2-03 Spectator mode

P2:
- F2-01 UI Amis
- F2-02 Notifications UX
- F2-04 Accessibilite

## 7) Risques et dependances

- Risque principal: avance backend non visible en demo si UI insuffisante
- Dependance: alignement front sur les endpoints social/notifications dejas exposes cote backend
- Mitigation: travailler en mode "UI first + adapter service" pour debloquer l'integration
- Spec backend de rattrapage: docs/backend-front-enablement-spec.md

## 8) Commandes utiles front

- Lancer stack: make up
- Smoke global: make smoke-test
- WS smoke backend: make smoke-test-ws

## 9) Livrables attendus fin F2

- Navigation front enrichie: home, login, register, profil, leaderboard, spectateur
- UX realtime stabilisee (erreurs, etats, feedback)
- Checklist QA navigateurs
- Dossier de demo orientee sujet (preuves fonctionnelles)

## 10) Plan d'amelioration documentaire (execution)

Objectif: rendre la conformite au sujet lisible en moins de 5 minutes pour tout nouveau collaborateur.

### Lot D1 - Matrice de conformite sujet (P0)

- Source de verite: `srcs_subject/module.txt`
- Livrable: `docs/sujet-conformite-matrice.md`
- Regle: chaque exigence du sujet pointe vers une preuve concrete (endpoint, event WS, ecran front, test, script, doc)
- Owner recommande: PM/Lead dev

Definition of Done:
- toutes les lignes du sujet ont un statut `Fait`, `Partiel` ou `A faire`
- chaque ligne `Fait` a au moins une preuve technique

### Lot D2 - Checklist de demo soutenance (P0)

- Livrable: section dediee dans la matrice + script de passage de demo
- Parcours minimum: auth -> room -> game -> scores -> social -> spectateur
- Sortie attendue: aucun trou fonctionnel pendant la demo

Definition of Done:
- checklist executable sans connaissance interne du code
- references explicites vers les pages front et contrats API/WS

### Lot D3 - Guide front de production (P1)

- Livrable: clarifier les pre-requis front dans ce fichier (etats UI, erreurs, fallback)
- Ajouter les conventions de rendu: `loading`, `empty`, `error`, `ready`
- Ajouter les attentes de tests manuels multi-navigateurs

Definition of Done:
- la personne front peut implementer sans demander les contrats backend

### Lot D4 - Hygiene documentaire continue (P1)

- A chaque PR: verifier que les sections API/WS impactees sont a jour
- Verifier que README pointe vers les bons documents
- Refuser merge si l'ecart doc/impl existe sur un flux critique

Definition of Done:
- aucune reference obsoletisee dans les docs principales

## 11) Quick wins doc (1-2 heures)

1. Ajouter un tableau `Sujet -> Statut -> Preuves` dans `docs/sujet-conformite-matrice.md`.
2. Ajouter une mini check-list de demo (10 etapes) avec liens vers endpoints/events.
3. Ajouter dans README un bloc `Conformite sujet` qui pointe vers la matrice.
4. Ajouter un statut explicite `Partiel` pour SSR et 2FA afin d'eviter les zones grises.
5. Mettre a jour la matrice apres chaque lot front (profil, amis, notifications, spectateur).
