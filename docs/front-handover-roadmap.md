# Front Handover Roadmap

Date: 2026-04-18
Contexte: le frontend et le backend sont alignes sur les flux critiques. Ce document suit les ecarts encore actifs et le chemin interne retenu pour viser `19` points a partir des exigences officielles de `en.subject.pdf` et `Intra Projects ft_transcendence Edit.pdf`.

Important:

- les modules officiels et leur score viennent uniquement des 2 PDFs
- cette roadmap ne redefinit pas le sujet
- elle decrit seulement l'ordre interne de priorisation retenu par le projet

## 1) Resume executif

Le front couvre aujourd'hui :

- auth locale / guest / OAuth 42
- lobby / room / game / chat
- creation de quiz et creation de room depuis un quiz
- profil utilisateur
- amis + demandes + notifications minimales
- stats utilisateur dans le profil

Les deltas encore actifs a fermer pour viser `19 / 14` sont :

- completion du module notifications
- page leaderboard globale / historique
- recette multi-browser formelle
- alignement end-to-end de la duree par question
- surface health / status minimale et dossier de preuve associe

## 2) Modules non vises dans le plan interne courant

Les points suivants existent bien dans le sujet officiel, mais ne font plus partie du plan actif retenu :

- mode spectateur cote UI
- `2FA`
- `SSR`

Note:
- la capacite backend `room:spectate` reste documentee et disponible, mais aucun parcours frontend dedie n'est prevu

## 3) Etat actuel (factuel)

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

### Gaps front visibles dans le scope courant

- Pas de page leaderboard globale ni d'historique de parties
- Pas de cloche notifications en navbar ni de pattern toast unifie
- Pas de recette multi-browser formalisee dans la doc
- Le selecteur "temps par question" du front n'est pas encore branche au backend
- Le front courant ne subscribe pas encore `notification:new`
- Il n'existe pas de vraie status page cote front

## 4) Backlog restant recommande

Ordre retenu pour viser `19` avec le moins de risque :

1. `Game customization options`
2. `Game statistics and match history`
3. `Support for additional browsers`
4. `Notification system`
5. `Health check & status page`

### Ticket R1 - Game customization options

- Fermer l'ecart entre le selecteur "temps par question" et le backend
- Ajouter au moins une surface de personnalisation lisible et demonstrable pour la partie
- Garantir des options par defaut disponibles

Reference sujet:
- "Different maps or themes"
- "Customizable game settings"
- "Default options must be available"

Definition of Done:
- plus aucun faux parametre dans l'UI
- personnalisation visible et utilisable en demo
- la doc n'affirme rien que le code ne fait pas

### Ticket R2 - Game statistics and match history

- Ajouter une page dediee aux scores
- Reutiliser `GET /scores/leaderboard`
- Ajouter un historique de matchs avec date, resultat et adversaire(s)
- Completer le profil ou la page scores avec les informations necessaires pour rendre le module revendicable

Reference sujet:
- "Track user game statistics (wins, losses, ranking, level, etc.)"
- "Display match history (1v1 games, dates, results, opponents)"
- "Show achievements and progression"
- "Leaderboard integration"

Definition of Done:
- navigation visible depuis le front
- etats `loading`, `empty`, `error`, `ready`
- historique demonstrable, pas seulement des stats agregees
- preuve de module compatible revue Intra

### Ticket R3 - Support for additional browsers

- Valider Chrome + au moins `2` navigateurs additionnels
- Rejouer tous les flows critiques
- Corriger les regressions specifiques
- Versionner une recette avec limitations connues si necessaire

Reference sujet:
- "Full compatibility with at least 2 additional browsers (Firefox, Safari, Edge, etc.)"
- "Test and fix all features in each browser"
- "Document any browser-specific limitations"
- "Consistent UI/UX across all supported browsers"

Definition of Done:
- checklist versionnee
- limitations explicites
- aucun bug critique bloqueur sur les browsers annonces

### Ticket R4 - Notification system

- Sortir d'un scope "lecture HTTP minimale"
- Couvrir creation, update et delete avec une logique notification claire
- Decider explicitement si `notification:new` doit etre consomme en temps reel cote front
- Ajouter une surface utilisateur visible et coherente

Reference sujet:
- "A complete notification system for all creation, update, and deletion actions"

Definition of Done:
- create/update/delete demonstrables
- comportement front documente
- pas de claim ambigu entre HTTP seul et WS
- surface UI suffisante pour une demo evaluateur

### Ticket R5 - Health check & status page

- Conserver `/health`
- Ajouter une vraie page ou vue de status minimale
- Documenter les sauvegardes et la reprise
- Preparer une demonstration concise pour la revue

Reference sujet:
- "Health check and status page system with automated backups and disaster recovery procedures"

Definition of Done:
- status page accessible
- preuves de sauvegarde / recovery documentees
- module revendicable sans extrapolation

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

## 6) Backlog priorise

P0:
- R1 Game customization options
- R2 Game statistics and match history

P1:
- R3 Support for additional browsers
- R4 Notification system
- R5 Health check & status page

P2:
- accessibilite / a11y de finition
- polish visuel secondaire

## 7) Risques et dependances

- Risque principal: revendiquer un module trop tot alors que la revue Intra ne comptera que les modules pleinement fonctionnels
- Dependance: rester strictement aligne avec les contrats API/WS deja exposes cote backend
- Mitigation: fermer 5 modules `Minor` simples et demonstrables au lieu d'etendre le scope sur des `Major`
- Spec backend de rattrapage: docs/backend-front-enablement-spec.md

## 8) Commandes utiles front

- Lancer stack: `make up`
- Smoke global: `make smoke-test`
- WS smoke backend: `make smoke-test-ws`
- Lint front: `cd frontend && npm run lint`
- Build front: `cd frontend && npm run build`

## 9) Livrables attendus

- Navigation front enrichie: home, login, register, profil, amis, leaderboard
- UX realtime stabilisee (erreurs, etats, feedback)
- Notifications demonstrables en create/update/delete
- Status page minimale et preuves ops
- Checklist QA navigateurs
- Dossier de demo oriente sujet (preuves fonctionnelles)

## 10) Hygiene documentaire

- A chaque PR: verifier que les sections API/WS impactees sont a jour
- Verifier que README pointe vers les bons documents
- Refuser merge si l'ecart doc/impl existe sur un flux critique
- Mettre a jour la matrice apres chaque lot ferme parmi les 5 modules cibles vers `19`

## 11) Quick wins doc

1. Maintenir les 2 PDFs comme source de verite sujet et `docs/sujet-conformite-matrice.md` comme lecture de travail derivee.
2. Garder une mini checklist de demo executable sans connaissance interne du code.
3. Verifier que cette roadmap reste descriptive du reel et non du plan passe.
